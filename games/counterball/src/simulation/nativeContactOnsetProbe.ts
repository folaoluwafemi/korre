import { Engine } from "@babylonjs/core/Engines/engine.js";
import { EngineStore } from "@babylonjs/core/Engines/engineStore.js";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import {
  PhysicsEngineV2,
  PhysicsPrestepType,
  PhysicsShapeBox,
  type IPhysicsCollisionEvent,
  type PhysicsBody,
} from "@babylonjs/core/Physics/v2/index.js";
import {
  COUNTERBALL_CONFIG_V1,
  ENTITY_IDS,
  hashCanonicalJson,
  hashCounterballConfig,
  parseMatchState,
  type BodyState,
  type Vec3,
} from "@korre/game-protocol";
import havokWasmUrl from "@babylonjs/havok/lib/esm/HavokPhysics.wasm?url";
import fixtureJson from "../../../../tests/fixtures/counterball-v1.json";
import fixtureRaw from "../../../../tests/fixtures/counterball-v1.json?raw";
import { initializeHavokRuntime } from "./havokRuntime.js";
import {
  createCounterballWorld,
  type CounterballWorld,
} from "./worldFactory.js";
import {
  configureNativeCollisionOnsets,
  type LoftContactSubscription,
} from "./nativeCollisionSubscription.js";
import {
  isLoftStartSeparated,
  nativeAabbOriginRadius,
} from "./loftStartSeparation.js";

const config = COUNTERBALL_CONFIG_V1;
const guard = config.restartLoftDiagnosticGuard;
const expectedFixtureSha =
  "b0d2987128b2bb486ae27a62255b16e899ebdd6419b9e8d9140351defb31e9a0";
const staticNames = [
  "counterball-goal-post--1--1",
  "counterball-goal-post--1-1",
  "counterball-goal-crossbar--1",
  "counterball-goal-post-1--1",
  "counterball-goal-post-1-1",
  "counterball-goal-crossbar-1",
  "counterball-surface",
] as const;
const staticIds = [
  "goal-frame-0",
  "goal-frame-1",
  "goal-frame-2",
  "goal-frame-3",
  "goal-frame-4",
  "goal-frame-5",
  "support-apron",
] as const;
type ContactId = (typeof ENTITY_IDS)[number] | (typeof staticIds)[number];
type Bounds = { minimum: Vec3; maximum: Vec3 };
type Contact = {
  callIndex: number;
  observingBodyId: ContactId;
  otherBodyId: ContactId;
  eventType: string;
  point: Vec3 | null;
};
type Sample = {
  callIndex: number;
  buttonBefore: BodyState;
  buttonAfter: BodyState;
  rawContactBeginIndex: number;
  rawContactEndIndex: number;
};
type Phase = { name: string; samples: Sample[] };
export type NativeContactOnsetProof = {
  scope: "native-contact-onset-proof-v1";
  configHash: string;
  wasmSha256: string;
  runtimeIdentity: string;
  subscription: LoftContactSubscription;
  nativeGeometry: {
    button: { nativeShapeType: number; rawAabb: Bounds };
    obstacle: { nativeShapeType: number; rawAabb: Bounds };
    support: {
      nativeShapeType: number;
      rawAabb: Bounds;
      pose: Vec3;
      nativeTopY: number;
      buttonGravityFactor: number;
    };
  };
  initialOverlap: {
    buttonPosition: Vec3;
    obstaclePosition: Vec3;
    buttonOriginRadius: number;
    obstacleOriginRadius: number;
    startsBefore: false;
    actualCallsBeforeCheck: 0;
  };
  phases: Phase[];
  contacts: Contact[];
  executeStepCalls: number;
  cleanup: {
    observerCountRemoved: number;
    sceneDisposed: boolean;
    callerEngineDisposed: boolean;
  };
};

