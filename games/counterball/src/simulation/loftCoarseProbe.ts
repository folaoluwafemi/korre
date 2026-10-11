import {
  COUNTERBALL_CONFIG_V1,
  hashCounterballConfig,
} from "@korre/game-protocol";

export type LoftCoarseTuple = readonly [
  gapOffset: number,
  tiltDegrees: number,
  impulseMagnitude: number,
  azimuthDegrees: number,
];

export const LOFT_COARSE_TUPLES: readonly LoftCoarseTuple[] = Object.freeze(
  [0.75, 1].flatMap((gapOffset) =>
    [45, 60].flatMap((tiltDegrees) =>
      [6, 8].flatMap((impulseMagnitude) =>
        [-15, 0, 15].map(
          (azimuthDegrees) =>
            Object.freeze([
              gapOffset,
              tiltDegrees,
              impulseMagnitude,
              azimuthDegrees,
            ] as const),
        ),
      ),
    ),
  ),
);

export type LoftCoarseEntityId =
  | "button"
  | "home-0"
  | "home-1"
  | "home-2"
  | "home-3"
  | "home-4"
  | "home-5"
  | "home-6"
  | "away-0"
  | "away-1"
  | "away-2"
  | "away-3"
  | "away-4"
  | "away-5"
  | "away-6";

export type LoftCoarseVec3 = Readonly<{ x: number; y: number; z: number }>;
export type LoftCoarseQuaternion = Readonly<{
  x: number;
  y: number;
  z: number;
  w: number;
}>;

type LoftCoarseMatrixIdentity = {
  guardSchemaVersion: number;
  scope: string;
  matrixId: string;
  algorithmVersion: string;
  protocolVersion: number;
  configSchemaVersion: number;
  configVersion: string;
  configHash: string;
  fixtureId: string;
  fixturePayloadSha256: string;
  fixtureFileSha256: string;
  physicsVersion: string;
  adapterVersion: string;
  wasmSha256: string;
  matchId: string;
  runtimeIdentity: string;
};

export type LoftCoarseMatrixMetadata = Readonly<LoftCoarseMatrixIdentity>;

type LoftCoarseMassProjection = {
  configuredMass: number;
  projectedMass: number;
  observedNativeMass: number;
  tolerance: number;
  withinTolerance: boolean;
};

type LoftCoarseNativeBodyFacts = {
  id: LoftCoarseEntityId;
  nativeMass: number;
  centerOfMassOffset: LoftCoarseVec3;
  principalInertias: LoftCoarseVec3;
  inertiaOrientation: LoftCoarseQuaternion;
  colliderDimensions: LoftCoarseVec3;
  collisionFilter: readonly [membershipMask: number, collideMask: number];
  initialLinearVelocity: LoftCoarseVec3;
  initialAngularVelocity: LoftCoarseVec3;
  configuredMassProjection: LoftCoarseMassProjection;
};

type LoftCoarseMaterialValues = {
  friction: number;
  staticFriction: number;
  restitution: number;
  frictionCombine: string;
  restitutionCombine: string;
};

type LoftCoarseMaterialFact = {
  bodyId: string;
  shapeIndex: number;
  setter: LoftCoarseMaterialValues;
  readback: LoftCoarseMaterialValues;
};

type LoftCoarseStaticBodyFacts = {
  id: string;
  colliderDimensions: LoftCoarseVec3;
  collisionFilter: readonly [membershipMask: number, collideMask: number];
  material: LoftCoarseMaterialValues;
};

type LoftCoarseBodyState = {
  id: LoftCoarseEntityId;
  position: LoftCoarseVec3;
  rotation: LoftCoarseQuaternion;
  linearVelocity: LoftCoarseVec3;
  angularVelocity: LoftCoarseVec3;
};

type LoftCoarseSettleTick = {
  tick: number;
  linearSpeeds: readonly number[];
  angularSpeeds: readonly number[];
  settledMask: number;
};

type LoftCoarseSettlingWindow = {
  startTick: number;
  endTick: number;
  linearSpeedThreshold: number;
  angularSpeedThreshold: number;
  ticks: readonly LoftCoarseSettleTick[];
};

type LoftCoarseEligibility = {
  eligible: boolean;
  reasons: readonly string[];
};

type LoftCoarseCaseMetadata = LoftCoarseMatrixIdentity & {
  tuple: LoftCoarseTuple;
  matrixIndex: number;
  initialStateHashAlgorithm: string;
  initialStateHash: string;
  dynamicBodies: readonly LoftCoarseNativeBodyFacts[];
  materials: readonly LoftCoarseMaterialFact[];
  staticBodies: readonly LoftCoarseStaticBodyFacts[];
  preImpulseMeasuredShiftedEnergy: number;
  preImpulsePredictedShiftedEnergy: number;
  finalBodies: readonly LoftCoarseBodyState[];
  settlingWindow: LoftCoarseSettlingWindow;
  eligibility: LoftCoarseEligibility;
  executeStepCalls: number;
  batches: number;
  wallTimeMs: number;
};

type LoftCoarseBodyRow = {
  tuple: LoftCoarseTuple;
  nominalTick: number;
  id: LoftCoarseEntityId;
  position: LoftCoarseVec3;
  rotation: LoftCoarseQuaternion;
  linearVelocity: LoftCoarseVec3;
  angularVelocity: LoftCoarseVec3;
};

type LoftCoarseContactRow = {
  tuple: LoftCoarseTuple;
  nominalTick: number;
  callIndex: number;
  pair: readonly [first: LoftCoarseEntityId, second: LoftCoarseEntityId];
  eventType: string;
  point: LoftCoarseVec3 | null;
};

type LoftCoarseExtremum = { value: number; callIndex: number };
type LoftCoarseBodyExtremum = LoftCoarseExtremum & {
  bodyId: LoftCoarseEntityId;
};
type LoftCoarseObstacleClearanceExtremum = LoftCoarseExtremum & {
  obstaclePair: readonly [first: LoftCoarseEntityId, second: LoftCoarseEntityId];
};

type LoftCoarseSweepRow = {
  tuple: LoftCoarseTuple;
  nominalTick: number;
  actualCheckedCallCount: number;
  maximumShiftedEnergy: LoftCoarseExtremum;
  maximumCandidateRelativeComDrop: LoftCoarseBodyExtremum;
  minimumApronMargin: LoftCoarseBodyExtremum;
  minimumSlabUndersideMargin: LoftCoarseBodyExtremum;
  maximumPointSweep: LoftCoarseBodyExtremum;
  maximumRotationSweep: LoftCoarseBodyExtremum;
  minimumWholeButtonObstacleClearance: LoftCoarseObstacleClearanceExtremum;
  intervalClassification: string;
  allFinite: boolean;
  all15Settled: boolean;
};

export type LoftCoarseCase = {
  metadata: LoftCoarseCaseMetadata;
  bodyRows: readonly LoftCoarseBodyRow[];
  contactRows: readonly LoftCoarseContactRow[];
  sweepRows: readonly LoftCoarseSweepRow[];
};

export type LoftCoarseByteSink = {
  write(chunk: Uint8Array): void | Promise<void>;
  abort(reason: unknown): void | Promise<void>;
};

export type LoftCoarseMatrixSummary = {
  caseCount: number;
  bodyRows: number;
  contactRows: number;
  sweepRows: number;
  executeStepCalls: number;
  batches: number;
  wallTimeMs: number;
  matrixBytes: number;
  envelopeBytes: number;
};

