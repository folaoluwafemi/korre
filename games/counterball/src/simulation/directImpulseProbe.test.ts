import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { Vector3, type Quaternion } from "@babylonjs/core/Maths/math.vector.js";
import {
  PhysicsEngineV2,
  type IPhysicsCollisionEvent,
} from "@babylonjs/core/Physics/v2/index.js";
import type { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody.js";
import {
  COUNTERBALL_CONFIG_V1,
  ENTITY_IDS,
  parseMatchState,
  type BodyState,
  type EntityId,
  type MatchState,
  type Vec3,
} from "@korre/game-protocol";
import { describe, expect, it } from "vitest";
import { initializeHavokRuntime } from "./havokRuntime.js";
import {
  createCounterballWorld,
  type CounterballWorld,
} from "./worldFactory.js";

type Fixture = { id: string; states: { initial: unknown } };
type QuaternionValue = { x: number; y: number; z: number; w: number };
type BodyStateValue = {
  id: EntityId;
  position: Vec3;
  rotation: QuaternionValue;
  linearVelocity: Vec3;
  angularVelocity: Vec3;
};
type RuntimeBodyValue = {
  id: EntityId;
  position: Vector3;
  rotation: Quaternion | null;
  linearVelocity: Vector3;
  angularVelocity: Vector3;
};
type ContactObservation = {
  step: number;
  pair: [string, string];
  type: string;
  point: Vec3 | null;
};
type TickObservation = {
  step: number;
  simulatedSeconds: number;
  /** Flattened xyz values in the canonical bodyIds order. */
  positions: number[];
  /** Flattened xyzw values in the canonical bodyIds order. */
  rotations: number[];
  /** Flattened xyz deltas from the preceding sample, including the initial pose. */
  displacementByBody: number[];
  /** Flattened xyz values in the canonical bodyIds order. */
  linearVelocities: number[];
  /** Flattened xyz values in the canonical bodyIds order. */
  angularVelocities: number[];
  linearSpeeds: number[];
  angularSpeeds: number[];
  finite: boolean;
  nonFiniteBodyIds: EntityId[];
};
type BodyPathSummary = {
  id: EntityId;
  pathDistance: number;
  maximumLinearSpeed: number;
  maximumAngularSpeed: number;
};
type AimSpec = {
  name: "straight-at-button" | "open-longitudinal-lane";
  selectedCapId: "home-6" | "home-3";
  target: "button-center" | "open-lane-point";
};
type TrialObservation = {
  key: string;
  aim: AimSpec["name"];
  selectedCapId: EntityId;
  inputImpulseUnits: number;
  inputImpulseVector: Vec3;
  applicationPoint: Vec3;
  fixtureId: string;
  matchId: string;
  startingBodyStates: BodyStateValue[];
  initialWorldMatchesFixture: boolean;
  immediateBodyVelocities: Array<{
    id: EntityId;
    linearVelocity: Vec3;
    angularVelocity: Vec3;
  }>;
  bodyIds: EntityId[];
  tickMeasurements: TickObservation[];
  bodyPathSummaries: BodyPathSummary[];
  finalBodyStates: BodyStateValue[];
  allBodiesSettledAtSeconds: number | null;
  quietWindowStepsRequired: number;
  quietWindowStepsObserved: number;
  quietWindowSecondsRequired: number;
  linearSettleThreshold: number;
  angularSettleThreshold: number;
  simulatedSeconds: number;
  totalSteps: number;
  contacts: ContactObservation[];
  buttonCapContacts: ContactObservation[];
  selectedCapButtonContact: boolean;
  buttonContact: boolean;
  runtimeError: string | null;
};
type IntendedShotArtifactRow = Record<string, unknown>;
type IntendedShotArtifact = Record<string, unknown> & {
  observations: IntendedShotArtifactRow[];
};

const require = createRequire(import.meta.url);
const candidateImpulses = [2, 4, 8] as const;
const aimScenarios: readonly AimSpec[] = [
  {
    name: "straight-at-button",
    selectedCapId: "home-6",
    target: "button-center",
  },
  {
    name: "open-longitudinal-lane",
    selectedCapId: "home-3",
    target: "open-lane-point",
  },
];
const fixedStepSeconds = COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds;
const maximumProbeSeconds =
  COUNTERBALL_CONFIG_V1.simulation.maxShotDurationSeconds;
const maximumSteps = Math.ceil(maximumProbeSeconds / fixedStepSeconds);
const quietWindowSeconds = COUNTERBALL_CONFIG_V1.simulation.settleWindowSeconds;
const quietWindowSteps = Math.ceil(quietWindowSeconds / fixedStepSeconds);
const artifactWaitMilliseconds = 300_000;
const artifactPollMilliseconds = 1_000;
// Require a finite per-step displacement above numerical noise in canonical world units.
const minimumSelectedCapStepMovement = 1e-4;
const existingCandidateImpulses = [0.5, 1, 1.5, 2, 3, 4, 6, 8] as const;
const existingCandidateTiltDegrees = [0, 15, 30, 45, 60] as const;

async function readPinnedHavokWasm(): Promise<ArrayBuffer> {
  const wasmPath =
    require.resolve("@babylonjs/havok/lib/esm/HavokPhysics.wasm");
  return new Uint8Array(await readFile(wasmPath)).buffer;
}

async function readInitialState(): Promise<{
  fixtureId: string;
  state: MatchState;
}> {
  const fixtureUrl = new URL(
    "../../../../tests/fixtures/counterball-v1.json",
    import.meta.url,
  );
  const fixture = JSON.parse(await readFile(fixtureUrl, "utf8")) as Fixture;
  return {
    fixtureId: fixture.id,
    state: parseMatchState(fixture.states.initial),
  };
}

function plainVector(vector: { x: number; y: number; z: number }): Vec3 {
  return { x: vector.x, y: vector.y, z: vector.z };
}

function plainProtocolBody(body: BodyState): BodyStateValue {
  return {
    id: body.id,
    position: { ...body.position },
    rotation: { ...body.rotation },
    linearVelocity: { ...body.linearVelocity },
    angularVelocity: { ...body.angularVelocity },
  };
}

function plainRuntimeBody(id: EntityId, body: PhysicsBody): BodyStateValue {
  const rotation = body.transformNode.rotationQuaternion;
  if (rotation === null) {
    return {
      id,
      position: plainVector(body.transformNode.position),
      rotation: {
        x: Number.NaN,
        y: Number.NaN,
        z: Number.NaN,
        w: Number.NaN,
      },
      linearVelocity: plainVector(body.getLinearVelocity()),
      angularVelocity: plainVector(body.getAngularVelocity()),
    };
  }
  return {
    id,
    position: plainVector(body.transformNode.position),
    rotation: {
      x: rotation.x,
      y: rotation.y,
      z: rotation.z,
      w: rotation.w,
    },
    linearVelocity: plainVector(body.getLinearVelocity()),
    angularVelocity: plainVector(body.getAngularVelocity()),
  };
}

function readRuntimeBodies(world: CounterballWorld): RuntimeBodyValue[] {
  return ENTITY_IDS.map((id) => {
    const body = world.bodies.get(id);
    if (body === undefined) {
      throw new Error(`Havok world is missing canonical body ${id}.`);
    }
    return {
      id,
      position: body.transformNode.position.clone(),
      rotation: body.transformNode.rotationQuaternion?.clone() ?? null,
      linearVelocity: body.getLinearVelocity().clone(),
      angularVelocity: body.getAngularVelocity().clone(),
    };
  });
}

function plainRuntimeBodies(world: CounterballWorld): BodyStateValue[] {
  return ENTITY_IDS.map((id) => {
    const body = world.bodies.get(id);
    if (body === undefined) {
      throw new Error(`Havok world is missing canonical body ${id}.`);
    }
    return plainRuntimeBody(id, body);
  });
}

function isFiniteVector(vector: { x: number; y: number; z: number }): boolean {
  return (
    Number.isFinite(vector.x) &&
    Number.isFinite(vector.y) &&
    Number.isFinite(vector.z)
  );
}

function isFiniteQuaternion(value: Quaternion | null): boolean {
  return (
    value !== null &&
    Number.isFinite(value.x) &&
    Number.isFinite(value.y) &&
    Number.isFinite(value.z) &&
    Number.isFinite(value.w)
  );
}

function isFiniteRuntimeBody(body: RuntimeBodyValue): boolean {
  const linearSpeed = Math.hypot(
    body.linearVelocity.x,
    body.linearVelocity.y,
    body.linearVelocity.z,
  );
  const angularSpeed = Math.hypot(
    body.angularVelocity.x,
    body.angularVelocity.y,
    body.angularVelocity.z,
  );
  return (
    isFiniteVector(body.position) &&
    isFiniteQuaternion(body.rotation) &&
    isFiniteVector(body.linearVelocity) &&
    isFiniteVector(body.angularVelocity) &&
    Number.isFinite(linearSpeed) &&
    Number.isFinite(angularSpeed)
  );
}

function runtimeBodiesMatchFixture(
  runtime: readonly RuntimeBodyValue[],
  expected: readonly BodyStateValue[],
): boolean {
  if (runtime.length !== expected.length) {
    return false;
  }
  return runtime.every((body, index) => {
    const expectedBody = expected[index];
    if (expectedBody === undefined || body.rotation === null) {
      return false;
    }
    return (
      body.id === expectedBody.id &&
      body.position.x === expectedBody.position.x &&
      body.position.y === expectedBody.position.y &&
      body.position.z === expectedBody.position.z &&
      body.rotation.x === expectedBody.rotation.x &&
      body.rotation.y === expectedBody.rotation.y &&
      body.rotation.z === expectedBody.rotation.z &&
      body.rotation.w === expectedBody.rotation.w &&
      body.linearVelocity.x === expectedBody.linearVelocity.x &&
      body.linearVelocity.y === expectedBody.linearVelocity.y &&
      body.linearVelocity.z === expectedBody.linearVelocity.z &&
      body.angularVelocity.x === expectedBody.angularVelocity.x &&
      body.angularVelocity.y === expectedBody.angularVelocity.y &&
      body.angularVelocity.z === expectedBody.angularVelocity.z
    );
  });
}

function errorDescription(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

function aimDirection(
  aim: AimSpec,
  state: MatchState,
): { direction: Vector3; selectedStart: Vector3 } {
  const selectedState = state.bodies.find(({ id }) => id === aim.selectedCapId);
  const buttonState = state.bodies.find(({ id }) => id === "button");
  if (selectedState === undefined || buttonState === undefined) {
    throw new Error("Canonical fixture is missing the selected cap or button.");
  }
  const selectedStart = new Vector3(
    selectedState.position.x,
    selectedState.position.y,
    selectedState.position.z,
  );
  const buttonStart = new Vector3(
    buttonState.position.x,
    buttonState.position.y,
    buttonState.position.z,
  );
  const target =
    aim.target === "button-center"
      ? buttonStart
      : new Vector3(
          -COUNTERBALL_CONFIG_V1.geometry.pitchWidth / 2 + 2.5,
          selectedStart.y,
          0,
        );
  const direction = new Vector3(
    target.x - selectedStart.x,
    0,
    target.z - selectedStart.z,
  );
  if (!Number.isFinite(direction.length()) || direction.length() === 0) {
    throw new Error(
      `Aim ${aim.name} does not define a finite horizontal path.`,
    );
  }
  direction.normalize();
  return { direction, selectedStart };
}

function keyForTrial(impulse: number, aim: AimSpec): string {
  return `impulse=${impulse}|aim=${aim.name}`;
}

function vectorComponents(vector: Vector3): number[] {
  return [vector.x, vector.y, vector.z];
}

function quaternionComponents(value: Quaternion | null): number[] {
  return value === null
    ? [Number.NaN, Number.NaN, Number.NaN, Number.NaN]
    : [value.x, value.y, value.z, value.w];
}

function captureTick(
  step: number,
  simulatedSeconds: number,
  current: readonly RuntimeBodyValue[],
  previousPositions: ReadonlyMap<EntityId, Vector3>,
): TickObservation {
  const positions: number[] = [];
  const rotations: number[] = [];
  const displacementByBody: number[] = [];
  const linearVelocities: number[] = [];
  const angularVelocities: number[] = [];
  const linearSpeeds: number[] = [];
  const angularSpeeds: number[] = [];
  const nonFiniteBodyIds: EntityId[] = [];

  for (const body of current) {
    const previous = previousPositions.get(body.id);
    if (previous === undefined) {
      throw new Error(`Missing previous position for ${body.id}.`);
    }
    const displacement = new Vector3(
      body.position.x - previous.x,
      body.position.y - previous.y,
      body.position.z - previous.z,
    );
    const linearSpeed = Math.hypot(
      body.linearVelocity.x,
      body.linearVelocity.y,
      body.linearVelocity.z,
    );
    const angularSpeed = Math.hypot(
      body.angularVelocity.x,
      body.angularVelocity.y,
      body.angularVelocity.z,
    );
    positions.push(...vectorComponents(body.position));
    rotations.push(...quaternionComponents(body.rotation));
    displacementByBody.push(...vectorComponents(displacement));
    linearVelocities.push(...vectorComponents(body.linearVelocity));
    angularVelocities.push(...vectorComponents(body.angularVelocity));
    linearSpeeds.push(linearSpeed);
    angularSpeeds.push(angularSpeed);
    if (
      !isFiniteRuntimeBody(body) ||
      !isFiniteVector(displacement) ||
      !Number.isFinite(linearSpeed) ||
      !Number.isFinite(angularSpeed)
    ) {
      nonFiniteBodyIds.push(body.id);
    }
  }

  return {
    step,
    simulatedSeconds,
    positions,
    rotations,
    displacementByBody,
    linearVelocities,
    angularVelocities,
    linearSpeeds,
    angularSpeeds,
    finite: nonFiniteBodyIds.length === 0,
    nonFiniteBodyIds,
  };
}

function runTrial(
  havok: Awaited<ReturnType<typeof initializeHavokRuntime>>,
  fixtureId: string,
  initial: MatchState,
  initialBodyStates: BodyStateValue[],
  aim: AimSpec,
  impulse: number,
): TrialObservation {
  const key = keyForTrial(impulse, aim);
  const state = structuredClone(initial);
  const startingBodyStates = state.bodies.map(plainProtocolBody);
  const { direction, selectedStart } = aimDirection(aim, state);
  const inputImpulse = direction.scale(impulse);
  const applicationPoint = selectedStart.clone();
  const engine = new NullEngine();
  const removeObservers: Array<() => void> = [];
  let world: CounterballWorld | undefined;
  let runtimeError: string | null = null;
  let initialWorldMatchesFixture = false;
  let immediateBodyVelocities: TrialObservation["immediateBodyVelocities"] = [];
  const tickMeasurements: TickObservation[] = [];
  const contacts: ContactObservation[] = [];
  const seenContacts = new Set<string>();
  const pathDistance = new Map<EntityId, number>(
    ENTITY_IDS.map((id) => [id, 0] as const),
  );
  const maximumLinearSpeed = new Map<EntityId, number>(
    ENTITY_IDS.map((id) => [id, 0] as const),
  );
  const maximumAngularSpeed = new Map<EntityId, number>(
    ENTITY_IDS.map((id) => [id, 0] as const),
  );
  let allBodiesSettledAtSeconds: number | null = null;
  let quietWindowStepsObserved = 0;
  let simulatedSeconds = 0;
  let currentStep = 0;

  try {
    world = createCounterballWorld({
      engine,
      havok,
      state,
      gravity: new Vector3(
        COUNTERBALL_CONFIG_V1.simulation.gravity.x,
        COUNTERBALL_CONFIG_V1.simulation.gravity.y,
        COUNTERBALL_CONFIG_V1.simulation.gravity.z,
      ),
    });
    const trialWorld = world;
    const physicsEngine = trialWorld.scene.getPhysicsEngine();
    if (!(physicsEngine instanceof PhysicsEngineV2)) {
      throw new Error("Probe scene did not create Babylon PhysicsEngineV2.");
    }
    if (trialWorld.plugin.isSupported() !== true) {
      throw new Error("Pinned Havok plugin reports unsupported physics.");
    }
    if (trialWorld.bodies.size !== ENTITY_IDS.length) {
      throw new Error("Probe world does not contain all fifteen match bodies.");
    }
    const initialRuntimeBodies = readRuntimeBodies(trialWorld);
    initialWorldMatchesFixture = runtimeBodiesMatchFixture(
      initialRuntimeBodies,
      initialBodyStates,
    );
    const previousPositions = new Map<EntityId, Vector3>(
      initialRuntimeBodies.map(
        ({ id, position }) => [id, position.clone()] as const,
      ),
    );
    const bodyNames = new Map<string, string>();
    for (const [id, body] of trialWorld.bodies) {
      bodyNames.set(body.transformNode.name, id);
    }
    for (const body of trialWorld.staticBodies) {
      bodyNames.set(
        body.transformNode.name,
        `static:${body.transformNode.name}`,
      );
    }
    const observeContact = (event: IPhysicsCollisionEvent): void => {
      const first =
        bodyNames.get(event.collider.transformNode.name) ??
        event.collider.transformNode.name;
      const second =
        bodyNames.get(event.collidedAgainst.transformNode.name) ??
        event.collidedAgainst.transformNode.name;
      if (first === second) {
        return;
      }
      const pair: [string, string] =
        first.localeCompare(second) <= 0 ? [first, second] : [second, first];
      const type = String(event.type);
      const contactKey = `${currentStep}|${pair[0]}|${pair[1]}|${type}`;
      if (seenContacts.has(contactKey)) {
        return;
      }
      seenContacts.add(contactKey);
      const point =
        event.point !== null &&
        event.point !== undefined &&
        isFiniteVector(event.point)
          ? plainVector(event.point)
          : null;
      contacts.push({ step: currentStep, pair, type, point });
    };
    for (const body of trialWorld.bodies.values()) {
      body.setCollisionCallbackEnabled(true);
      const observable = body.getCollisionObservable();
      const observer = observable.add(observeContact);
      removeObservers.push(() => observable.remove(observer));
    }

    const selectedCap = trialWorld.bodies.get(aim.selectedCapId);
    if (selectedCap === undefined) {
      throw new Error(`Selected cap ${aim.selectedCapId} is missing.`);
    }
    selectedCap.applyImpulse(inputImpulse, applicationPoint);
    immediateBodyVelocities = ENTITY_IDS.map((id) => {
      const body = trialWorld.bodies.get(id);
      if (body === undefined) {
        throw new Error(`Immediate response is missing body ${id}.`);
      }
      return {
        id,
        linearVelocity: plainVector(body.getLinearVelocity()),
        angularVelocity: plainVector(body.getAngularVelocity()),
      };
    });
    for (const body of immediateBodyVelocities) {
      maximumLinearSpeed.set(
        body.id,
        Math.hypot(
          body.linearVelocity.x,
          body.linearVelocity.y,
          body.linearVelocity.z,
        ),
      );
      maximumAngularSpeed.set(
        body.id,
        Math.hypot(
          body.angularVelocity.x,
          body.angularVelocity.y,
          body.angularVelocity.z,
        ),
      );
    }

    let quietWindowCount = 0;
    for (let step = 1; step <= maximumSteps; step += 1) {
      currentStep = step;
      try {
        trialWorld.plugin.executeStep(
          fixedStepSeconds,
          physicsEngine.getBodies(),
        );
      } catch (error) {
        runtimeError = `Physics step ${step} failed: ${errorDescription(error)}`;
        break;
      }
      simulatedSeconds = step * fixedStepSeconds;
      const currentBodies = readRuntimeBodies(trialWorld);
      const tick = captureTick(
        step,
        simulatedSeconds,
        currentBodies,
        previousPositions,
      );
      tickMeasurements.push(tick);

      let allBodiesQuiet = tick.finite;
      for (const body of currentBodies) {
        const previous = previousPositions.get(body.id);
        if (previous === undefined) {
          throw new Error(`Missing previous position for ${body.id}.`);
        }
        const traveled = Vector3.Distance(body.position, previous);
        const linearSpeed = Math.hypot(
          body.linearVelocity.x,
          body.linearVelocity.y,
          body.linearVelocity.z,
        );
        const angularSpeed = Math.hypot(
          body.angularVelocity.x,
          body.angularVelocity.y,
          body.angularVelocity.z,
        );
        pathDistance.set(body.id, (pathDistance.get(body.id) ?? 0) + traveled);
        maximumLinearSpeed.set(
          body.id,
          Math.max(maximumLinearSpeed.get(body.id) ?? 0, linearSpeed),
        );
        maximumAngularSpeed.set(
          body.id,
          Math.max(maximumAngularSpeed.get(body.id) ?? 0, angularSpeed),
        );
        if (
          linearSpeed >
            COUNTERBALL_CONFIG_V1.simulation.linearSettleThreshold ||
          angularSpeed > COUNTERBALL_CONFIG_V1.simulation.angularSettleThreshold
        ) {
          allBodiesQuiet = false;
        }
        previousPositions.set(body.id, body.position.clone());
      }

      quietWindowCount = allBodiesQuiet ? quietWindowCount + 1 : 0;
      quietWindowStepsObserved = quietWindowCount;
      if (!tick.finite) {
        runtimeError = `Non-finite body sample at step ${step}.`;
        break;
      }
      if (quietWindowCount >= quietWindowSteps) {
        allBodiesSettledAtSeconds = simulatedSeconds;
        break;
      }
    }
  } catch (error) {
    runtimeError = errorDescription(error);
  }

  let finalBodyStates = startingBodyStates;
  if (world !== undefined) {
    try {
      finalBodyStates = plainRuntimeBodies(world);
    } catch (error) {
      runtimeError = [runtimeError, errorDescription(error)]
        .filter((value): value is string => value !== null)
        .join("; final sample: ");
    }
  }

  const cleanupErrors: string[] = [];
  for (const removeObserver of removeObservers.splice(0).reverse()) {
    try {
      removeObserver();
    } catch (error) {
      cleanupErrors.push(errorDescription(error));
    }
  }
  try {
    world?.dispose();
  } catch (error) {
    cleanupErrors.push(errorDescription(error));
  }
  try {
    engine.dispose();
  } catch (error) {
    cleanupErrors.push(errorDescription(error));
  }
  if (cleanupErrors.length > 0) {
    const errorParts = runtimeError === null ? [] : [runtimeError];
    runtimeError = [
      ...errorParts,
      ...cleanupErrors.map((error) => `cleanup: ${error}`),
    ].join("; ");
  }

  const buttonCapContacts = contacts.filter(
    ({ pair }) =>
      pair.includes("button") &&
      pair.some((id) => id.startsWith("home-") || id.startsWith("away-")),
  );
  const pathSummaries = ENTITY_IDS.map((id) => ({
    id,
    pathDistance: pathDistance.get(id) ?? 0,
    maximumLinearSpeed: maximumLinearSpeed.get(id) ?? 0,
    maximumAngularSpeed: maximumAngularSpeed.get(id) ?? 0,
  }));
  const selectedCapButtonContact = buttonCapContacts.some(({ pair }) =>
    pair.includes(aim.selectedCapId),
  );

  return {
    key,
    aim: aim.name,
    selectedCapId: aim.selectedCapId,
    inputImpulseUnits: impulse,
    inputImpulseVector: plainVector(inputImpulse),
    applicationPoint: plainVector(applicationPoint),
    fixtureId,
    matchId: initial.matchId,
    startingBodyStates,
    initialWorldMatchesFixture,
    immediateBodyVelocities,
    bodyIds: [...ENTITY_IDS],
    tickMeasurements,
    bodyPathSummaries: pathSummaries,
    finalBodyStates,
    allBodiesSettledAtSeconds,
    quietWindowStepsRequired: quietWindowSteps,
    quietWindowStepsObserved,
    quietWindowSecondsRequired: quietWindowSeconds,
    linearSettleThreshold:
      COUNTERBALL_CONFIG_V1.simulation.linearSettleThreshold,
    angularSettleThreshold:
      COUNTERBALL_CONFIG_V1.simulation.angularSettleThreshold,
    simulatedSeconds,
    totalSteps: tickMeasurements.length,
    contacts,
    buttonCapContacts,
    selectedCapButtonContact,
    buttonContact: buttonCapContacts.length > 0,
    runtimeError,
  };
}

function expectedIntendedShotKeys(): string[] {
  return existingCandidateTiltDegrees.flatMap((tiltDegrees) =>
    existingCandidateImpulses.map(
      (impulse) => `tilt=${tiltDegrees}|impulse=${impulse}`,
    ),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function equalsNumberArray(
  value: unknown,
  expected: readonly number[],
): boolean {
  return (
    Array.isArray(value) &&
    value.length === expected.length &&
    value.every(
      (item, index) => typeof item === "number" && item === expected[index],
    )
  );
}

function completeIntendedShotArtifactIssue(value: unknown): string | null {
  if (!isRecord(value)) {
    return "artifact root is not an object";
  }
  if (value["directImpulseProbe"] !== undefined) {
    return "artifact already contains a directImpulseProbe property";
  }
  if (
    value["babylonCore"] !== "9.30.0" ||
    value["havokPackage"] !== "1.3.14" ||
    value["diagnosticOnly"] !== true ||
    value["observedTrials"] !== 40 ||
    value["fixedStepSeconds"] !== fixedStepSeconds ||
    value["maximumProbeSeconds"] !== maximumProbeSeconds ||
    value["settleWindowSeconds"] !== quietWindowSeconds
  ) {
    return "artifact provenance or observed trial count is incomplete";
  }
  if (
    !equalsNumberArray(value["candidateImpulses"], existingCandidateImpulses) ||
    !equalsNumberArray(
      value["candidateTiltDegrees"],
      existingCandidateTiltDegrees,
    )
  ) {
    return "artifact does not contain the canonical 40-row candidate matrix";
  }
  const observations = value["observations"];
  if (!Array.isArray(observations) || observations.length !== 40) {
    return "artifact observations are not a complete 40-row array";
  }
  const expectedKeys = expectedIntendedShotKeys();
  const keys: string[] = [];
  for (const observation of observations) {
    if (!isRecord(observation) || typeof observation["key"] !== "string") {
      return "artifact contains a malformed observation row";
    }
    keys.push(observation["key"]);
    const finiteNumbers = [
      "friction",
      "restitution",
      "impulse",
      "tiltDegrees",
      "buttonAzimuthRadians",
      "obstacleGap",
      "capTravelledDistance",
      "capFinalDistance",
      "capPeakHeight",
      "capMaximumSpeed",
      "capFinalSpeed",
      "buttonTravelledDistance",
      "buttonFinalDistance",
      "buttonPeakHeight",
      "buttonMaximumSpeed",
      "buttonFinalSpeed",
      "simulatedSeconds",
    ];
    if (
      finiteNumbers.some((field) => {
        const measuredValue = observation[field];
        return (
          typeof measuredValue !== "number" || !Number.isFinite(measuredValue)
        );
      })
    ) {
      return "artifact contains an observation with missing or non-finite measurements";
    }
    if (!Array.isArray(observation["contacts"])) {
      return "artifact contains an observation without contact records";
    }
  }
  if (
    new Set(keys).size !== 40 ||
    keys.some((key, index) => key !== expectedKeys[index])
  ) {
    return "artifact row keys do not exactly match the ordered 40-trial matrix";
  }
  return null;
}

function isMissingFileError(error: unknown): boolean {
  return isRecord(error) && error["code"] === "ENOENT";
}

async function waitForStableIntendedShotArtifact(
  artifactPath: string,
): Promise<{
  absolutePath: string;
  sourceText: string;
  value: IntendedShotArtifact;
}> {
  const absolutePath = resolve(artifactPath);
  const deadline = Date.now() + artifactWaitMilliseconds;
  let previousCompleteText: string | null = null;
  let lastIssue = "artifact does not exist yet";

  while (Date.now() < deadline) {
    try {
      const sourceText = await readFile(absolutePath, "utf8");
      let parsed: unknown;
      try {
        parsed = JSON.parse(sourceText) as unknown;
      } catch {
        lastIssue = "artifact JSON is not complete yet";
        previousCompleteText = null;
        await new Promise((resolvePromise) =>
          setTimeout(resolvePromise, artifactPollMilliseconds),
        );
        continue;
      }

      const issue = completeIntendedShotArtifactIssue(parsed);
      if (issue === "artifact already contains a directImpulseProbe property") {
        throw new Error(issue);
      }
      if (issue !== null) {
        lastIssue = issue;
        previousCompleteText = null;
      } else if (previousCompleteText === sourceText) {
        if (!isRecord(parsed) || !Array.isArray(parsed["observations"])) {
          throw new Error("Validated artifact changed shape unexpectedly.");
        }
        return {
          absolutePath,
          sourceText,
          value: parsed as IntendedShotArtifact,
        };
      } else {
        previousCompleteText = sourceText;
        lastIssue = "complete artifact is awaiting a stable second read";
      }
    } catch (error) {
      if (isMissingFileError(error)) {
        lastIssue = "artifact does not exist yet";
        previousCompleteText = null;
      } else {
        throw error;
      }
    }
    await new Promise((resolvePromise) =>
      setTimeout(resolvePromise, artifactPollMilliseconds),
    );
  }

  throw new Error(
    `Timed out waiting for a stable complete 40-row intended-shot artifact: ${lastIssue}.`,
  );
}

async function mergeDirectImpulseArtifact(
  observations: TrialObservation[],
  fixtureId: string,
): Promise<void> {
  const configuredPath = process.env["COUNTERBALL_INTENDED_SHOT_OUTPUT"];
  if (configuredPath === undefined) {
    return;
  }
  if (configuredPath.trim().length === 0) {
    throw new Error("COUNTERBALL_INTENDED_SHOT_OUTPUT is set but empty.");
  }

  const stable = await waitForStableIntendedShotArtifact(configuredPath);
  const latestText = await readFile(stable.absolutePath, "utf8");
  if (latestText !== stable.sourceText) {
    throw new Error(
      "The intended-shot artifact changed before direct-probe merge; refusing to overwrite it.",
    );
  }

  const merged = {
    ...stable.value,
    directImpulseProbe: {
      babylonCore: "9.30.0",
      havokPackage: "1.3.14",
      wasm: "@babylonjs/havok/lib/esm/HavokPhysics.wasm",
      diagnosticOnly: true,
      inputUnits:
        "Raw direct PhysicsBody.applyImpulse magnitude; not normalized gameplay power.",
      fixture: `tests/fixtures/counterball-v1.json#${fixtureId}:states.initial`,
      fixtureMatchId: observations[0]?.matchId ?? null,
      setup: {
        sameCanonicalInitialStateForAllTrials: true,
        straightAtButton: {
          selectedCapId: "home-6",
          target: "button center at the canonical initial position",
        },
        openLongitudinalLane: {
          selectedCapId: "home-3",
          target: {
            x: -COUNTERBALL_CONFIG_V1.geometry.pitchWidth / 2 + 2.5,
            z: 0,
          },
          note: "Dominantly longitudinal open path; no other cap is moved.",
        },
        applicationPoint:
          "Selected cap center at its canonical initial transform, using the same applyImpulse(vector, center) API as the intended-shot probe.",
        unrelatedCaps:
          "All caps start at the exact fixture transforms. Only the selected cap receives the direct impulse; subsequent movement is physics-driven.",
      },
      fixedStepSeconds,
      maximumProbeSeconds,
      settleWindowSeconds: quietWindowSeconds,
      settleWindowStepsRequired: quietWindowSteps,
      linearSettleThreshold:
        COUNTERBALL_CONFIG_V1.simulation.linearSettleThreshold,
      angularSettleThreshold:
        COUNTERBALL_CONFIG_V1.simulation.angularSettleThreshold,
      bodyIds: [...ENTITY_IDS],
      candidateImpulses,
      aims: aimScenarios,
      observedTrials: observations.length,
      observations,
    },
  };

  const temporaryPath = `${stable.absolutePath}.${process.pid}.${randomUUID()}.tmp`;
  let temporaryExists = false;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(merged, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
    });
    temporaryExists = true;
    const beforeRename = await readFile(stable.absolutePath, "utf8");
    if (beforeRename !== stable.sourceText) {
      throw new Error(
        "The intended-shot artifact changed during direct-probe merge; refusing to overwrite it.",
      );
    }
    await rename(temporaryPath, stable.absolutePath);
    temporaryExists = false;
  } catch (error) {
    if (temporaryExists) {
      try {
        await unlink(temporaryPath);
      } catch {
        // Keep the merge failure as the useful test error.
      }
    }
    throw error;
  }
}

function isFinitePlainBody(body: BodyStateValue): boolean {
  return [
    body.position.x,
    body.position.y,
    body.position.z,
    body.rotation.x,
    body.rotation.y,
    body.rotation.z,
    body.rotation.w,
    body.linearVelocity.x,
    body.linearVelocity.y,
    body.linearVelocity.z,
    body.angularVelocity.x,
    body.angularVelocity.y,
    body.angularVelocity.z,
  ].every(Number.isFinite);
}

function failedTrialChecks(
  observations: readonly TrialObservation[],
  trialErrors: readonly { key: string; error: string }[],
  initialBodyStates: readonly BodyStateValue[],
): string[] {
  const failures: string[] = [];
  const expectedKeys = candidateImpulses.flatMap((impulse) =>
    aimScenarios.map((aim) => keyForTrial(impulse, aim)),
  );
  const observedKeys = observations.map(({ key }) => key);
  if (trialErrors.length !== 0) {
    failures.push("one or more trials raised a runtime or cleanup error");
  }
  if (observations.length !== 6) {
    failures.push("the probe did not produce all six observations");
  }
  if (
    observedKeys.length !== expectedKeys.length ||
    observedKeys.some((key, index) => key !== expectedKeys[index]) ||
    new Set(observedKeys).size !== 6
  ) {
    failures.push("the observed rows do not match the unique fixed 3x2 matrix");
  }
  if (
    initialBodyStates.some(
      (body) =>
        body.linearVelocity.x !== 0 ||
        body.linearVelocity.y !== 0 ||
        body.linearVelocity.z !== 0 ||
        body.angularVelocity.x !== 0 ||
        body.angularVelocity.y !== 0 ||
        body.angularVelocity.z !== 0,
    )
  ) {
    failures.push("the canonical starting fixture is not at rest");
  }

  for (const [index, observation] of observations.entries()) {
    const prefix = observation.key;
    const expectedImpulse = candidateImpulses[Math.floor(index / 2)];
    const expectedAim = aimScenarios[index % 2];
    if (
      expectedImpulse === undefined ||
      expectedAim === undefined ||
      observation.inputImpulseUnits !== expectedImpulse ||
      observation.aim !== expectedAim.name ||
      observation.selectedCapId !== expectedAim.selectedCapId
    ) {
      failures.push(
        `${prefix}: impulse or selected aim differs from the fixed matrix`,
      );
    }
    const selectedStart = observation.startingBodyStates.find(
      ({ id }) => id === observation.selectedCapId,
    );
    const inputMagnitude = Math.hypot(
      observation.inputImpulseVector.x,
      observation.inputImpulseVector.y,
      observation.inputImpulseVector.z,
    );
    if (
      selectedStart === undefined ||
      observation.applicationPoint.x !== selectedStart.position.x ||
      observation.applicationPoint.y !== selectedStart.position.y ||
      observation.applicationPoint.z !== selectedStart.position.z ||
      Math.abs(inputMagnitude - observation.inputImpulseUnits) > 1e-12 ||
      ![
        observation.inputImpulseUnits,
        observation.inputImpulseVector.x,
        observation.inputImpulseVector.y,
        observation.inputImpulseVector.z,
        observation.applicationPoint.x,
        observation.applicationPoint.y,
        observation.applicationPoint.z,
        observation.linearSettleThreshold,
        observation.angularSettleThreshold,
      ].every(Number.isFinite)
    ) {
      failures.push(
        `${prefix}: input vector, application point, or config is invalid`,
      );
    }
    if (observation.runtimeError !== null) {
      failures.push(`${prefix}: ${observation.runtimeError}`);
    }
    if (
      !observation.initialWorldMatchesFixture ||
      JSON.stringify(observation.startingBodyStates) !==
        JSON.stringify(initialBodyStates)
    ) {
      failures.push(
        `${prefix}: world did not start at the exact shared fixture state`,
      );
    }
    if (
      observation.bodyIds.length !== 15 ||
      observation.bodyIds.some((id, index) => id !== ENTITY_IDS[index])
    ) {
      failures.push(`${prefix}: canonical 15-body order is missing`);
    }
    const immediate = new Map(
      observation.immediateBodyVelocities.map(
        (body) => [body.id, body] as const,
      ),
    );
    const selectedImmediate = immediate.get(observation.selectedCapId);
    if (
      selectedImmediate === undefined ||
      !Number.isFinite(selectedImmediate.linearVelocity.x) ||
      !Number.isFinite(selectedImmediate.linearVelocity.y) ||
      !Number.isFinite(selectedImmediate.linearVelocity.z) ||
      Math.hypot(
        selectedImmediate.linearVelocity.x,
        selectedImmediate.linearVelocity.y,
        selectedImmediate.linearVelocity.z,
      ) <= 0
    ) {
      failures.push(
        `${prefix}: selected cap did not receive the direct impulse`,
      );
    } else {
      const projectedResponse =
        selectedImmediate.linearVelocity.x * observation.inputImpulseVector.x +
        selectedImmediate.linearVelocity.y * observation.inputImpulseVector.y +
        selectedImmediate.linearVelocity.z * observation.inputImpulseVector.z;
      if (!(projectedResponse > 0)) {
        failures.push(
          `${prefix}: initial cap response opposes its requested aim`,
        );
      }
    }
    if (
      observation.immediateBodyVelocities.some(
        (body) =>
          body.id !== observation.selectedCapId &&
          (body.linearVelocity.x !== 0 ||
            body.linearVelocity.y !== 0 ||
            body.linearVelocity.z !== 0 ||
            body.angularVelocity.x !== 0 ||
            body.angularVelocity.y !== 0 ||
            body.angularVelocity.z !== 0),
      )
    ) {
      failures.push(
        `${prefix}: an unrelated body received the initial impulse`,
      );
    }
    if (observation.tickMeasurements.length !== observation.totalSteps) {
      failures.push(
        `${prefix}: tick count does not match captured measurements`,
      );
    }
    if (
      observation.tickMeasurements.some(
        (tick, index) =>
          !tick.finite ||
          tick.step !== index + 1 ||
          tick.simulatedSeconds !== tick.step * fixedStepSeconds ||
          tick.nonFiniteBodyIds.length > 0 ||
          tick.positions.length !== ENTITY_IDS.length * 3 ||
          tick.rotations.length !== ENTITY_IDS.length * 4 ||
          tick.displacementByBody.length !== ENTITY_IDS.length * 3 ||
          tick.linearVelocities.length !== ENTITY_IDS.length * 3 ||
          tick.angularVelocities.length !== ENTITY_IDS.length * 3 ||
          tick.linearSpeeds.length !== ENTITY_IDS.length ||
          tick.angularSpeeds.length !== ENTITY_IDS.length ||
          [
            ...tick.positions,
            ...tick.rotations,
            ...tick.displacementByBody,
            ...tick.linearVelocities,
            ...tick.angularVelocities,
            ...tick.linearSpeeds,
            ...tick.angularSpeeds,
          ].some((value) => !Number.isFinite(value)),
      )
    ) {
      failures.push(
        `${prefix}: per-tick body data is incomplete or non-finite`,
      );
    }
    const selectedBodyIndex = observation.bodyIds.indexOf(
      observation.selectedCapId,
    );
    const selectedCapMovedDuringStep =
      selectedBodyIndex >= 0 &&
      observation.tickMeasurements.some((tick) => {
        const offset = selectedBodyIndex * 3;
        const displacement = Math.hypot(
          tick.displacementByBody[offset] ?? Number.NaN,
          tick.displacementByBody[offset + 1] ?? Number.NaN,
          tick.displacementByBody[offset + 2] ?? Number.NaN,
        );
        return (
          Number.isFinite(displacement) &&
          displacement >= minimumSelectedCapStepMovement
        );
      });
    if (!selectedCapMovedDuringStep) {
      failures.push(
        `${prefix}: selected cap did not move at least ${minimumSelectedCapStepMovement} world units during any physics step`,
      );
    }
    if (
      observation.allBodiesSettledAtSeconds === null ||
      observation.allBodiesSettledAtSeconds < quietWindowSeconds ||
      observation.quietWindowStepsObserved < quietWindowSteps ||
      observation.allBodiesSettledAtSeconds > observation.simulatedSeconds
    ) {
      failures.push(
        `${prefix}: all fifteen bodies did not settle for the full quiet window`,
      );
    }
    if (
      observation.finalBodyStates.length !== ENTITY_IDS.length ||
      observation.finalBodyStates.some(
        (body, bodyIndex) =>
          body.id !== ENTITY_IDS[bodyIndex] || !isFinitePlainBody(body),
      )
    ) {
      failures.push(
        `${prefix}: final transforms or velocities are incomplete/non-finite`,
      );
    }
    if (
      observation.bodyPathSummaries.length !== ENTITY_IDS.length ||
      observation.bodyPathSummaries.some(
        (body, bodyIndex) =>
          body.id !== ENTITY_IDS[bodyIndex] ||
          !Number.isFinite(body.pathDistance) ||
          !Number.isFinite(body.maximumLinearSpeed) ||
          !Number.isFinite(body.maximumAngularSpeed),
      )
    ) {
      failures.push(
        `${prefix}: all-body path or speed summary is incomplete/non-finite`,
      );
    }
    if (
      !Number.isFinite(observation.simulatedSeconds) ||
      observation.simulatedSeconds <= 0 ||
      observation.contacts.some(
        (contact) =>
          !Number.isSafeInteger(contact.step) ||
          contact.step < 1 ||
          contact.pair.length !== 2 ||
          contact.pair[0] === contact.pair[1] ||
          (contact.point !== null &&
            ![contact.point.x, contact.point.y, contact.point.z].every(
              Number.isFinite,
            )),
      )
    ) {
      failures.push(`${prefix}: time or contact measurements are invalid`);
    }
  }
  return failures;
}

describe("real Havok direct impulse response probe", () => {
  it("records six actual WASM trials on the unchanged canonical fixture", async () => {
    const havok = await initializeHavokRuntime({
      wasmBinary: await readPinnedHavokWasm(),
    });
    const { fixtureId, state: initial } = await readInitialState();
    const initialBodyStates = initial.bodies.map(plainProtocolBody);
    expect(initialBodyStates.map(({ id }) => id)).toEqual([...ENTITY_IDS]);
    const observations: TrialObservation[] = [];
    const trialErrors: Array<{ key: string; error: string }> = [];

    for (const impulse of candidateImpulses) {
      for (const aim of aimScenarios) {
        const key = keyForTrial(impulse, aim);
        try {
          observations.push(
            runTrial(
              havok,
              fixtureId,
              initial,
              initialBodyStates,
              aim,
              impulse,
            ),
          );
        } catch (error) {
          trialErrors.push({ key, error: errorDescription(error) });
        }
      }
    }

    const failedChecks = failedTrialChecks(
      observations,
      trialErrors,
      initialBodyStates,
    );
    if (failedChecks.length > 0) {
      console.error(
        "COUNTERBALL_DIRECT_IMPULSE_PROBE_FAILURE",
        JSON.stringify(
          {
            fixtureId,
            fixtureMatchId: initial.matchId,
            candidateImpulses,
            aims: aimScenarios,
            failedChecks,
            trialErrors,
            observations,
          },
          null,
          2,
        ),
      );
    }
    expect(failedChecks).toEqual([]);
    await mergeDirectImpulseArtifact(observations, fixtureId);
  }, 600_000);
});