const vec = (v: { x: number; y: number; z: number }): Vec3 => ({
  x: v.x,
  y: v.y,
  z: v.z,
});
function bounds(body: PhysicsBody): Bounds {
  if (!body.shape) throw new Error("Missing native shape.");
  const box = body.shape.getBoundingBox();
  return { minimum: vec(box.minimum), maximum: vec(box.maximum) };
}
function state(body: PhysicsBody): BodyState {
  const rotation = body.transformNode.rotationQuaternion;
  if (!rotation) throw new Error("Button rotation is missing.");
  const result: BodyState = {
    id: "button",
    position: vec(body.transformNode.position),
    rotation: { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w },
    linearVelocity: vec(body.getLinearVelocity()),
    angularVelocity: vec(body.getAngularVelocity()),
  };
  if (
    Object.values(result.position)
      .concat(
        Object.values(result.rotation),
        Object.values(result.linearVelocity),
        Object.values(result.angularVelocity),
      )
      .some((n) => !Number.isFinite(n))
  )
    throw new Error("Non-finite native state.");
  return result;
}
function omitHash(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(omitHash);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "configHash")
      .map(([key, child]) => [key, omitHash(child)]),
  );
}
async function digest(bytes: ArrayBuffer): Promise<string> {
  return Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    (n) => n.toString(16).padStart(2, "0"),
  ).join("");
}
function check(signal: AbortSignal, started: number): void {
  if (signal.aborted)
    throw signal.reason ?? new DOMException("Cancelled", "AbortError");
  if (performance.now() - started > 30_000)
    throw new Error("Native contact diagnostic exceeded 30 seconds.");
}