type WriteLoftCoarseMatrixInput = {
  metadata: LoftCoarseMatrixMetadata;
  cases: AsyncIterable<LoftCoarseCase>;
  sink: LoftCoarseByteSink;
  signal: AbortSignal;
};

type LoftCoarseJsonValue =
  | null
  | boolean
  | number
  | string
  | readonly LoftCoarseJsonValue[]
  | { readonly [key: string]: LoftCoarseJsonValue };

type LoftCoarseJsonObject = Readonly<{
  [key: string]: LoftCoarseJsonValue;
}>;

const encoder = new TextEncoder();
const guard = COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard;
const artifactCaps = guard.artifact;
const workloadCaps = guard.workload;
const maximumChunkBytes = 256 * 1_024;
const canonicalEntityIds: readonly LoftCoarseEntityId[] = Object.freeze([
  "button",
  "home-0",
  "home-1",
  "home-2",
  "home-3",
  "home-4",
  "home-5",
  "home-6",
  "away-0",
  "away-1",
  "away-2",
  "away-3",
  "away-4",
  "away-5",
  "away-6",
]);
const canonicalStaticBodyIds = Object.freeze([
  "goal-frame-0",
  "goal-frame-1",
  "goal-frame-2",
  "goal-frame-3",
  "goal-frame-4",
  "goal-frame-5",
  "support-apron",
] as const);

const matrixIdentityKeys = [
  "guardSchemaVersion",
  "scope",
  "matrixId",
  "algorithmVersion",
  "protocolVersion",
  "configSchemaVersion",
  "configVersion",
  "configHash",
  "fixtureId",
  "fixturePayloadSha256",
  "fixtureFileSha256",
  "physicsVersion",
  "adapterVersion",
  "wasmSha256",
  "matchId",
  "runtimeIdentity",
] as const;
const caseMetadataKeys = [
  ...matrixIdentityKeys,
  "tuple",
  "matrixIndex",
  "initialStateHashAlgorithm",
  "initialStateHash",
  "dynamicBodies",
  "materials",
  "staticBodies",
  "preImpulseMeasuredShiftedEnergy",
  "preImpulsePredictedShiftedEnergy",
  "finalBodies",
  "settlingWindow",
  "eligibility",
  "executeStepCalls",
  "batches",
  "wallTimeMs",
] as const;

const dynamicBodyFactKeys = [
  "id",
  "nativeMass",
  "centerOfMassOffset",
  "principalInertias",
  "inertiaOrientation",
  "colliderDimensions",
  "collisionFilter",
  "initialLinearVelocity",
  "initialAngularVelocity",
  "configuredMassProjection",
] as const;
const bodyStateKeys = [
  "id",
  "position",
  "rotation",
  "linearVelocity",
  "angularVelocity",
] as const;
const bodyRowKeys = [
  "tuple",
  "nominalTick",
  ...bodyStateKeys,
] as const;
const contactRowKeys = [
  "tuple",
  "nominalTick",
  "callIndex",
  "pair",
  "eventType",
  "point",
] as const;
const sweepRowKeys = [
  "tuple",
  "nominalTick",
  "actualCheckedCallCount",
  "maximumShiftedEnergy",
  "maximumCandidateRelativeComDrop",
  "minimumApronMargin",
  "minimumSlabUndersideMargin",
  "maximumPointSweep",
  "maximumRotationSweep",
  "minimumWholeButtonObstacleClearance",
  "intervalClassification",
  "allFinite",
  "all15Settled",
] as const;

class LoftCoarseArtifactError extends Error {
  readonly code: "invalid" | "resourceLimit" | "cancelled";

  constructor(
    code: "invalid" | "resourceLimit" | "cancelled",
    message: string,
  ) {
    super(message);
    this.name = "LoftCoarseArtifactError";
    this.code = code;
  }
}

function invalid(message: string): never {
  throw new LoftCoarseArtifactError("invalid", message);
}

function overLimit(message: string): never {
  throw new LoftCoarseArtifactError("resourceLimit", message);
}

function assertPlainObject(
  value: unknown,
  label: string,
): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    invalid(`${label} must be a plain JSON object.`);
  }
  const prototype = Reflect.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    invalid(`${label} must be a plain JSON object.`);
  }
  const keys = Object.keys(value);
  if (
    Object.getOwnPropertySymbols(value).length !== 0 ||
    Object.getOwnPropertyNames(value).length !== keys.length
  ) {
    invalid(`${label} cannot contain hidden or symbol keys.`);
  }
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) {
      invalid(`${label} cannot contain accessors.`);
    }
  }
}

function assertExactKeys(
  value: unknown,
  expected: readonly string[],
  label: string,
): asserts value is Record<string, unknown> {
  assertPlainObject(value, label);
  const actual = Object.keys(value);
  const expectedSet = new Set(expected);
  const missing = expected.filter((key) => !Object.prototype.hasOwnProperty.call(value, key));
  const extra = actual.filter((key) => !expectedSet.has(key));
  if (missing.length > 0 || extra.length > 0) {
    invalid(
      `${label} fields are invalid (missing: ${missing.join(",")}; extra: ${extra.join(",")}).`,
    );
  }
}

function assertFiniteNumber(value: unknown, label: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    invalid(`${label} must be a finite number.`);
  }
}

function assertBoundedInteger(
  value: unknown,
  minimum: number,
  maximum: number,
  label: string,
): asserts value is number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    invalid(`${label} must be an integer from ${minimum} through ${maximum}.`);
  }
}

function assertWorkloadCount(
  value: unknown,
  maximum: number,
  label: string,
): asserts value is number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    invalid(`${label} must be a non-negative safe integer.`);
  }
  if (value > maximum) overLimit(`${label} exceeds its accepted workload limit.`);
}

function assertNonemptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`${label} must be a non-empty string.`);
  }
}

function assertSha256(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) {
    invalid(`${label} must be a lowercase SHA-256 digest.`);
  }
}

function assertVector(value: unknown, label: string): asserts value is LoftCoarseVec3 {
  assertExactKeys(value, ["x", "y", "z"], label);
  const vector = value as unknown as LoftCoarseVec3;
  assertFiniteNumber(vector.x, `${label}.x`);
  assertFiniteNumber(vector.y, `${label}.y`);
  assertFiniteNumber(vector.z, `${label}.z`);
}

function assertQuaternion(
  value: unknown,
  label: string,
): asserts value is LoftCoarseQuaternion {
  assertExactKeys(value, ["x", "y", "z", "w"], label);
  const quaternion = value as unknown as LoftCoarseQuaternion;
  assertFiniteNumber(quaternion.x, `${label}.x`);
  assertFiniteNumber(quaternion.y, `${label}.y`);
  assertFiniteNumber(quaternion.z, `${label}.z`);
  assertFiniteNumber(quaternion.w, `${label}.w`);
}

function assertCanonicalEntityId(
  value: unknown,
  label: string,
): asserts value is LoftCoarseEntityId {
  if (typeof value !== "string" || !canonicalEntityIds.includes(value as LoftCoarseEntityId)) {
    invalid(`${label} must be a canonical entity id.`);
  }
}

