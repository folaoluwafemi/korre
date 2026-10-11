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
  COUNTERBALL_PROTOCOL_LIMITS,
  ENTITY_IDS,
  QUATERNION_NORM_TOLERANCE,
  parseMatchState,
  type BodyState,
  type CounterballConfig,
  type EntityId,
  type PlaybackFrame,
  type Quat,
  type SimulationError,
  type SimulationErrorCode,
  type SimulationRunOptions,
  type Vec3,
} from "@korre/game-protocol";
import fixtureJson from "../../../../tests/fixtures/counterball-v1.json";
import { createPlaybackSampler } from "./sampling.js";
import { initializeHavokRuntime } from "./havokRuntime.js";
import {
  createCounterballWorld,
  type CounterballWorld,
} from "./worldFactory.js";

const guard = COUNTERBALL_CONFIG_V1.diagnosticGuard;
const sweepGuard = createDiagnosticSweepGuard(COUNTERBALL_CONFIG_V1);
const geometry = COUNTERBALL_CONFIG_V1.geometry;
const gravityMagnitude = Math.abs(COUNTERBALL_CONFIG_V1.simulation.gravity.y);

export type BrowserDirectProbeContact = {
  step: number;
  timeMs: number;
  pair: [string, string];
  type: string;
  point: Vec3 | null;
};

/** Diagnostic-only result. This is deliberately not a wire or shot type. */
export type BrowserDirectProbeResult = {
  scope: "browser-direct-impulse-v1";
  fixtureId: string;
  matchId: string;
  capId: "home-6";
  impulse: Vec3;
  applicationPoint: Vec3;
  termination: "settled";
  durationMs: number;
  nominalTicks: number;
  actualExecuteStepCalls: number;
  actualSubstepDurationsSeconds: number[];
  batchSizes: number[];
  settledBodies: BodyState[];
  frames: PlaybackFrame[];
  contacts: BrowserDirectProbeContact[];
  guardObservations: {
    maximumShiftedMechanicalEnergy: number;
    maximumRestReferencedMechanicalEnergy: number;
    maximumRestHeightDrop: number;
    minimumApronClearance: number;
    minimumSurfaceClearance: number;
    maximumPointSweep: number;
    maximumRotationSweep: number;
    substepsPerTick: number;
  };
};

export type DiagnosticEnergyBody = {
  mass: number;
  inertiaUnitMass: Vec3;
  centerOfMassY: number;
  restY: number;
  linearVelocity: Vec3;
  angularVelocityPrincipal: Vec3;
};

export type DiagnosticSweepPlanBody = {
  mass: number;
  minimumUnitInertia: number;
  maximumUnitInertia: number;
  farthestPointRadius: number;
};

export type DiagnosticSweepGuard = {
  maxMechanicalEnergy: number;
  maxRestHeightDrop: number;
  supportApronMargin: number;
  maxPointSweepPerSubstep: number;
  maxRotationPerSubstep: number;
  maxSubstepsPerTick: number;
};

/** Combines the canonical outer guard and tunnelling subset without inventing limits. */
export function createDiagnosticSweepGuard(
  config: Pick<CounterballConfig, "diagnosticGuard">,
): DiagnosticSweepGuard {
  const selected = config.diagnosticGuard;
  return {
    maxMechanicalEnergy: selected.maxMechanicalEnergy,
    maxRestHeightDrop: selected.maxRestHeightDrop,
    supportApronMargin: selected.supportApronMargin,
    maxPointSweepPerSubstep: selected.tunnelling.maxPointSweepPerSubstep,
    maxRotationPerSubstep: selected.tunnelling.maxRotationPerSubstep,
    maxSubstepsPerTick: selected.tunnelling.maxSubstepsPerTick,
  };
}

export type DiagnosticSweepPlan = {
  substepsPerTick: number;
  substepSeconds: number;
  maximumPointSweep: number;
  maximumRotationSweep: number;
  bodies: Array<{
    linearSpeedBound: number;
    angularSpeedBound: number;
    pointSpeedBound: number;
  }>;
};

export type DiagnosticSweptBody = {
  centerOfMass: Vec3;
  originY: number;
  axisY: number;
  radius: number;
  height: number;
  farthestPointRadius: number;
  restY: number;
  linearSpeedBound: number;
  pointSpeedBound: number;
};

export type DiagnosticSweptLimits = {
  deltaSeconds: number;
  pitchWidth: number;
  pitchLength: number;
  supportApronMargin: number;
  surfaceUnderside: number;
  maxRestHeightDrop: number;
};

export type DiagnosticCleanupHooks = {
  removeObservers: readonly (() => void)[];
  replacementAttached: boolean;
  restoreSurface?: (() => void) | undefined;
  disposeReplacement?: (() => void) | undefined;
  disposeWorld: () => void;
};

const validMaterialCombineModes = new Set<number>([
  PhysicsMaterialCombineMode.GEOMETRIC_MEAN,
  PhysicsMaterialCombineMode.MINIMUM,
  PhysicsMaterialCombineMode.MAXIMUM,
  PhysicsMaterialCombineMode.ARITHMETIC_MEAN,
  PhysicsMaterialCombineMode.MULTIPLY,
]);

const simulationErrorCodes = new Set<SimulationErrorCode>([
  "initialization",
  "timeout",
  "cancelled",
  "invalidBody",
  "resourceLimit",
]);

function finiteVector(value: Vec3): boolean {
  return (
    Number.isFinite(value.x) &&
    Number.isFinite(value.y) &&
    Number.isFinite(value.z)
  );
}

function finiteQuaternion(value: Quat): boolean {
  if (
    !Number.isFinite(value.x) ||
    !Number.isFinite(value.y) ||
    !Number.isFinite(value.z) ||
    !Number.isFinite(value.w)
  ) {
    return false;
  }
  const norm = Math.hypot(value.x, value.y, value.z, value.w);
  return (
    Number.isFinite(norm) && Math.abs(norm - 1) <= QUATERNION_NORM_TOLERANCE
  );
}

function normalizedQuaternion(value: Quat, label: string): Quat {
  if (!finiteQuaternion(value)) {
    throw new RangeError(`${label} is non-finite or not normalized.`);
  }
  const norm = Math.hypot(value.x, value.y, value.z, value.w);
  return {
    x: value.x / norm,
    y: value.y / norm,
    z: value.z / norm,
    w: value.w / norm,
  };
}