/** Controlled browser-only contact lifecycle. It is not a gameplay or calibration result. */
export async function runNativeContactOnsetProbe({
  engine,
  signal,
}: {
  engine: Engine;
  signal: AbortSignal;
}): Promise<NativeContactOnsetProof> {
  const started = performance.now();
  const deadline = new AbortController();
  const abort = (): void => deadline.abort(signal.reason);
  if (signal.aborted) abort();
  else signal.addEventListener("abort", abort, { once: true });
  const timer = globalThis.setTimeout(
    () =>
      deadline.abort(
        new Error("Native contact diagnostic exceeded 30 seconds."),
      ),
    30_000,
  );
  const activeSignal = deadline.signal;
  let world: CounterballWorld | undefined;
  let replacement: PhysicsShapeBox | undefined;
  let original: PhysicsBody["shape"] | undefined;
  let support: PhysicsBody | undefined;
  const removers: Array<() => void> = [];
  let result: Omit<NativeContactOnsetProof, "cleanup"> | undefined;
  let removed = 0;
  let disposed = false;
  try {
    check(activeSignal, started);
    if (!(engine instanceof Engine) || !EngineStore.Instances.includes(engine))
      throw new Error("A live browser Engine is required.");
    const fixture = fixtureJson as unknown as {
      id: string;
      versions: { configHash: string };
      states: { initial: unknown };
    };
    const configHash = await hashCounterballConfig();
    const encoded = new TextEncoder().encode(fixtureRaw);
    const rawSha = await digest(encoded.buffer as ArrayBuffer);
    const payloadSha = await hashCanonicalJson(omitHash(fixtureJson));
    const initial = parseMatchState(fixture.states.initial);
    if (
      rawSha !== expectedFixtureSha ||
      payloadSha !== guard.fixture.payloadSha256 ||
      fixture.id !== guard.fixture.id ||
      initial.matchId !== guard.matchId ||
      fixture.versions.configHash !== configHash ||
      initial.versions.configHash !== configHash
    )
      throw new Error("Fixture or config identity mismatch.");
    check(activeSignal, started);
    const response = await fetch(havokWasmUrl, { signal: activeSignal });
    if (!response.ok) throw new Error(`Havok WASM HTTP ${response.status}.`);
    const wasm = await response.arrayBuffer();
    const wasmSha256 = await digest(wasm);
    if (wasmSha256 !== guard.wasmSha256)
      throw new Error("Havok WASM hash mismatch.");
    const havok = await new Promise<
      Awaited<ReturnType<typeof initializeHavokRuntime>>
    >((resolve, reject) => {
      const onAbort = (): void => reject(activeSignal.reason);
      activeSignal.addEventListener("abort", onAbort, { once: true });
      if (activeSignal.aborted) {
        activeSignal.removeEventListener("abort", onAbort);
        onAbort();
        return;
      }
      void initializeHavokRuntime({ wasmBinary: wasm }).then(
        (value) => {
          activeSignal.removeEventListener("abort", onAbort);
          resolve(value);
        },
        (error: unknown) => {
          activeSignal.removeEventListener("abort", onAbort);
          reject(error);
        },
      );
    });
    check(activeSignal, started);
    const y = config.geometry.surfaceY + 10;
    const controlled = parseMatchState({
      ...initial,
      bodies: initial.bodies.map((body) => ({
        ...body,
        position:
          body.id === "button" || body.id === "home-1"
            ? { x: 0, y, z: 0 }
            : body.position,
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        linearVelocity: { x: 0, y: 0, z: 0 },
        angularVelocity: { x: 0, y: 0, z: 0 },
      })),
    });
    world = createCounterballWorld({
      engine,
      havok,
      state: controlled,
      gravity: new Vector3(
        config.simulation.gravity.x,
        config.simulation.gravity.y,
        config.simulation.gravity.z,
      ),
    });
    const physics = world.scene.getPhysicsEngine();
    if (
      !(physics instanceof PhysicsEngineV2) ||
      !world.plugin.isSupported() ||
      physics.getBodies().length !== 22 ||
      world.bodies.size !== 15 ||
      world.staticBodies.length !== 7
    )
      throw new Error("The canonical native world is incomplete.");
    const button = world.bodies.get("button");
    const obstacle = world.bodies.get("home-1");
    if (!button || !obstacle) throw new Error("Diagnostic bodies are missing.");
    const ordered = [
      ...ENTITY_IDS.map((bodyId) => {
        const body = world?.bodies.get(bodyId);
        if (!body) throw new Error(`Missing ${bodyId}.`);
        return { bodyId, body };
      }),
      ...staticIds.map((bodyId, index) => {
        const body = world?.staticBodies.find(
          (item) => item.transformNode.name === staticNames[index],
        );
        if (!body) throw new Error(`Missing ${bodyId}.`);
        return { bodyId, body };
      }),
    ];
    support = ordered[21]?.body;
    if (!support?.shape || !button.shape || !obstacle.shape)
      throw new Error("Native shapes are missing.");
    original = support.shape;
    replacement = new PhysicsShapeBox(
      Vector3.Zero(),
      Quaternion.Identity(),
      new Vector3(
        config.geometry.pitchWidth + 2 * guard.setup.supportApronMargin,
        config.geometry.surfaceThickness,
        config.geometry.pitchLength + 2 * guard.setup.supportApronMargin,
      ),
      world.scene,
    );
    replacement.filterMembershipMask = original.filterMembershipMask;
    replacement.filterCollideMask = original.filterCollideMask;
    replacement.density = original.density;
    replacement.isTrigger = original.isTrigger;
    support.shape = replacement;
    const buttonBounds = bounds(button),
      obstacleBounds = bounds(obstacle),
      supportBounds = bounds(support);
    const buttonRadius = nativeAabbOriginRadius(buttonBounds),
      obstacleRadius = nativeAabbOriginRadius(obstacleBounds);
    const buttonPosition = vec(button.transformNode.position),
      obstaclePosition = vec(obstacle.transformNode.position);
    if (
      isLoftStartSeparated(
        buttonPosition.z,
        buttonRadius,
        obstaclePosition.z,
        obstacleRadius,
      )
    )
      throw new Error("Initial overlap was not rejected.");
    const top = support.transformNode.position.y + supportBounds.maximum.y;
    if (
      !Number.isFinite(top) ||
      top < config.geometry.surfaceY ||
      button.getGravityFactor() !== 1
    )
      throw new Error("Native support or gravity readback is invalid.");
    const geometry = {
      button: { nativeShapeType: button.shape.type, rawAabb: buttonBounds },
      obstacle: {
        nativeShapeType: obstacle.shape.type,
        rawAabb: obstacleBounds,
      },
      support: {
        nativeShapeType: support.shape.type,
        rawAabb: supportBounds,
        pose: vec(support.transformNode.position),
        nativeTopY: top,
        buttonGravityFactor: button.getGravityFactor(),
      },
    };
    const initialOverlap = {
      buttonPosition,
      obstaclePosition,
      buttonOriginRadius: buttonRadius,
      obstacleOriginRadius: obstacleRadius,
      startsBefore: false as const,
      actualCallsBeforeCheck: 0 as const,
    };
    const teleport = (body: PhysicsBody, x: number, height: number): void => {
      body.setPrestepType(PhysicsPrestepType.TELEPORT);
      body.transformNode.position.copyFromFloats(x, height, 0);
      body.transformNode.rotationQuaternion = Quaternion.Identity();
      body.setLinearVelocity(Vector3.Zero());
      body.setAngularVelocity(Vector3.Zero());
    };
    for (const [index, id] of ENTITY_IDS.entries()) {
      const body = world.bodies.get(id);
      if (!body) throw new Error("Missing parked body.");
      teleport(
        body,
        id === "button" ? 0 : 4 + (index - 1) * 2,
        config.geometry.surfaceY + config.geometry.buttonThickness / 2 + 10,
      );
    }
    const contacts: Contact[] = [];
    let currentCall = 0;
    let callbackError: unknown;
    const byNode = new Map(
      ordered.map(({ bodyId, body }) => [body.transformNode.name, bodyId]),
    );
    for (const { bodyId, body } of ordered) {
      const observable = body.getCollisionObservable();
      const observer = observable.add((event: IPhysicsCollisionEvent) => {
        try {
          const other = byNode.get(event.collidedAgainst.transformNode.name);
          const collider = byNode.get(event.collider.transformNode.name);
          if (
            collider !== bodyId ||
            !other ||
            !(
              (bodyId === "button" && other === "support-apron") ||
              (bodyId === "support-apron" && other === "button")
            )
          )
            throw new Error("Unexpected native contact pair.");
          if (String(event.type) !== "COLLISION_STARTED")
            throw new Error("Unexpected native contact type.");
          if (contacts.length >= 4096)
            throw new Error("Native contact row limit exceeded.");
          const point = event.point ? vec(event.point) : null;
          if (point && Object.values(point).some((n) => !Number.isFinite(n)))
            throw new Error("Invalid native contact point.");
          contacts.push({
            callIndex: currentCall,
            observingBodyId: bodyId,
            otherBodyId: other,
            eventType: String(event.type),
            point,
          });
        } catch (error) {
          callbackError ??= error;
        }
      });
      removers.push(() => {
        observable.remove(observer);
      });
    }
    const subscription = configureNativeCollisionOnsets(
      havok.EventType.COLLISION_STARTED,
      ordered,
    );
    const phases: Phase[] = [];
    const step = (phase: Phase): void => {
      check(activeSignal, started);
      currentCall += 1;
      if (currentCall > 64)
        throw new Error("Native contact call limit exceeded.");
      const before = state(button),
        begin = contacts.length;
      world?.plugin.executeStep(
        config.simulation.fixedStepSeconds,
        physics.getBodies(),
      );
      if (callbackError) throw callbackError;
      phase.samples.push({
        callIndex: currentCall,
        buttonBefore: before,
        buttonAfter: state(button),
        rawContactBeginIndex: begin,
        rawContactEndIndex: contacts.length,
      });
    };
    const phase = (name: string): Phase => {
      const value = { name, samples: [] as Sample[] };
      phases.push(value);
      return value;
    };
    const separatedBefore = phase("separated-before");
    step(separatedBefore);
    for (const id of ENTITY_IDS)
      world.bodies.get(id)?.setPrestepType(PhysicsPrestepType.DISABLED);
    const first = separatedBefore.samples[0];
    if (
      !first ||
      first.buttonBefore.position.y + buttonBounds.minimum.y <= top ||
      first.buttonAfter.position.y >= first.buttonBefore.position.y ||
      first.rawContactEndIndex !== first.rawContactBeginIndex
    )
      throw new Error("Separated gravity control failed.");
    teleport(button, 0, top + config.geometry.buttonThickness / 2 - 0.002);
    const firstContact = phase("first-contact");
    step(firstContact);
    const mirrored = (sample: Sample | undefined): boolean =>
      !!sample &&
      ["button", "support-apron"].every((id) =>
        contacts
          .slice(sample.rawContactBeginIndex, sample.rawContactEndIndex)
          .some((row) => row.observingBodyId === id),
      );
    button.setPrestepType(PhysicsPrestepType.DISABLED);
    if (!mirrored(firstContact.samples[0]))
      throw new Error("First contact lacks mirrored native onsets.");
    const sustained = phase("sustained-contact");
    for (let index = 0; index < 60; index += 1) {
      button.setLinearVelocity(Vector3.Zero());
      button.setAngularVelocity(Vector3.Zero());
      step(sustained);
    }
    for (const sample of sustained.samples.slice(-10)) {
      const a = sample.buttonAfter,
        b = sample.buttonBefore;
      if (
        Math.abs(a.position.y + buttonBounds.minimum.y - top) > 0.001 ||
        Math.abs(a.position.y - b.position.y) > 0.0001 ||
        Math.hypot(a.linearVelocity.x, a.linearVelocity.y, a.linearVelocity.z) >
          config.simulation.linearSettleThreshold ||
        Math.hypot(
          a.angularVelocity.x,
          a.angularVelocity.y,
          a.angularVelocity.z,
        ) > config.simulation.angularSettleThreshold ||
        sample.rawContactBeginIndex !== sample.rawContactEndIndex
      )
        throw new Error(
          "Sustained support did not meet the fixed quiet limits.",
        );
    }
    teleport(
      button,
      0,
      config.geometry.surfaceY + config.geometry.buttonThickness / 2 + 10,
    );
    const separatedAfter = phase("separated-after");
    step(separatedAfter);
    const separated = separatedAfter.samples[0];
    if (
      !separated ||
      separated.buttonAfter.position.y + buttonBounds.minimum.y <= top ||
      separated.rawContactBeginIndex !== separated.rawContactEndIndex
    )
      throw new Error("Separated control failed.");
    teleport(button, 0, top + config.geometry.buttonThickness / 2 - 0.002);
    const recontact = phase("recontact");
    step(recontact);
    if (!mirrored(recontact.samples[0]) || currentCall !== 64)
      throw new Error("Fresh mirrored recontact was not observed.");
    const runtimeIdentity = `browser:${navigator.userAgent};engine:${engine.constructor.name};physics:${guard.physicsVersion}`;
    if (runtimeIdentity.length > 1024)
      throw new Error("Runtime identity exceeds its limit.");
    result = {
      scope: "native-contact-onset-proof-v1",
      configHash,
      wasmSha256,
      runtimeIdentity,
      subscription,
      nativeGeometry: geometry,
      initialOverlap,
      phases,
      contacts,
      executeStepCalls: currentCall,
    };
  } finally {
    globalThis.clearTimeout(timer);
    signal.removeEventListener("abort", abort);
    const errors: unknown[] = [];
    for (const remove of removers) {
      try {
        remove();
        removed += 1;
      } catch (error) {
        errors.push(error);
      }
    }
    if (support && original && replacement) {
      try {
        support.shape = original;
      } catch (error) {
        errors.push(error);
      }
      try {
        replacement.dispose();
      } catch (error) {
        errors.push(error);
      }
    }
    if (world) {
      try {
        world.dispose();
        disposed = world.scene.isDisposed;
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length)
      throw new AggregateError(errors, "Native diagnostic cleanup failed.");
  }
  if (
    !result ||
    removed !== 22 ||
    !disposed ||
    !EngineStore.Instances.includes(engine)
  )
    throw new Error("Native contact cleanup did not complete.");
  check(signal, started);
  return {
    ...result,
    cleanup: {
      observerCountRemoved: removed,
      sceneDisposed: disposed,
      callerEngineDisposed: false,
    },
  };
}