function assertFilterPair(value: unknown, label: string): void {
  if (!Array.isArray(value) || value.length !== 2) {
    invalid(`${label} must contain membership and collide masks.`);
  }
  value.forEach((part, index) => {
    if (!Number.isSafeInteger(part) || (part as number) < 0) {
      invalid(`${label}[${index}] must be a non-negative integer.`);
    }
  });
}

function assertPositiveVector(value: unknown, label: string): void {
  assertVector(value, label);
  if (value.x <= 0 || value.y <= 0 || value.z <= 0) {
    invalid(`${label} dimensions must be positive.`);
  }
}

function assertMaterial(value: unknown, label: string): void {
  assertExactKeys(
    value,
    ["friction", "staticFriction", "restitution", "frictionCombine", "restitutionCombine"],
    label,
  );
  const material = value as unknown as LoftCoarseMaterialValues;
  assertFiniteNumber(material.friction, `${label}.friction`);
  assertFiniteNumber(material.staticFriction, `${label}.staticFriction`);
  assertFiniteNumber(material.restitution, `${label}.restitution`);
  assertNonemptyString(material.frictionCombine, `${label}.frictionCombine`);
  assertNonemptyString(material.restitutionCombine, `${label}.restitutionCombine`);
  if (
    material.friction !== guard.materials.friction ||
    material.staticFriction !== guard.materials.staticFriction ||
    material.restitution !== guard.materials.restitution ||
    material.frictionCombine !== guard.materials.frictionCombine ||
    material.restitutionCombine !== guard.materials.restitutionCombine
  ) invalid(`${label} differs from the frozen material policy.`);
}

function validateMatrixMetadata(value: unknown): asserts value is LoftCoarseMatrixMetadata {
  assertExactKeys(value, matrixIdentityKeys, "Matrix metadata");
  const metadata = value as unknown as LoftCoarseMatrixIdentity;
  assertBoundedInteger(metadata.guardSchemaVersion, 1, 1, "Matrix guardSchemaVersion");
  assertNonemptyString(metadata.scope, "Matrix scope");
  assertNonemptyString(metadata.matrixId, "Matrix matrixId");
  assertNonemptyString(metadata.algorithmVersion, "Matrix algorithmVersion");
  assertBoundedInteger(metadata.protocolVersion, 1, 1, "Matrix protocolVersion");
  assertBoundedInteger(metadata.configSchemaVersion, 1, 1_000, "Matrix configSchemaVersion");
  assertNonemptyString(metadata.configVersion, "Matrix configVersion");
  assertSha256(metadata.configHash, "Matrix configHash");
  assertNonemptyString(metadata.fixtureId, "Matrix fixtureId");
  assertSha256(metadata.fixturePayloadSha256, "Matrix fixturePayloadSha256");
  assertSha256(metadata.fixtureFileSha256, "Matrix fixtureFileSha256");
  assertNonemptyString(metadata.physicsVersion, "Matrix physicsVersion");
  assertNonemptyString(metadata.adapterVersion, "Matrix adapterVersion");
  assertSha256(metadata.wasmSha256, "Matrix wasmSha256");
  assertNonemptyString(metadata.matchId, "Matrix matchId");
  assertNonemptyString(metadata.runtimeIdentity, "Matrix runtimeIdentity");
  if (
    metadata.guardSchemaVersion !== guard.schemaVersion ||
    metadata.scope !== guard.scope ||
    metadata.matrixId !== guard.matrixId ||
    metadata.algorithmVersion !== guard.algorithmVersion ||
    metadata.protocolVersion !== guard.protocolVersion ||
    metadata.configSchemaVersion !== guard.configSchemaVersion ||
    metadata.configVersion !== COUNTERBALL_CONFIG_V1.configVersion ||
    metadata.fixtureId !== guard.fixture.id ||
    metadata.fixturePayloadSha256 !== guard.fixture.payloadSha256 ||
    metadata.physicsVersion !== guard.physicsVersion ||
    metadata.adapterVersion !== guard.physicsVersion.slice(guard.physicsVersion.lastIndexOf("/") + 1) ||
    metadata.wasmSha256 !== guard.wasmSha256 ||
    metadata.matchId !== guard.matchId
  ) {
    invalid("Matrix metadata does not match the frozen diagnostic guard identity.");
  }
}

function validateMassProjection(value: unknown, nativeMass: number, label: string): void {
  assertExactKeys(
    value,
    ["configuredMass", "projectedMass", "observedNativeMass", "tolerance", "withinTolerance"],
    label,
  );
  for (const key of ["configuredMass", "projectedMass", "observedNativeMass", "tolerance"] as const) {
    assertFiniteNumber(value[key], `${label}.${key}`);
  }
  const projection = value as unknown as LoftCoarseMassProjection;
  const expectedTolerance =
    guard.energy.nativeMassToleranceMultiplier *
    Number.EPSILON *
    Math.max(1, Math.abs(projection.projectedMass));
  if (
    projection.configuredMass <= 0 ||
    projection.projectedMass !== Math.fround(projection.configuredMass) ||
    projection.tolerance !== expectedTolerance ||
    projection.observedNativeMass !== nativeMass ||
    projection.tolerance < 0 ||
    projection.withinTolerance !== true ||
    Math.abs(projection.observedNativeMass - projection.projectedMass) > projection.tolerance
  ) {
    invalid(`${label} does not prove the configured mass projection.`);
  }
}

