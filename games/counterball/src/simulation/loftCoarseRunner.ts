import { Engine } from "@babylonjs/core/Engines/engine.js";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine.js";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import {
  PhysicsEngineV2,
  PhysicsShapeBox,
  PhysicsShapeType,
  type IPhysicsCollisionEvent,
  type PhysicsMaterial,
  type PhysicsShape,
} from "@babylonjs/core/Physics/v2/index.js";
import { PhysicsMaterialCombineMode } from "@babylonjs/core/Physics/v2/physicsMaterial.js";
import type { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody.js";
import {
  COUNTERBALL_CONFIG_V1,
  ENTITY_IDS,
  QUATERNION_NORM_TOLERANCE,
  hashCanonicalJson,
  hashCounterballConfig,
  parseMatchState,
  type BodyState,
  type MatchState,
  type Quat,
  type Vec3,
} from "@korre/game-protocol";
import havokWasmUrl from "@babylonjs/havok/lib/esm/HavokPhysics.wasm?url";
import fixtureJson from "../../../../tests/fixtures/counterball-v1.json";
import fixtureRaw from "../../../../tests/fixtures/counterball-v1.json?raw";
import { deriveRestartButtonPose } from "../features/restarts/domain/placementPose.js";
import {
  checkDiagnosticSweptEnvelope,
  cleanupDiagnosticResources,
  computeDiagnosticShiftedEnergy,
  deriveDiagnosticSweepPlan,
  errorWithCleanup,
  isDiagnosticShiftedEnergyWithinLimit,
  normalizeDiagnosticError,
  type DiagnosticEnergyBody,
  type DiagnosticSweepGuard,
} from "./browserDirectProbe.js";
import {
  canonicalizeLoftCoarseContactPair,
  LOFT_COARSE_TUPLES,
  matchesExactFloat32Projection,
  writeLoftCoarseMatrix,
  type LoftCoarseByteSink,
  type LoftCoarseCase,
  type LoftCoarseMatrixMetadata,
  type LoftCoarseMatrixSummary,
  type LoftCoarseEntityId,
  type LoftCoarseStaticBodyId,
  type LoftCoarseTuple,
} from "./loftCoarseProbe.js";
import { initializeHavokRuntime } from "./havokRuntime.js";
import {
  createCounterballWorld,
  type CounterballWorld,
} from "./worldFactory.js";
import { nativeCylinderComRadius } from "./nativeCylinderRadius.js";
import {
  deriveNativeCylinderSupportDatum,
} from "./nativeCylinderSupportDatum.js";

const config = COUNTERBALL_CONFIG_V1;
const guard = config.restartLoftDiagnosticGuard;
const encoder = new TextEncoder();
const expectedFixtureFileSha256 =
  "beaa25d969b7e0c5e863538af13d54ba9b2f8b9547c4827ef220ea863aa1b092";
const staticNames = new Map<string, LoftCoarseStaticBodyId>([
  ["counterball-goal-post--1--1", "goal-frame-0"],
  ["counterball-goal-post--1-1", "goal-frame-1"],
  ["counterball-goal-crossbar--1", "goal-frame-2"],
  ["counterball-goal-post-1--1", "goal-frame-3"],
  ["counterball-goal-post-1-1", "goal-frame-4"],
  ["counterball-goal-crossbar-1", "goal-frame-5"],
  ["counterball-surface", "support-apron"],
]);
const staticIds: readonly LoftCoarseStaticBodyId[] = [
  "goal-frame-0",
  "goal-frame-1",
  "goal-frame-2",
  "goal-frame-3",
  "goal-frame-4",
  "goal-frame-5",
  "support-apron",
];
const targetFrictionCombine = PhysicsMaterialCombineMode.MINIMUM;
const targetRestitutionCombine = PhysicsMaterialCombineMode.MAXIMUM;
type DiagnosticMaterialValues = {
  friction: number;
  staticFriction: number;
  restitution: number;
  frictionCombine: "MINIMUM";
  restitutionCombine: "MAXIMUM";
};

export type LoftCoarseRunOptions = Readonly<{
  engine: AbstractEngine;
  signal: AbortSignal;
  sink: LoftCoarseByteSink;
  onProgress: (progress: LoftCoarseProgress) => void;
}>;

export type LoftCoarseProgress = Readonly<{
  completedCases: number;
  totalCases: number;
  currentMatrixIndex: number | null;
  nominalTick: number;
  nominalTickLimit: number;
  executeStepCalls: number;
  batches: number;
  elapsedMs: number;
}>;

export type LoftCoarseRunSummary = LoftCoarseMatrixSummary &
  Readonly<{
    configHash: string;
    fixtureFileSha256: string;
    fixturePayloadSha256: string;
    wasmSha256: string;
    runtimeIdentity: string;
    eligibleCases: number;
    measuredMatrixWallTimeMs: number;
  }>;

type NativeBodyMetrics = {
  id: LoftCoarseEntityId;
  body: PhysicsBody;
  shape: PhysicsShape;
  radius: number;
  height: number;
  dimensions: Vec3;
  nativeLocalAabb: Readonly<{ minimum: Vec3; maximum: Vec3 }>;
  farthestPointRadius: number;
  farthestOriginRadius: number;
  mass: number;
  inertiaUnitMass: Vec3;
  inertiaOrientation: Quat;
  centerOfMassLocal: Vec3;
  filter: readonly [number, number];
  restY: number;
};

type NativeBodySample = {
  state: Omit<BodyState, "id"> & { id: LoftCoarseEntityId };
  centerOfMass: Vec3;
  angularVelocityPrincipal: Vec3;
};

type NamedStaticBody = {
  id: LoftCoarseStaticBodyId;
  body: PhysicsBody;
  shape: PhysicsShape;
  dimensions: Vec3;
  nativeLocalAabb: Readonly<{ minimum: Vec3; maximum: Vec3 }>;
  filter: readonly [number, number];
  material: ReturnType<typeof materialFact>;
};

function failure(message: string, cause?: unknown): Error {
  return cause === undefined
    ? new Error(message)
    : new Error(message, { cause });
}

function resourceFailure(message: string, cause?: unknown): Error {
  return Object.assign(failure(message, cause), { code: "resourceLimit" });
}

function resourceGuard<T>(operation: () => T): T {
  try {
    return operation();
  } catch (error) {
    throw normalizeDiagnosticError(error, "resourceLimit");
  }
}

function cancellationError(reason: unknown, message: string): Error {
  if (reason instanceof Error)
    return normalizeDiagnosticError(reason, "cancelled");
  return Object.assign(new Error(message), {
    name: "AbortError",
    code: "cancelled",
  });
}

function checkCancelled(signal: AbortSignal, label: string): void {
  if (signal.aborted) {
    throw cancellationError(signal.reason, `${label} was cancelled.`);
  }
}

function nowMs(): number {
  const value = globalThis.performance?.now();
  if (value === undefined || !Number.isFinite(value)) {
    throw resourceFailure("A monotonic browser clock is unavailable.");
  }
  return value;
}

function ensureWithin(
  signal: AbortSignal,
  startedAt: number,
  deadlineMs: number,
  label: string,
): void {
  checkCancelled(signal, label);
  if (nowMs() - startedAt > deadlineMs) {
    throw Object.assign(new Error(`${label} exceeded its wall-time limit.`), {
      code: "resourceLimit",
    });
  }
}

function finiteVector(value: Vec3): boolean {
  return (
    Number.isFinite(value.x) &&
    Number.isFinite(value.y) &&
    Number.isFinite(value.z)
  );
}

function assertFiniteVector(value: Vec3, label: string): void {
  if (!finiteVector(value)) throw resourceFailure(`${label} is non-finite.`);
}

function normalizedQuaternion(value: Quat, label: string): Quat {
  if (
    !Number.isFinite(value.x) ||
    !Number.isFinite(value.y) ||
    !Number.isFinite(value.z) ||
    !Number.isFinite(value.w)
  ) {
    throw resourceFailure(`${label} is non-finite.`);
  }
  const norm = Math.hypot(value.x, value.y, value.z, value.w);
  if (
    !Number.isFinite(norm) ||
    norm === 0 ||
    Math.abs(norm - 1) > QUATERNION_NORM_TOLERANCE
  ) {
    throw resourceFailure(`${label} is not normalized.`);
  }
  return {
    x: value.x / norm,
    y: value.y / norm,
    z: value.z / norm,
    w: value.w / norm,
  };
}

function conjugate(value: Quat): Quat {
  return { x: -value.x, y: -value.y, z: -value.z, w: value.w };
}

function multiplyQuaternion(left: Quat, right: Quat): Quat {
  return normalizedQuaternion(
    {
      x:
        left.w * right.x +
        left.x * right.w +
        left.y * right.z -
        left.z * right.y,
      y:
        left.w * right.y -
        left.x * right.z +
        left.y * right.w +
        left.z * right.x,
      z:
        left.w * right.z +
        left.x * right.y -
        left.y * right.x +
        left.z * right.w,
      w:
        left.w * right.w -
        left.x * right.x -
        left.y * right.y -
        left.z * right.z,
    },
    "Combined orientation",
  );
}

function rotate(rotation: Quat, vector: Vec3): Vec3 {
  const q = normalizedQuaternion(rotation, "Rotation");
  const tx = 2 * (q.y * vector.z - q.z * vector.y);
  const ty = 2 * (q.z * vector.x - q.x * vector.z);
  const tz = 2 * (q.x * vector.y - q.y * vector.x);
  return {
    x: vector.x + q.w * tx + q.y * tz - q.z * ty,
    y: vector.y + q.w * ty + q.z * tx - q.x * tz,
    z: vector.z + q.w * tz + q.x * ty - q.y * tx,
  };
}

function add(left: Vec3, right: Vec3): Vec3 {
  return { x: left.x + right.x, y: left.y + right.y, z: left.z + right.z };
}

function maskIsValid(value: number): boolean {
  return (
    Number.isSafeInteger(value) && value >= -0x80000000 && value <= 0xffffffff
  );
}

function materialName(value: PhysicsMaterialCombineMode | undefined): string {
  if (value === undefined) {
    throw resourceFailure("A native material combine mode is missing.");
  }
  switch (value) {
    case PhysicsMaterialCombineMode.MINIMUM:
      return "MINIMUM";
    case PhysicsMaterialCombineMode.MAXIMUM:
      return "MAXIMUM";
    case PhysicsMaterialCombineMode.GEOMETRIC_MEAN:
      return "GEOMETRIC_MEAN";
    case PhysicsMaterialCombineMode.ARITHMETIC_MEAN:
      return "ARITHMETIC_MEAN";
    case PhysicsMaterialCombineMode.MULTIPLY:
      return "MULTIPLY";
    default:
      throw resourceFailure("A native material combine mode is unsupported.");
  }
}

function materialValues(material: PhysicsMaterial): DiagnosticMaterialValues {
  const friction = material.friction;
  const staticFriction = material.staticFriction;
  const restitution = material.restitution;
  const frictionCombine = material.frictionCombine;
  const restitutionCombine = material.restitutionCombine;
  if (
    typeof friction !== "number" ||
    typeof staticFriction !== "number" ||
    typeof restitution !== "number" ||
    frictionCombine === undefined ||
    restitutionCombine === undefined
  ) {
    throw resourceFailure(
      "A native material coefficient or combine mode is missing.",
    );
  }
  const nativeValues = {
    friction,
    staticFriction,
    restitution,
    frictionCombine: materialName(frictionCombine),
    restitutionCombine: materialName(restitutionCombine),
  };
  if (
    !Number.isFinite(nativeValues.friction) ||
    !Number.isFinite(nativeValues.staticFriction) ||
    !Number.isFinite(nativeValues.restitution) ||
    nativeValues.friction < 0 ||
    nativeValues.staticFriction < 0 ||
    nativeValues.restitution < 0 ||
    nativeValues.restitution > 1 ||
    nativeValues.frictionCombine !== guard.materials.frictionCombine ||
    nativeValues.restitutionCombine !== guard.materials.restitutionCombine
  ) {
    throw resourceFailure(
      "A native material value is missing or out of range.",
    );
  }
  return {
    friction: nativeValues.friction,
    staticFriction: nativeValues.staticFriction,
    restitution: nativeValues.restitution,
    frictionCombine: guard.materials.frictionCombine,
    restitutionCombine: guard.materials.restitutionCombine,
  };
}

function materialFact(): DiagnosticMaterialValues {
  return {
    friction: guard.materials.friction,
    staticFriction: guard.materials.staticFriction,
    restitution: guard.materials.restitution,
    frictionCombine: guard.materials.frictionCombine,
    restitutionCombine: guard.materials.restitutionCombine,
  };
}

function setAndReadMaterial(
  world: CounterballWorld,
  shape: PhysicsShape,
): {
  setter: ReturnType<typeof materialFact>;
  readback: ReturnType<typeof materialFact>;
} {
  const setter = materialFact();
  shape.material = {
    friction: setter.friction,
    staticFriction: setter.staticFriction,
    restitution: setter.restitution,
    frictionCombine: targetFrictionCombine,
    restitutionCombine: targetRestitutionCombine,
  };
  const readback = materialValues(world.plugin.getMaterial(shape));
  for (const key of ["friction", "staticFriction", "restitution"] as const) {
    if (!matchesExactFloat32Projection(setter[key], readback[key])) {
      const projected = Math.fround(setter[key]);
      throw resourceFailure(
        `Native ${key} material readback differs from its setter. ${JSON.stringify(
          {
            field: key,
            configuredSetter: setter[key],
            projected,
            readback: readback[key],
          },
        )}`,
      );
    }
  }
  for (const key of ["frictionCombine", "restitutionCombine"] as const) {
    if (readback[key] !== setter[key]) {
      throw resourceFailure(
        `Native ${key} material readback differs from its setter. ${JSON.stringify(
          {
            field: key,
            setter: setter[key],
            readback: readback[key],
          },
        )}`,
      );
    }
  }
  return { setter, readback };
}

function shapeBoundsAndDimensions(shape: PhysicsShape): {
  minimum: Vec3;
  maximum: Vec3;
  dimensions: Vec3;
} {
  const bounds = shape.getBoundingBox();
  const minimum = {
    x: bounds.minimum.x,
    y: bounds.minimum.y,
    z: bounds.minimum.z,
  };
  const maximum = {
    x: bounds.maximum.x,
    y: bounds.maximum.y,
    z: bounds.maximum.z,
  };
  const dimensions = {
    x: maximum.x - minimum.x,
    y: maximum.y - minimum.y,
    z: maximum.z - minimum.z,
  };
  if (
    !finiteVector(dimensions) ||
    dimensions.x <= 0 ||
    dimensions.y <= 0 ||
    dimensions.z <= 0
  ) {
    throw resourceFailure("A native collider has unsupported dimensions.");
  }
  return { minimum, maximum, dimensions };
}

function shapeDimensions(shape: PhysicsShape): Vec3 {
  return shapeBoundsAndDimensions(shape).dimensions;
}

function radiiFromBounds(
  bounds: { minimum: Vec3; maximum: Vec3; dimensions: Vec3 },
  centerOfMassLocal: Vec3,
): { farthestPointRadius: number; farthestOriginRadius: number } {
  const farthestPointRadius = resourceGuard(() =>
    nativeCylinderComRadius(bounds, centerOfMassLocal),
  );
  let farthestOriginRadius = 0;
  for (const x of [bounds.minimum.x, bounds.maximum.x]) {
    for (const y of [bounds.minimum.y, bounds.maximum.y]) {
      for (const z of [bounds.minimum.z, bounds.maximum.z]) {
        farthestOriginRadius = Math.max(
          farthestOriginRadius,
          Math.hypot(x, y, z),
        );
      }
    }
  }
  if (
    !Number.isFinite(farthestPointRadius) ||
    farthestPointRadius <= 0 ||
    !Number.isFinite(farthestOriginRadius) ||
    farthestOriginRadius <= 0
  ) {
    throw resourceFailure("A native collider has no finite support radius.");
  }
  return { farthestPointRadius, farthestOriginRadius };
}

function omitConfigHash(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(omitConfigHash);
  if (value === null || typeof value !== "object") return value;
  const entries = Object.entries(value)
    .filter(([key]) => key !== "configHash")
    .map(([key, child]) => [key, omitConfigHash(child)] as const);
  return Object.fromEntries(entries);
}

async function sha256(buffer: ArrayBuffer): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
}