function rotateVector(rotation: Quat, vector: Vec3): Vec3 {
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

function conjugateQuaternion(rotation: Quat): Quat {
  return {
    x: -rotation.x,
    y: -rotation.y,
    z: -rotation.z,
    w: rotation.w,
  };
}

function addVectors(left: Vec3, right: Vec3): Vec3 {
  return { x: left.x + right.x, y: left.y + right.y, z: left.z + right.z };
}

function subtractVectors(left: Vec3, right: Vec3): Vec3 {
  return { x: left.x - right.x, y: left.y - right.y, z: left.z - right.z };
}

function scaleVector(value: Vec3, scalar: number): Vec3 {
  return { x: value.x * scalar, y: value.y * scalar, z: value.z * scalar };
}

function dot(left: Vec3, right: Vec3): number {
  return left.x * right.x + left.y * right.y + left.z * right.z;
}

function cross(left: Vec3, right: Vec3): Vec3 {
  return {
    x: left.y * right.z - left.z * right.y,
    y: left.z * right.x - left.x * right.z,
    z: left.x * right.y - left.y * right.x,
  };
}

function assertFinitePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be finite and positive.`);
  }
}

/** Calculates the fail-closed energy reference whose potential is nonnegative inside the drop guard. */
export function computeDiagnosticShiftedEnergy(
  bodies: readonly DiagnosticEnergyBody[],
  gravity: number,
  maximumDrop: number,
): { kineticEnergy: number; shiftedMechanicalEnergy: number } {
  assertFinitePositive(gravity, "Gravity magnitude");
  if (!Number.isFinite(maximumDrop) || maximumDrop < 0) {
    throw new RangeError("Maximum COM drop must be finite and nonnegative.");
  }
  if (bodies.length !== ENTITY_IDS.length) {
    throw new RangeError(`Expected ${ENTITY_IDS.length} energy bodies.`);
  }

  let kineticEnergy = 0;
  let shiftedPotential = 0;
  for (const body of bodies) {
    assertFinitePositive(body.mass, "Body mass");
    if (
      !finiteVector(body.inertiaUnitMass) ||
      body.inertiaUnitMass.x <= 0 ||
      body.inertiaUnitMass.y <= 0 ||
      body.inertiaUnitMass.z <= 0 ||
      !Number.isFinite(body.centerOfMassY) ||
      !Number.isFinite(body.restY) ||
      !finiteVector(body.linearVelocity) ||
      !finiteVector(body.angularVelocityPrincipal)
    ) {
      throw new RangeError(
        "Energy input contains a non-finite or invalid value.",
      );
    }
    if (body.centerOfMassY < body.restY - maximumDrop) {
      throw new RangeError("Body COM is below its permitted rest-height drop.");
    }
    const linearSquared = dot(body.linearVelocity, body.linearVelocity);
    const omega = body.angularVelocityPrincipal;
    const inertia = body.inertiaUnitMass;
    const rotationalUnitEnergy =
      inertia.x * omega.x * omega.x +
      inertia.y * omega.y * omega.y +
      inertia.z * omega.z * omega.z;
    kineticEnergy += 0.5 * body.mass * (linearSquared + rotationalUnitEnergy);
    shiftedPotential +=
      body.mass * gravity * (body.centerOfMassY - (body.restY - maximumDrop));
  }

  const shiftedMechanicalEnergy = kineticEnergy + shiftedPotential;
  if (
    !Number.isFinite(kineticEnergy) ||
    !Number.isFinite(shiftedPotential) ||
    !Number.isFinite(shiftedMechanicalEnergy)
  ) {
    throw new RangeError("Energy calculation is non-finite.");
  }
  return { kineticEnergy, shiftedMechanicalEnergy };
}

/** Shares the exact hashed-energy comparison between the runner and pure tests. */
export function isDiagnosticShiftedEnergyWithinLimit(
  shiftedMechanicalEnergy: number,
  maximumMechanicalEnergy: number,
): boolean {
  assertFinitePositive(maximumMechanicalEnergy, "Energy ceiling");
  return (
    Number.isFinite(shiftedMechanicalEnergy) &&
    shiftedMechanicalEnergy <= maximumMechanicalEnergy
  );
}

/** Derives a conservative, diagnostic-only subdivision from the hashed guard and active native properties. */
export function deriveDiagnosticSweepPlan(
  bodies: readonly DiagnosticSweepPlanBody[],
  fixedStepSeconds: number,
  limits: DiagnosticSweepGuard,
): DiagnosticSweepPlan {
  assertFinitePositive(fixedStepSeconds, "Fixed tick duration");
  assertFinitePositive(limits.maxMechanicalEnergy, "Energy ceiling");
  assertFinitePositive(limits.maxPointSweepPerSubstep, "Point sweep limit");
  assertFinitePositive(limits.maxRotationPerSubstep, "Rotation limit");
  if (
    !Number.isSafeInteger(limits.maxSubstepsPerTick) ||
    limits.maxSubstepsPerTick < 1 ||
    bodies.length !== ENTITY_IDS.length
  ) {
    throw new RangeError("Substep guard or body list is invalid.");
  }

  let requiredSubsteps = 1;
  const bounds = bodies.map((body) => {
    assertFinitePositive(body.mass, "Body mass");
    assertFinitePositive(body.minimumUnitInertia, "Minimum unit inertia");
    assertFinitePositive(body.maximumUnitInertia, "Maximum unit inertia");
    assertFinitePositive(body.farthestPointRadius, "Farthest point radius");
    const linearSpeedBound = Math.sqrt(
      (2 * limits.maxMechanicalEnergy) / body.mass,
    );
    const angularSpeedBound = Math.sqrt(
      (2 * limits.maxMechanicalEnergy) / (body.mass * body.minimumUnitInertia),
    );
    const pointSpeedBound =
      linearSpeedBound + angularSpeedBound * body.farthestPointRadius;
    requiredSubsteps = Math.max(
      requiredSubsteps,
      Math.ceil(
        (pointSpeedBound * fixedStepSeconds) / limits.maxPointSweepPerSubstep,
      ),
      Math.ceil(
        (angularSpeedBound * fixedStepSeconds) / limits.maxRotationPerSubstep,
      ),
    );
    return { linearSpeedBound, angularSpeedBound, pointSpeedBound };
  });

  if (
    !Number.isSafeInteger(requiredSubsteps) ||
    requiredSubsteps > limits.maxSubstepsPerTick
  ) {
    throw new RangeError("Required Havok substeps exceed the hashed guard.");
  }
  const substepSeconds = fixedStepSeconds / requiredSubsteps;
  const maximumPointSweep = Math.max(
    ...bounds.map((body) => body.pointSpeedBound * substepSeconds),
  );
  const maximumRotationSweep = Math.max(
    ...bounds.map((body) => body.angularSpeedBound * substepSeconds),
  );
  if (
    !Number.isFinite(substepSeconds) ||
    maximumPointSweep > limits.maxPointSweepPerSubstep ||
    maximumRotationSweep > limits.maxRotationPerSubstep
  ) {
    throw new RangeError(
      "Derived substep does not satisfy the hashed sweep limits.",
    );
  }
  return {
    substepsPerTick: requiredSubsteps,
    substepSeconds,
    maximumPointSweep,
    maximumRotationSweep,
    bodies: bounds,
  };
}

/** Checks the complete orientation-independent movement envelope before one actual Havok call. */
export function checkDiagnosticSweptEnvelope(
  body: DiagnosticSweptBody,
  limits: DiagnosticSweptLimits,
): {
  apronClearance: number;
  surfaceClearance: number;
  restDropClearance: number;
} {
  const values = [
    body.centerOfMass.x,
    body.centerOfMass.y,
    body.centerOfMass.z,
    body.originY,
    body.axisY,
    body.radius,
    body.height,
    body.farthestPointRadius,
    body.restY,
    body.linearSpeedBound,
    body.pointSpeedBound,
    limits.deltaSeconds,
    limits.pitchWidth,
    limits.pitchLength,
    limits.supportApronMargin,
    limits.surfaceUnderside,
    limits.maxRestHeightDrop,
  ];
  if (values.some((value) => !Number.isFinite(value))) {
    throw new RangeError("Swept-envelope input is non-finite.");
  }
  if (
    body.radius <= 0 ||
    body.height <= 0 ||
    body.farthestPointRadius <= 0 ||
    body.linearSpeedBound < 0 ||
    body.pointSpeedBound < 0 ||
    limits.deltaSeconds <= 0 ||
    limits.pitchWidth <= 0 ||
    limits.pitchLength <= 0 ||
    limits.supportApronMargin < 0 ||
    limits.maxRestHeightDrop < 0 ||
    Math.abs(body.axisY) > 1
  ) {
    throw new RangeError(
      "Swept-envelope limits are outside their valid domain.",
    );
  }
  const pointSweep = body.pointSpeedBound * limits.deltaSeconds;
  const comDropSweep = body.linearSpeedBound * limits.deltaSeconds;
  const apronHalfWidth = limits.pitchWidth / 2 + limits.supportApronMargin;
  const apronHalfLength = limits.pitchLength / 2 + limits.supportApronMargin;
  const apronClearance = Math.min(
    apronHalfWidth -
      (Math.abs(body.centerOfMass.x) + body.farthestPointRadius + pointSweep),
    apronHalfLength -
      (Math.abs(body.centerOfMass.z) + body.farthestPointRadius + pointSweep),
  );
  const radialAxisSupport =
    body.radius * Math.sqrt(Math.max(0, 1 - body.axisY * body.axisY));
  const lowestPoint =
    body.originY - (body.height / 2) * Math.abs(body.axisY) - radialAxisSupport;
  const surfaceClearance = lowestPoint - pointSweep - limits.surfaceUnderside;
  const restDropClearance =
    body.centerOfMass.y -
    comDropSweep -
    (body.restY - limits.maxRestHeightDrop);
  if (apronClearance < 0 || surfaceClearance < 0 || restDropClearance < 0) {
    throw new RangeError("A full-collider swept guard would be crossed.");
  }
  return { apronClearance, surfaceClearance, restDropClearance };
}

/** Failure-safe cleanup ordering is separately testable without a fake physics result. */
export function cleanupDiagnosticResources(
  hooks: DiagnosticCleanupHooks,
): unknown[] {
  const errors: unknown[] = [];
  const attempt = (operation: (() => void) | undefined): boolean => {
    if (operation === undefined) return true;
    try {
      operation();
      return true;
    } catch (error) {
      errors.push(error);
      return false;
    }
  };

  for (const remove of [...hooks.removeObservers].reverse()) {
    attempt(remove);
  }

  const disposeReplacement = (): void => {
    attempt(hooks.disposeReplacement);
  };
  if (!hooks.replacementAttached) {
    disposeReplacement();
    attempt(hooks.disposeWorld);
    return errors;
  }

  const restored =
    hooks.restoreSurface === undefined
      ? (errors.push(
          new Error("Attached diagnostic shape has no restoration operation."),
        ),
        false)
      : attempt(hooks.restoreSurface);
  if (restored) {
    disposeReplacement();
    attempt(hooks.disposeWorld);
    return errors;
  }

  // On uncertain detach, the world must release all bodies before the shape.
  const worldDisposed = attempt(hooks.disposeWorld);
  if (worldDisposed) disposeReplacement();
  return errors;
}

type RuntimeBodyDefinition = {
  id: EntityId;
  radius: number;
  height: number;
  expectedMass: number;
};

type RuntimeBodyMetrics = {
  id: EntityId;
  body: PhysicsBody;
  shape: PhysicsShape;
  radius: number;
  height: number;
  mass: number;
  inertiaUnitMass: Vec3;
  inertiaOrientation: Quat;
  centerOfMassLocal: Vec3;
  farthestPointRadius: number;
  filterMembershipMask: number;
  filterCollideMask: number;
  restY: number;
};

type RuntimeBodySample = {
  state: BodyState;
  centerOfMass: Vec3;
  angularVelocityPrincipal: Vec3;
};

const bodyDefinitions = new Map<EntityId, RuntimeBodyDefinition>(
  ENTITY_IDS.map((id) => {
    const isButton = id === "button";
    return [
      id,
      {
        id,
        radius: isButton ? geometry.buttonRadius : geometry.capRadius,
        height: isButton ? geometry.buttonThickness : geometry.capHeight,
        expectedMass: isButton
          ? COUNTERBALL_CONFIG_V1.bodies.buttonMass
          : COUNTERBALL_CONFIG_V1.bodies.capMass,
      },
    ];
  }),
);

function diagnosticError(
  code: SimulationErrorCode,
  message: string,
  cause?: unknown,
): SimulationError {
  const error = new Error(
    message,
    cause === undefined ? undefined : { cause },
  ) as SimulationError;
  error.name = "BrowserDirectProbeError";
  Object.defineProperty(error, "code", { value: code, enumerable: true });
  return error;
}

function hasSimulationErrorCode(error: unknown): error is SimulationError {
  if (!(error instanceof Error)) return false;
  const code = (error as Partial<SimulationError>).code;
  return (
    typeof code === "string" &&
    simulationErrorCodes.has(code as SimulationErrorCode)
  );
}

/** Converts untyped failures at a known boundary while preserving typed failures. */
export function normalizeDiagnosticError(
  error: unknown,
  fallbackCode: SimulationErrorCode,
): SimulationError {
  if (hasSimulationErrorCode(error)) return error;
  const cause = error instanceof Error ? error : new Error(String(error));
  return diagnosticError(fallbackCode, cause.message, error);
}

export function resourceGuard<T>(operation: () => T): T {
  try {
    return operation();
  } catch (error) {
    throw normalizeDiagnosticError(error, "resourceLimit");
  }
}

export function errorWithCleanup(
  primary: unknown,
  cleanupErrors: readonly unknown[],
): SimulationError {
  const original = normalizeDiagnosticError(primary, "initialization");
  if (cleanupErrors.length === 0) return original;
  const combined: SimulationError = Object.assign(
    new AggregateError(
      [original, ...cleanupErrors],
      "Browser diagnostic failed and cleanup also reported errors.",
    ),
    { code: original.code },
  );
  return combined;
}

function fail(code: SimulationErrorCode, message: string): never {
  throw diagnosticError(code, message);
}

function parseFixture(): {
  fixtureId: string;
  state: ReturnType<typeof parseMatchState>;
} {
  const candidate: unknown = fixtureJson;
  if (
    candidate === null ||
    typeof candidate !== "object" ||
    !("id" in candidate) ||
    typeof candidate.id !== "string" ||
    !("states" in candidate) ||
    candidate.states === null ||
    typeof candidate.states !== "object" ||
    !("initial" in candidate.states)
  ) {
    fail("invalidBody", "Canonical diagnostic fixture has an invalid shape.");
  }
  return {
    fixtureId: candidate.id,
    state: parseMatchState(candidate.states.initial),
  };
}

function requireShape(body: PhysicsBody, id: EntityId): PhysicsShape {
  const shape = body.shape;
  if (shape === null || shape.type !== PhysicsShapeType.CYLINDER) {
    fail(
      "resourceLimit",
      `Body ${id} does not have the canonical cylinder shape.`,
    );
  }
  return shape;
}

function validateMaterial(material: PhysicsMaterial, label: string): void {
  const dynamicFriction = material.friction;
  const staticFriction = material.staticFriction;
  const restitution = material.restitution;
  if (
    typeof dynamicFriction !== "number" ||
    !Number.isFinite(dynamicFriction) ||
    dynamicFriction < 0 ||
    typeof staticFriction !== "number" ||
    !Number.isFinite(staticFriction) ||
    staticFriction < 0 ||
    typeof restitution !== "number" ||
    !Number.isFinite(restitution) ||
    restitution < 0 ||
    restitution > 1 ||
    typeof material.frictionCombine !== "number" ||
    !validMaterialCombineModes.has(material.frictionCombine) ||
    typeof material.restitutionCombine !== "number" ||
    !validMaterialCombineModes.has(material.restitutionCombine)
  ) {
    fail(
      "resourceLimit",
      `${label} has missing or out-of-domain native material values.`,
    );
  }
}

function isValidCollisionMask(value: number): boolean {
  return (
    Number.isSafeInteger(value) && value >= -0x80000000 && value <= 0xffffffff
  );
}

function shapesCanCollide(
  leftMembership: number,
  leftCollide: number,
  rightMembership: number,
  rightCollide: number,
): boolean {
  return (
    (leftMembership & rightCollide) !== 0 &&
    (rightMembership & leftCollide) !== 0
  );
}

function sameMaterial(left: PhysicsMaterial, right: PhysicsMaterial): boolean {
  return (
    left.friction === right.friction &&
    left.staticFriction === right.staticFriction &&
    left.restitution === right.restitution &&
    left.frictionCombine === right.frictionCombine &&
    left.restitutionCombine === right.restitutionCombine
  );
}

function readBodyMetrics(world: CounterballWorld): RuntimeBodyMetrics[] {
  const metrics: RuntimeBodyMetrics[] = [];
  for (const id of ENTITY_IDS) {
    const body = world.bodies.get(id);
    const definition = bodyDefinitions.get(id);
    if (body === undefined || definition === undefined) {
      fail("invalidBody", `Canonical dynamic body ${id} is missing.`);
    }
    const shape = requireShape(body, id);
    validateMaterial(shape.material, `Dynamic body ${id}`);
    const filterMembershipMask = shape.filterMembershipMask;
    const filterCollideMask = shape.filterCollideMask;
    if (
      !isValidCollisionMask(filterMembershipMask) ||
      !isValidCollisionMask(filterCollideMask)
    ) {
      fail(
        "resourceLimit",
        `Dynamic body ${id} has invalid native collision filters.`,
      );
    }
    const transform = body.transformNode;
    if (
      transform.parent !== null ||
      transform.scaling.x !== 1 ||
      transform.scaling.y !== 1 ||
      transform.scaling.z !== 1
    ) {
      fail(
        "resourceLimit",
        `Dynamic body ${id} has unsupported parent or scale geometry.`,
      );
    }
    const props = body.getMassProperties();
    if (
      props.centerOfMass === undefined ||
      props.inertia === undefined ||
      props.inertiaOrientation === undefined ||
      props.mass === undefined
    ) {
      fail(
        "resourceLimit",
        `Body ${id} has incomplete native mass properties.`,
      );
    }
    const nativeMass = props.mass;
    const nativeCenterOfMass = props.centerOfMass;
    const nativeInertia = props.inertia;
    const nativeInertiaOrientation = props.inertiaOrientation;
    const centerOfMassLocal = {
      x: nativeCenterOfMass.x,
      y: nativeCenterOfMass.y,
      z: nativeCenterOfMass.z,
    };
    const inertiaUnitMass = {
      x: nativeInertia.x,
      y: nativeInertia.y,
      z: nativeInertia.z,
    };
    const inertiaOrientation = normalizedQuaternion(
      {
        x: nativeInertiaOrientation.x,
        y: nativeInertiaOrientation.y,
        z: nativeInertiaOrientation.z,
        w: nativeInertiaOrientation.w,
      },
      `Body ${id} native inertia orientation`,
    );
    assertFinitePositive(nativeMass, `Body ${id} native mass`);
    if (
      !finiteVector(centerOfMassLocal) ||
      !finiteVector(inertiaUnitMass) ||
      inertiaUnitMass.x <= 0 ||
      inertiaUnitMass.y <= 0 ||
      inertiaUnitMass.z <= 0
    ) {
      fail("resourceLimit", `Body ${id} has unusable native mass properties.`);
    }
    const expectedMassTolerance =
      Number.EPSILON * Math.max(1, definition.expectedMass) * 64;
    if (
      Math.abs(nativeMass - definition.expectedMass) > expectedMassTolerance
    ) {
      fail(
        "resourceLimit",
        `Body ${id} native mass differs from its canonical configured mass.`,
      );
    }
    const farthestPointRadius =
      Math.hypot(
        centerOfMassLocal.x,
        centerOfMassLocal.y,
        centerOfMassLocal.z,
      ) + Math.hypot(definition.radius, definition.height / 2);
    if (!Number.isFinite(farthestPointRadius) || farthestPointRadius <= 0) {
      fail("resourceLimit", `Body ${id} has an invalid collider radius bound.`);
    }
    metrics.push({
      id,
      body,
      shape,
      radius: definition.radius,
      height: definition.height,
      mass: nativeMass,
      inertiaUnitMass,
      inertiaOrientation,
      centerOfMassLocal,
      farthestPointRadius,
      filterMembershipMask,
      filterCollideMask,
      restY: Number.NaN,
    });
  }
  const surface = world.staticBodies.find(
    (body) => body.transformNode.name === "counterball-surface",
  );
  const surfaceShape = surface?.shape;
  if (surfaceShape === null || surfaceShape === undefined) {
    fail("invalidBody", "Diagnostic support surface is missing its shape.");
  }
  const surfaceMembership = surfaceShape.filterMembershipMask;
  const surfaceCollide = surfaceShape.filterCollideMask;
  if (
    !isValidCollisionMask(surfaceMembership) ||
    !isValidCollisionMask(surfaceCollide)
  ) {
    fail(
      "resourceLimit",
      "Static support has invalid native collision filters.",
    );
  }
  for (const metric of metrics) {
    if (
      !shapesCanCollide(
        metric.filterMembershipMask,
        metric.filterCollideMask,
        surfaceMembership,
        surfaceCollide,
      )
    ) {
      fail(
        "resourceLimit",
        `Dynamic body ${metric.id} cannot collide with the support surface.`,
      );
    }
  }
  for (let first = 0; first < metrics.length; first += 1) {
    for (let second = first + 1; second < metrics.length; second += 1) {
      const left = metrics[first];
      const right = metrics[second];
      if (
        left === undefined ||
        right === undefined ||
        !shapesCanCollide(
          left.filterMembershipMask,
          left.filterCollideMask,
          right.filterMembershipMask,
          right.filterCollideMask,
        )
      ) {
        fail(
          "resourceLimit",
          "Canonical dynamic bodies have incompatible collision filters.",
        );
      }
    }
  }
  return metrics;
}

function readBodySamples(
  metrics: readonly RuntimeBodyMetrics[],
): RuntimeBodySample[] {
  return metrics.map((metric) => {
    const node = metric.body.transformNode;
    const rotationValue = node.rotationQuaternion;
    if (rotationValue === null) {
      fail("invalidBody", `Body ${metric.id} has no runtime quaternion.`);
    }
    const rotation = normalizedQuaternion(
      {
        x: rotationValue.x,
        y: rotationValue.y,
        z: rotationValue.z,
        w: rotationValue.w,
      },
      `Body ${metric.id} transform quaternion`,
    );
    const position = {
      x: node.position.x,
      y: node.position.y,
      z: node.position.z,
    };
    const linearVelocityValue = metric.body.getLinearVelocity();
    const angularVelocityValue = metric.body.getAngularVelocity();
    const linearVelocity = {
      x: linearVelocityValue.x,
      y: linearVelocityValue.y,
      z: linearVelocityValue.z,
    };
    const angularVelocity = {
      x: angularVelocityValue.x,
      y: angularVelocityValue.y,
      z: angularVelocityValue.z,
    };
    if (
      !finiteVector(position) ||
      !finiteVector(linearVelocity) ||
      !finiteVector(angularVelocity)
    ) {
      fail(
        "invalidBody",
        `Body ${metric.id} has non-finite transforms or velocity.`,
      );
    }
    const centerOfMassOffset = rotateVector(rotation, metric.centerOfMassLocal);
    const centerOfMass = addVectors(position, centerOfMassOffset);
    const principalWorld = normalizedQuaternion(
      Quaternion.FromArray([...Object.values(rotation)]).multiply(
        Quaternion.FromArray([
          metric.inertiaOrientation.x,
          metric.inertiaOrientation.y,
          metric.inertiaOrientation.z,
          metric.inertiaOrientation.w,
        ]),
      ),
      `Body ${metric.id} principal-axis orientation`,
    );
    const angularVelocityPrincipal = rotateVector(
      conjugateQuaternion(principalWorld),
      angularVelocity,
    );
    const state: BodyState = {
      id: metric.id,
      position,
      rotation,
      linearVelocity,
      angularVelocity,
    };
    return { state, centerOfMass, angularVelocityPrincipal };
  });
}

function energyInputs(
  metrics: readonly RuntimeBodyMetrics[],
  samples: readonly RuntimeBodySample[],
): DiagnosticEnergyBody[] {
  if (
    metrics.length !== samples.length ||
    metrics.some((metric) => !Number.isFinite(metric.restY))
  ) {
    fail("invalidBody", "Body energy references are incomplete.");
  }
  return metrics.map((metric, index) => {
    const sample = samples[index];
    if (sample === undefined)
      fail("invalidBody", `Missing body sample ${metric.id}.`);
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

function assertAtRestFixture(samples: readonly RuntimeBodySample[]): void {
  for (const sample of samples) {
    const { linearVelocity, angularVelocity } = sample.state;
    if (
      linearVelocity.x !== 0 ||
      linearVelocity.y !== 0 ||
      linearVelocity.z !== 0 ||
      angularVelocity.x !== 0 ||
      angularVelocity.y !== 0 ||
      angularVelocity.z !== 0
    ) {
      fail(
        "resourceLimit",
        "Accepted D01 input requires the at-rest canonical fixture.",
      );
    }
  }
}

function assertGlobalApronReach(
  metrics: readonly RuntimeBodyMetrics[],
  samples: readonly RuntimeBodySample[],
  plan: DiagnosticSweepPlan,
): void {
  for (let index = 0; index < metrics.length; index += 1) {
    const metric = metrics[index];
    const sample = samples[index];
    const bound = plan.bodies[index];
    if (metric === undefined || sample === undefined || bound === undefined) {
      fail("invalidBody", "Global apron bound is missing a body.");
    }
    if (
      Math.abs(sample.state.position.x) > geometry.pitchWidth / 2 ||
      Math.abs(sample.state.position.z) > geometry.pitchLength / 2
    ) {
      fail(
        "resourceLimit",
        `Body ${metric.id} starts outside the painted pitch.`,
      );
    }
    const reach =
      bound.linearSpeedBound *
        COUNTERBALL_CONFIG_V1.simulation.maxShotDurationSeconds +
      metric.farthestPointRadius;
    if (reach > guard.supportApronMargin) {
      fail(
        "resourceLimit",
        `Body ${metric.id} exceeds the hashed support apron reach.`,
      );
    }
  }
}

function crossPairName(event: IPhysicsCollisionEvent): [string, string] {
  const first = event.collider.transformNode.name;
  const second = event.collidedAgainst.transformNode.name;
  return first.localeCompare(second) <= 0 ? [first, second] : [second, first];
}

function finiteContactPoint(
  point: IPhysicsCollisionEvent["point"],
): Vec3 | null {
  if (
    point === null ||
    point === undefined ||
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    !Number.isFinite(point.z)
  ) {
    return null;
  }
  return { x: point.x, y: point.y, z: point.z };
}

function nowMs(): number {
  const value = globalThis.performance?.now();
  if (value === undefined || !Number.isFinite(value)) {
    fail("initialization", "A monotonic browser clock is unavailable.");
  }
  return value;
}

function jsonBytes(value: unknown): number {
  const json = JSON.stringify(value);
  if (json === undefined)
    fail("resourceLimit", "Diagnostic result did not serialize.");
  return new TextEncoder().encode(json).byteLength;
}

/** Runs the one accepted raw impulse in a fresh real-browser Havok/WASM world. */
export async function runBrowserDirectProbe(
  engine: AbstractEngine,
  options: SimulationRunOptions = {},
): Promise<BrowserDirectProbeResult> {
  const startedAt = nowMs();
  let world: CounterballWorld | undefined;
  let replacementShape: PhysicsShapeBox | undefined;
  let replacementAttached = false;
  let originalSurfaceShape: PhysicsShape | undefined;
  let surfaceBody: PhysicsBody | undefined;
  const removeObservers: Array<() => void> = [];
  let primaryError: unknown;
  let result: BrowserDirectProbeResult | undefined;
  const contacts: BrowserDirectProbeContact[] = [];
  const seenContacts = new Set<string>();
  let deferredCallbackError: SimulationError | undefined;
  let currentStep = 0;

  const checkLimits = (): void => {
    if (options.signal?.aborted === true) {
      fail("cancelled", "Browser direct diagnostic was cancelled.");
    }
    if (nowMs() - startedAt > guard.workload.maxWallTimeMs) {
      fail(
        "resourceLimit",
        "Browser direct diagnostic exceeded its wall-time limit.",
      );
    }
  };

  try {
    checkLimits();
    const fixture = parseFixture();
    if (
      fixture.fixtureId !== guard.fixtureId ||
      fixture.state.matchId !== guard.matchId
    ) {
      fail(
        "invalidBody",
        "Canonical fixture identity does not match the hashed diagnostic guard.",
      );
    }
    const havok = await initializeHavokRuntime();
    checkLimits();
    world = createCounterballWorld({
      engine,
      havok,
      state: fixture.state,
      gravity: new Vector3(
        COUNTERBALL_CONFIG_V1.simulation.gravity.x,
        COUNTERBALL_CONFIG_V1.simulation.gravity.y,
        COUNTERBALL_CONFIG_V1.simulation.gravity.z,
      ),
    });
    if (world.plugin.isSupported() !== true) {
      fail("initialization", "Pinned browser Havok plugin is not supported.");
    }
    const physicsEngine = world.scene.getPhysicsEngine();
    if (!(physicsEngine instanceof PhysicsEngineV2)) {
      fail(
        "initialization",
        "Diagnostic world did not create PhysicsEngineV2.",
      );
    }
    const physicsBodies = physicsEngine.getBodies();
    if (
      physicsBodies.length !== ENTITY_IDS.length + world.staticBodies.length ||
      world.staticBodies.length !== 7 ||
      [...world.bodies.values()].some((body) => !physicsBodies.includes(body))
    ) {
      fail(
        "invalidBody",
        "Havok world does not contain the canonical bodies and static frame.",
      );
    }

    surfaceBody = world.staticBodies.find(
      (body) => body.transformNode.name === "counterball-surface",
    );
    if (surfaceBody === undefined) {
      fail("invalidBody", "Canonical support surface is missing.");
    }
    originalSurfaceShape = surfaceBody.shape ?? undefined;
    if (
      originalSurfaceShape === undefined ||
      originalSurfaceShape.type !== PhysicsShapeType.BOX ||
      originalSurfaceShape.isTrigger
    ) {
      fail("resourceLimit", "Canonical support surface is not a solid box.");
    }
    const expectedSurfaceY = geometry.surfaceY - geometry.surfaceThickness / 2;
    const surfacePosition = surfaceBody.transformNode.position;
    const surfaceRotation = surfaceBody.transformNode.rotationQuaternion;
    const hasIdentityRotation =
      surfaceRotation === null
        ? surfaceBody.transformNode.rotation.x === 0 &&
          surfaceBody.transformNode.rotation.y === 0 &&
          surfaceBody.transformNode.rotation.z === 0
        : Number.isFinite(surfaceRotation.x) &&
          Number.isFinite(surfaceRotation.y) &&
          Number.isFinite(surfaceRotation.z) &&
          Number.isFinite(surfaceRotation.w) &&
          Math.abs(surfaceRotation.x) <= 1e-12 &&
          Math.abs(surfaceRotation.y) <= 1e-12 &&
          Math.abs(surfaceRotation.z) <= 1e-12 &&
          Math.abs(surfaceRotation.w - 1) <= 1e-12;
    if (
      surfacePosition.x !== 0 ||
      surfacePosition.y !== expectedSurfaceY ||
      surfacePosition.z !== 0 ||
      !hasIdentityRotation ||
      surfaceBody.transformNode.parent !== null ||
      surfaceBody.transformNode.scaling.x !== 1 ||
      surfaceBody.transformNode.scaling.y !== 1 ||
      surfaceBody.transformNode.scaling.z !== 1
    ) {
      fail(
        "resourceLimit",
        "Canonical surface transform differs from the open pitch slab.",
      );
    }
    const originalMaterial = originalSurfaceShape.material;
    validateMaterial(originalMaterial, "Canonical support surface");
    const originalMembership = originalSurfaceShape.filterMembershipMask;
    const originalCollide = originalSurfaceShape.filterCollideMask;
    const originalDensity = originalSurfaceShape.density;
    if (
      !Number.isSafeInteger(originalMembership) ||
      !isValidCollisionMask(originalMembership) ||
      !Number.isSafeInteger(originalCollide) ||
      !isValidCollisionMask(originalCollide) ||
      !Number.isFinite(originalDensity) ||
      originalDensity < 0
    ) {
      fail(
        "resourceLimit",
        "Canonical support surface filters or density are invalid.",
      );
    }
    const apronWidth = geometry.pitchWidth + 2 * guard.supportApronMargin;
    const apronLength = geometry.pitchLength + 2 * guard.supportApronMargin;
    if (
      !Number.isFinite(apronWidth) ||
      !Number.isFinite(apronLength) ||
      apronWidth !== 662 ||
      apronLength !== 670 ||
      geometry.surfaceThickness !== 0.2
    ) {
      fail(
        "resourceLimit",
        "Hashed diagnostic apron geometry is not the accepted 662 by 0.2 by 670 box.",
      );
    }
    replacementShape = new PhysicsShapeBox(
      Vector3.Zero(),
      Quaternion.Identity(),
      new Vector3(apronWidth, geometry.surfaceThickness, apronLength),
      world.scene,
    );
    replacementShape.material = { ...originalMaterial };
    replacementShape.filterMembershipMask = originalMembership;
    replacementShape.filterCollideMask = originalCollide;
    replacementShape.density = originalDensity;
    replacementShape.isTrigger = originalSurfaceShape.isTrigger;
    const replacementMaterial = world.plugin.getMaterial(replacementShape);
    validateMaterial(replacementMaterial, "Diagnostic support apron");
    if (
      replacementShape.type !== PhysicsShapeType.BOX ||
      replacementShape.isTrigger !== originalSurfaceShape.isTrigger ||
      replacementShape.filterMembershipMask !== originalMembership ||
      replacementShape.filterCollideMask !== originalCollide ||
      replacementShape.density !== originalDensity ||
      !sameMaterial(replacementMaterial, originalMaterial)
    ) {
      fail(
        "resourceLimit",
        "Diagnostic apron did not preserve the native surface material/filter.",
      );
    }
    replacementAttached = true;
    surfaceBody.shape = replacementShape;
    if (surfaceBody.shape !== replacementShape) {
      fail(
        "resourceLimit",
        "Diagnostic apron could not be attached to the surface body.",
      );
    }

    const metrics = readBodyMetrics(world);
    for (const staticBody of world.staticBodies) {
      const shape = staticBody.shape;
      if (shape === null)
        fail("invalidBody", "Static collider is missing its shape.");
      validateMaterial(
        shape.material,
        `Static body ${staticBody.transformNode.name}`,
      );
      const staticMembership = shape.filterMembershipMask;
      const staticCollide = shape.filterCollideMask;
      if (
        !isValidCollisionMask(staticMembership) ||
        !isValidCollisionMask(staticCollide)
      ) {
        fail(
          "resourceLimit",
          `Static body ${staticBody.transformNode.name} has invalid native collision filters.`,
        );
      }
      for (const metric of metrics) {
        if (
          !shapesCanCollide(
            metric.filterMembershipMask,
            metric.filterCollideMask,
            staticMembership,
            staticCollide,
          )
        ) {
          fail(
            "resourceLimit",
            `Dynamic body ${metric.id} cannot collide with static body ${staticBody.transformNode.name}.`,
          );
        }
      }
    }
    const initialSamples = readBodySamples(metrics);
    assertAtRestFixture(initialSamples);
    for (let index = 0; index < metrics.length; index += 1) {
      const metric = metrics[index];
      const sample = initialSamples[index];
      if (metric === undefined || sample === undefined) {
        fail("invalidBody", "Initial body state is incomplete.");
      }
      metric.restY = sample.centerOfMass.y;
    }
    const plan = resourceGuard(() =>
      deriveDiagnosticSweepPlan(
        metrics.map((metric) => ({
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
        })),
        COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds,
        sweepGuard,
      ),
    );
    assertGlobalApronReach(metrics, initialSamples, plan);
    const initialEnergy = resourceGuard(() =>
      computeDiagnosticShiftedEnergy(
        energyInputs(metrics, initialSamples),
        gravityMagnitude,
        guard.maxRestHeightDrop,
      ),
    );
    if (
      !isDiagnosticShiftedEnergyWithinLimit(
        initialEnergy.shiftedMechanicalEnergy,
        guard.maxMechanicalEnergy,
      )
    ) {
      fail(
        "resourceLimit",
        "Initial fixture exceeds the shifted mechanical-energy guard.",
      );
    }

    const selectedIndex = metrics.findIndex(
      (metric) => metric.id === guard.capId,
    );
    const selected = metrics[selectedIndex];
    const selectedSample = initialSamples[selectedIndex];
    if (selected === undefined || selectedSample === undefined) {
      fail("invalidBody", "Selected D01 cap is missing.");
    }
    const inputImpulse: Vec3 = { ...guard.impulse };
    const applicationPoint: Vec3 = { ...guard.applicationPoint };
    const linearDelta = scaleVector(inputImpulse, 1 / selected.mass);
    const lever = subtractVectors(
      applicationPoint,
      selectedSample.centerOfMass,
    );
    const angularImpulseWorld = cross(lever, inputImpulse);
    const bodyRotation = selectedSample.state.rotation;
    const principalWorld = normalizedQuaternion(
      Quaternion.FromArray([
        bodyRotation.x,
        bodyRotation.y,
        bodyRotation.z,
        bodyRotation.w,
      ]).multiply(
        Quaternion.FromArray([
          selected.inertiaOrientation.x,
          selected.inertiaOrientation.y,
          selected.inertiaOrientation.z,
          selected.inertiaOrientation.w,
        ]),
      ),
      "Selected cap principal-axis orientation",
    );
    const torquePrincipal = rotateVector(
      conjugateQuaternion(principalWorld),
      angularImpulseWorld,
    );
    const angularDeltaPrincipal = {
      x: torquePrincipal.x / (selected.mass * selected.inertiaUnitMass.x),
      y: torquePrincipal.y / (selected.mass * selected.inertiaUnitMass.y),
      z: torquePrincipal.z / (selected.mass * selected.inertiaUnitMass.z),
    };
    const predictedInputs = energyInputs(metrics, initialSamples).map(
      (item, index) =>
        index === selectedIndex
          ? {
              ...item,
              linearVelocity: addVectors(item.linearVelocity, linearDelta),
              angularVelocityPrincipal: addVectors(
                item.angularVelocityPrincipal,
                angularDeltaPrincipal,
              ),
            }
          : item,
    );
    const predictedImpulseEnergy = resourceGuard(() =>
      computeDiagnosticShiftedEnergy(
        predictedInputs,
        gravityMagnitude,
        guard.maxRestHeightDrop,
      ),
    );
    if (
      !isDiagnosticShiftedEnergyWithinLimit(
        predictedImpulseEnergy.shiftedMechanicalEnergy,
        guard.maxMechanicalEnergy,
      )
    ) {
      fail(
        "resourceLimit",
        "Accepted D01 impulse exceeds the energy guard for native mass properties.",
      );
    }

    const bodyNames = new Map<string, string>();
    for (const metric of metrics)
      bodyNames.set(metric.body.transformNode.name, metric.id);
    for (const body of world.staticBodies)
      bodyNames.set(body.transformNode.name, body.transformNode.name);
    let callbackFailure: SimulationError | undefined;
    const observeContact = (event: IPhysicsCollisionEvent): void => {
      try {
        const [first, second] = crossPairName(event);
        const firstId = bodyNames.get(first);
        const secondId = bodyNames.get(second);
        if (
          firstId === undefined ||
          secondId === undefined ||
          firstId === secondId
        ) {
          callbackFailure ??= diagnosticError(
            "invalidBody",
            "Collision event references an unknown or identical body.",
          );
          return;
        }
        const pair: [string, string] =
          firstId.localeCompare(secondId) <= 0
            ? [firstId, secondId]
            : [secondId, firstId];
        const eventType = String(event.type);
        const key = `${currentStep}|${pair[0]}|${pair[1]}|${eventType}`;
        if (seenContacts.has(key)) return;
        if (
          contacts.length >=
          COUNTERBALL_PROTOCOL_LIMITS.maxSimulationFactsPerShot
        ) {
          callbackFailure ??= diagnosticError(
            "resourceLimit",
            "Diagnostic contact facts exceed the protocol limit.",
          );
          return;
        }
        seenContacts.add(key);
        contacts.push({
          step: currentStep,
          timeMs: currentStep * plan.substepSeconds * 1_000,
          pair,
          type: eventType,
          point: finiteContactPoint(event.point),
        });
      } catch (error) {
        callbackFailure ??= diagnosticError(
          "invalidBody",
          "Collision callback could not be serialized.",
          error,
        );
      }
    };
    for (const body of world.bodies.values()) {
      body.setCollisionCallbackEnabled(true);
      const observable = body.getCollisionObservable();
      const observer = observable.add(observeContact);
      removeObservers.push(() => observable.remove(observer));
    }

    const selectedBody = selected.body;
    selectedBody.applyImpulse(
      new Vector3(inputImpulse.x, inputImpulse.y, inputImpulse.z),
      new Vector3(applicationPoint.x, applicationPoint.y, applicationPoint.z),
    );
    const postImpulseSamples = readBodySamples(metrics);
    const postImpulseEnergy = resourceGuard(() =>
      computeDiagnosticShiftedEnergy(
        energyInputs(metrics, postImpulseSamples),
        gravityMagnitude,
        guard.maxRestHeightDrop,
      ),
    );
    if (
      !isDiagnosticShiftedEnergyWithinLimit(
        postImpulseEnergy.shiftedMechanicalEnergy,
        guard.maxMechanicalEnergy,
      )
    ) {
      fail(
        "resourceLimit",
        "Applied D01 impulse exceeds the shifted energy guard.",
      );
    }

    const sampler = createPlaybackSampler(COUNTERBALL_CONFIG_V1);
    sampler.record(
      0,
      postImpulseSamples.map(({ state }) => state),
    );
    const fixedStep = COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds;
    const maximumTicks = Math.floor(
      COUNTERBALL_CONFIG_V1.simulation.maxShotDurationSeconds / fixedStep,
    );
    let maximumShiftedEnergy = postImpulseEnergy.shiftedMechanicalEnergy;
    let maximumRestReferencedEnergy =
      postImpulseEnergy.shiftedMechanicalEnergy -
      metrics.reduce(
        (sum, metric) =>
          sum + metric.mass * gravityMagnitude * guard.maxRestHeightDrop,
        0,
      );
    let maximumRestDrop = 0;
    let minimumApronClearance = Number.POSITIVE_INFINITY;
    let minimumSurfaceClearance = Number.POSITIVE_INFINITY;
    let maximumPointSweep = 0;
    let maximumRotationSweep = 0;
    let actualCalls = 0;
    let batchCalls = 0;
    const batchSizes: number[] = [];
    const actualSubstepDurationsSeconds: number[] = [];
    let quietTicks = 0;
    let settledBodies: BodyState[] | undefined;
    let nominalTicks = 0;
    const dropLimit = guard.maxRestHeightDrop;
    const minLinear = COUNTERBALL_CONFIG_V1.simulation.linearSettleThreshold;
    const minAngular = COUNTERBALL_CONFIG_V1.simulation.angularSettleThreshold;
    const quietWindowTicks = Math.ceil(
      COUNTERBALL_CONFIG_V1.simulation.settleWindowSeconds / fixedStep,
    );

    const checkObservedState = (
      samples: readonly RuntimeBodySample[],
    ): void => {
      const energy = resourceGuard(() =>
        computeDiagnosticShiftedEnergy(
          energyInputs(metrics, samples),
          gravityMagnitude,
          dropLimit,
        ),
      );
      if (
        !isDiagnosticShiftedEnergyWithinLimit(
          energy.shiftedMechanicalEnergy,
          guard.maxMechanicalEnergy,
        )
      ) {
        fail(
          "resourceLimit",
          "Observed shifted mechanical energy exceeds the hashed guard.",
        );
      }
      maximumShiftedEnergy = Math.max(
        maximumShiftedEnergy,
        energy.shiftedMechanicalEnergy,
      );
      const constantShift = metrics.reduce(
        (sum, metric) => sum + metric.mass * gravityMagnitude * dropLimit,
        0,
      );
      maximumRestReferencedEnergy = Math.max(
        maximumRestReferencedEnergy,
        energy.shiftedMechanicalEnergy - constantShift,
      );
      for (let index = 0; index < metrics.length; index += 1) {
        const metric = metrics[index];
        const sample = samples[index];
        const bound = plan.bodies[index];
        if (
          metric === undefined ||
          sample === undefined ||
          bound === undefined
        ) {
          fail(
            "invalidBody",
            "Observed guard state is missing a canonical body.",
          );
        }
        const drop = metric.restY - sample.centerOfMass.y;
        if (drop > dropLimit) {
          fail(
            "resourceLimit",
            `Body ${metric.id} exceeded the COM-drop guard.`,
          );
        }
        maximumRestDrop = Math.max(maximumRestDrop, drop);
        const axis = rotateVector(sample.state.rotation, { x: 0, y: 1, z: 0 });
        const lowestPoint =
          sample.state.position.y -
          (metric.height / 2) * Math.abs(axis.y) -
          metric.radius * Math.sqrt(Math.max(0, 1 - axis.y * axis.y));
        const actualSurfaceClearance =
          lowestPoint - (geometry.surfaceY - geometry.surfaceThickness);
        if (actualSurfaceClearance < 0) {
          fail(
            "resourceLimit",
            `Body ${metric.id} penetrated the support slab underside.`,
          );
        }
        const apronClearance = Math.min(
          geometry.pitchWidth / 2 +
            guard.supportApronMargin -
            (Math.abs(sample.centerOfMass.x) + metric.farthestPointRadius),
          geometry.pitchLength / 2 +
            guard.supportApronMargin -
            (Math.abs(sample.centerOfMass.z) + metric.farthestPointRadius),
        );
        if (apronClearance < 0) {
          fail(
            "resourceLimit",
            `Body ${metric.id} left the diagnostic support apron.`,
          );
        }
        minimumSurfaceClearance = Math.min(
          minimumSurfaceClearance,
          actualSurfaceClearance,
        );
        minimumApronClearance = Math.min(minimumApronClearance, apronClearance);
      }
    };

    for (let tick = 1; tick <= maximumTicks; tick += 1) {
      for (let substep = 0; substep < plan.substepsPerTick; substep += 1) {
        checkLimits();
        if (actualCalls >= guard.workload.maxTotalSubsteps) {
          fail(
            "resourceLimit",
            "Diagnostic exceeded the total actual-substep limit.",
          );
        }
        const before = readBodySamples(metrics);
        checkObservedState(before);
        for (let index = 0; index < metrics.length; index += 1) {
          const metric = metrics[index];
          const sample = before[index];
          const bound = plan.bodies[index];
          if (
            metric === undefined ||
            sample === undefined ||
            bound === undefined
          ) {
            fail("invalidBody", "Pre-step sweep is missing a canonical body.");
          }
          const axis = rotateVector(sample.state.rotation, {
            x: 0,
            y: 1,
            z: 0,
          });
          const lowestPoint =
            sample.state.position.y -
            (metric.height / 2) * Math.abs(axis.y) -
            metric.radius * Math.sqrt(Math.max(0, 1 - axis.y * axis.y));
          const clearances = resourceGuard(() =>
            checkDiagnosticSweptEnvelope(
              {
                centerOfMass: sample.centerOfMass,
                originY: sample.state.position.y,
                axisY: axis.y,
                radius: metric.radius,
                height: metric.height,
                farthestPointRadius: metric.farthestPointRadius,
                restY: metric.restY,
                linearSpeedBound: bound.linearSpeedBound,
                pointSpeedBound: bound.pointSpeedBound,
              },
              {
                deltaSeconds: plan.substepSeconds,
                pitchWidth: geometry.pitchWidth,
                pitchLength: geometry.pitchLength,
                supportApronMargin: guard.supportApronMargin,
                surfaceUnderside: geometry.surfaceY - geometry.surfaceThickness,
                maxRestHeightDrop: dropLimit,
              },
            ),
          );
          minimumApronClearance = Math.min(
            minimumApronClearance,
            clearances.apronClearance,
          );
          minimumSurfaceClearance = Math.min(
            minimumSurfaceClearance,
            clearances.surfaceClearance,
          );
          const rotationSweep = bound.angularSpeedBound * plan.substepSeconds;
          if (rotationSweep > guard.tunnelling.maxRotationPerSubstep) {
            fail(
              "resourceLimit",
              "Pre-step rotational sweep exceeds the hashed guard.",
            );
          }
          maximumRotationSweep = Math.max(maximumRotationSweep, rotationSweep);
        }
        const plannedPointSweep = plan.maximumPointSweep;
        if (plannedPointSweep > guard.tunnelling.maxPointSweepPerSubstep) {
          fail(
            "resourceLimit",
            "Pre-step point sweep exceeds the hashed guard.",
          );
        }
        maximumPointSweep = Math.max(maximumPointSweep, plannedPointSweep);
        currentStep = actualCalls + 1;
        world.plugin.executeStep(plan.substepSeconds, physicsBodies);
        actualCalls += 1;
        batchCalls += 1;
        actualSubstepDurationsSeconds.push(plan.substepSeconds);
        checkLimits();
        if (
          callbackFailure !== undefined ||
          deferredCallbackError !== undefined
        ) {
          throw callbackFailure ?? deferredCallbackError;
        }
        checkObservedState(readBodySamples(metrics));
        if (batchCalls >= guard.workload.maxBatchSubsteps) {
          batchSizes.push(batchCalls);
          batchCalls = 0;
          await new Promise<void>((resolve) =>
            globalThis.setTimeout(resolve, 0),
          );
          checkLimits();
        }
      }
      nominalTicks = tick;
      const tickSamples = readBodySamples(metrics);
      checkObservedState(tickSamples);
      const bodyStates = tickSamples.map(({ state }) => state);
      sampler.record(tick, bodyStates);
      const allQuiet = tickSamples.every(
        ({ state }) =>
          Math.hypot(
            state.linearVelocity.x,
            state.linearVelocity.y,
            state.linearVelocity.z,
          ) <= minLinear &&
          Math.hypot(
            state.angularVelocity.x,
            state.angularVelocity.y,
            state.angularVelocity.z,
          ) <= minAngular,
      );
      quietTicks = allQuiet ? quietTicks + 1 : 0;
      if (quietTicks >= quietWindowTicks) {
        settledBodies = bodyStates.map((body) => ({
          ...body,
          position: { ...body.position },
          rotation: { ...body.rotation },
          linearVelocity: { ...body.linearVelocity },
          angularVelocity: { ...body.angularVelocity },
        }));
        break;
      }
    }
    if (settledBodies === undefined) {
      fail(
        "timeout",
        "Diagnostic did not settle within the configured simulated duration.",
      );
    }
    if (batchCalls > 0) batchSizes.push(batchCalls);
    const frames = sampler.finish();
    if (
      frames.length > COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackFramesPerShot ||
      contacts.length > COUNTERBALL_PROTOCOL_LIMITS.maxSimulationFactsPerShot
    ) {
      fail(
        "resourceLimit",
        "Diagnostic output exceeds the canonical protocol limits.",
      );
    }
    const elapsedMs = nowMs() - startedAt;
    result = {
      scope: guard.scope,
      fixtureId: fixture.fixtureId,
      matchId: fixture.state.matchId,
      capId: guard.capId,
      impulse: inputImpulse,
      applicationPoint,
      termination: "settled",
      durationMs: elapsedMs,
      nominalTicks,
      actualExecuteStepCalls: actualCalls,
      actualSubstepDurationsSeconds,
      batchSizes,
      settledBodies,
      frames,
      contacts: contacts.map((contact) => ({
        ...contact,
        pair: [...contact.pair] as [string, string],
        point: contact.point === null ? null : { ...contact.point },
      })),
      guardObservations: {
        maximumShiftedMechanicalEnergy: maximumShiftedEnergy,
        maximumRestReferencedMechanicalEnergy: maximumRestReferencedEnergy,
        maximumRestHeightDrop: maximumRestDrop,
        minimumApronClearance,
        minimumSurfaceClearance,
        maximumPointSweep,
        maximumRotationSweep,
        substepsPerTick: plan.substepsPerTick,
      },
    };
    if (
      jsonBytes(result) > COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackSnapshotBytes
    ) {
      fail(
        "resourceLimit",
        "Serialized diagnostic output exceeds the one-megabyte protocol limit.",
      );
    }
    checkLimits();
  } catch (error) {
    primaryError = normalizeDiagnosticError(error, "initialization");
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
            if (surfaceBody.shape !== originalSurfaceShape) {
              throw new Error(
                "Original support shape restoration was not confirmed.",
              );
            }
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
  if (cleanupErrors.length > 0) {
    throw errorWithCleanup(
      diagnosticError(
        "initialization",
        "Browser direct diagnostic cleanup failed.",
      ),
      cleanupErrors,
    );
  }
  if (result === undefined) {
    fail("initialization", "Browser direct diagnostic ended without a result.");
  }
  return result;
}