function validateCaseMetadata(
  value: unknown,
  matrixMetadata: LoftCoarseMatrixMetadata,
  expectedTuple: LoftCoarseTuple,
  expectedIndex: number,
): asserts value is LoftCoarseCaseMetadata {
  assertExactKeys(value, caseMetadataKeys, `Case ${expectedIndex} metadata`);
  const metadata = value as unknown as LoftCoarseCaseMetadata;
  for (const key of matrixIdentityKeys) {
    if (metadata[key] !== matrixMetadata[key]) {
      invalid(`Case ${expectedIndex} metadata has a mismatched ${key}.`);
    }
  }
  if (!isExactTuple(metadata.tuple, expectedTuple)) {
    invalid(`Case ${expectedIndex} has a tuple that does not match canonical matrix order.`);
  }
  assertBoundedInteger(metadata.matrixIndex, 0, LOFT_COARSE_TUPLES.length - 1, `Case ${expectedIndex} matrixIndex`);
  if (metadata.matrixIndex !== expectedIndex) invalid(`Case ${expectedIndex} has an incorrect matrixIndex.`);
  assertNonemptyString(metadata.initialStateHashAlgorithm, `Case ${expectedIndex} initialStateHashAlgorithm`);
  if (metadata.initialStateHashAlgorithm !== guard.setup.initialStateHashAlgorithm) {
    invalid(`Case ${expectedIndex} has an unsupported initial-state hash algorithm.`);
  }
  assertSha256(metadata.initialStateHash, `Case ${expectedIndex} initialStateHash`);

  assertArray(metadata.dynamicBodies, `Case ${expectedIndex} dynamicBodies`);
  if (metadata.dynamicBodies.length !== canonicalEntityIds.length) {
    invalid(`Case ${expectedIndex} must record all 15 dynamic bodies.`);
  }
  metadata.dynamicBodies.forEach((body, bodyIndex) => {
    const label = `Case ${expectedIndex} dynamicBodies[${bodyIndex}]`;
    assertExactKeys(body, dynamicBodyFactKeys, label);
    assertCanonicalEntityId(body.id, `${label}.id`);
    if (body.id !== canonicalEntityIds[bodyIndex]) invalid(`${label} is out of canonical order.`);
    for (const key of ["nativeMass"] as const) {
      assertFiniteNumber(body[key], `${label}.${key}`);
      if (body[key] <= 0) invalid(`${label}.${key} must be positive.`);
    }
    assertVector(body.centerOfMassOffset, `${label}.centerOfMassOffset`);
    assertPositiveVector(body.principalInertias, `${label}.principalInertias`);
    assertQuaternion(body.inertiaOrientation, `${label}.inertiaOrientation`);
    assertPositiveVector(body.colliderDimensions, `${label}.colliderDimensions`);
    assertFilterPair(body.collisionFilter, `${label}.collisionFilter`);
    assertVector(body.initialLinearVelocity, `${label}.initialLinearVelocity`);
    assertVector(body.initialAngularVelocity, `${label}.initialAngularVelocity`);
    assertExactKeys(
      body.configuredMassProjection,
      ["configuredMass", "projectedMass", "observedNativeMass", "tolerance", "withinTolerance"],
      `${label}.configuredMassProjection`,
    );
    const configuredMass =
      body.id === "button"
        ? COUNTERBALL_CONFIG_V1.bodies.buttonMass
        : COUNTERBALL_CONFIG_V1.bodies.capMass;
    if (body.configuredMassProjection.configuredMass !== configuredMass) {
      invalid(`${label} configured mass does not match canonical configuration.`);
    }
    validateMassProjection(body.configuredMassProjection, body.nativeMass, `${label}.configuredMassProjection`);
  });

  assertArray(metadata.materials, `Case ${expectedIndex} materials`);
  if (metadata.materials.length !== guard.materials.shapeCount) invalid(`Case ${expectedIndex} must record all 22 material readbacks.`);
  const materialKeys = new Set<string>();
  metadata.materials.forEach((material, materialIndex) => {
    const label = `Case ${expectedIndex} materials[${materialIndex}]`;
    assertExactKeys(material, ["bodyId", "shapeIndex", "setter", "readback"], label);
    assertNonemptyString(material.bodyId, `${label}.bodyId`);
    assertBoundedInteger(material.shapeIndex, 0, 0, `${label}.shapeIndex`);
    const uniqueKey = `${material.bodyId}:${material.shapeIndex}`;
    if (materialKeys.has(uniqueKey)) invalid(`${label} duplicates a material shape.`);
    materialKeys.add(uniqueKey);
    assertMaterial(material.setter, `${label}.setter`);
    assertMaterial(material.readback, `${label}.readback`);
    for (const field of ["friction", "staticFriction", "restitution", "frictionCombine", "restitutionCombine"] as const) {
      if (material.setter[field] !== material.readback[field]) invalid(`${label} setter/readback mismatch.`);
    }
  });

  assertArray(metadata.staticBodies, `Case ${expectedIndex} staticBodies`);
  if (metadata.staticBodies.length !== 7) invalid(`Case ${expectedIndex} must record all seven static bodies.`);
  const staticIds = new Set<string>();
  metadata.staticBodies.forEach((body, bodyIndex) => {
    const label = `Case ${expectedIndex} staticBodies[${bodyIndex}]`;
    assertExactKeys(body, ["id", "colliderDimensions", "collisionFilter", "material"], label);
    assertNonemptyString(body.id, `${label}.id`);
    if (body.id !== requiredAt(canonicalStaticBodyIds, bodyIndex, `canonical static body ${bodyIndex}`)) {
      invalid(`${label}.id is not the expected goal-frame/support body in canonical order.`);
    }
    if (canonicalEntityIds.includes(body.id as LoftCoarseEntityId) || staticIds.has(body.id)) {
      invalid(`${label}.id must be a unique static-body id.`);
    }
    staticIds.add(body.id);
    assertPositiveVector(body.colliderDimensions, `${label}.colliderDimensions`);
    assertFilterPair(body.collisionFilter, `${label}.collisionFilter`);
    assertMaterial(body.material, `${label}.material`);
    const materialRecord = metadata.materials.find(
      (candidate) => candidate.bodyId === body.id && candidate.shapeIndex === 0,
    );
    if (materialRecord === undefined) invalid(`${label} has no matching material readback.`);
    for (const field of ["friction", "staticFriction", "restitution", "frictionCombine", "restitutionCombine"] as const) {
      if (body.material[field] !== materialRecord.readback[field]) {
        invalid(`${label}.material does not match the native material readback.`);
      }
    }
  });
  for (const bodyId of canonicalEntityIds) {
    if (!materialKeys.has(`${bodyId}:0`)) invalid(`Case ${expectedIndex} is missing material readback for ${bodyId}.`);
  }
  for (const bodyId of staticIds) {
    if (!materialKeys.has(`${bodyId}:0`)) invalid(`Case ${expectedIndex} is missing material readback for ${bodyId}.`);
  }

  assertFiniteNumber(metadata.preImpulseMeasuredShiftedEnergy, `Case ${expectedIndex} preImpulseMeasuredShiftedEnergy`);
  assertFiniteNumber(metadata.preImpulsePredictedShiftedEnergy, `Case ${expectedIndex} preImpulsePredictedShiftedEnergy`);
  if (
    metadata.preImpulseMeasuredShiftedEnergy > guard.energy.maximum ||
    metadata.preImpulseMeasuredShiftedEnergy < 0 ||
    metadata.preImpulsePredictedShiftedEnergy > guard.energy.maximum
    || metadata.preImpulsePredictedShiftedEnergy < 0
  ) invalid(`Case ${expectedIndex} pre-impulse energy exceeds the frozen guard.`);

  assertArray(metadata.finalBodies, `Case ${expectedIndex} finalBodies`);
  if (metadata.finalBodies.length !== canonicalEntityIds.length) invalid(`Case ${expectedIndex} must record all 15 final bodies.`);
  metadata.finalBodies.forEach((body, bodyIndex) => {
    const label = `Case ${expectedIndex} finalBodies[${bodyIndex}]`;
    assertExactKeys(body, bodyStateKeys, label);
    assertBodyState(
      body,
      label,
      requiredAt(canonicalEntityIds, bodyIndex, `canonical entity ${bodyIndex}`),
    );
  });
  validateSettlingWindow(metadata.settlingWindow, expectedIndex);
  assertExactKeys(metadata.eligibility, ["eligible", "reasons"], `Case ${expectedIndex} eligibility`);
  if (typeof metadata.eligibility.eligible !== "boolean") invalid(`Case ${expectedIndex} eligibility.eligible must be boolean.`);
  assertArray(metadata.eligibility.reasons, `Case ${expectedIndex} eligibility.reasons`);
  metadata.eligibility.reasons.forEach((reason, reasonIndex) => assertNonemptyString(reason, `Case ${expectedIndex} eligibility.reasons[${reasonIndex}]`));
  if (
    (metadata.eligibility.eligible && metadata.eligibility.reasons.length !== 0) ||
    (!metadata.eligibility.eligible && metadata.eligibility.reasons.length === 0)
  ) invalid(`Case ${expectedIndex} eligibility must explain every ineligible result.`);
  if (
    metadata.eligibility.eligible &&
    !metadata.settlingWindow.ticks.every((tick) => tick.settledMask === 0x7fff)
  ) invalid(`Case ${expectedIndex} cannot be eligible without a complete settled window.`);

  for (const [field, maximum] of [
    ["executeStepCalls", workloadCaps.maximumExecuteStepCallsPerCase],
    ["batches", workloadCaps.maximumBatchesPerCase],
  ] as const) {
    assertWorkloadCount(metadata[field], maximum, `Case ${expectedIndex} ${field}`);
  }
  assertFiniteNumber(metadata.wallTimeMs, `Case ${expectedIndex} wallTimeMs`);
  if (metadata.wallTimeMs < 0 || metadata.wallTimeMs > workloadCaps.maximumWallTimePerCaseMs) {
    overLimit(`Case ${expectedIndex} wallTimeMs exceeds its accepted limit.`);
  }
  if (
    metadata.executeStepCalls === 0 ||
    metadata.batches === 0 ||
    metadata.batches > metadata.executeStepCalls ||
    metadata.batches * workloadCaps.maximumCallsPerBatch < metadata.executeStepCalls
  ) invalid(`Case ${expectedIndex} batch totals do not cover its executeStep calls.`);
}