function withAbort<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const onAbort = (): void => {
      signal.removeEventListener("abort", onAbort);
      reject(cancellationError(signal.reason, "The L01 matrix was cancelled."));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    if (signal.aborted) {
      onAbort();
      return;
    }
    operation.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener("abort", onAbort);
        reject(normalizeDiagnosticError(error, "initialization"));
      },
    );
  });
}

function arrayBufferOf(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function fixtureState(): { fixtureId: string; state: MatchState } {
  const candidate = fixtureJson as unknown as {
    id?: unknown;
    versions?: { configHash?: unknown };
    states?: { initial?: unknown };
  };
  if (
    typeof candidate.id !== "string" ||
    candidate.id !== guard.fixture.id ||
    candidate.versions === undefined ||
    candidate.states?.initial === undefined
  ) {
    throw failure("The pinned fixture has an invalid shape or id.");
  }
  const state = parseMatchState(candidate.states.initial);
  if (
    state.matchId !== guard.matchId ||
    candidate.versions.configHash !== state.versions.configHash
  ) {
    throw failure("The fixture match/config identity is inconsistent.");
  }
  return { fixtureId: candidate.id, state };
}

function regeneratedState(
  fixture: MatchState,
  tuple: LoftCoarseTuple,
): MatchState {
  const [gap, tiltDegrees, , azimuthDegrees] = tuple;
  const { geometry } = config;
  const capY = geometry.surfaceY + geometry.capHeight / 2;
  const selectedPosition = { x: 0, y: capY, z: -5 };
  const pose = deriveRestartButtonPose(
    selectedPosition,
    (azimuthDegrees * Math.PI) / 180,
    (tiltDegrees * Math.PI) / 180,
    config,
  );
  const obstaclePosition = {
    x: 0,
    y: capY,
    z: pose.position.z + geometry.buttonRadius + geometry.capRadius + gap,
  };
  const fillerIds = ENTITY_IDS.filter(
    (id) => id !== "button" && id !== "home-0" && id !== "home-1",
  );
  const slots = guard.setup.fillerX.flatMap((x) =>
    guard.setup.fillerZ.map((z) => ({ x, y: capY, z })),
  );
  if (fillerIds.length !== 12 || slots.length !== fillerIds.length) {
    throw failure("The canonical filler order/slot matrix is invalid.");
  }
  const existing = new Map(fixture.bodies.map((body) => [body.id, body]));
  let fillerIndex = 0;
  const bodies = ENTITY_IDS.map((id) => {
    const original = existing.get(id);
    if (original === undefined) throw failure(`Fixture body ${id} is missing.`);
    let position: Vec3;
    let rotation: Quat = { x: 0, y: 0, z: 0, w: 1 };
    if (id === "home-0") position = selectedPosition;
    else if (id === "home-1") position = obstaclePosition;
    else if (id === "button") {
      position = pose.position;
      rotation = pose.rotation;
    } else {
      const slot = slots[fillerIndex];
      if (slot === undefined)
        throw failure("A canonical filler slot is missing.");
      position = slot;
      fillerIndex += 1;
    }
    return {
      ...original,
      position: { ...position },
      rotation: { ...rotation },
      linearVelocity: { x: 0, y: 0, z: 0 },
      angularVelocity: { x: 0, y: 0, z: 0 },
    } satisfies BodyState;
  });
  return parseMatchState({ ...fixture, bodies });
}

function getWorldSamples(
  metrics: readonly NativeBodyMetrics[],
): NativeBodySample[] {
  return metrics.map((metric) => {
    const node = metric.body.transformNode;
    const rotationValue = node.rotationQuaternion;
    if (rotationValue === null)
      throw resourceFailure(`Body ${metric.id} has no quaternion.`);
    const rotation = normalizedQuaternion(
      {
        x: rotationValue.x,
        y: rotationValue.y,
        z: rotationValue.z,
        w: rotationValue.w,
      },
      `Body ${metric.id} rotation`,
    );
    const position = {
      x: node.position.x,
      y: node.position.y,
      z: node.position.z,
    };
    const linear = metric.body.getLinearVelocity();
    const angular = metric.body.getAngularVelocity();
    const linearVelocity = { x: linear.x, y: linear.y, z: linear.z };
    const angularVelocity = { x: angular.x, y: angular.y, z: angular.z };
    assertFiniteVector(position, `Body ${metric.id} position`);
    assertFiniteVector(linearVelocity, `Body ${metric.id} linear velocity`);
    assertFiniteVector(angularVelocity, `Body ${metric.id} angular velocity`);
    const centerOfMass = add(
      position,
      rotate(rotation, metric.centerOfMassLocal),
    );
    const principalWorld = multiplyQuaternion(
      rotation,
      metric.inertiaOrientation,
    );
    const angularVelocityPrincipal = rotate(
      conjugate(principalWorld),
      angularVelocity,
    );
    return {
      state: {
        id: metric.id,
        position,
        rotation,
        linearVelocity,
        angularVelocity,
      },
      centerOfMass,
      angularVelocityPrincipal,
    };
  });
}

function energyBodies(
  metrics: readonly NativeBodyMetrics[],
  samples: readonly NativeBodySample[],
): DiagnosticEnergyBody[] {
  if (metrics.length !== 15 || samples.length !== 15) {
    throw resourceFailure(
      "Energy sample does not contain all fifteen dynamic bodies.",
    );
  }
  return metrics.map((metric, index) => {
    const sample = samples[index];
    if (sample === undefined)
      throw resourceFailure(`Missing body sample ${metric.id}.`);
    return {
      mass: metric.mass,
      inertiaUnitMass: metric.inertiaUnitMass,
      centerOfMassY: sample.centerOfMass.y,
      restY: metric.restY,
      linearVelocity: sample.state.linearVelocity,
      angularVelocityPrincipal: sample.angularVelocityPrincipal,
    };
  });
}

function allZero(samples: readonly NativeBodySample[]): boolean {
  return samples.every(({ state }) =>
    [
      state.linearVelocity.x,
      state.linearVelocity.y,
      state.linearVelocity.z,
      state.angularVelocity.x,
      state.angularVelocity.y,
      state.angularVelocity.z,
    ].every((value) => value === 0),
  );
}

function isCollisionCompatible(
  left: readonly [number, number],
  right: readonly [number, number],
): boolean {
  return (left[0] & right[1]) !== 0 && (right[0] & left[1]) !== 0;
}

function makeSweepGuard(): DiagnosticSweepGuard {
  return {
    maxMechanicalEnergy: guard.energy.maximum,
    maxRestHeightDrop: guard.energy.maximumRestComDrop,
    supportApronMargin: guard.setup.supportApronMargin,
    maxPointSweepPerSubstep: guard.sweep.maximumPointSweepPerCall,
    maxRotationPerSubstep: guard.sweep.maximumRotationPerCall,
    maxSubstepsPerTick: guard.sweep.maximumCallsPerNominalTick,
  };
}

function recordBodyRows(
  target: unknown[],
  tuple: LoftCoarseTuple,
  tick: number,
  samples: readonly NativeBodySample[],
): void {
  for (const sample of samples) {
    target.push({ tuple, nominalTick: tick, ...sample.state });
  }
}

function materialRow(
  bodyId: string,
  value: ReturnType<typeof setAndReadMaterial>,
): LoftCoarseCase["metadata"]["materials"][number] {
  return {
    bodyId,
    shapeIndex: 0,
    setter: value.setter,
    readback: value.readback,
  };
}

function supportClearances(
  metric: NativeBodyMetrics,
  sample: NativeBodySample,
  pointSweep: number,
): { apron: number; slab: number; drop: number } {
  const geometry = config.geometry;
  const apronX = geometry.pitchWidth / 2 + guard.setup.supportApronMargin;
  const apronZ = geometry.pitchLength / 2 + guard.setup.supportApronMargin;
  const apron = Math.min(
    apronX -
      (Math.abs(sample.state.position.x) +
        metric.farthestOriginRadius +
        pointSweep),
    apronZ -
      (Math.abs(sample.state.position.z) +
        metric.farthestOriginRadius +
        pointSweep),
  );
  const axis = rotate(sample.state.rotation, { x: 0, y: 1, z: 0 });
  const radialSupport =
    metric.radius * Math.sqrt(Math.max(0, 1 - axis.y * axis.y));
  const verticalSupport =
    (metric.height / 2) * Math.abs(axis.y) + radialSupport;
  const underside = geometry.surfaceY - geometry.surfaceThickness;
  const slab =
    sample.state.position.y - verticalSupport - pointSweep - underside;
  const drop = metric.restY - sample.centerOfMass.y;
  const result = { apron, slab, drop };
  if (Object.values(result).some((value) => !Number.isFinite(value))) {
    throw resourceFailure(
      `Body ${metric.id} has non-finite support clearance.`,
    );
  }
  if (apron < 0 || slab < 0 || drop > guard.energy.maximumRestComDrop) {
    throw Object.assign(
      new Error(`Body ${metric.id} crossed a strict support/drop guard.`),
      { code: "resourceLimit" },
    );
  }
  return result;
}

function verticalObstacleClearance(
  button: NativeBodyMetrics,
  buttonSample: NativeBodySample,
  obstacle: NativeBodyMetrics,
  obstacleSample: NativeBodySample,
  combinedPointSweep: number,
): { horizontalOverlap: boolean; clearance: number } {
  const horizontalDistance = Math.hypot(
    buttonSample.state.position.x - obstacleSample.state.position.x,
    buttonSample.state.position.z - obstacleSample.state.position.z,
  );
  const horizontalOverlap =
    horizontalDistance <=
    button.farthestOriginRadius +
      obstacle.farthestOriginRadius +
      combinedPointSweep;
  const buttonAxis = rotate(buttonSample.state.rotation, { x: 0, y: 1, z: 0 });
  const obstacleAxis = rotate(obstacleSample.state.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const buttonVerticalSupport =
    (button.height / 2) * Math.abs(buttonAxis.y) +
    button.radius * Math.sqrt(Math.max(0, 1 - buttonAxis.y * buttonAxis.y));
  const obstacleVerticalSupport =
    (obstacle.height / 2) * Math.abs(obstacleAxis.y) +
    obstacle.radius *
      Math.sqrt(Math.max(0, 1 - obstacleAxis.y * obstacleAxis.y));
  const clearance =
    Math.abs(buttonSample.state.position.y - obstacleSample.state.position.y) -
    buttonVerticalSupport -
    obstacleVerticalSupport -
    combinedPointSweep;
  if (!Number.isFinite(clearance))
    throw resourceFailure("Obstacle clearance is non-finite.");
  return { horizontalOverlap, clearance };
}

function staticBodyName(body: PhysicsBody): LoftCoarseStaticBodyId {
  const id = staticNames.get(body.transformNode.name);
  if (id === undefined)
    throw resourceFailure(
      `Unknown static collider ${body.transformNode.name}.`,
    );
  return id;
}

function eventPoint(point: IPhysicsCollisionEvent["point"]): Vec3 | null {
  if (point === null || point === undefined) return null;
  if (
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    !Number.isFinite(point.z)
  ) {
    throw resourceFailure("A native contact point is present but non-finite.");
  }
  return { x: point.x, y: point.y, z: point.z };
}

function isButtonObstaclePair(
  pair: LoftCoarseCase["contactRows"][number]["pair"],
): boolean {
  return (
    (pair[0] === "button" && pair[1] === "home-1") ||
    (pair[0] === "home-1" && pair[1] === "button")
  );
}

function makeMatrixMetadata(
  configHash: string,
  fixtureFileSha256: string,
  fixturePayloadSha256: string,
  wasmSha256: string,
  runtimeIdentity: string,
): LoftCoarseMatrixMetadata {
  return {
    guardSchemaVersion: guard.schemaVersion,
    scope: guard.scope,
    matrixId: guard.matrixId,
    algorithmVersion: guard.algorithmVersion,
    protocolVersion: guard.protocolVersion,
    configSchemaVersion: guard.configSchemaVersion,
    configVersion: config.configVersion,
    configHash,
    fixtureId: guard.fixture.id,
    fixturePayloadSha256,
    fixtureFileSha256,
    physicsVersion: guard.physicsVersion,
    adapterVersion: guard.physicsVersion.slice(
      guard.physicsVersion.lastIndexOf("/") + 1,
    ),
    wasmSha256,
    matchId: guard.matchId,
    runtimeIdentity,
  };
}

function exactMatrixTuples(): void {
  const expected = guard.matrix.gapOffsets.flatMap((gap) =>
    guard.matrix.tiltDegrees.flatMap((tilt) =>
      guard.matrix.impulseMagnitudes.flatMap((impulse) =>
        guard.matrix.azimuthDegrees.map(
          (azimuth) => [gap, tilt, impulse, azimuth] as const,
        ),
      ),
    ),
  );
  if (
    expected.length !== LOFT_COARSE_TUPLES.length ||
    expected.some((tuple, index) =>
      tuple.some((value, axis) => value !== LOFT_COARSE_TUPLES[index]?.[axis]),
    )
  ) {
    throw resourceFailure(
      "The exported L01 tuples do not match the hashed matrix order.",
    );
  }
}

function readNativeBodies(world: CounterballWorld): {
  metrics: NativeBodyMetrics[];
  dynamicFacts: LoftCoarseCase["metadata"]["dynamicBodies"][number][];
  materials: LoftCoarseCase["metadata"]["materials"][number][];
  statics: NamedStaticBody[];
  staticFacts: LoftCoarseCase["metadata"]["staticBodies"][number][];
  supportPlane: LoftCoarseCase["metadata"]["supportPlane"];
} {
  const { geometry } = config;
  const dynamicFacts: LoftCoarseCase["metadata"]["dynamicBodies"][number][] =
    [];
  const materials: LoftCoarseCase["metadata"]["materials"][number][] = [];
  const metrics: NativeBodyMetrics[] = [];
  for (const entityId of ENTITY_IDS) {
    const id = entityId;
    const body = world.bodies.get(entityId);
    if (body === undefined)
      throw resourceFailure(`Canonical dynamic body ${id} is missing.`);
    const shape = body.shape;
    if (shape === null)
      throw resourceFailure(`Dynamic body ${id} has an unsupported collider.`);
    const nativeShapeType = shape.type;
    if (nativeShapeType !== PhysicsShapeType.CYLINDER || shape.isTrigger) {
      throw resourceFailure(`Dynamic body ${id} has an unsupported collider.`);
    }
    const transform = body.transformNode;
    if (
      transform.parent !== null ||
      transform.scaling.x !== 1 ||
      transform.scaling.y !== 1 ||
      transform.scaling.z !== 1
    ) {
      throw resourceFailure(
        `Dynamic body ${id} has unsupported parent/scale geometry.`,
      );
    }
    const nativeMaterial = setAndReadMaterial(world, shape);
    materials.push(materialRow(id, nativeMaterial));
    const membership = shape.filterMembershipMask;
    const collide = shape.filterCollideMask;
    if (!maskIsValid(membership) || !maskIsValid(collide)) {
      throw resourceFailure(
        `Dynamic body ${id} has invalid native collision filters.`,
      );
    }
    const nativeBounds = shapeBoundsAndDimensions(shape);
    const dimensions = nativeBounds.dimensions;
    if (
      nativeBounds.minimum.x !== -nativeBounds.maximum.x ||
      nativeBounds.minimum.y !== -nativeBounds.maximum.y ||
      nativeBounds.minimum.z !== -nativeBounds.maximum.z ||
      dimensions.x !== dimensions.z
    ) {
      throw resourceFailure(
        `Dynamic body ${id} native cylinder bounds are not centered and symmetric.`,
      );
    }
    const isButton = id === "button";
    const configuredRadius = isButton
      ? geometry.buttonRadius
      : geometry.capRadius;
    const configuredHeight = isButton
      ? geometry.buttonThickness
      : geometry.capHeight;
    const expectedDimensions = {
      x: configuredRadius * 2,
      y: configuredHeight,
      z: configuredRadius * 2,
    };
    const radius = Math.max(dimensions.x, dimensions.z) / 2;
    const height = dimensions.y;
    if (
      !matchesExactFloat32Projection(expectedDimensions.x, dimensions.x) ||
      !matchesExactFloat32Projection(expectedDimensions.y, dimensions.y) ||
      !matchesExactFloat32Projection(expectedDimensions.z, dimensions.z)
    ) {
      throw resourceFailure(
        `Dynamic body ${id} native dimensions differ from canonical cylinder geometry. ${JSON.stringify(
          {
            bodyId: id,
            nativeShapeType,
            configuredRadius,
            configuredHeight,
            expectedDimensions,
            nativeLocalAabb: {
              minimum: nativeBounds.minimum,
              maximum: nativeBounds.maximum,
            },
            observedDimensions: dimensions,
          },
        )}`,
      );
    }
    const properties = body.getMassProperties();
    if (
      properties.mass === undefined ||
      properties.centerOfMass === undefined ||
      properties.inertia === undefined ||
      properties.inertiaOrientation === undefined
    ) {
      throw resourceFailure(
        `Dynamic body ${id} has incomplete native mass properties.`,
      );
    }
    const mass = properties.mass;
    const centerOfMassLocal = {
      x: properties.centerOfMass.x,
      y: properties.centerOfMass.y,
      z: properties.centerOfMass.z,
    };
    const inertiaUnitMass = {
      x: properties.inertia.x,
      y: properties.inertia.y,
      z: properties.inertia.z,
    };
    const inertiaOrientation = normalizedQuaternion(
      {
        x: properties.inertiaOrientation.x,
        y: properties.inertiaOrientation.y,
        z: properties.inertiaOrientation.z,
        w: properties.inertiaOrientation.w,
      },
      `Body ${id} inertia orientation`,
    );
    const configuredMass = isButton
      ? config.bodies.buttonMass
      : config.bodies.capMass;
    const projectedMass = Math.fround(configuredMass);
    const tolerance =
      guard.energy.nativeMassToleranceMultiplier *
      Number.EPSILON *
      Math.max(1, configuredMass);
    if (
      !Number.isFinite(mass) ||
      mass <= 0 ||
      !finiteVector(centerOfMassLocal) ||
      !finiteVector(inertiaUnitMass) ||
      inertiaUnitMass.x <= 0 ||
      inertiaUnitMass.y <= 0 ||
      inertiaUnitMass.z <= 0 ||
      Math.abs(mass - projectedMass) > tolerance
    ) {
      throw resourceFailure(
        `Dynamic body ${id} failed its actual native mass/inertia projection checks.`,
      );
    }
    const radii = radiiFromBounds(nativeBounds, centerOfMassLocal);
    const metric: NativeBodyMetrics = {
      id,
      body,
      shape,
      radius,
      height,
      dimensions,
      nativeLocalAabb: {
        minimum: nativeBounds.minimum,
        maximum: nativeBounds.maximum,
      },
      farthestPointRadius: radii.farthestPointRadius,
      farthestOriginRadius: radii.farthestOriginRadius,
      mass,
      inertiaUnitMass,
      inertiaOrientation,
      centerOfMassLocal,
      filter: [membership, collide],
      restY: Number.NaN,
    };
    metrics.push(metric);
    dynamicFacts.push({
      id,
      nativeShapeType,
      nativeLocalAabb: {
        minimum: nativeBounds.minimum,
        maximum: nativeBounds.maximum,
      },
      nativeMass: mass,
      centerOfMassOffset: centerOfMassLocal,
      principalInertias: inertiaUnitMass,
      inertiaOrientation,
      colliderDimensions: dimensions,
      collisionFilter: [membership, collide],
      initialLinearVelocity: { x: 0, y: 0, z: 0 },
      initialAngularVelocity: { x: 0, y: 0, z: 0 },
      configuredMassProjection: {
        configuredMass,
        projectedMass,
        observedNativeMass: mass,
        tolerance,
        withinTolerance: true,
      },
    });
  }
  if (metrics.length !== ENTITY_IDS.length || world.staticBodies.length !== 7) {
    throw resourceFailure(
      "The Havok world does not contain the canonical 15+7 body set.",
    );
  }
  const statics: NamedStaticBody[] = [];
  const staticFacts: LoftCoarseCase["metadata"]["staticBodies"][number][] = [];
  let supportPlane: LoftCoarseCase["metadata"]["supportPlane"] | undefined;
  for (const body of world.staticBodies) {
    const id = staticBodyName(body);
    const shape = body.shape;
    if (shape === null || shape.isTrigger)
      throw resourceFailure(`Static body ${id} has no solid shape.`);
    const nativeShapeType = shape.type;
    const material = setAndReadMaterial(world, shape);
    materials.push(materialRow(id, material));
    const membership = shape.filterMembershipMask;
    const collide = shape.filterCollideMask;
    const density = shape.density;
    if (
      !maskIsValid(membership) ||
      !maskIsValid(collide) ||
      !Number.isFinite(density) ||
      density < 0
    ) {
      throw resourceFailure(
        `Static body ${id} has invalid native filter/density properties.`,
      );
    }
    const nativeBounds = shapeBoundsAndDimensions(shape);
    const dimensions = nativeBounds.dimensions;
    if (id === "support-apron") {
      if (
        nativeShapeType !== PhysicsShapeType.BOX ||
        nativeBounds.minimum.x !== -nativeBounds.maximum.x ||
        nativeBounds.minimum.y !== -nativeBounds.maximum.y ||
        nativeBounds.minimum.z !== -nativeBounds.maximum.z ||
        dimensions.x !== 662 ||
        !matchesExactFloat32Projection(0.2, dimensions.y) ||
        dimensions.z !== 670
      ) {
        throw resourceFailure(
          "The diagnostic support apron does not match the exact hashed slab geometry.",
        );
      }
      const transform = body.transformNode;
      const rotationValue = transform.rotationQuaternion;
      let rotation: Quat;
      let identityRotation: boolean;
      if (rotationValue === null) {
        identityRotation =
          transform.rotation.x === 0 &&
          transform.rotation.y === 0 &&
          transform.rotation.z === 0;
        rotation = { x: 0, y: 0, z: 0, w: 1 };
      } else {
        rotation = {
          x: rotationValue.x,
          y: rotationValue.y,
          z: rotationValue.z,
          w: rotationValue.w,
        };
        identityRotation =
          Number.isFinite(rotation.x) &&
          Number.isFinite(rotation.y) &&
          Number.isFinite(rotation.z) &&
          Number.isFinite(rotation.w) &&
          rotation.x === 0 &&
          rotation.y === 0 &&
          rotation.z === 0 &&
          rotation.w === 1;
      }
      const position = {
        x: transform.position.x,
        y: transform.position.y,
        z: transform.position.z,
      };
      const hasParent = transform.parent !== null;
      const scaling = {
        x: transform.scaling.x,
        y: transform.scaling.y,
        z: transform.scaling.z,
      };
      const referenceY = geometry.surfaceY;
      const nativeTopY = position.y + nativeBounds.maximum.y;
      if (
        position.x !== 0 ||
        position.y !== geometry.surfaceY - geometry.surfaceThickness / 2 ||
        position.z !== 0 ||
        !identityRotation ||
        hasParent ||
        scaling.x !== 1 ||
        scaling.y !== 1 ||
        scaling.z !== 1 ||
        !Number.isFinite(nativeTopY) ||
        nativeTopY < referenceY
      ) {
        throw resourceFailure(
          "The diagnostic support plane has an unsupported native pose or top.",
        );
      }
      supportPlane = {
        referenceY,
        nativeTopY,
        nativeShapeType,
        nativeLocalAabb: {
          minimum: nativeBounds.minimum,
          maximum: nativeBounds.maximum,
        },
        position,
        rotation,
        scaling,
        hasParent,
      };
    } else if (nativeShapeType !== PhysicsShapeType.CYLINDER) {
      throw resourceFailure(
        `Goal frame body ${id} has an unsupported collider type.`,
      );
    } else {
      const isCrossbar = id === "goal-frame-2" || id === "goal-frame-5";
      const expected = isCrossbar
        ? {
            x: geometry.goalWidth,
            y: geometry.goalFrameRadius * 2,
            z: geometry.goalFrameRadius * 2,
          }
        : {
            x: geometry.goalFrameRadius * 2,
            y: geometry.goalHeight,
            z: geometry.goalFrameRadius * 2,
          };
      if (
        !matchesExactFloat32Projection(expected.x, dimensions.x) ||
        !matchesExactFloat32Projection(expected.y, dimensions.y) ||
        !matchesExactFloat32Projection(expected.z, dimensions.z)
      ) {
        throw resourceFailure(
          `Goal frame collider ${id} dimensions differ from canonical geometry. ${JSON.stringify(
            {
              id,
              shapeType: nativeShapeType,
              configured: {
                goalWidth: geometry.goalWidth,
                goalHeight: geometry.goalHeight,
                goalFrameRadius: geometry.goalFrameRadius,
              },
              expectedDimensions: expected,
              nativeLocalAabb: {
                minimum: nativeBounds.minimum,
                maximum: nativeBounds.maximum,
              },
              observedDimensions: dimensions,
            },
          )}`,
        );
      }
    }
    const named: NamedStaticBody = {
      id,
      body,
      shape,
      dimensions,
      nativeLocalAabb: {
        minimum: nativeBounds.minimum,
        maximum: nativeBounds.maximum,
      },
      filter: [membership, collide],
      material: material.readback,
    };
    statics.push(named);
    staticFacts.push({
      id,
      colliderDimensions: dimensions,
      collisionFilter: named.filter,
      material: named.material,
    });
  }
  statics.sort((a, b) => staticIds.indexOf(a.id) - staticIds.indexOf(b.id));
  staticFacts.sort(
    (a, b) =>
      staticIds.indexOf((a as { id: LoftCoarseStaticBodyId }).id) -
      staticIds.indexOf((b as { id: LoftCoarseStaticBodyId }).id),
  );
  if (
    materials.length !== guard.materials.shapeCount ||
    statics.length !== staticIds.length
  ) {
    throw resourceFailure("Native material/static facts are incomplete.");
  }
  const support = statics.find((item) => item.id === "support-apron");
  if (support === undefined)
    throw resourceFailure("Diagnostic support body is missing.");
  for (const metric of metrics) {
    if (!isCollisionCompatible(metric.filter, support.filter)) {
      throw resourceFailure(
        `Dynamic body ${metric.id} cannot collide with the support slab.`,
      );
    }
    for (const staticBody of statics) {
      if (!isCollisionCompatible(metric.filter, staticBody.filter)) {
        throw resourceFailure(
          `Dynamic body ${metric.id} cannot collide with ${staticBody.id}.`,
        );
      }
    }
  }
  for (let left = 0; left < metrics.length; left += 1) {
    for (let right = left + 1; right < metrics.length; right += 1) {
      const first = metrics[left];
      const second = metrics[right];
      if (
        first === undefined ||
        second === undefined ||
        !isCollisionCompatible(first.filter, second.filter)
      ) {
        throw resourceFailure(
          "Dynamic collision filters are unsupported or incompatible.",
        );
      }
    }
  }
  if (supportPlane === undefined)
    throw resourceFailure("Native support-plane facts are incomplete.");
  return {
    metrics,
    dynamicFacts,
    materials,
    statics,
    staticFacts,
    supportPlane,
  };
}

async function makeCaseInitialBodyState(state: MatchState): Promise<string> {
  return hashCanonicalJson(state);
}

function measureMatrixWallTime(startedAt: number): number {
  const elapsed = nowMs() - startedAt;
  if (elapsed > guard.workload.maximumWallTimeMatrixMs) {
    throw Object.assign(
      new Error("The matrix exceeded its wall-time ceiling."),
      { code: "resourceLimit" },
    );
  }
  return elapsed;
}

async function yieldToBrowser(signal: AbortSignal): Promise<void> {
  checkCancelled(signal, "The L01 matrix");
  await new Promise<void>((resolve) => globalThis.setTimeout(resolve, 0));
  checkCancelled(signal, "The L01 matrix");
}

async function runCase(
  engine: AbstractEngine,
  havok: Awaited<ReturnType<typeof initializeHavokRuntime>>,
  fixture: MatchState,
  tuple: LoftCoarseTuple,
  matrixIndex: number,
  identity: LoftCoarseMatrixMetadata,
  signal: AbortSignal,
  runStartedAt: number,
  counts: {
    calls: number;
    batches: number;
    contacts: number;
    eligible: number;
  },
  progress: (progress: LoftCoarseProgress) => void,
  completedCases: number,
): Promise<LoftCoarseCase> {
  const caseStartedAt = nowMs();
  const caseBeginCalls = counts.calls;
  let world: CounterballWorld | undefined;
  let replacementShape: PhysicsShapeBox | undefined;
  let replacementAttached = false;
  let originalSurfaceShape: PhysicsShape | undefined;
  let surfaceBody: PhysicsBody | undefined;
  const removeObservers: Array<() => void> = [];
  let result: LoftCoarseCase | undefined;
  let primaryError: unknown;
  try {
    ensureWithin(
      signal,
      runStartedAt,
      guard.workload.maximumWallTimeMatrixMs,
      "L01 matrix",
    );
    ensureWithin(
      signal,
      caseStartedAt,
      guard.workload.maximumWallTimePerCaseMs,
      "L01 case",
    );
    const caseState = regeneratedState(fixture, tuple);
    const initialStateHash = await makeCaseInitialBodyState(caseState);
    const activeWorld = createCounterballWorld({
      engine,
      havok,
      state: caseState,
      gravity: new Vector3(
        config.simulation.gravity.x,
        config.simulation.gravity.y,
        config.simulation.gravity.z,
      ),
    });
    world = activeWorld;
    if (activeWorld.plugin.isSupported() !== true)
      throw failure("Pinned browser Havok plugin is not supported.");
    const physicsEngine = activeWorld.scene.getPhysicsEngine();
    if (!(physicsEngine instanceof PhysicsEngineV2))
      throw failure("The trial did not create PhysicsEngineV2.");
    const physicsBodies = physicsEngine.getBodies();
    if (
      activeWorld.staticBodies.length !== 7 ||
      activeWorld.bodies.size !== 15 ||
      physicsBodies.length !== 22 ||
      [...activeWorld.bodies.values(), ...activeWorld.staticBodies].some(
        (body) => !physicsBodies.includes(body),
      )
    ) {
      throw resourceFailure(
        "The trial does not have exactly the canonical 15 dynamic and 7 static bodies.",
      );
    }
    surfaceBody = activeWorld.staticBodies.find(
      (body) => body.transformNode.name === "counterball-surface",
    );
    if (surfaceBody === undefined)
      throw resourceFailure("Canonical support surface is missing.");
    originalSurfaceShape = surfaceBody.shape ?? undefined;
    const originalShape = originalSurfaceShape;
    if (
      originalShape === undefined ||
      originalShape.type !== PhysicsShapeType.BOX ||
      originalShape.isTrigger
    ) {
      throw resourceFailure("Canonical surface is not a solid box.");
    }
    const expectedSurfaceY =
      config.geometry.surfaceY - config.geometry.surfaceThickness / 2;
    const originalSurfaceDimensions = resourceGuard(() =>
      shapeDimensions(originalShape),
    );
    const surfaceRotation = surfaceBody.transformNode.rotationQuaternion;
    const surfaceIsIdentityRotation =
      surfaceRotation === null
        ? surfaceBody.transformNode.rotation.x === 0 &&
          surfaceBody.transformNode.rotation.y === 0 &&
          surfaceBody.transformNode.rotation.z === 0
        : surfaceRotation.x === 0 &&
          surfaceRotation.y === 0 &&
          surfaceRotation.z === 0 &&
          surfaceRotation.w === 1;
    if (
      surfaceBody.transformNode.position.x !== 0 ||
      surfaceBody.transformNode.position.y !== expectedSurfaceY ||
      surfaceBody.transformNode.position.z !== 0 ||
      !surfaceIsIdentityRotation ||
      surfaceBody.transformNode.parent !== null ||
      surfaceBody.transformNode.scaling.x !== 1 ||
      surfaceBody.transformNode.scaling.y !== 1 ||
      surfaceBody.transformNode.scaling.z !== 1 ||
      originalSurfaceDimensions.x !== config.geometry.pitchWidth ||
      !matchesExactFloat32Projection(
        config.geometry.surfaceThickness,
        originalSurfaceDimensions.y,
      ) ||
      originalSurfaceDimensions.z !== config.geometry.pitchLength
    ) {
      const diagnosticNumber = (value: number): number | string =>
        Number.isFinite(value) ? value : String(value);
      const expectedSupportReadback = {
        position: {
          x: 0,
          y: expectedSurfaceY,
          z: 0,
        },
        rotation:
          surfaceRotation === null
            ? { representation: "euler", x: 0, y: 0, z: 0 }
            : {
                representation: "quaternion",
                x: 0,
                y: 0,
                z: 0,
                w: 1,
                componentTolerance: 0,
              },
        parent: null,
        scale: { x: 1, y: 1, z: 1 },
        nativeShapeDimensions: {
          x: config.geometry.pitchWidth,
          y: config.geometry.surfaceThickness,
          z: config.geometry.pitchLength,
        },
        nativeShapeDimensionYProjection: {
          configured: config.geometry.surfaceThickness,
          projected: diagnosticNumber(
            Math.fround(config.geometry.surfaceThickness),
          ),
          observed: diagnosticNumber(originalSurfaceDimensions.y),
        },
      };
      const observedSupportReadback = {
        position: {
          x: diagnosticNumber(surfaceBody.transformNode.position.x),
          y: diagnosticNumber(surfaceBody.transformNode.position.y),
          z: diagnosticNumber(surfaceBody.transformNode.position.z),
        },
        rotation:
          surfaceRotation === null
            ? {
                representation: "euler",
                x: diagnosticNumber(surfaceBody.transformNode.rotation.x),
                y: diagnosticNumber(surfaceBody.transformNode.rotation.y),
                z: diagnosticNumber(surfaceBody.transformNode.rotation.z),
              }
            : {
                representation: "quaternion",
                x: diagnosticNumber(surfaceRotation.x),
                y: diagnosticNumber(surfaceRotation.y),
                z: diagnosticNumber(surfaceRotation.z),
                w: diagnosticNumber(surfaceRotation.w),
              },
        parent: surfaceBody.transformNode.parent === null ? null : "present",
        scale: {
          x: diagnosticNumber(surfaceBody.transformNode.scaling.x),
          y: diagnosticNumber(surfaceBody.transformNode.scaling.y),
          z: diagnosticNumber(surfaceBody.transformNode.scaling.z),
        },
        nativeShapeDimensions: {
          readFrom: "PhysicsShape.getBoundingBox()",
          x: diagnosticNumber(originalSurfaceDimensions.x),
          y: diagnosticNumber(originalSurfaceDimensions.y),
          z: diagnosticNumber(originalSurfaceDimensions.z),
        },
      };
      const supportPreflightMatches = {
        positionX: surfaceBody.transformNode.position.x === 0,
        positionY: surfaceBody.transformNode.position.y === expectedSurfaceY,
        positionZ: surfaceBody.transformNode.position.z === 0,
        rotationIsIdentity: surfaceIsIdentityRotation,
        parentIsNull: surfaceBody.transformNode.parent === null,
        scaleX: surfaceBody.transformNode.scaling.x === 1,
        scaleY: surfaceBody.transformNode.scaling.y === 1,
        scaleZ: surfaceBody.transformNode.scaling.z === 1,
        nativeShapeDimensionX:
          originalSurfaceDimensions.x === config.geometry.pitchWidth,
        nativeShapeDimensionY: matchesExactFloat32Projection(
          config.geometry.surfaceThickness,
          originalSurfaceDimensions.y,
        ),
        nativeShapeDimensionZ:
          originalSurfaceDimensions.z === config.geometry.pitchLength,
      };
      throw resourceFailure(
        `Canonical support transform differs from the open slab contract. ${JSON.stringify(
          {
            expected: expectedSupportReadback,
            observed: observedSupportReadback,
            clauseMatches: supportPreflightMatches,
          },
        )}`,
      );
    }
    const originalMembership = originalShape.filterMembershipMask;
    const originalCollide = originalShape.filterCollideMask;
    const originalDensity = originalShape.density;
    if (
      !maskIsValid(originalMembership) ||
      !maskIsValid(originalCollide) ||
      !Number.isFinite(originalDensity) ||
      originalDensity < 0
    ) {
      throw resourceFailure(
        "Canonical surface filter or density readback is invalid.",
      );
    }
    // The detached original is restored only during disposal. Set the accepted
    // diagnostic material before cloning it so the replacement preserves it.
    resourceGuard(() => setAndReadMaterial(activeWorld, originalShape));
    const dimensionsX =
      config.geometry.pitchWidth + 2 * guard.setup.supportApronMargin;
    const dimensionsZ =
      config.geometry.pitchLength + 2 * guard.setup.supportApronMargin;
    if (
      dimensionsX !== 662 ||
      dimensionsZ !== 670 ||
      config.geometry.surfaceThickness !== 0.2
    ) {
      throw resourceFailure(
        "Hashed diagnostic apron dimensions differ from the accepted 662 x 0.2 x 670 slab.",
      );
    }
    replacementShape = new PhysicsShapeBox(
      Vector3.Zero(),
      Quaternion.Identity(),
      new Vector3(dimensionsX, config.geometry.surfaceThickness, dimensionsZ),
      activeWorld.scene,
    );
    replacementShape.filterMembershipMask = originalMembership;
    replacementShape.filterCollideMask = originalCollide;
    replacementShape.density = originalDensity;
    replacementShape.isTrigger = originalShape.isTrigger;
    replacementAttached = true;
    surfaceBody.shape = replacementShape;
    if (surfaceBody.shape !== replacementShape)
      throw resourceFailure("Diagnostic apron attachment was not confirmed.");

    const bodyFacts = resourceGuard(() => readNativeBodies(activeWorld));
    const samples = resourceGuard(() => getWorldSamples(bodyFacts.metrics));
    if (!allZero(samples))
      throw resourceFailure("Initial dynamic velocities are not exactly zero.");
    const expectedStates = new Map(
      caseState.bodies.map((body) => [body.id, body]),
    );
    for (let index = 0; index < bodyFacts.metrics.length; index += 1) {
      const metric = bodyFacts.metrics[index];
      const sample = samples[index];
      const expected =
        metric === undefined ? undefined : expectedStates.get(metric.id);
      if (
        metric === undefined ||
        sample === undefined ||
        expected === undefined
      ) {
        throw resourceFailure(
          "Initial transform validation omitted a canonical body.",
        );
      }
      if (
        sample.state.position.x !== expected.position.x ||
        sample.state.position.y !== expected.position.y ||
        sample.state.position.z !== expected.position.z ||
        Math.abs(sample.state.rotation.x - expected.rotation.x) >
          QUATERNION_NORM_TOLERANCE ||
        Math.abs(sample.state.rotation.y - expected.rotation.y) >
          QUATERNION_NORM_TOLERANCE ||
        Math.abs(sample.state.rotation.z - expected.rotation.z) >
          QUATERNION_NORM_TOLERANCE ||
        Math.abs(sample.state.rotation.w - expected.rotation.w) >
          QUATERNION_NORM_TOLERANCE
      ) {
        throw resourceFailure(
          `World transform for ${metric.id} differs from its hashed initial state.`,
        );
      }
    }
    for (let index = 0; index < bodyFacts.metrics.length; index += 1) {
      const metric = bodyFacts.metrics[index];
      const sample = samples[index];
      if (metric === undefined || sample === undefined)
        throw resourceFailure("Initial native body facts are incomplete.");
      metric.restY = resourceGuard(() =>
        deriveNativeCylinderSupportDatum(
          {
            minimum: metric.nativeLocalAabb.minimum,
            maximum: metric.nativeLocalAabb.maximum,
            dimensions: metric.dimensions,
          },
          metric.centerOfMassLocal,
          bodyFacts.supportPlane.referenceY,
        ),
      );
    }
    const plannerBodies = bodyFacts.metrics.map((metric) => ({
      id: metric.id,
      mass: metric.mass,
      minimumUnitInertia: Math.min(
        metric.inertiaUnitMass.x,
        metric.inertiaUnitMass.y,
        metric.inertiaUnitMass.z,
      ),
      maximumUnitInertia: Math.max(
        metric.inertiaUnitMass.x,
        metric.inertiaUnitMass.y,
        metric.inertiaUnitMass.z,
      ),
      farthestPointRadius: metric.farthestPointRadius,
    }));
    const fixedStepSeconds = config.simulation.fixedStepSeconds;
    const sweepGuard = makeSweepGuard();
    let plan: ReturnType<typeof deriveDiagnosticSweepPlan>;
    try {
      plan = deriveDiagnosticSweepPlan(
        plannerBodies,
        fixedStepSeconds,
        sweepGuard,
      );
    } catch (error) {
      const cause = error instanceof Error ? error.message : String(error);
      throw resourceFailure(
        `Native sweep subdivision cannot satisfy the hashed resource guard. ${JSON.stringify(
          {
            plannerBodies,
            fixedStepSeconds,
            sweepGuard,
            cause,
          },
        )}`,
        error,
      );
    }
    const preEnergy = resourceGuard(
      () =>
        computeDiagnosticShiftedEnergy(
          energyBodies(bodyFacts.metrics, samples),
          guard.energy.gravityMagnitude,
          guard.energy.maximumRestComDrop,
        ).shiftedMechanicalEnergy,
    );
    if (
      !isDiagnosticShiftedEnergyWithinLimit(preEnergy, guard.energy.maximum)
    ) {
      throw resourceFailure(
        "Tuple initial state exceeds the shifted-energy ceiling.",
      );
    }
    const selectedIndex = bodyFacts.metrics.findIndex(
      (metric) => metric.id === "home-0",
    );
    const selected = bodyFacts.metrics[selectedIndex];
    const selectedSample = samples[selectedIndex];
    if (selected === undefined || selectedSample === undefined)
      throw resourceFailure("Selected candidate cap is missing.");
    const impulseMagnitude = tuple[2];
    const inputImpulse = { x: 0, y: 0, z: impulseMagnitude };
    const applicationPoint = add(
      selectedSample.state.position,
      rotate(selectedSample.state.rotation, selected.centerOfMassLocal),
    );
    const predictedBodies = energyBodies(bodyFacts.metrics, samples).map(
      (item, index) =>
        index === selectedIndex
          ? {
              ...item,
              linearVelocity: {
                x: item.linearVelocity.x,
                y: item.linearVelocity.y,
                z: item.linearVelocity.z + impulseMagnitude / selected.mass,
              },
            }
          : item,
    );
    const predictedEnergy = resourceGuard(
      () =>
        computeDiagnosticShiftedEnergy(
          predictedBodies,
          guard.energy.gravityMagnitude,
          guard.energy.maximumRestComDrop,
        ).shiftedMechanicalEnergy,
    );
    if (
      !isDiagnosticShiftedEnergyWithinLimit(
        predictedEnergy,
        guard.energy.maximum,
      )
    ) {
      throw resourceFailure(
        "The single planar COM impulse exceeds the shifted-energy ceiling.",
      );
    }

    const names = new Map<
      string,
      LoftCoarseEntityId | LoftCoarseStaticBodyId
    >();
    for (const metric of bodyFacts.metrics)
      names.set(metric.body.transformNode.name, metric.id);
    for (const body of bodyFacts.statics)
      names.set(body.body.transformNode.name, body.id);
    const contactRows: LoftCoarseCase["contactRows"][number][] = [];
    let callbackFailure: unknown;
    let nominalTick = 0;
    let currentCallIndex = 0;
    const onContact = (event: IPhysicsCollisionEvent): void => {
      try {
        const first = names.get(event.collider.transformNode.name);
        const second = names.get(event.collidedAgainst.transformNode.name);
        if (first === undefined || second === undefined || first === second) {
          throw resourceFailure(
            "A collision callback reported an unknown/self participant.",
          );
        }
        const pair = canonicalizeLoftCoarseContactPair(first, second);
        const eventType = String(event.type);
        if (
          encoder.encode(eventType).byteLength >
          guard.artifact.maximumEventTypeBytes
        ) {
          throw resourceFailure(
            "A native contact event name exceeds the byte cap.",
          );
        }
        if (
          contactRows.length >= guard.artifact.maximumContactsPerCase ||
          counts.contacts + contactRows.length >=
            guard.artifact.maximumContactsMatrix
        ) {
          throw Object.assign(
            new Error("Contact rows exceed the hashed case/matrix ceiling."),
            { code: "resourceLimit" },
          );
        }
        contactRows.push({
          tuple,
          nominalTick,
          callIndex: currentCallIndex,
          pair,
          eventType,
          point: eventPoint(event.point),
        });
      } catch (error) {
        callbackFailure ??= error;
      }
    };
    for (const body of [
      ...bodyFacts.metrics.map((metric) => metric.body),
      ...bodyFacts.statics.map((item) => item.body),
    ]) {
      body.setCollisionCallbackEnabled(true);
      const observable = body.getCollisionObservable();
      const observer = observable.add(onContact);
      removeObservers.push(() => observable.remove(observer));
    }

    const bodyRows: LoftCoarseCase["bodyRows"][number][] = [];
    const sweepRows: LoftCoarseCase["sweepRows"][number][] = [];
    const quietWindow = Math.ceil(
      config.simulation.settleWindowSeconds /
        config.simulation.fixedStepSeconds,
    );
    if (quietWindow !== 60)
      throw failure("Canonical settle window is not exactly sixty ticks.");
    const quietTicks: Array<{
      tick: number;
      linearSpeeds: number[];
      angularSpeeds: number[];
      settledMask: number;
    }> = [];
    selected.body.applyImpulse(
      new Vector3(inputImpulse.x, inputImpulse.y, inputImpulse.z),
      new Vector3(applicationPoint.x, applicationPoint.y, applicationPoint.z),
    );
    const afterImpulse = resourceGuard(() =>
      getWorldSamples(bodyFacts.metrics),
    );
    const measuredPostImpulseEnergy = resourceGuard(
      () =>
        computeDiagnosticShiftedEnergy(
          energyBodies(bodyFacts.metrics, afterImpulse),
          guard.energy.gravityMagnitude,
          guard.energy.maximumRestComDrop,
        ).shiftedMechanicalEnergy,
    );
    if (
      !isDiagnosticShiftedEnergyWithinLimit(
        measuredPostImpulseEnergy,
        guard.energy.maximum,
      )
    ) {
      throw resourceFailure(
        "Observed post-impulse energy exceeds the hashed ceiling.",
      );
    }
    recordBodyRows(bodyRows, tuple, 0, afterImpulse);
    let totalCalls = 0;
    let totalBatches = 0;
    let callsInBatch = 0;
    let finalSamples = afterImpulse;
    const maxTicks = guard.workload.maximumNominalTicksPerCase;
    const minLinear = config.simulation.linearSettleThreshold;
    const minAngular = config.simulation.angularSettleThreshold;
    const maxPointSweep = guard.sweep.maximumPointSweepPerCall;
    const sweepLimits = {
      deltaSeconds: plan.substepSeconds,
      pitchWidth: config.geometry.pitchWidth,
      pitchLength: config.geometry.pitchLength,
      supportApronMargin: guard.setup.supportApronMargin,
      surfaceUnderside:
        config.geometry.surfaceY - config.geometry.surfaceThickness,
      maxRestHeightDrop: guard.energy.maximumRestComDrop,
    };
    for (let tick = 1; tick <= maxTicks; tick += 1) {
      ensureWithin(
        signal,
        runStartedAt,
        guard.workload.maximumWallTimeMatrixMs,
        "L01 matrix",
      );
      ensureWithin(
        signal,
        caseStartedAt,
        guard.workload.maximumWallTimePerCaseMs,
        "L01 case",
      );
      nominalTick = tick - 1;
      let maximumEnergy = { value: -Infinity, callIndex: 0 };
      let maximumDrop = {
        value: -Infinity,
        callIndex: 0,
        bodyId: "home-0" as LoftCoarseEntityId,
      };
      let minimumApron = {
        value: Infinity,
        callIndex: 0,
        bodyId: "button" as LoftCoarseEntityId,
      };
      let minimumSlab = {
        value: Infinity,
        callIndex: 0,
        bodyId: "button" as LoftCoarseEntityId,
      };
      let maximumSweep = {
        value: -Infinity,
        callIndex: 0,
        bodyId: "button" as LoftCoarseEntityId,
      };
      let maximumRotation = {
        value: -Infinity,
        callIndex: 0,
        bodyId: "button" as LoftCoarseEntityId,
      };
      let minimumClearance = {
        value: Infinity,
        callIndex: 0,
        obstaclePair: ["button", "home-1"] as const,
      };
      let sawHorizontalOverlap = false;
      let checkedCalls = 0;
      for (let substep = 0; substep < plan.substepsPerTick; substep += 1) {
        ensureWithin(
          signal,
          runStartedAt,
          guard.workload.maximumWallTimeMatrixMs,
          "L01 matrix",
        );
        ensureWithin(
          signal,
          caseStartedAt,
          guard.workload.maximumWallTimePerCaseMs,
          "L01 case",
        );
        if (
          totalCalls >= guard.workload.maximumExecuteStepCallsPerCase ||
          counts.calls >= guard.workload.maximumExecuteStepCallsMatrix
        ) {
          throw Object.assign(
            new Error("The L01 executeStep ceiling was reached."),
            { code: "resourceLimit" },
          );
        }
        const before = resourceGuard(() => getWorldSamples(bodyFacts.metrics));
        const beforeEnergy = resourceGuard(
          () =>
            computeDiagnosticShiftedEnergy(
              energyBodies(bodyFacts.metrics, before),
              guard.energy.gravityMagnitude,
              guard.energy.maximumRestComDrop,
            ).shiftedMechanicalEnergy,
        );
        if (
          !isDiagnosticShiftedEnergyWithinLimit(
            beforeEnergy,
            guard.energy.maximum,
          )
        ) {
          throw resourceFailure(
            "Pre-step shifted energy exceeds the hashed maximum.",
          );
        }
        if (beforeEnergy > maximumEnergy.value)
          maximumEnergy = { value: beforeEnergy, callIndex: substep };
        let candidateMetric: NativeBodyMetrics | undefined;
        let candidateSample: NativeBodySample | undefined;
        for (let index = 0; index < bodyFacts.metrics.length; index += 1) {
          const metric = bodyFacts.metrics[index];
          const sample = before[index];
          const bound = plan.bodies[index];
          if (
            metric === undefined ||
            sample === undefined ||
            bound === undefined
          )
            throw resourceFailure("Pre-step sweep omitted a dynamic body.");
          const margins = resourceGuard(() =>
            checkDiagnosticSweptEnvelope(
              {
                centerOfMass: sample.centerOfMass,
                originY: sample.state.position.y,
                axisY: rotate(sample.state.rotation, { x: 0, y: 1, z: 0 }).y,
                radius: metric.radius,
                height: metric.height,
                farthestPointRadius: metric.farthestPointRadius,
                restY: metric.restY,
                linearSpeedBound: bound.linearSpeedBound,
                pointSpeedBound: bound.pointSpeedBound,
              },
              sweepLimits,
            ),
          );
          const sweptDrop =
            metric.restY -
            sample.centerOfMass.y +
            bound.linearSpeedBound * plan.substepSeconds;
          if (metric.id === "home-0") {
            candidateMetric = metric;
            candidateSample = sample;
            if (sweptDrop > maximumDrop.value)
              maximumDrop = {
                value: sweptDrop,
                callIndex: substep,
                bodyId: metric.id,
              };
          }
          if (margins.apronClearance < minimumApron.value)
            minimumApron = {
              value: margins.apronClearance,
              callIndex: substep,
              bodyId: metric.id,
            };
          if (margins.surfaceClearance < minimumSlab.value)
            minimumSlab = {
              value: margins.surfaceClearance,
              callIndex: substep,
              bodyId: metric.id,
            };
          const bodyPointSweep = bound.pointSpeedBound * plan.substepSeconds;
          const bodyRotationSweep =
            bound.angularSpeedBound * plan.substepSeconds;
          if (bodyPointSweep > maxPointSweep)
            throw resourceFailure(
              "Pre-step point sweep exceeds the hashed cap.",
            );
          if (bodyRotationSweep > guard.sweep.maximumRotationPerCall)
            throw resourceFailure(
              "Pre-step rotation sweep exceeds the hashed cap.",
            );
          if (bodyPointSweep > maximumSweep.value)
            maximumSweep = {
              value: bodyPointSweep,
              callIndex: substep,
              bodyId: metric.id,
            };
          if (bodyRotationSweep > maximumRotation.value)
            maximumRotation = {
              value: bodyRotationSweep,
              callIndex: substep,
              bodyId: metric.id,
            };
          // A static support witness is checked at every call, before physics advances.
          supportClearances(metric, sample, bodyPointSweep);
        }
        const buttonIndex = bodyFacts.metrics.findIndex(
          (metric) => metric.id === "button",
        );
        const obstacleIndex = bodyFacts.metrics.findIndex(
          (metric) => metric.id === "home-1",
        );
        const buttonMetric = bodyFacts.metrics[buttonIndex];
        const obstacleMetric = bodyFacts.metrics[obstacleIndex];
        const buttonSample = before[buttonIndex];
        const obstacleSample = before[obstacleIndex];
        const buttonBound = plan.bodies[buttonIndex];
        const obstacleBound = plan.bodies[obstacleIndex];
        if (
          buttonMetric === undefined ||
          obstacleMetric === undefined ||
          buttonSample === undefined ||
          obstacleSample === undefined ||
          buttonBound === undefined ||
          obstacleBound === undefined ||
          candidateMetric === undefined ||
          candidateSample === undefined
        ) {
          throw resourceFailure("Button/obstacle sweep inputs are incomplete.");
        }
        const combinedPointSweep =
          (buttonBound.pointSpeedBound + obstacleBound.pointSpeedBound) *
          plan.substepSeconds;
        const obstacleClearance = verticalObstacleClearance(
          buttonMetric,
          buttonSample,
          obstacleMetric,
          obstacleSample,
          combinedPointSweep,
        );
        if (obstacleClearance.horizontalOverlap) {
          sawHorizontalOverlap = true;
          if (obstacleClearance.clearance < minimumClearance.value) {
            minimumClearance = {
              value: obstacleClearance.clearance,
              callIndex: substep,
              obstaclePair: ["button", "home-1"],
            };
          }
        }
        currentCallIndex = totalCalls;
        activeWorld.plugin.executeStep(plan.substepSeconds, physicsBodies);
        totalCalls += 1;
        counts.calls += 1;
        checkedCalls += 1;
        callsInBatch += 1;
        if (callbackFailure !== undefined) {
          throw normalizeDiagnosticError(callbackFailure, "resourceLimit");
        }
        if (callsInBatch === guard.workload.maximumCallsPerBatch) {
          if (
            totalBatches >= guard.workload.maximumBatchesPerCase ||
            counts.batches >= guard.workload.maximumBatchesMatrix
          ) {
            throw Object.assign(
              new Error("The L01 host-yield batch ceiling was reached."),
              { code: "resourceLimit" },
            );
          }
          callsInBatch = 0;
          totalBatches += 1;
          counts.batches += 1;
          await yieldToBrowser(signal);
          ensureWithin(
            signal,
            runStartedAt,
            guard.workload.maximumWallTimeMatrixMs,
            "L01 matrix",
          );
          ensureWithin(
            signal,
            caseStartedAt,
            guard.workload.maximumWallTimePerCaseMs,
            "L01 case",
          );
          progress({
            completedCases,
            totalCases: LOFT_COARSE_TUPLES.length,
            currentMatrixIndex: matrixIndex,
            nominalTick: tick - 1,
            nominalTickLimit: maxTicks,
            executeStepCalls: counts.calls,
            batches: counts.batches,
            elapsedMs: nowMs() - runStartedAt,
          });
        }
        if (callbackFailure !== undefined) {
          throw normalizeDiagnosticError(callbackFailure, "resourceLimit");
        }
        const after = resourceGuard(() => getWorldSamples(bodyFacts.metrics));
        const afterEnergy = resourceGuard(
          () =>
            computeDiagnosticShiftedEnergy(
              energyBodies(bodyFacts.metrics, after),
              guard.energy.gravityMagnitude,
              guard.energy.maximumRestComDrop,
            ).shiftedMechanicalEnergy,
        );
        if (
          !isDiagnosticShiftedEnergyWithinLimit(
            afterEnergy,
            guard.energy.maximum,
          )
        ) {
          throw resourceFailure(
            "Post-step shifted energy exceeds the hashed maximum.",
          );
        }
        if (afterEnergy > maximumEnergy.value)
          maximumEnergy = { value: afterEnergy, callIndex: substep };
        for (let index = 0; index < bodyFacts.metrics.length; index += 1) {
          const metric = bodyFacts.metrics[index];
          const sample = after[index];
          const bound = plan.bodies[index];
          if (
            metric === undefined ||
            sample === undefined ||
            bound === undefined
          )
            throw resourceFailure("Post-step state omitted a dynamic body.");
          const margins = supportClearances(metric, sample, 0);
          if (margins.apron < minimumApron.value)
            minimumApron = {
              value: margins.apron,
              callIndex: substep,
              bodyId: metric.id,
            };
          if (margins.slab < minimumSlab.value)
            minimumSlab = {
              value: margins.slab,
              callIndex: substep,
              bodyId: metric.id,
            };
          if (metric.id === "home-0" && margins.drop > maximumDrop.value)
            maximumDrop = {
              value: margins.drop,
              callIndex: substep,
              bodyId: metric.id,
            };
        }
        finalSamples = after;
      }
      if (callsInBatch > 0 && tick === maxTicks) {
        if (
          totalBatches >= guard.workload.maximumBatchesPerCase ||
          counts.batches >= guard.workload.maximumBatchesMatrix
        ) {
          throw Object.assign(
            new Error("The L01 final host-yield batch ceiling was reached."),
            { code: "resourceLimit" },
          );
        }
        callsInBatch = 0;
        totalBatches += 1;
        counts.batches += 1;
        await yieldToBrowser(signal);
      }
      if (
        checkedCalls < 1 ||
        checkedCalls > guard.sweep.maximumCallsPerNominalTick
      ) {
        throw resourceFailure(
          "A nominal interval has an invalid checked-call count.",
        );
      }
      nominalTick = tick;
      finalSamples = resourceGuard(() => getWorldSamples(bodyFacts.metrics));
      const linearSpeeds: number[] = [];
      const angularSpeeds: number[] = [];
      let settledMask = 0;
      for (let index = 0; index < finalSamples.length; index += 1) {
        const sample = finalSamples[index];
        if (sample === undefined)
          throw resourceFailure("Settling sample is missing.");
        const linearSpeed = Math.hypot(
          sample.state.linearVelocity.x,
          sample.state.linearVelocity.y,
          sample.state.linearVelocity.z,
        );
        const angularSpeed = Math.hypot(
          sample.state.angularVelocity.x,
          sample.state.angularVelocity.y,
          sample.state.angularVelocity.z,
        );
        linearSpeeds.push(linearSpeed);
        angularSpeeds.push(angularSpeed);
        if (linearSpeed <= minLinear && angularSpeed <= minAngular)
          settledMask |= 1 << index;
      }
      quietTicks.push({ tick, linearSpeeds, angularSpeeds, settledMask });
      if (quietTicks.length > quietWindow) quietTicks.shift();
      const all15Quiet = settledMask === 0x7fff;
      recordBodyRows(bodyRows, tuple, tick, finalSamples);
      if (
        maximumEnergy.value === -Infinity ||
        maximumDrop.value === -Infinity ||
        minimumApron.value === Infinity ||
        minimumSlab.value === Infinity ||
        maximumSweep.value === -Infinity ||
        maximumRotation.value === -Infinity
      ) {
        throw resourceFailure(
          "A nominal interval is missing required extrema.",
        );
      }
      if (minimumClearance.value === Infinity)
        minimumClearance = {
          value: 0,
          callIndex: 0,
          obstaclePair: ["button", "home-1"],
        };
      const tickContacts = contactRows.some(
        (row) => row.nominalTick === tick - 1 && isButtonObstaclePair(row.pair),
      );
      const classification = !sawHorizontalOverlap
        ? "no-horizontal-overlap"
        : tickContacts
          ? "contact"
          : minimumClearance.value > guard.sweep.verticalClearanceMargin
            ? "clear-above-margin"
            : "clearance-at-or-below-margin";
      sweepRows.push({
        tuple,
        nominalTick: tick - 1,
        actualCheckedCallCount: checkedCalls,
        maximumShiftedEnergy: maximumEnergy,
        maximumCandidateRelativeComDrop: maximumDrop,
        minimumApronMargin: minimumApron,
        minimumSlabUndersideMargin: minimumSlab,
        maximumPointSweep: maximumSweep,
        maximumRotationSweep: maximumRotation,
        minimumWholeButtonObstacleClearance: minimumClearance,
        intervalClassification: classification,
        allFinite: true,
        all15Settled: all15Quiet,
      });
      const maxTicksForSettle =
        quietTicks.length === quietWindow &&
        quietTicks.every((value) => value.settledMask === 0x7fff);
      if (maxTicksForSettle) {
        break;
      }
      if (tick % 120 === 0) {
        progress({
          completedCases,
          totalCases: LOFT_COARSE_TUPLES.length,
          currentMatrixIndex: matrixIndex,
          nominalTick: tick,
          nominalTickLimit: maxTicks,
          executeStepCalls: counts.calls,
          batches: counts.batches,
          elapsedMs: nowMs() - runStartedAt,
        });
      }
    }
    if (totalCalls < 1 || sweepRows.length === 0 || bodyRows.length < 30)
      throw resourceFailure(
        "Trial did not produce the minimum complete evidence rows.",
      );
    if (callsInBatch > 0) {
      if (
        totalBatches >= guard.workload.maximumBatchesPerCase ||
        counts.batches >= guard.workload.maximumBatchesMatrix
      ) {
        throw Object.assign(
          new Error("The L01 final host-yield batch ceiling was reached."),
          { code: "resourceLimit" },
        );
      }
      callsInBatch = 0;
      totalBatches += 1;
      counts.batches += 1;
      await yieldToBrowser(signal);
    }
    counts.contacts += contactRows.length;
    const settlingTicks =
      quietTicks.length === quietWindow
        ? quietTicks
        : quietTicks.slice(-quietWindow);
    if (settlingTicks.length !== quietWindow)
      throw resourceFailure(
        "The trial has fewer than 60 endpoint samples for its settling window.",
      );
    const startTick = settlingTicks[0]?.tick;
    const finalTick = settlingTicks.at(-1)?.tick;
    if (startTick === undefined || finalTick === undefined)
      throw resourceFailure("Settling-window tick bounds are missing.");
    const settled = settlingTicks.every((tick) => tick.settledMask === 0x7fff);
    const buttonIndex = bodyFacts.metrics.findIndex(
      (metric) => metric.id === "button",
    );
    const obstacleIndex = bodyFacts.metrics.findIndex(
      (metric) => metric.id === "home-1",
    );
    const buttonMetric = bodyFacts.metrics[buttonIndex];
    const obstacleMetric = bodyFacts.metrics[obstacleIndex];
    const buttonFinal = finalSamples[buttonIndex];
    const obstacleFinal = finalSamples[obstacleIndex];
    if (
      buttonMetric === undefined ||
      obstacleMetric === undefined ||
      buttonFinal === undefined ||
      obstacleFinal === undefined
    )
      throw resourceFailure("Final button/obstacle states are missing.");
    const buttonStart = samples[buttonIndex];
    const obstacleStart = samples[obstacleIndex];
    const startsBefore =
      buttonStart !== undefined &&
      obstacleStart !== undefined &&
      buttonStart.state.position.z + buttonMetric.farthestOriginRadius <
        obstacleStart.state.position.z - obstacleMetric.farthestOriginRadius;
    const finishesBeyond =
      buttonFinal.state.position.z - buttonMetric.farthestOriginRadius >
      obstacleFinal.state.position.z + obstacleMetric.farthestOriginRadius;
    const overlapSeen = sweepRows.some(
      (row) =>
        (row as { intervalClassification: string }).intervalClassification !==
        "no-horizontal-overlap",
    );
    const clearancePass = sweepRows
      .filter(
        (row) =>
          (row as { intervalClassification: string }).intervalClassification !==
          "no-horizontal-overlap",
      )
      .every(
        (row) =>
          (row as { minimumWholeButtonObstacleClearance: { value: number } })
            .minimumWholeButtonObstacleClearance.value >
          guard.sweep.verticalClearanceMargin,
      );
    const contactWithObstacle = contactRows.some((row) =>
      isButtonObstaclePair(row.pair),
    );
    const reasons: string[] = [];
    if (!startsBefore)
      reasons.push("button-does-not-start-fully-before-obstacle");
    if (!finishesBeyond)
      reasons.push("button-does-not-finish-fully-beyond-obstacle");
    if (!overlapSeen) reasons.push("no-full-horizontal-overlap-sampled");
    if (!clearancePass)
      reasons.push("vertical-clearance-not-above-diagnostic-margin");
    if (contactWithObstacle) reasons.push("button-obstacle-contact-observed");
    if (!settled) reasons.push("all-body-settling-window-not-achieved");
    const eligible = reasons.length === 0;
    if (eligible) counts.eligible += 1;
    const finalBodies = finalSamples.map(({ state }) => ({
      id: state.id,
      position: { ...state.position },
      rotation: { ...state.rotation },
      linearVelocity: { ...state.linearVelocity },
      angularVelocity: { ...state.angularVelocity },
    }));
    const caseWallTimeMs = nowMs() - caseStartedAt;
    if (caseWallTimeMs > guard.workload.maximumWallTimePerCaseMs)
      throw Object.assign(
        new Error("The L01 case exceeded its wall-time ceiling."),
        { code: "resourceLimit" },
      );
    result = {
      metadata: {
        ...identity,
        tuple,
        matrixIndex,
        initialStateHashAlgorithm: guard.setup.initialStateHashAlgorithm,
        initialStateHash,
        dynamicBodies: bodyFacts.dynamicFacts,
        supportPlane: bodyFacts.supportPlane,
        materials: bodyFacts.materials,
        staticBodies: bodyFacts.staticFacts,
        preImpulseMeasuredShiftedEnergy: preEnergy,
        preImpulsePredictedShiftedEnergy: predictedEnergy,
        finalBodies,
        settlingWindow: {
          startTick,
          endTick: finalTick,
          linearSpeedThreshold: minLinear,
          angularSpeedThreshold: minAngular,
          ticks: settlingTicks,
        },
        eligibility: { eligible, reasons },
        executeStepCalls: totalCalls,
        batches: totalBatches,
        wallTimeMs: caseWallTimeMs,
      },
      bodyRows,
      contactRows,
      sweepRows,
    };
  } catch (error) {
    primaryError = error;
  }
  const cleanupErrors = cleanupDiagnosticResources({
    removeObservers,
    replacementAttached,
    restoreSurface:
      replacementAttached &&
      surfaceBody !== undefined &&
      originalSurfaceShape !== undefined
        ? () => {
            surfaceBody.shape = originalSurfaceShape;
            if (surfaceBody.shape !== originalSurfaceShape)
              throw failure(
                "Original support shape restoration was not confirmed.",
              );
          }
        : undefined,
    disposeReplacement:
      replacementShape === undefined
        ? undefined
        : () => replacementShape?.dispose(),
    disposeWorld: () => world?.dispose(),
  });
  if (primaryError !== undefined)
    throw errorWithCleanup(primaryError, cleanupErrors);
  if (cleanupErrors.length > 0)
    throw errorWithCleanup(failure("Trial cleanup failed."), cleanupErrors);
  if (result === undefined)
    throw failure("Trial ended without a serialized case.");
  const caseWallTimeMs = nowMs() - caseStartedAt;
  if (caseWallTimeMs > guard.workload.maximumWallTimePerCaseMs)
    throw Object.assign(
      new Error("The L01 case exceeded its wall-time ceiling."),
      { code: "resourceLimit" },
    );
  result.metadata.wallTimeMs = caseWallTimeMs;
  if (counts.calls - caseBeginCalls !== result.metadata.executeStepCalls)
    throw failure("Case call count changed during output.");
  return result;
}

async function* makeCases(
  options: LoftCoarseRunOptions,
  havok: Awaited<ReturnType<typeof initializeHavokRuntime>>,
  fixture: MatchState,
  matrixMetadata: LoftCoarseMatrixMetadata,
  runStartedAt: number,
  counts: {
    calls: number;
    batches: number;
    contacts: number;
    eligible: number;
  },
  abortMatrix: (reason: unknown) => void,
): AsyncGenerator<LoftCoarseCase, void, void> {
  for (
    let matrixIndex = 0;
    matrixIndex < LOFT_COARSE_TUPLES.length;
    matrixIndex += 1
  ) {
    const tuple = LOFT_COARSE_TUPLES[matrixIndex];
    if (tuple === undefined)
      throw failure("A canonical matrix tuple is missing.");
    const caseStartedAt = nowMs();
    const caseTimer = globalThis.setTimeout(
      () =>
        abortMatrix(
          Object.assign(
            new Error("The L01 case exceeded its wall-time ceiling."),
            { code: "resourceLimit" },
          ),
        ),
      guard.workload.maximumWallTimePerCaseMs,
    );
    try {
      const currentCase = await runCase(
        options.engine,
        havok,
        fixture,
        tuple,
        matrixIndex,
        matrixMetadata,
        options.signal,
        runStartedAt,
        counts,
        options.onProgress,
        matrixIndex,
      );
      yield currentCase;
      ensureWithin(
        options.signal,
        caseStartedAt,
        guard.workload.maximumWallTimePerCaseMs,
        "L01 case including serialization",
      );
      ensureWithin(
        options.signal,
        runStartedAt,
        guard.workload.maximumWallTimeMatrixMs,
        "L01 matrix including serialization",
      );
      options.onProgress({
        completedCases: matrixIndex + 1,
        totalCases: LOFT_COARSE_TUPLES.length,
        currentMatrixIndex: matrixIndex,
        nominalTick: 0,
        nominalTickLimit: guard.workload.maximumNominalTicksPerCase,
        executeStepCalls: counts.calls,
        batches: counts.batches,
        elapsedMs: nowMs() - runStartedAt,
      });
    } finally {
      globalThis.clearTimeout(caseTimer);
    }
  }
}

/** Executes the hashed 24-case matrix with a caller-owned real browser Engine. */
export async function runLoftCoarseMatrix({
  engine,
  signal,
  sink,
  onProgress,
}: LoftCoarseRunOptions): Promise<LoftCoarseRunSummary> {
  const startedAt = nowMs();
  let writerStarted = false;
  let writerSucceeded = false;
  const deadlineController = new AbortController();
  let matrixTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
  const abortFromCaller = (): void => {
    deadlineController.abort(signal.reason);
  };
  try {
    if (!(engine instanceof Engine))
      throw failure("L01 requires the real Babylon browser Engine.");
    if (signal === null || typeof signal?.addEventListener !== "function")
      throw failure("L01 requires an AbortSignal.");
    if (
      sink === null ||
      typeof sink?.write !== "function" ||
      typeof sink?.abort !== "function"
    )
      throw failure("L01 requires the accepted bounded byte sink.");
    if (typeof onProgress !== "function")
      throw failure("L01 requires a compact progress callback.");
    if (signal.aborted) abortFromCaller();
    else signal.addEventListener("abort", abortFromCaller, { once: true });
    matrixTimer = globalThis.setTimeout(
      () =>
        deadlineController.abort(
          Object.assign(
            new Error("The L01 matrix exceeded its wall-time ceiling."),
            { code: "resourceLimit" },
          ),
        ),
      guard.workload.maximumWallTimeMatrixMs,
    );
    const runOptions: LoftCoarseRunOptions = {
      engine,
      signal: deadlineController.signal,
      sink,
      onProgress,
    };
    ensureWithin(
      deadlineController.signal,
      startedAt,
      guard.workload.maximumWallTimeMatrixMs,
      "L01 matrix",
    );
    exactMatrixTuples();
    const computedConfigHash = await hashCounterballConfig();
    const payloadSha = await hashCanonicalJson(omitConfigHash(fixtureJson));
    const fixtureBytes = encoder.encode(fixtureRaw);
    const fixtureFileSha = await sha256(arrayBufferOf(fixtureBytes));
    if (
      fixtureFileSha !== expectedFixtureFileSha256 ||
      payloadSha !== guard.fixture.payloadSha256
    ) {
      throw failure(
        "Fixture bytes or configHash-independent payload differ from the pinned L01 identity.",
      );
    }
    const fixture = fixtureState();
    const fixtureObject = fixtureJson as unknown as {
      versions: { configHash: string };
    };
    if (
      fixtureObject.versions.configHash !== computedConfigHash ||
      fixture.state.versions.configHash !== computedConfigHash
    ) {
      throw failure(
        "Pinned fixture configHash does not match the exact canonical config.",
      );
    }
    const response = await fetch(havokWasmUrl, {
      signal: deadlineController.signal,
    });
    if (!response.ok)
      throw failure(
        `Pinned Havok WASM fetch failed with HTTP ${response.status}.`,
      );
    const wasmBytes = await response.arrayBuffer();
    const wasmHash = await sha256(wasmBytes);
    if (wasmHash !== guard.wasmSha256)
      throw failure(
        "Fetched Havok WASM bytes do not match the hashed diagnostic guard.",
      );
    const havok = await withAbort(
      initializeHavokRuntime({ wasmBinary: wasmBytes }),
      deadlineController.signal,
    );
    ensureWithin(
      deadlineController.signal,
      startedAt,
      guard.workload.maximumWallTimeMatrixMs,
      "L01 matrix",
    );
    const runtimeIdentity = `browser:${navigator.userAgent};engine:${engine.constructor.name};physics:${guard.physicsVersion}`;
    if (runtimeIdentity.length > 1_024)
      throw failure("Browser runtime identity exceeds its compact bound.");
    const matrixMetadata = makeMatrixMetadata(
      computedConfigHash,
      fixtureFileSha,
      payloadSha,
      wasmHash,
      runtimeIdentity,
    );
    const counts = { calls: 0, batches: 0, contacts: 0, eligible: 0 };
    writerStarted = true;
    const matrix = await writeLoftCoarseMatrix({
      metadata: matrixMetadata,
      cases: makeCases(
        runOptions,
        havok,
        fixture.state,
        matrixMetadata,
        startedAt,
        counts,
        (reason) => deadlineController.abort(reason),
      ),
      sink,
      signal: deadlineController.signal,
    });
    writerSucceeded = true;
    checkCancelled(deadlineController.signal, "L01 matrix");
    const measuredMatrixWallTimeMs = measureMatrixWallTime(startedAt);
    return {
      ...matrix,
      configHash: computedConfigHash,
      fixtureFileSha256: fixtureFileSha,
      fixturePayloadSha256: payloadSha,
      wasmSha256: wasmHash,
      runtimeIdentity,
      eligibleCases: counts.eligible,
      measuredMatrixWallTimeMs,
    };
  } catch (error) {
    if (
      (!writerStarted || writerSucceeded) &&
      typeof sink?.abort === "function"
    ) {
      try {
        await sink.abort(error);
      } catch (abortError) {
        throw errorWithCleanup(error, [abortError]);
      }
    }
    throw normalizeDiagnosticError(error, "initialization");
  } finally {
    if (matrixTimer !== undefined) globalThis.clearTimeout(matrixTimer);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}
