import {
  COUNTERBALL_PROTOCOL_LIMITS,
  ENTITY_IDS,
  QUATERNION_NORM_TOLERANCE,
  type CounterballConfig,
  type EntityId,
  type PlaybackTransform,
  type Quat,
  type SimulationFact,
  type Vec3,
} from "@korre/game-protocol";

export type PhysicsContactStart = {
  a: EntityId;
  b: EntityId;
  point: Vec3;
};

export type PhysicsStepObservation = {
  step: number;
  timeMs: number;
  bodies: readonly PlaybackTransform[];
  contactStarts: readonly PhysicsContactStart[];
};

type Boundary = {
  name: "left" | "right" | "homeEnd" | "awayEnd";
  axis: "x" | "z";
  plane: number;
  inwardSign: 1 | -1;
};

type Pose = PlaybackTransform;
type Observation = {
  step: number;
  timeMs: number;
  bodies: ReadonlyMap<EntityId, Pose>;
  contactStarts: readonly PhysicsContactStart[];
};

const entityOrder = new Map<EntityId, number>(
  ENTITY_IDS.map((id, index) => [id, index]),
);
const entityIdSet = new Set<string>(ENTITY_IDS);
const boundaryOrder = new Map<Boundary["name"], number>([
  ["left", 0],
  ["right", 1],
  ["homeEnd", 2],
  ["awayEnd", 3],
]);
const quaternionNormTolerance = QUATERNION_NORM_TOLERANCE;
const maximumFactCount = COUNTERBALL_PROTOCOL_LIMITS.maxSimulationFactsPerShot;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireFiniteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number.`);
  }
  return value;
}

function readVector(value: unknown, label: string): Vec3 {
  if (!isRecord(value)) {
    throw new TypeError(`${label} must be a vector.`);
  }

  return {
    x: requireFiniteNumber(value["x"], `${label}.x`),
    y: requireFiniteNumber(value["y"], `${label}.y`),
    z: requireFiniteNumber(value["z"], `${label}.z`),
  };
}

function readQuaternion(value: unknown, label: string): Quat {
  if (!isRecord(value)) {
    throw new TypeError(`${label} must be a quaternion.`);
  }

  const quaternion = {
    x: requireFiniteNumber(value["x"], `${label}.x`),
    y: requireFiniteNumber(value["y"], `${label}.y`),
    z: requireFiniteNumber(value["z"], `${label}.z`),
    w: requireFiniteNumber(value["w"], `${label}.w`),
  };
  const norm = Math.hypot(
    quaternion.x,
    quaternion.y,
    quaternion.z,
    quaternion.w,
  );
  if (
    norm === 0 ||
    !Number.isFinite(norm) ||
    Math.abs(norm - 1) > quaternionNormTolerance
  ) {
    throw new TypeError(`${label} must be normalized.`);
  }

  return {
    x: quaternion.x / norm,
    y: quaternion.y / norm,
    z: quaternion.z / norm,
    w: quaternion.w / norm,
  };
}

function normalizeBodies(value: unknown): ReadonlyMap<EntityId, Pose> {
  if (!Array.isArray(value) || value.length !== ENTITY_IDS.length) {
    throw new TypeError(
      `Each observation must contain exactly ${ENTITY_IDS.length} bodies.`,
    );
  }

  const byId = new Map<EntityId, Pose>();
  for (const candidate of value as readonly unknown[]) {
    if (!isRecord(candidate)) {
      throw new TypeError("Observed body must be an object.");
    }
    const rawId = candidate["id"];
    if (typeof rawId !== "string" || !entityIdSet.has(rawId)) {
      throw new TypeError("Observed body has a non-canonical entity ID.");
    }

    const id = rawId as EntityId;
    if (byId.has(id)) {
      throw new TypeError(`Observed body ID ${id} is duplicated.`);
    }
    byId.set(id, {
      id,
      position: readVector(candidate["position"], `Body ${id} position`),
      rotation: readQuaternion(candidate["rotation"], `Body ${id} rotation`),
    });
  }

  if (byId.size !== ENTITY_IDS.length) {
    throw new TypeError("Observation is missing a canonical body ID.");
  }
  return byId;
}

function normalizeContacts(value: unknown): PhysicsContactStart[] {
  if (!Array.isArray(value)) {
    throw new TypeError("Contact starts must be an array.");
  }

  return (value as readonly unknown[]).map((candidate) => {
    if (!isRecord(candidate)) {
      throw new TypeError("Contact start must be an object.");
    }
    const rawA = candidate["a"];
    const rawB = candidate["b"];
    if (
      typeof rawA !== "string" ||
      !entityIdSet.has(rawA) ||
      typeof rawB !== "string" ||
      !entityIdSet.has(rawB)
    ) {
      throw new TypeError("Contact start uses a non-canonical entity ID.");
    }
    if (rawA === rawB) {
      throw new TypeError("Contact start cannot refer to the same body twice.");
    }

    const a = rawA as EntityId;
    const b = rawB as EntityId;
    const aOrder = entityOrder.get(a);
    const bOrder = entityOrder.get(b);
    if (aOrder === undefined || bOrder === undefined) {
      throw new TypeError("Contact start uses a non-canonical entity ID.");
    }
    const point = readVector(candidate["point"], "Contact point");
    return aOrder < bOrder ? { a, b, point } : { a: b, b: a, point };
  });
}

function validateGeometry(config: Readonly<CounterballConfig>): void {
  const { geometry, simulation } = config;
  const positiveValues = [
    geometry.pitchWidth,
    geometry.pitchLength,
    geometry.capRadius,
    geometry.capHeight,
    geometry.buttonRadius,
    geometry.buttonThickness,
    geometry.goalWidth,
    geometry.goalHeight,
    geometry.goalFrameRadius,
    simulation.fixedStepSeconds,
    simulation.maxShotDurationSeconds,
  ];
  if (
    positiveValues.some((value) => !Number.isFinite(value) || value <= 0) ||
    !Number.isFinite(geometry.surfaceY) ||
    geometry.goalWidth <= geometry.goalFrameRadius * 2 ||
    geometry.goalHeight <= geometry.goalFrameRadius
  ) {
    throw new TypeError("Fact derivation requires valid finite geometry.");
  }
  if (!Number.isFinite(simulation.maxShotDurationSeconds * 1_000)) {
    throw new TypeError(
      "Fact derivation requires a finite millisecond duration.",
    );
  }
}

function normalizeObservations(
  value: unknown,
  config: Readonly<CounterballConfig>,
): Observation[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError(
      "At least the initial physics observation is required.",
    );
  }

  const maximumTimeMs = config.simulation.maxShotDurationSeconds * 1_000;
  const observations: Observation[] = [];
  const candidates = value as readonly unknown[];
  let previousStep = -1;
  let previousTimeMs = -1;

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    if (!isRecord(candidate)) {
      throw new TypeError("Physics observation must be an object.");
    }

    const step = candidate["step"];
    const timeMs = candidate["timeMs"];
    if (!Number.isSafeInteger(step) || (step as number) < 0) {
      throw new TypeError(
        "Observation step must be a non-negative safe integer.",
      );
    }
    if (
      typeof timeMs !== "number" ||
      !Number.isFinite(timeMs) ||
      timeMs < 0 ||
      timeMs > maximumTimeMs
    ) {
      throw new TypeError(
        "Observation time must be within the finite shot duration.",
      );
    }
    if (index === 0) {
      if (step !== 0 || timeMs !== 0) {
        throw new TypeError(
          "The initial observation must be step 0 at time 0.",
        );
      }
    } else if ((step as number) < previousStep || timeMs <= previousTimeMs) {
      throw new TypeError(
        "Observation steps must not decrease and times must increase.",
      );
    }

    const bodies = normalizeBodies(candidate["bodies"]);
    const contactStarts = normalizeContacts(candidate["contactStarts"]);
    if (index === 0 && contactStarts.length !== 0) {
      throw new TypeError(
        "The initial observation cannot contain contact starts.",
      );
    }

    observations.push({
      step: step as number,
      timeMs,
      bodies,
      contactStarts,
    });
    previousStep = step as number;
    previousTimeMs = timeMs;
  }

  return observations;
}

function makeBoundaries(config: Readonly<CounterballConfig>): Boundary[] {
  const { pitchWidth, pitchLength } = config.geometry;
  return [
    {
      name: "left",
      axis: "x",
      plane: -pitchWidth / 2,
      inwardSign: 1,
    },
    {
      name: "right",
      axis: "x",
      plane: pitchWidth / 2,
      inwardSign: -1,
    },
    {
      name: "homeEnd",
      axis: "z",
      plane: -pitchLength / 2,
      inwardSign: 1,
    },
    {
      name: "awayEnd",
      axis: "z",
      plane: pitchLength / 2,
      inwardSign: -1,
    },
  ];
}

function dimensionsFor(
  id: EntityId,
  config: Readonly<CounterballConfig>,
): { radius: number; height: number } {
  if (id === "button") {
    return {
      radius: config.geometry.buttonRadius,
      height: config.geometry.buttonThickness,
    };
  }
  return {
    radius: config.geometry.capRadius,
    height: config.geometry.capHeight,
  };
}

function verticalAxis(rotation: Quat): Vec3 {
  const { x, y, z, w } = rotation;
  return {
    x: 2 * (x * y - w * z),
    y: 1 - 2 * (x * x + z * z),
    z: 2 * (y * z + w * x),
  };
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function normalized(value: Vec3): Vec3 | undefined {
  const length = Math.hypot(value.x, value.y, value.z);
  if (length === 0) {
    return undefined;
  }
  return { x: value.x / length, y: value.y / length, z: value.z / length };
}

function supportExtent(
  pose: Pose,
  direction: Vec3,
  radius: number,
  height: number,
): number {
  const axis = normalized(verticalAxis(pose.rotation));
  if (axis === undefined) {
    throw new TypeError("Cylinder support axis could not be normalized.");
  }
  const axialProjection = Math.max(-1, Math.min(1, dot(axis, direction)));
  const radial = cross(axis, direction);
  const radialProjection = Math.hypot(radial.x, radial.y, radial.z);
  return radius * radialProjection + (height / 2) * Math.abs(axialProjection);
}

function supportPoint(
  pose: Pose,
  direction: Vec3,
  radius: number,
  height: number,
): Vec3 {
  const axis = normalized(verticalAxis(pose.rotation));
  if (axis === undefined) {
    throw new TypeError("Cylinder support axis could not be normalized.");
  }
  const axialProjection = Math.max(-1, Math.min(1, dot(axis, direction)));
  // (axis × direction) × axis is the in-plane component of direction. It
  // avoids subtracting nearly equal vectors when the cylinder is aligned.
  const radial = normalized(cross(cross(axis, direction), axis));
  const axialSign = Math.sign(axialProjection);
  return {
    x:
      pose.position.x +
      (height / 2) * axialSign * axis.x +
      radius * (radial?.x ?? 0),
    y:
      pose.position.y +
      (height / 2) * axialSign * axis.y +
      radius * (radial?.y ?? 0),
    z:
      pose.position.z +
      (height / 2) * axialSign * axis.z +
      radius * (radial?.z ?? 0),
  };
}

function inwardNormal(boundary: Boundary): Vec3 {
  return boundary.axis === "x"
    ? { x: boundary.inwardSign, y: 0, z: 0 }
    : { x: 0, y: 0, z: boundary.inwardSign };
}

function signedCenterDistance(pose: Pose, boundary: Boundary): number {
  const coordinate = pose.position[boundary.axis];
  return boundary.inwardSign * (coordinate - boundary.plane);
}

function leadingClearance(
  pose: Pose,
  boundary: Boundary,
  dimensions: { radius: number; height: number },
): number {
  return (
    signedCenterDistance(pose, boundary) -
    supportExtent(
      pose,
      inwardNormal(boundary),
      dimensions.radius,
      dimensions.height,
    )
  );
}

function trailingClearance(
  pose: Pose,
  boundary: Boundary,
  dimensions: { radius: number; height: number },
): number {
  return (
    signedCenterDistance(pose, boundary) +
    supportExtent(
      pose,
      inwardNormal(boundary),
      dimensions.radius,
      dimensions.height,
    )
  );
}

function isWhollyInsidePitch(
  pose: Pose,
  boundaries: readonly Boundary[],
  dimensions: { radius: number; height: number },
): boolean {
  return boundaries.every(
    (boundary) => leadingClearance(pose, boundary, dimensions) >= 0,
  );
}

type ShortestArcEndpoints = { cosine: number; end: Quat };

function shortestArcEndpoints(a: Quat, b: Quat): ShortestArcEndpoints {
  let bx = b.x;
  let by = b.y;
  let bz = b.z;
  let bw = b.w;
  let cosine = a.x * bx + a.y * by + a.z * bz + a.w * bw;
  if (cosine < 0) {
    cosine = -cosine;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }

  return { cosine, end: { x: bx, y: by, z: bz, w: bw } };
}

function multiplyQuaternions(a: Quat, b: Quat): Quat {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  };
}

function interpolateQuaternion(a: Quat, b: Quat, amount: number): Quat {
  const { cosine, end } = shortestArcEndpoints(a, b);

  let leftWeight: number;
  let rightWeight: number;
  if (cosine > 0.9995) {
    leftWeight = 1 - amount;
    rightWeight = amount;
  } else {
    const angle = Math.acos(Math.max(-1, Math.min(1, cosine)));
    const sine = Math.sin(angle);
    leftWeight = Math.sin((1 - amount) * angle) / sine;
    rightWeight = Math.sin(amount * angle) / sine;
  }

  const result = {
    x: leftWeight * a.x + rightWeight * end.x,
    y: leftWeight * a.y + rightWeight * end.y,
    z: leftWeight * a.z + rightWeight * end.z,
    w: leftWeight * a.w + rightWeight * end.w,
  };
  const norm = Math.hypot(result.x, result.y, result.z, result.w);
  return {
    x: result.x / norm,
    y: result.y / norm,
    z: result.z / norm,
    w: result.w / norm,
  };
}

function interpolatePose(a: Pose, b: Pose, amount: number): Pose {
  return {
    id: a.id,
    position: {
      x: a.position.x + (b.position.x - a.position.x) * amount,
      y: a.position.y + (b.position.y - a.position.y) * amount,
      z: a.position.z + (b.position.z - a.position.z) * amount,
    },
    rotation: interpolateQuaternion(a.rotation, b.rotation, amount),
  };
}

function cylinderAxisAngularTravelBound(a: Quat, b: Quat): number {
  const { cosine, end } = shortestArcEndpoints(a, b);
  if (a.x === end.x && a.y === end.y && a.z === end.z && a.w === end.w) {
    return 0;
  }
  const selectedCosine = Math.max(0, Math.min(1, cosine));
  const relative = multiplyQuaternions(end, {
    x: -a.x,
    y: -a.y,
    z: -a.z,
    w: a.w,
  });
  const relativeNorm = Math.hypot(
    relative.x,
    relative.y,
    relative.z,
    relative.w,
  );
  if (relativeNorm === 0 || !Number.isFinite(relativeNorm)) {
    throw new TypeError("Cylinder rotation axis bound is not finite.");
  }

  const relativeVectorLength =
    Math.hypot(relative.x, relative.y, relative.z) / relativeNorm;

  const angleFromDot = 2 * Math.acos(selectedCosine);
  const angleFromRelative =
    2 * Math.atan2(relativeVectorLength, Math.abs(relative.w) / relativeNorm);
  const theta = Math.max(angleFromDot, angleFromRelative);
  if (!Number.isFinite(theta) || theta < 0 || theta > Math.PI + 1e-12) {
    throw new TypeError("Cylinder rotation angle bound is not finite.");
  }

  // Add an outward allowance for dot/product/trigonometric roundoff before
  // applying the monotone angular-speed factor. Exact equivalent endpoints
  // returned zero above; a numerically tiny, non-identical arc stays bounded.
  const rotationMargin = 64 * Number.EPSILON * Math.max(1, theta);
  const thetaUpper = Math.min(Math.PI, theta + rotationMargin);
  const nlerp = cosine > 0.9995;
  const angularSpeed = nlerp ? 4 * Math.tan(thetaUpper / 4) : thetaUpper;
  if (!Number.isFinite(angularSpeed) || angularSpeed < 0) {
    throw new TypeError("Cylinder angular speed bound is not finite.");
  }

  // The world relative quaternion is end * inverse(start), so its vector
  // part supplies the selected world-axis direction. If that direction is
  // numerically uncertain, use the full physical angular speed (s <= 1).
  if (relativeVectorLength <= 1e-8) {
    return angularSpeed + 64 * Number.EPSILON * Math.max(1, angularSpeed);
  }

  const relativeVectorNorm = Math.hypot(relative.x, relative.y, relative.z);
  const rotationAxis = {
    x: relative.x / relativeVectorNorm,
    y: relative.y / relativeVectorNorm,
    z: relative.z / relativeVectorNorm,
  };
  const initialAxis = normalized(verticalAxis(a));
  if (initialAxis === undefined) {
    throw new TypeError("Initial cylinder axis could not be bounded finitely.");
  }
  const axisSine = Math.hypot(
    rotationAxis.y * initialAxis.z - rotationAxis.z * initialAxis.y,
    rotationAxis.z * initialAxis.x - rotationAxis.x * initialAxis.z,
    rotationAxis.x * initialAxis.y - rotationAxis.y * initialAxis.x,
  );
  if (!Number.isFinite(axisSine)) {
    throw new TypeError("Cylinder symmetry-axis travel is non-finite.");
  }

  // Division by the relative vector length amplifies floating-point error on
  // small rotations. Inflate |u x v0| by a conservative operation-count
  // allowance; near-degenerate axes took the full-angle fallback above.
  const axisSineMargin =
    (128 * Number.EPSILON) / relativeVectorLength + 64 * Number.EPSILON;
  const axisSineUpper = Math.min(1, axisSine + axisSineMargin);
  const travel = angularSpeed * axisSineUpper;
  if (!Number.isFinite(travel) || travel < 0) {
    throw new TypeError("Cylinder symmetry-axis travel could not be bounded.");
  }
  return travel + 64 * Number.EPSILON * Math.max(1, angularSpeed);
}

function supportAngularRadius(dimensions: {
  radius: number;
  height: number;
}): number {
  // The accepted piecewise derivative bound for finite-cylinder support is
  // max(radius, half-height), including its one-sided limits at support ties.
  return Math.max(dimensions.radius, dimensions.height / 2);
}

function clearanceLipschitzBound(
  centerTravel: number,
  dimensions: { radius: number; height: number },
  angularTravel: number,
): number {
  const bound =
    centerTravel + supportAngularRadius(dimensions) * angularTravel;
  if (!Number.isFinite(bound) || bound < 0) {
    throw new TypeError("Whole-body clearance could not be bounded finitely.");
  }
  if (bound === 0) {
    return 0;
  }
  const outwardBound = bound + 64 * Number.EPSILON * Math.max(1, bound);
  if (!Number.isFinite(outwardBound)) {
    throw new TypeError("Whole-body clearance could not be bounded finitely.");
  }
  return outwardBound;
}

function supportClearanceLipschitz(
  before: Pose,
  after: Pose,
  boundary: Boundary,
  dimensions: { radius: number; height: number },
): number {
  return clearanceLipschitzBound(
    Math.abs(after.position[boundary.axis] - before.position[boundary.axis]),
    dimensions,
    cylinderAxisAngularTravelBound(before.rotation, after.rotation),
  );
}

function refineFirstDescendingBracket(
  evaluate: (amount: number) => number,
  start: number,
  end: number,
): number {
  let low = start;
  let high = end;
  for (let iteration = 0; iteration < 36; iteration += 1) {
    const middle = (low + high) / 2;
    if (evaluate(middle) >= 0) {
      low = middle;
    } else {
      high = middle;
    }
  }
  return (low + high) / 2;
}

function findDescendingRoot(
  evaluate: (amount: number) => number,
  start: number,
  end: number,
  lipschitzBound: number,
): number | undefined {
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    !Number.isFinite(lipschitzBound) ||
    lipschitzBound < 0
  ) {
    throw new TypeError("Crossing clearance could not be bounded finitely.");
  }
  if (start < 0) {
    throw new TypeError("Crossing interval starts beyond the full-body exit.");
  }

  const maximumDepth = 22;
  const maximumNodes = 65_536;
  let visitedNodes = 0;
  const search = (
    low: number,
    lowValue: number,
    high: number,
    highValue: number,
    depth: number,
  ): number | undefined => {
    visitedNodes += 1;
    if (visitedNodes > maximumNodes) {
      throw new RangeError(
        "Whole-body crossing search exceeded its bounded work limit.",
      );
    }
    const middle = (low + high) / 2;
    const middleValue = evaluate(middle);
    if (!Number.isFinite(middleValue)) {
      throw new TypeError("Crossing clearance became non-finite.");
    }

    // Signed centre distance is linear. The accepted finite-cylinder support
    // bound multiplies symmetry-axis travel by max(radius, half-height).
    // This lower bound proves intervals cannot contain a hidden exit.
    const lowerBound = middleValue - (lipschitzBound * (high - low)) / 2;
    if (lowerBound >= 0) {
      return undefined;
    }

    if (depth >= maximumDepth) {
      if (lowValue >= 0 && middleValue < 0) {
        return refineFirstDescendingBracket(evaluate, low, middle);
      }
      if (middleValue >= 0 && highValue < 0) {
        return refineFirstDescendingBracket(evaluate, middle, high);
      }
      throw new RangeError(
        "Could not establish a bounded whole-body crossing in this interval.",
      );
    }

    const leftRoot = search(low, lowValue, middle, middleValue, depth + 1);
    if (leftRoot !== undefined) {
      return leftRoot;
    }
    return search(middle, middleValue, high, highValue, depth + 1);
  };

  return search(0, start, 1, end, 0);
}

type GoalMouthClearances = {
  left: number;
  right: number;
  bottom: number;
  top: number;
};

type GoalPassageState = { active: boolean; clear: boolean };

function goalMouthRoundoffAllowance(
  before: Pose,
  after: Pose,
  config: Readonly<CounterballConfig>,
): number {
  const { geometry } = config;
  const scale = Math.max(
    1,
    Math.abs(geometry.goalWidth / 2),
    Math.abs(geometry.goalFrameRadius),
    Math.abs(geometry.goalHeight),
    Math.abs(geometry.surfaceY),
    Math.abs(before.position.x),
    Math.abs(after.position.x),
    Math.abs(before.position.y),
    Math.abs(after.position.y),
    Math.abs(geometry.buttonRadius),
    Math.abs(geometry.buttonThickness / 2),
  );
  return 64 * Number.EPSILON * scale;
}

function goalMouthClearance(
  pose: Pose,
  config: Readonly<CounterballConfig>,
): GoalMouthClearances {
  const { geometry } = config;
  const { radius, height } = dimensionsFor("button", config);
  const horizontalHalf = geometry.goalWidth / 2 - geometry.goalFrameRadius;
  const horizontalSupport = supportExtent(
    pose,
    { x: 1, y: 0, z: 0 },
    radius,
    height,
  );
  const verticalSupport = supportExtent(
    pose,
    { x: 0, y: 1, z: 0 },
    radius,
    height,
  );
  const crossbarUnderside =
    geometry.surfaceY + geometry.goalHeight - geometry.goalFrameRadius;

  return {
    left: horizontalHalf + pose.position.x - horizontalSupport,
    right: horizontalHalf - pose.position.x - horizontalSupport,
    bottom: pose.position.y - verticalSupport - geometry.surfaceY,
    top: crossbarUnderside - pose.position.y - verticalSupport,
  };
}

function provesGoalPassageClear(
  before: Pose,
  after: Pose,
  start: number,
  end: number,
  config: Readonly<CounterballConfig>,
): boolean {
  if (end < start) {
    return false;
  }

  const { radius, height } = dimensionsFor("button", config);
  const angularTravel = cylinderAxisAngularTravelBound(
    before.rotation,
    after.rotation,
  );
  const dimensions = { radius, height };
  const roundoffAllowance = goalMouthRoundoffAllowance(
    before,
    after,
    config,
  );
  const horizontalLipschitz = clearanceLipschitzBound(
    Math.abs(after.position.x - before.position.x),
    dimensions,
    angularTravel,
  );
  const verticalLipschitz = clearanceLipschitzBound(
    Math.abs(after.position.y - before.position.y),
    dimensions,
    angularTravel,
  );
  const maximumDepth = 12;

  // The passage starts when the leading support reaches the goal plane and
  // ends when the trailing support clears it. These clearance bounds cover
  // every interpolated orientation in between; unresolved intervals fail
  // closed instead of inheriting a previously clear sample.
  const prove = (low: number, high: number, depth: number): boolean => {
    const middle = (low + high) / 2;
    const clearance = goalMouthClearance(
      interpolatePose(before, after, middle),
      config,
    );
    if (
      !Object.values(clearance).every(Number.isFinite) ||
      clearance.left <= roundoffAllowance ||
      clearance.right <= roundoffAllowance ||
      clearance.top <= roundoffAllowance ||
      clearance.bottom < 0
    ) {
      return false;
    }

    const halfWidth = (high - low) / 2;
    if (
      clearance.left - horizontalLipschitz * halfWidth > roundoffAllowance &&
      clearance.right - horizontalLipschitz * halfWidth > roundoffAllowance &&
      clearance.top - verticalLipschitz * halfWidth > roundoffAllowance &&
      clearance.bottom - verticalLipschitz * halfWidth >= 0
    ) {
      return true;
    }
    if (depth >= maximumDepth) {
      return false;
    }
    return prove(low, middle, depth + 1) && prove(middle, high, depth + 1);
  };

  return prove(start, end, 0);
}

function crossingForInterval(
  id: EntityId,
  boundary: Boundary,
  left: Observation,
  right: Observation,
  config: Readonly<CounterballConfig>,
  goalMouthClear: boolean,
): SimulationFact | undefined {
  const before = left.bodies.get(id);
  const after = right.bodies.get(id);
  if (before === undefined || after === undefined) {
    throw new TypeError(`Observation is missing body ${id}.`);
  }
  const dimensions = dimensionsFor(id, config);
  const clearanceLipschitz = supportClearanceLipschitz(
    before,
    after,
    boundary,
    dimensions,
  );
  const fraction = findDescendingRoot(
    (amount) =>
      trailingClearance(
        interpolatePose(before, after, amount),
        boundary,
        dimensions,
      ),
    trailingClearance(before, boundary, dimensions),
    trailingClearance(after, boundary, dimensions),
    clearanceLipschitz,
  );
  if (fraction === undefined) {
    return undefined;
  }

  const crossingPose = interpolatePose(before, after, fraction);
  let kind: "goal" | "out" = "out";
  if (
    id === "button" &&
    (boundary.name === "homeEnd" || boundary.name === "awayEnd") &&
    goalMouthClear
  ) {
    kind = "goal";
  }

  const point = supportPoint(
    crossingPose,
    inwardNormal(boundary),
    dimensions.radius,
    dimensions.height,
  );
  return {
    type: "crossing",
    step: right.step,
    timeMs: left.timeMs + (right.timeMs - left.timeMs) * fraction,
    entity: id,
    boundary: boundary.name,
    point,
    kind,
  };
}

function compareNumber(a: number, b: number): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function compareEntity(a: EntityId, b: EntityId): number {
  return compareNumber(entityOrder.get(a) ?? 0, entityOrder.get(b) ?? 0);
}

function compareEntityIdLexically(a: EntityId, b: EntityId): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function compareFacts(a: SimulationFact, b: SimulationFact): number {
  const stepOrder = compareNumber(a.step, b.step);
  if (stepOrder !== 0) {
    return stepOrder;
  }

  const typeOrder = compareNumber(
    a.type === "contact" ? 0 : 1,
    b.type === "contact" ? 0 : 1,
  );
  if (typeOrder !== 0) {
    return typeOrder;
  }

  const timeOrder = compareNumber(a.timeMs, b.timeMs);
  if (timeOrder !== 0) {
    return timeOrder;
  }

  if (a.type === "contact" && b.type === "contact") {
    return (
      compareEntityIdLexically(a.a, b.a) ||
      compareEntityIdLexically(a.b, b.b) ||
      compareNumber(a.point.x, b.point.x) ||
      compareNumber(a.point.y, b.point.y) ||
      compareNumber(a.point.z, b.point.z)
    );
  }
  if (a.type === "crossing" && b.type === "crossing") {
    return (
      compareEntity(a.entity, b.entity) ||
      compareNumber(
        boundaryOrder.get(a.boundary) ?? 0,
        boundaryOrder.get(b.boundary) ?? 0,
      ) ||
      compareNumber(a.kind === "goal" ? 0 : 1, b.kind === "goal" ? 0 : 1)
    );
  }
  return 0;
}

/**
 * Derive finite, canonical facts from every actual physical observation.
 * Positions are linear-interpolated and rotations use the existing
 * shortest-arc quaternion interpolation between adjacent substep endpoints,
 * including its normalized-linear near-equal branch. This is swept pose
 * interpolation, not a claim that endpoint observations prove collision-free
 * physics traversal.
 */
export function deriveSimulationFacts(
  observations: readonly PhysicsStepObservation[],
  config: Readonly<CounterballConfig>,
): SimulationFact[] {
  validateGeometry(config);
  const normalized = normalizeObservations(observations, config);
  const boundaries = makeBoundaries(config);
  const facts: SimulationFact[] = [];
  const pushFact = (fact: SimulationFact): void => {
    const point = fact.point;
    if (
      !Number.isSafeInteger(fact.step) ||
      fact.step < 0 ||
      !Number.isFinite(fact.timeMs) ||
      fact.timeMs < 0 ||
      !Number.isFinite(point.x) ||
      !Number.isFinite(point.y) ||
      !Number.isFinite(point.z)
    ) {
      throw new TypeError(
        "Derived fact must contain only finite protocol values.",
      );
    }
    if (facts.length >= maximumFactCount) {
      throw new RangeError(
        `Simulation facts exceed the ${maximumFactCount}-fact protocol limit.`,
      );
    }
    const canonicalPoint = {
      x: point.x === 0 ? 0 : point.x,
      y: point.y === 0 ? 0 : point.y,
      z: point.z === 0 ? 0 : point.z,
    };
    facts.push({ ...fact, point: canonicalPoint });
  };

  for (let index = 1; index < normalized.length; index += 1) {
    const observation = normalized[index];
    if (observation === undefined) {
      continue;
    }

    for (const contact of observation.contactStarts) {
      pushFact({
        type: "contact",
        step: observation.step,
        timeMs: observation.timeMs,
        a: contact.a,
        b: contact.b,
        point: { ...contact.point },
      });
    }
  }

  for (const id of ENTITY_IDS) {
    const dimensions = dimensionsFor(id, config);
    const goalPassageByBoundary = new Map<Boundary["name"], GoalPassageState>();
    if (id === "button") {
      for (const boundary of boundaries) {
        if (boundary.name === "homeEnd" || boundary.name === "awayEnd") {
          goalPassageByBoundary.set(boundary.name, {
            active: false,
            clear: true,
          });
        }
      }
    }
    let hasBeenWhollyInside = false;
    let hasCrossed = false;

    for (let index = 0; index < normalized.length; index += 1) {
      const current = normalized[index];
      if (current === undefined) {
        continue;
      }
      const currentPose = current.bodies.get(id);
      if (currentPose === undefined) {
        throw new TypeError(`Observation is missing body ${id}.`);
      }
      if (isWhollyInsidePitch(currentPose, boundaries, dimensions)) {
        hasBeenWhollyInside = true;
      }

      if (index === 0 || !hasBeenWhollyInside || hasCrossed) {
        continue;
      }
      const previous = normalized[index - 1];
      if (previous === undefined) {
        continue;
      }

      if (id === "button") {
        const previousPose = previous.bodies.get(id);
        if (previousPose === undefined) {
          throw new TypeError(`Observation is missing body ${id}.`);
        }
        for (const boundary of boundaries) {
          if (boundary.name !== "homeEnd" && boundary.name !== "awayEnd") {
            continue;
          }
          const passage = goalPassageByBoundary.get(boundary.name);
          if (passage === undefined) {
            throw new TypeError("Goal passage state is missing.");
          }

          const clearanceLipschitz = supportClearanceLipschitz(
            previousPose,
            currentPose,
            boundary,
            dimensions,
          );
          const leadingAt = (amount: number): number =>
            leadingClearance(
              interpolatePose(previousPose, currentPose, amount),
              boundary,
              dimensions,
            );
          const trailingAt = (amount: number): number =>
            trailingClearance(
              interpolatePose(previousPose, currentPose, amount),
              boundary,
              dimensions,
            );

          let passageStart: number | undefined;
          if (!passage.active && hasBeenWhollyInside) {
            const leadingStart = leadingAt(0);
            const leadingEnd = leadingAt(1);
            if (leadingStart < 0) {
              // Prior observations did not establish when this passage began.
              passage.active = true;
              passage.clear = false;
            } else {
              passageStart = findDescendingRoot(
                leadingAt,
                leadingStart,
                leadingEnd,
                clearanceLipschitz,
              );
              if (passageStart !== undefined) {
                passage.active = true;
                passage.clear = true;
              }
            }
          }

          let trailingExit: number | undefined;
          if (passage.active) {
            const trailingStart = trailingAt(0);
            const trailingEnd = trailingAt(1);
            trailingExit = findDescendingRoot(
              trailingAt,
              trailingStart,
              trailingEnd,
              clearanceLipschitz,
            );
            if (passageStart === undefined) {
              passageStart = 0;
            }
            const passageEnd = trailingExit ?? 1;
            if (
              !provesGoalPassageClear(
                previousPose,
                currentPose,
                passageStart,
                passageEnd,
                config,
              )
            ) {
              passage.clear = false;
            }

            // If the leading support returned wholly into play without the
            // trailing support exiting, this attempt ended and a later attempt
            // must prove its own passage.
            if (trailingExit === undefined && leadingAt(1) >= 0) {
              passage.active = false;
              passage.clear = true;
            }
          }
        }
      }

      const candidates = boundaries
        .map((boundary) =>
          crossingForInterval(
            id,
            boundary,
            previous,
            current,
            config,
            goalPassageByBoundary.get(boundary.name)?.active === true &&
              goalPassageByBoundary.get(boundary.name)?.clear === true,
          ),
        )
        .filter((fact): fact is SimulationFact => fact !== undefined);
      if (candidates.length === 0) {
        continue;
      }

      candidates.sort(compareFacts);
      const earliest = candidates[0];
      if (earliest === undefined || earliest.type !== "crossing") {
        continue;
      }
      const tieTolerance =
        Number.EPSILON * Math.max(1, Math.abs(earliest.timeMs)) * 16;
      for (const candidate of candidates) {
        if (
          candidate.type === "crossing" &&
          Math.abs(candidate.timeMs - earliest.timeMs) <= tieTolerance
        ) {
          pushFact(candidate);
        }
      }
      hasCrossed = true;
    }
  }

  facts.sort(compareFacts);
  return facts;
}