function assertBodyState(
  value: unknown,
  label: string,
  expectedId: LoftCoarseEntityId,
): asserts value is LoftCoarseBodyState {
  assertExactKeys(value, bodyStateKeys, label);
  const body = value as unknown as LoftCoarseBodyState;
  assertCanonicalEntityId(body.id, `${label}.id`);
  if (body.id !== expectedId) invalid(`${label}.id is out of canonical order.`);
  assertVector(body.position, `${label}.position`);
  assertQuaternion(body.rotation, `${label}.rotation`);
  assertVector(body.linearVelocity, `${label}.linearVelocity`);
  assertVector(body.angularVelocity, `${label}.angularVelocity`);
}

function validateSettlingWindow(value: unknown, caseIndex: number): void {
  const label = `Case ${caseIndex} settlingWindow`;
  assertExactKeys(value, ["startTick", "endTick", "linearSpeedThreshold", "angularSpeedThreshold", "ticks"], label);
  const window = value as unknown as LoftCoarseSettlingWindow;
  assertBoundedInteger(window.startTick, 0, workloadCaps.maximumNominalTicksPerCase, `${label}.startTick`);
  assertBoundedInteger(window.endTick, 0, workloadCaps.maximumNominalTicksPerCase, `${label}.endTick`);
  if (window.endTick < window.startTick || window.endTick - window.startTick + 1 !== 60) {
    invalid(`${label} must describe the configured 60-tick settling window.`);
  }
  assertFiniteNumber(window.linearSpeedThreshold, `${label}.linearSpeedThreshold`);
  assertFiniteNumber(window.angularSpeedThreshold, `${label}.angularSpeedThreshold`);
  if (window.linearSpeedThreshold <= 0 || window.angularSpeedThreshold <= 0) {
    invalid(`${label} speed thresholds must be positive.`);
  }
  if (
    window.linearSpeedThreshold !== COUNTERBALL_CONFIG_V1.simulation.linearSettleThreshold ||
    window.angularSpeedThreshold !== COUNTERBALL_CONFIG_V1.simulation.angularSettleThreshold
  ) invalid(`${label} thresholds do not match canonical configuration.`);
  assertArray(window.ticks, `${label}.ticks`);
  if (window.ticks.length !== 60) invalid(`${label} must contain all 60 per-tick settling results.`);
  window.ticks.forEach((tick, tickIndex) => {
    const tickLabel = `${label}.ticks[${tickIndex}]`;
    assertExactKeys(tick, ["tick", "linearSpeeds", "angularSpeeds", "settledMask"], tickLabel);
    const settleTick = tick as unknown as LoftCoarseSettleTick;
    assertBoundedInteger(settleTick.tick, window.startTick, window.endTick, `${tickLabel}.tick`);
    if (settleTick.tick !== window.startTick + tickIndex) invalid(`${tickLabel} is out of tick order.`);
    assertArray(settleTick.linearSpeeds, `${tickLabel}.linearSpeeds`);
    assertArray(settleTick.angularSpeeds, `${tickLabel}.angularSpeeds`);
    if (
      settleTick.linearSpeeds.length !== canonicalEntityIds.length ||
      settleTick.angularSpeeds.length !== canonicalEntityIds.length
    ) invalid(`${tickLabel} must record speeds for all 15 bodies in canonical entity order.`);
    assertBoundedInteger(settleTick.settledMask, 0, 0x7fff, `${tickLabel}.settledMask`);
    canonicalEntityIds.forEach((id, bodyIndex) => {
      const linear = settleTick.linearSpeeds[bodyIndex];
      const angular = settleTick.angularSpeeds[bodyIndex];
      assertNonnegativeFinite(linear, `${tickLabel}.linearSpeeds[${bodyIndex}] (${id})`);
      assertNonnegativeFinite(angular, `${tickLabel}.angularSpeeds[${bodyIndex}] (${id})`);
      const bitIsSet = (settleTick.settledMask & (1 << bodyIndex)) !== 0;
      const expectedSettled = linear <= window.linearSpeedThreshold && angular <= window.angularSpeedThreshold;
      if (bitIsSet !== expectedSettled) invalid(`${tickLabel} settledMask does not match measured speeds.`);
    });
  });
}

function validateBodyRow(value: unknown, tuple: LoftCoarseTuple, tickIndex: number, bodyIndex: number): void {
  const label = `Body row ${tickIndex * 15 + bodyIndex}`;
  assertExactKeys(value, bodyRowKeys, label);
  const row = value as unknown as LoftCoarseBodyRow;
  if (!isExactTuple(row.tuple, tuple)) invalid(`${label} tuple does not match its case.`);
  assertBoundedInteger(row.nominalTick, 0, workloadCaps.maximumNominalTicksPerCase, `${label}.nominalTick`);
  if (row.nominalTick !== tickIndex) invalid(`${label} is not in contiguous tick/body order.`);
  assertBodyState(
    { id: row.id, position: row.position, rotation: row.rotation, linearVelocity: row.linearVelocity, angularVelocity: row.angularVelocity },
    label,
    requiredAt(canonicalEntityIds, bodyIndex, `canonical entity ${bodyIndex}`),
  );
}

function validateContactRow(
  value: unknown,
  tuple: LoftCoarseTuple,
  calls: number,
  maximumTick: number,
  rowIndex: number,
): void {
  const label = `Contact row ${rowIndex}`;
  assertExactKeys(value, contactRowKeys, label);
  const row = value as unknown as LoftCoarseContactRow;
  if (!isExactTuple(row.tuple, tuple)) invalid(`${label} tuple does not match its case.`);
  assertBoundedInteger(row.nominalTick, 0, workloadCaps.maximumNominalTicksPerCase, `${label}.nominalTick`);
  if (row.nominalTick > maximumTick) invalid(`${label} is beyond the recorded body samples.`);
  assertBoundedInteger(row.callIndex, 0, Math.max(0, calls - 1), `${label}.callIndex`);
  if (!Array.isArray(row.pair) || row.pair.length !== 2) invalid(`${label}.pair must be a canonical entity pair.`);
  assertCanonicalEntityId(row.pair[0], `${label}.pair[0]`);
  assertCanonicalEntityId(row.pair[1], `${label}.pair[1]`);
  const left = canonicalEntityIds.indexOf(row.pair[0]);
  const right = canonicalEntityIds.indexOf(row.pair[1]);
  if (left >= right) invalid(`${label}.pair must be unique and in canonical order.`);
  assertNonemptyString(row.eventType, `${label}.eventType`);
  if (encoder.encode(row.eventType).byteLength > artifactCaps.maximumEventTypeBytes) {
    invalid(`${label}.eventType exceeds ${artifactCaps.maximumEventTypeBytes} UTF-8 bytes.`);
  }
  if (row.point !== null) assertVector(row.point, `${label}.point`);
}

function validateExtremum(value: unknown, label: string, calls: number, withBody: boolean): void {
  assertExactKeys(value, withBody ? ["value", "callIndex", "bodyId"] : ["value", "callIndex"], label);
  const extremum = value as unknown as LoftCoarseExtremum & { bodyId?: LoftCoarseEntityId };
  assertFiniteNumber(extremum.value, `${label}.value`);
  assertBoundedInteger(extremum.callIndex, 0, Math.max(0, calls - 1), `${label}.callIndex`);
  if (withBody) assertCanonicalEntityId(extremum.bodyId, `${label}.bodyId`);
}

function validateObstacleClearance(value: unknown, label: string, calls: number): void {
  assertExactKeys(value, ["value", "callIndex", "obstaclePair"], label);
  const clearance = value as unknown as LoftCoarseObstacleClearanceExtremum;
  assertFiniteNumber(clearance.value, `${label}.value`);
  assertBoundedInteger(clearance.callIndex, 0, Math.max(0, calls - 1), `${label}.callIndex`);
  if (!Array.isArray(clearance.obstaclePair) || clearance.obstaclePair.length !== 2) {
    invalid(`${label}.obstaclePair must identify the compared obstacle.`);
  }
  assertCanonicalEntityId(clearance.obstaclePair[0], `${label}.obstaclePair[0]`);
  assertCanonicalEntityId(clearance.obstaclePair[1], `${label}.obstaclePair[1]`);
  if (canonicalEntityIds.indexOf(clearance.obstaclePair[0]) >= canonicalEntityIds.indexOf(clearance.obstaclePair[1])) {
    invalid(`${label}.obstaclePair must be in canonical entity order.`);
  }
  if (clearance.obstaclePair[0] !== "button" || clearance.obstaclePair[1] !== "home-1") {
    invalid(`${label}.obstaclePair must identify the button and configured obstacle cap.`);
  }
}

function validateSweepRow(value: unknown, tuple: LoftCoarseTuple, rowIndex: number): number {
  const label = `Sweep row ${rowIndex}`;
  assertExactKeys(value, sweepRowKeys, label);
  const row = value as unknown as LoftCoarseSweepRow;
  if (!isExactTuple(row.tuple, tuple)) invalid(`${label} tuple does not match its case.`);
  assertBoundedInteger(row.nominalTick, 0, workloadCaps.maximumNominalTicksPerCase, `${label}.nominalTick`);
  if (row.nominalTick !== rowIndex) invalid(`${label} is not in nominal-tick order.`);
  assertBoundedInteger(row.actualCheckedCallCount, 1, guard.sweep.maximumCallsPerNominalTick, `${label}.actualCheckedCallCount`);
  validateExtremum(row.maximumShiftedEnergy, `${label}.maximumShiftedEnergy`, row.actualCheckedCallCount, false);
  validateExtremum(row.maximumCandidateRelativeComDrop, `${label}.maximumCandidateRelativeComDrop`, row.actualCheckedCallCount, true);
  validateExtremum(row.minimumApronMargin, `${label}.minimumApronMargin`, row.actualCheckedCallCount, true);
  validateExtremum(row.minimumSlabUndersideMargin, `${label}.minimumSlabUndersideMargin`, row.actualCheckedCallCount, true);
  validateExtremum(row.maximumPointSweep, `${label}.maximumPointSweep`, row.actualCheckedCallCount, true);
  validateExtremum(row.maximumRotationSweep, `${label}.maximumRotationSweep`, row.actualCheckedCallCount, true);
  validateObstacleClearance(
    row.minimumWholeButtonObstacleClearance,
    `${label}.minimumWholeButtonObstacleClearance`,
    row.actualCheckedCallCount,
  );
  const energy = row.maximumShiftedEnergy.value;
  const drop = row.maximumCandidateRelativeComDrop.value;
  const apron = row.minimumApronMargin.value;
  const slab = row.minimumSlabUndersideMargin.value;
  const pointSweep = row.maximumPointSweep.value;
  const rotationSweep = row.maximumRotationSweep.value;
  if (
    energy > guard.energy.maximum ||
    drop > guard.energy.maximumRestComDrop ||
    apron < 0 ||
    slab < 0 ||
    pointSweep < 0 ||
    pointSweep > guard.sweep.maximumPointSweepPerCall ||
    rotationSweep < 0 ||
    rotationSweep > guard.sweep.maximumRotationPerCall
  ) invalid(`${label} violates the frozen per-call safety guard.`);
  assertNonemptyString(row.intervalClassification, `${label}.intervalClassification`);
  if (encoder.encode(row.intervalClassification).byteLength > 64) invalid(`${label}.intervalClassification exceeds 64 UTF-8 bytes.`);
  if (row.allFinite !== true || typeof row.all15Settled !== "boolean") {
    invalid(`${label} must record finite and all-body settling facts.`);
  }
  return row.actualCheckedCallCount;
}

function* jsonStringParts(value: string): Generator<string> {
  if (value.length === 0) {
    yield '""';
    return;
  }
  yield '"';
  const maxCodeUnitsPerPart = 1_024;
  for (let start = 0; start < value.length; ) {
    let end = Math.min(start + maxCodeUnitsPerPart, value.length);
    if (
      end < value.length &&
      end > start &&
      value.charCodeAt(end - 1) >= 0xd800 &&
      value.charCodeAt(end - 1) <= 0xdbff &&
      value.charCodeAt(end) >= 0xdc00 &&
      value.charCodeAt(end) <= 0xdfff
    ) {
      end -= 1;
    }
    const encodedPart = JSON.stringify(value.slice(start, end));
    if (encodedPart === undefined) {
      invalid("A string did not serialize as JSON.");
    }
    yield encodedPart.slice(1, -1);
    start = end;
  }
  yield '"';
}

function* jsonParts(
  value: unknown,
  ancestors: Set<object>,
): Generator<string> {
  if (value === null) {
    yield "null";
    return;
  }
  if (typeof value === "string") {
    yield* jsonStringParts(value);
    return;
  }
  if (typeof value === "boolean") {
    yield value ? "true" : "false";
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid("JSON values cannot contain non-finite numbers.");
    }
    const encoded = Object.is(value, -0) ? "-0" : JSON.stringify(value);
    if (encoded === undefined) invalid("A number did not serialize as JSON.");
    yield encoded;
    return;
  }
  if (typeof value !== "object" || value === undefined) {
    invalid(`JSON values cannot contain ${typeof value}.`);
  }
  if (ancestors.has(value)) {
    invalid("JSON values cannot contain circular references.");
  }
  ancestors.add(value);
  if (Array.isArray(value)) {
    if (
      Object.getOwnPropertySymbols(value).length !== 0 ||
      Object.getOwnPropertyNames(value).length !== value.length + 1
    ) {
      invalid("JSON arrays cannot contain holes or extra properties.");
    }
    yield "[";
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (descriptor === undefined || !("value" in descriptor)) {
        invalid("JSON arrays cannot contain holes or accessors.");
      }
      if (index > 0) yield ",";
      yield* jsonParts(descriptor.value, ancestors);
    }
    yield "]";
    ancestors.delete(value);
    return;
  }
  const prototype = Reflect.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    invalid("JSON values must be plain objects.");
  }
  const keys = Object.keys(value).sort();
  if (
    Object.getOwnPropertySymbols(value).length !== 0 ||
    Object.getOwnPropertyNames(value).length !== keys.length
  ) {
    invalid("JSON objects cannot contain hidden or symbol keys.");
  }
  yield "{";
  let firstKey = true;
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) {
      invalid("JSON objects cannot contain accessors.");
    }
    if (descriptor.value === undefined) {
      invalid("JSON objects cannot contain undefined values.");
    }
    if (!firstKey) yield ",";
    firstKey = false;
    yield* jsonStringParts(key);
    yield ":";
    yield* jsonParts(descriptor.value, ancestors);
  }
  yield "}";
  ancestors.delete(value);
}

function stringifyBounded(
  value: unknown,
  maxBytes: number,
  label: string,
): { json: string; bytes: number } {
  const fragments: string[] = [];
  let byteCount = 0;
  for (const fragment of jsonParts(value, new Set<object>())) {
    byteCount += encoder.encode(fragment).byteLength;
    if (byteCount > maxBytes) {
      overLimit(`${label} exceeds its inclusive ${maxBytes}-byte UTF-8 cap.`);
    }
    fragments.push(fragment);
  }
  return { json: fragments.join(""), bytes: byteCount };
}

function isExactTuple(value: unknown, expected: LoftCoarseTuple): boolean {
  return (
    Array.isArray(value) &&
    value.length === expected.length &&
    expected.every((part, index) => value[index] === part)
  );
}

function assertArray(value: unknown, label: string): asserts value is unknown[] {
  if (!Array.isArray(value)) invalid(`${label} must be an array.`);
}

function requiredAt<T>(values: readonly T[], index: number, label: string): T {
  const value = values[index];
  if (value === undefined) invalid(`${label} is missing.`);
  return value;
}

function assertNonnegativeFinite(
  value: unknown,
  label: string,
): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    invalid(`${label} must be a finite non-negative number.`);
  }
}

function makeEnvelope(
  summary: Omit<LoftCoarseMatrixSummary, "matrixBytes" | "envelopeBytes">,
): LoftCoarseJsonObject {
  return {
    tuples: LOFT_COARSE_TUPLES,
    caseCount: summary.caseCount,
    bodyRows: summary.bodyRows,
    contactRows: summary.contactRows,
    sweepRows: summary.sweepRows,
    executeStepCalls: summary.executeStepCalls,
    batches: summary.batches,
    wallTimeMs: summary.wallTimeMs,
  };
}

class JsonChunkWriter {
  private readonly buffer = new Uint8Array(maximumChunkBytes);
  private bufferLength = 0;
  private byteCount = 0;

  constructor(
    private readonly sink: LoftCoarseByteSink,
    private readonly maximumBytes: number,
    private readonly signal: WriteLoftCoarseMatrixInput["signal"],
  ) {}

  get bytesWrittenAndBuffered(): number {
    return this.byteCount;
  }

  async writeText(text: string): Promise<number> {
    return this.writeEncoded(encoder.encode(text));
  }

  async writeEncoded(encoded: Uint8Array): Promise<number> {
    let offset = 0;
    while (offset < encoded.byteLength) {
      checkCancelled(this.signal);
      const available = maximumChunkBytes - this.bufferLength;
      const count = Math.min(available, encoded.byteLength - offset);
      if (this.byteCount + count > this.maximumBytes) {
        overLimit("The matrix exceeds its inclusive matrix-byte cap.");
      }
      this.buffer.set(encoded.subarray(offset, offset + count), this.bufferLength);
      this.bufferLength += count;
      this.byteCount += count;
      offset += count;
      if (this.bufferLength === maximumChunkBytes) {
        await this.flush();
      }
    }
    return encoded.byteLength;
  }

  async flush(): Promise<void> {
    if (this.bufferLength === 0) return;
    checkCancelled(this.signal);
    const chunk = this.buffer.slice(0, this.bufferLength);
    this.bufferLength = 0;
    let onAbort: (() => void) | undefined;
    const cancelled = new Promise<never>((_, reject) => {
      onAbort = () => reject(makeCancelledError());
      this.signal.addEventListener("abort", onAbort, { once: true });
      if (this.signal.aborted) onAbort();
    });
    try {
      await Promise.race([
        Promise.resolve().then(() => this.sink.write(chunk)),
        cancelled,
      ]);
    } finally {
      if (onAbort !== undefined) {
        this.signal.removeEventListener("abort", onAbort);
      }
    }
  }
}

function assertCaseShape(value: unknown): asserts value is LoftCoarseCase {
  assertExactKeys(value, ["metadata", "bodyRows", "contactRows", "sweepRows"], "Case");
  const currentCase = value as unknown as LoftCoarseCase;
  assertPlainObject(currentCase.metadata, "Case metadata");
  assertArray(currentCase.bodyRows, "Case bodyRows");
  assertArray(currentCase.contactRows, "Case contactRows");
  assertArray(currentCase.sweepRows, "Case sweepRows");
}

async function writeCase(
  output: JsonChunkWriter,
  value: unknown,
  matrixMetadata: LoftCoarseMatrixMetadata,
  expectedTuple: LoftCoarseTuple,
  index: number,
): Promise<{
  bodyRows: number;
  contactRows: number;
  sweepRows: number;
  executeStepCalls: number;
  batches: number;
  wallTimeMs: number;
}> {
  assertCaseShape(value);
  const metadata = value.metadata;
  validateCaseMetadata(metadata, matrixMetadata, expectedTuple, index);
  const bodyRows = value.bodyRows;
  const contactRows = value.contactRows;
  const sweepRows = value.sweepRows;
  if (bodyRows.length > artifactCaps.maximumBodyRowsPerCase) {
    overLimit(`Case ${index} has too many body rows.`);
  }
  if (contactRows.length > artifactCaps.maximumContactsPerCase) {
    overLimit(`Case ${index} has too many contact rows.`);
  }
  if (sweepRows.length > artifactCaps.maximumSweepRowsPerCase) {
    overLimit(`Case ${index} has too many sweep rows.`);
  }
  if (bodyRows.length === 0 || bodyRows.length % canonicalEntityIds.length !== 0) {
    invalid(`Case ${index} body rows must contain tick zero and complete 15-body samples.`);
  }
  const nominalIntervalCount = bodyRows.length / canonicalEntityIds.length - 1;
  if (nominalIntervalCount < 1) {
    invalid(`Case ${index} must include tick zero and at least one nominal endpoint.`);
  }
  if (sweepRows.length !== nominalIntervalCount) {
    invalid(`Case ${index} must have one sweep row for every executed nominal interval.`);
  }
  if (contactRows.length > 0 && metadata.executeStepCalls === 0) {
    invalid(`Case ${index} cannot contain contacts without executeStep calls.`);
  }

  const metadataJson = stringifyBounded(
    metadata,
    artifactCaps.maximumCaseMetadataBytes,
    `Case ${index} metadata`,
  );
  let caseByteCount = 0;
  let sweepCheckedCallCount = 0;
  const writeCaseText = async (text: string): Promise<void> => {
    const bytes = encoder.encode(text);
    caseByteCount += bytes.byteLength;
    if (caseByteCount > artifactCaps.maximumCaseBytes) {
      overLimit(`Case ${index} exceeds its inclusive case-byte cap.`);
    }
    await output.writeEncoded(bytes);
  };
  const writeRows = async (
    key: "bodyRows" | "contactRows" | "sweepRows",
    rows: readonly unknown[],
    maxRowBytes: number,
  ): Promise<void> => {
    await writeCaseText(`,"${key}":[`);
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      if (rowIndex > 0) await writeCaseText(",");
      if (key === "bodyRows") {
        validateBodyRow(
          rows[rowIndex],
          expectedTuple,
          Math.floor(rowIndex / canonicalEntityIds.length),
          rowIndex % canonicalEntityIds.length,
        );
      } else if (key === "contactRows") {
        validateContactRow(
          rows[rowIndex],
          expectedTuple,
          metadata.executeStepCalls,
          sweepRows.length - 1,
          rowIndex,
        );
      } else {
        sweepCheckedCallCount += validateSweepRow(rows[rowIndex], expectedTuple, rowIndex);
      }
      const serialized = stringifyBounded(
        rows[rowIndex],
        maxRowBytes,
        `Case ${index} ${key}[${rowIndex}]`,
      );
      await writeCaseText(serialized.json);
    }
    await writeCaseText("]");
  };

  await writeCaseText(`{"metadata":${metadataJson.json}`);
  await writeRows(
    "bodyRows",
    bodyRows,
    artifactCaps.maximumBodyOrContactRowBytes,
  );
  await writeRows(
    "contactRows",
    contactRows,
    artifactCaps.maximumBodyOrContactRowBytes,
  );
  await writeRows("sweepRows", sweepRows, artifactCaps.maximumSweepRowBytes);
  if (sweepCheckedCallCount !== metadata.executeStepCalls) {
    invalid(`Case ${index} sweep rows do not account for every executeStep call.`);
  }
  if (
    (metadata.executeStepCalls === 0 && metadata.batches !== 0) ||
    (metadata.executeStepCalls > 0 &&
      metadata.batches < Math.ceil(metadata.executeStepCalls / workloadCaps.maximumCallsPerBatch))
  ) invalid(`Case ${index} batches do not cover its executeStep calls.`);
  await writeCaseText("}");

  return {
    bodyRows: bodyRows.length,
    contactRows: contactRows.length,
    sweepRows: sweepRows.length,
    executeStepCalls: metadata.executeStepCalls,
    batches: metadata.batches,
    wallTimeMs: metadata.wallTimeMs,
  };
}

function checkCancelled(signal: WriteLoftCoarseMatrixInput["signal"]): void {
  if (signal.aborted) {
    throw makeCancelledError();
  }
}

function makeCancelledError(): LoftCoarseArtifactError {
  return new LoftCoarseArtifactError(
    "cancelled",
    "The coarse matrix artifact was cancelled.",
  );
}

export async function writeLoftCoarseMatrix({
  metadata,
  cases,
  sink,
  signal,
}: WriteLoftCoarseMatrixInput): Promise<LoftCoarseMatrixSummary> {
  const output = new JsonChunkWriter(
    sink,
    artifactCaps.maximumMatrixBytes,
    signal,
  );
  try {
    if (
      signal === null ||
      signal === undefined ||
      typeof signal !== "object" ||
      typeof signal.addEventListener !== "function" ||
      typeof signal.removeEventListener !== "function"
    ) {
      invalid("A cancellation signal is required.");
    }
    checkCancelled(signal);
    if (
      cases === null ||
      typeof cases !== "object" ||
      !(Symbol.asyncIterator in cases)
    ) {
      invalid("Cases must be an AsyncIterable.");
    }
    assertPlainObject(metadata, "Matrix metadata");
    validateMatrixMetadata(metadata);
    if (metadata.configHash !== (await hashCounterballConfig())) {
      invalid("Matrix configHash does not match the canonical configuration.");
    }
    const matrixMetadata = stringifyBounded(
      metadata,
      artifactCaps.maximumMatrixMetadataBytes,
      "Matrix metadata",
    );
    const aggregate = {
      caseCount: 0,
      bodyRows: 0,
      contactRows: 0,
      sweepRows: 0,
      executeStepCalls: 0,
      batches: 0,
      wallTimeMs: 0,
    };

    await output.writeText(`{"metadata":${matrixMetadata.json},"cases":[`);
    let iterator = 0;
    for await (const currentCase of cases) {
      checkCancelled(signal);
      if (iterator >= LOFT_COARSE_TUPLES.length) {
        invalid("The matrix contains more than 24 cases.");
      }
      const expectedTuple = requiredAt(LOFT_COARSE_TUPLES, iterator, "canonical matrix tuple");
      if (iterator > 0) await output.writeText(",");
      const counts = await writeCase(
        output,
        currentCase,
        metadata,
        expectedTuple,
        iterator,
      );
      aggregate.caseCount += 1;
      aggregate.bodyRows += counts.bodyRows;
      aggregate.contactRows += counts.contactRows;
      aggregate.sweepRows += counts.sweepRows;
      aggregate.executeStepCalls += counts.executeStepCalls;
      aggregate.batches += counts.batches;
      aggregate.wallTimeMs += counts.wallTimeMs;
      if (aggregate.bodyRows > artifactCaps.maximumBodyRowsMatrix) {
        overLimit("The matrix has too many body rows.");
      }
      if (aggregate.contactRows > artifactCaps.maximumContactsMatrix) {
        overLimit("The matrix has too many contact rows.");
      }
      if (
        aggregate.executeStepCalls > workloadCaps.maximumExecuteStepCallsMatrix ||
        aggregate.batches > workloadCaps.maximumBatchesMatrix ||
        aggregate.wallTimeMs > workloadCaps.maximumWallTimeMatrixMs
      ) {
        overLimit("The matrix exceeds an aggregate workload limit.");
      }
      iterator += 1;
    }
    if (aggregate.caseCount !== LOFT_COARSE_TUPLES.length) {
      invalid("The matrix must contain exactly 24 ordered cases.");
    }
    checkCancelled(signal);
    await output.writeText(`],"envelope":`);
    const envelope = stringifyBounded(
      makeEnvelope(aggregate),
      artifactCaps.maximumMatrixMetadataBytes,
      "Matrix envelope",
    );
    const bytesBeforeEnvelope = output.bytesWrittenAndBuffered;
    await output.writeText(envelope.json);
    await output.writeText("}");
    checkCancelled(signal);
    const matrixBytes = output.bytesWrittenAndBuffered;
    await output.flush();
    checkCancelled(signal);
    return {
      ...aggregate,
      matrixBytes,
      envelopeBytes: matrixBytes - bytesBeforeEnvelope - 1,
    };
  } catch (error) {
    try {
      await sink.abort(error);
    } catch (abortError) {
      throw new AggregateError(
        [error, abortError],
        "Matrix artifact failed and the byte sink also failed to abort.",
      );
    }
    throw error;
  }
}
