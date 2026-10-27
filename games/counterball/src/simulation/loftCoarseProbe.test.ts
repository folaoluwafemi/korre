import {
  COUNTERBALL_CONFIG_V1,
  hashCounterballConfig,
} from "@korre/game-protocol";
import { beforeAll, describe, expect, it } from "vitest";
import { computeDiagnosticShiftedEnergy } from "./browserDirectProbe.js";
import { deriveNativeCylinderSupportDatum } from "./nativeCylinderSupportDatum.js";
import {
  LOFT_COARSE_TUPLES,
  canonicalizeLoftCoarseContactPair,
  matchesExactFloat32Projection,
  type LoftCoarseByteSink,
  type LoftCoarseCase,
  type LoftCoarseContactBodyId,
  type LoftCoarseEntityId,
  type LoftCoarseMatrixMetadata,
  type LoftCoarseStaticBodyId,
  type LoftCoarseTuple,
  writeLoftCoarseMatrix,
} from "./loftCoarseProbe.js";

const guard = COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard;
const entityIds: readonly LoftCoarseEntityId[] = [
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
];
const staticIds: readonly LoftCoarseStaticBodyId[] = [
  "goal-frame-0",
  "goal-frame-1",
  "goal-frame-2",
  "goal-frame-3",
  "goal-frame-4",
  "goal-frame-5",
  "support-apron",
] as const;
let canonicalConfigHash = "";

beforeAll(async () => {
  canonicalConfigHash = await hashCounterballConfig();
});

function requiredItem<T>(
  values: readonly T[],
  index: number,
  label: string,
): T {
  const value = values[index];
  if (value === undefined)
    throw new Error(`${label} is missing from the test fixture.`);
  return value;
}

function matrixMetadata(
  overrides: Partial<LoftCoarseMatrixMetadata> = {},
): LoftCoarseMatrixMetadata {
  return {
    guardSchemaVersion: guard.schemaVersion,
    scope: guard.scope,
    matrixId: guard.matrixId,
    algorithmVersion: guard.algorithmVersion,
    protocolVersion: guard.protocolVersion,
    configSchemaVersion: guard.configSchemaVersion,
    configVersion: COUNTERBALL_CONFIG_V1.configVersion,
    configHash: canonicalConfigHash,
    fixtureId: guard.fixture.id,
    fixturePayloadSha256: guard.fixture.payloadSha256,
    fixtureFileSha256: "b".repeat(64),
    physicsVersion: guard.physicsVersion,
    adapterVersion: guard.physicsVersion.slice(
      guard.physicsVersion.lastIndexOf("/") + 1,
    ),
    wasmSha256: guard.wasmSha256,
    matchId: guard.matchId,
    runtimeIdentity: "Chromium / Playwright diagnostic runner",
    ...overrides,
  };
}

function vec3(x = 0, y = 0, z = 0) {
  return { x, y, z };
}

function quaternion() {
  return { x: 0, y: 0, z: 0, w: 1 };
}

function nativeAabb(dimensions: ReturnType<typeof vec3>) {
  return {
    minimum: vec3(-dimensions.x / 2, -dimensions.y / 2, -dimensions.z / 2),
    maximum: vec3(dimensions.x / 2, dimensions.y / 2, dimensions.z / 2),
  };
}

function bodyState(id: LoftCoarseEntityId) {
  return {
    id,
    position: vec3(),
    rotation: quaternion(),
    linearVelocity: vec3(),
    angularVelocity: vec3(),
  };
}

function materialValues() {
  return {
    friction: guard.materials.friction,
    staticFriction: guard.materials.staticFriction,
    restitution: guard.materials.restitution,
    frictionCombine: guard.materials.frictionCombine,
    restitutionCombine: guard.materials.restitutionCombine,
  };
}

function projectedMaterialValues() {
  const configured = materialValues();
  return {
    ...configured,
    friction: Math.fround(configured.friction),
    staticFriction: Math.fround(configured.staticFriction),
    restitution: Math.fround(configured.restitution),
  };
}

function caseMetadata(
  index: number,
  identity: LoftCoarseMatrixMetadata,
  overrides: Partial<LoftCoarseCase["metadata"]> = {},
): LoftCoarseCase["metadata"] {
  const dynamicBodies = entityIds.map((id) => {
    const configuredMass =
      id === "button"
        ? COUNTERBALL_CONFIG_V1.bodies.buttonMass
        : COUNTERBALL_CONFIG_V1.bodies.capMass;
    const projectedMass = Math.fround(configuredMass);
    const geometry = COUNTERBALL_CONFIG_V1.geometry;
    const colliderDimensions =
      id === "button"
        ? vec3(
            Math.fround(geometry.buttonRadius * 2),
            Math.fround(geometry.buttonThickness),
            Math.fround(geometry.buttonRadius * 2),
          )
        : vec3(
            Math.fround(geometry.capRadius * 2),
            Math.fround(geometry.capHeight),
            Math.fround(geometry.capRadius * 2),
          );
    return {
      id,
      nativeShapeType: 2 as const,
      nativeLocalAabb: nativeAabb(colliderDimensions),
      nativeMass: projectedMass,
      centerOfMassOffset: vec3(),
      principalInertias: vec3(0.01, 0.01, 0.01),
      inertiaOrientation: quaternion(),
      colliderDimensions,
      collisionFilter: [1, 1] as const,
      initialLinearVelocity: vec3(),
      initialAngularVelocity: vec3(),
      configuredMassProjection: {
        configuredMass,
        projectedMass,
        observedNativeMass: projectedMass,
        tolerance:
          guard.energy.nativeMassToleranceMultiplier *
          Number.EPSILON *
          Math.max(1, Math.abs(projectedMass)),
        withinTolerance: true,
      },
    };
  });
  const geometry = COUNTERBALL_CONFIG_V1.geometry;
  const supportDimensions = vec3(
    geometry.pitchWidth + 650,
    Math.fround(geometry.surfaceThickness),
    geometry.pitchLength + 650,
  );
  const staticBodies = staticIds.map((id) => ({
    id,
    colliderDimensions:
      id === "support-apron" ? supportDimensions : vec3(1, 1, 1),
    collisionFilter: [1, 1] as const,
    material: projectedMaterialValues(),
  }));
  const supportBounds = nativeAabb(supportDimensions);
  const materials = [
    ...entityIds.map((bodyId) => ({
      bodyId,
      shapeIndex: 0,
      setter: materialValues(),
      readback: projectedMaterialValues(),
    })),
    ...staticIds.map((bodyId) => ({
      bodyId,
      shapeIndex: 0,
      setter: materialValues(),
      readback: projectedMaterialValues(),
    })),
  ];
  const settlingWindow = {
    startTick: 0,
    endTick: 59,
    linearSpeedThreshold:
      COUNTERBALL_CONFIG_V1.simulation.linearSettleThreshold,
    angularSpeedThreshold:
      COUNTERBALL_CONFIG_V1.simulation.angularSettleThreshold,
    ticks: Array.from({ length: 60 }, (_, tick) => ({
      tick,
      linearSpeeds: Array.from({ length: 15 }, () => 0),
      angularSpeeds: Array.from({ length: 15 }, () => 0),
      settledMask: 0x7fff,
    })),
  };
  return {
    ...identity,
    tuple: requiredItem(LOFT_COARSE_TUPLES, index, `tuple ${index}`),
    matrixIndex: index,
    initialStateHashAlgorithm: guard.setup.initialStateHashAlgorithm,
    initialStateHash: "c".repeat(64),
    dynamicBodies,
    supportPlane: {
      referenceY: geometry.surfaceY,
      nativeTopY:
        geometry.surfaceY -
        geometry.surfaceThickness / 2 +
        supportBounds.maximum.y,
      nativeShapeType: 3 as const,
      nativeLocalAabb: {
        minimum: supportBounds.minimum,
        maximum: supportBounds.maximum,
      },
      position: vec3(0, geometry.surfaceY - geometry.surfaceThickness / 2, 0),
      rotation: quaternion(),
      scaling: vec3(1, 1, 1),
      hasParent: false as const,
    },
    materials,
    staticBodies,
    contactSubscription: {
      eventType: "COLLISION_STARTED",
      nativeMask: 1,
      bodies: [...entityIds, ...staticIds].map((bodyId) => ({
        bodyId,
        requestedMask: 1,
        observedMask: 1,
      })),
    },
    preImpulseMeasuredShiftedEnergy: 1,
    preImpulsePredictedShiftedEnergy: 1,
    finalBodies: entityIds.map(bodyState),
    settlingWindow,
    eligibility: { eligible: true, reasons: [] },
    executeStepCalls: 1,
    batches: 1,
    wallTimeMs: 1,
    ...overrides,
  };
}

function bodyRow(
  tuple: LoftCoarseTuple,
  nominalTick: number,
  id: LoftCoarseEntityId,
) {
  return { tuple, nominalTick, ...bodyState(id) };
}

function bodyRowsFor(tuple: LoftCoarseTuple, tickCount: number) {
  return Array.from({ length: tickCount }, (_, tick) =>
    entityIds.map((id) => bodyRow(tuple, tick, id)),
  ).flat();
}

function sweepRow(
  tuple: LoftCoarseTuple,
  nominalTick: number,
  actualCheckedCallCount: number,
) {
  const callIndex = 0;
  return {
    tuple,
    nominalTick,
    actualCheckedCallCount,
    maximumShiftedEnergy: { value: 1, callIndex },
    maximumCandidateRelativeComDrop: {
      value: 0.001,
      bodyId: "home-0",
      callIndex,
    },
    minimumApronMargin: { value: 1, bodyId: "home-0", callIndex },
    minimumSlabUndersideMargin: { value: 1, bodyId: "home-0", callIndex },
    maximumPointSweep: { value: 0.001, bodyId: "home-0", callIndex },
    maximumRotationSweep: { value: 0.001, bodyId: "home-0", callIndex },
    minimumWholeButtonObstacleClearance: {
      value: 0.01,
      callIndex,
      obstaclePair: ["button", "home-1"],
    },
    intervalClassification: "clear",
    allFinite: true,
    all15Settled: true,
  } as const;
}

function sweepRowsFor(
  tuple: LoftCoarseTuple,
  callsPerInterval: readonly number[],
) {
  return callsPerInterval.map((calls, tick) => sweepRow(tuple, tick, calls));
}

function contactRow(
  tuple: LoftCoarseTuple,
  nominalTick = 0,
  pair: readonly [LoftCoarseContactBodyId, LoftCoarseContactBodyId] = [
    "button",
    "home-0",
  ],
  eventType = "COLLISION_STARTED",
) {
  return {
    tuple,
    nominalTick,
    callIndex: 0,
    pair,
    eventType,
    point: vec3(),
  };
}

type CaseOptions = {
  tickCount?: number;
  callsPerInterval?: readonly number[];
  contactCount?: number;
  wallTimeMs?: number;
  batchCount?: number;
  metadata?: Partial<LoftCoarseCase["metadata"]>;
};

function caseAt(
  index: number,
  identity: LoftCoarseMatrixMetadata,
  options: CaseOptions = {},
): LoftCoarseCase {
  const tickCount = options.tickCount ?? 2;
  const callsPerInterval =
    options.callsPerInterval ?? Array.from({ length: tickCount - 1 }, () => 1);
  const executeStepCalls = callsPerInterval.reduce(
    (sum, calls) => sum + calls,
    0,
  );
  const metadata = caseMetadata(index, identity, {
    executeStepCalls,
    batches:
      options.batchCount ??
      Math.ceil(executeStepCalls / guard.workload.maximumCallsPerBatch),
    wallTimeMs: options.wallTimeMs ?? 1,
    ...options.metadata,
  });
  return {
    metadata,
    bodyRows: bodyRowsFor(metadata.tuple, tickCount),
    contactRows: Array.from({ length: options.contactCount ?? 0 }, () =>
      contactRow(metadata.tuple),
    ),
    sweepRows: sweepRowsFor(metadata.tuple, callsPerInterval),
  };
}

async function* orderedCases(
  identity: LoftCoarseMatrixMetadata,
  change?: (index: number, value: LoftCoarseCase) => LoftCoarseCase,
): AsyncGenerator<LoftCoarseCase> {
  await Promise.resolve();
  for (let index = 0; index < LOFT_COARSE_TUPLES.length; index += 1) {
    const value = caseAt(index, identity);
    yield change === undefined ? value : change(index, value);
  }
}

function collectingSink(): {
  sink: LoftCoarseByteSink;
  text: () => string;
  chunks: Uint8Array[];
  aborted: unknown[];
} {
  const chunks: Uint8Array[] = [];
  const aborted: unknown[] = [];
  return {
    sink: {
      write: (chunk) => {
        chunks.push(new Uint8Array(chunk));
      },
      abort: (reason) => {
        aborted.push(reason);
      },
    },
    chunks,
    aborted,
    text: () => {
      const byteLength = chunks.reduce(
        (total, chunk) => total + chunk.byteLength,
        0,
      );
      const bytes = new Uint8Array(byteLength);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return new TextDecoder().decode(bytes);
    },
  };
}

function countingSink(): {
  sink: LoftCoarseByteSink;
  getBytes: () => number;
  getLargestChunk: () => number;
  aborted: unknown[];
} {
  let bytes = 0;
  let largestChunk = 0;
  const aborted: unknown[] = [];
  return {
    sink: {
      write: (chunk) => {
        bytes += chunk.byteLength;
        largestChunk = Math.max(largestChunk, chunk.byteLength);
      },
      abort: (reason) => {
        aborted.push(reason);
      },
    },
    getBytes: () => bytes,
    getLargestChunk: () => largestChunk,
    aborted,
  };
}

async function run(
  options: {
    metadata?: LoftCoarseMatrixMetadata;
    cases?: AsyncIterable<LoftCoarseCase>;
    change?: (index: number, value: LoftCoarseCase) => LoftCoarseCase;
    signal?: AbortSignal;
    sink?: LoftCoarseByteSink;
  } = {},
) {
  const metadata = options.metadata ?? matrixMetadata();
  const collected = collectingSink();
  const result = await writeLoftCoarseMatrix({
    metadata,
    cases: options.cases ?? orderedCases(metadata, options.change),
    sink: options.sink ?? collected.sink,
    signal: options.signal ?? new AbortController().signal,
  });
  return { result, collected };
}

function exactCaseLimits(
  index: number,
  identity: LoftCoarseMatrixMetadata,
): LoftCoarseCase {
  const callsPerInterval = Array.from({ length: 1_800 }, () => 48);
  return caseAt(index, identity, {
    tickCount: 1_801,
    callsPerInterval,
    contactCount: 8_192,
    wallTimeMs: 30_000,
    batchCount: 720,
  });
}

describe("matchesExactFloat32Projection", () => {
  it("projects only temporary support-apron thickness and keeps its footprint exact", () => {
    const expectedDimensions = { x: 662, y: 0.2, z: 670 };
    const projectedY = Math.fround(expectedDimensions.y);
    const view = new DataView(new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT));
    view.setFloat32(0, projectedY);
    view.setUint32(0, view.getUint32(0) + 1);
    const adjacentY = view.getFloat32(0);
    const matchesApronY = (observedY: number): boolean =>
      matchesExactFloat32Projection(expectedDimensions.y, observedY);

    expect(expectedDimensions.x).toBe(662);
    expect(expectedDimensions.z).toBe(670);
    expect(matchesApronY(projectedY)).toBe(true);
    expect(matchesApronY(expectedDimensions.y)).toBe(false);
    expect(adjacentY).not.toBe(projectedY);
    expect(Math.fround(adjacentY)).toBe(adjacentY);
    expect(matchesApronY(adjacentY)).toBe(false);
  });

  it("projects the canonical button and cap dimensions exactly", () => {
    const geometry = COUNTERBALL_CONFIG_V1.geometry;
    const canonicalDimensions = [
      {
        x: geometry.buttonRadius * 2,
        y: geometry.buttonThickness,
        z: geometry.buttonRadius * 2,
      },
      {
        x: geometry.capRadius * 2,
        y: geometry.capHeight,
        z: geometry.capRadius * 2,
      },
    ];

    expect(canonicalDimensions).toEqual([
      { x: 0.26, y: 0.045, z: 0.26 },
      { x: 0.64, y: 0.12, z: 0.64 },
    ]);
    for (const dimensions of canonicalDimensions) {
      for (const axis of ["x", "y", "z"] as const) {
        const configured = dimensions[axis];
        expect(
          matchesExactFloat32Projection(configured, Math.fround(configured)),
        ).toBe(true);
      }
    }
  });

  it("matches only exact Float32 projections for goal-frame spans", () => {
    const geometry = COUNTERBALL_CONFIG_V1.geometry;
    const frameDimensions = [
      {
        kind: "upright",
        dimensions: {
          x: geometry.goalFrameRadius * 2,
          y: geometry.goalHeight,
          z: geometry.goalFrameRadius * 2,
        },
      },
      {
        kind: "crossbar",
        dimensions: {
          x: geometry.goalWidth,
          y: geometry.goalFrameRadius * 2,
          z: geometry.goalFrameRadius * 2,
        },
      },
    ] as const;

    expect(frameDimensions.map(({ dimensions }) => dimensions)).toEqual([
      { x: 0.12, y: 0.8, z: 0.12 },
      { x: 2.4, y: 0.12, z: 0.12 },
    ]);
    for (const { dimensions } of frameDimensions) {
      for (const axis of ["x", "y", "z"] as const) {
        const configured = dimensions[axis];
        const projected = Math.fround(configured);
        const view = new DataView(
          new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT),
        );
        view.setFloat32(0, projected);
        const projectedBits = view.getUint32(0);
        const adjacentValues = [-1, 1].map((offset) => {
          const adjacentView = new DataView(
            new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT),
          );
          adjacentView.setUint32(0, projectedBits + offset);
          return adjacentView.getFloat32(0);
        });

        expect(projected).not.toBe(configured);
        expect(matchesExactFloat32Projection(configured, projected)).toBe(true);
        expect(matchesExactFloat32Projection(configured, configured)).toBe(
          false,
        );
        for (const adjacent of adjacentValues) {
          expect(adjacent).not.toBe(projected);
          expect(Math.fround(adjacent)).toBe(adjacent);
          expect(matchesExactFloat32Projection(configured, adjacent)).toBe(
            false,
          );
        }
      }
    }
  });

  it("accepts only the exact finite projection and rejects adjacent values", () => {
    const configured = 0.2;
    const projected = Math.fround(configured);
    const view = new DataView(new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT));
    view.setFloat32(0, projected);
    view.setUint32(0, view.getUint32(0) + 1);
    const adjacent = view.getFloat32(0);

    expect(matchesExactFloat32Projection(configured, projected)).toBe(true);
    expect(matchesExactFloat32Projection(configured, configured)).toBe(false);
    expect(adjacent).not.toBe(projected);
    expect(Math.fround(adjacent)).toBe(adjacent);
    expect(matchesExactFloat32Projection(configured, adjacent)).toBe(false);
  });

  it("rejects non-finite values and finite values with infinite projection", () => {
    const projected = Math.fround(0.2);
    const nonFiniteValues = [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ];
    for (const observed of nonFiniteValues) {
      expect(matchesExactFloat32Projection(0.2, observed)).toBe(false);
    }
    for (const configured of nonFiniteValues) {
      expect(matchesExactFloat32Projection(configured, projected)).toBe(false);
    }

    expect(Math.fround(Number.MAX_VALUE)).toBe(Number.POSITIVE_INFINITY);
    expect(
      matchesExactFloat32Projection(Number.MAX_VALUE, Number.MAX_VALUE),
    ).toBe(false);
  });
});

describe("native cylinder support datum", () => {
  it("derives and charges the cylinder support datum", () => {
    const dimensions = vec3(0.64, 0.12, 0.64);
    const bounds = nativeAabb(dimensions);
    const nativeCOM = vec3(0.01, -0.02, 0.02);
    const datum = deriveNativeCylinderSupportDatum(
      { ...bounds, dimensions },
      nativeCOM,
      0,
    );
    expect(datum).toBeCloseTo(0.06 - Math.hypot(0.01, -0.02, 0.02), 14);

    const bodies = entityIds.map((_, index) => ({
      mass: 1,
      inertiaUnitMass: vec3(1, 1, 1),
      centerOfMassY: 0.4 + index / 100,
      restY: datum,
      linearVelocity: vec3(),
      angularVelocityPrincipal: vec3(),
    }));
    const charged = computeDiagnosticShiftedEnergy(
      bodies,
      9.81,
      guard.energy.maximumRestComDrop,
    );
    expect(charged.kineticEnergy).toBe(0);
    expect(charged.shiftedMechanicalEnergy).toBeGreaterThan(0);
    const first = bodies[0];
    if (first === undefined) throw new Error("Energy test body is missing.");
    first.centerOfMassY = datum - guard.energy.maximumRestComDrop;
    expect(() =>
      computeDiagnosticShiftedEnergy(
        bodies,
        9.81,
        guard.energy.maximumRestComDrop,
      ),
    ).not.toThrow();
    first.centerOfMassY -= Number.EPSILON * 4;
    expect(() =>
      computeDiagnosticShiftedEnergy(
        bodies,
        9.81,
        guard.energy.maximumRestComDrop,
      ),
    ).toThrow(/below its permitted rest-height drop/);
  });

  it("charges flat and tilted supported cylinder COM height", () => {
    const geometry = COUNTERBALL_CONFIG_V1.geometry;
    const dimensions = vec3(
      Math.fround(geometry.buttonRadius * 2),
      Math.fround(geometry.buttonThickness),
      Math.fround(geometry.buttonRadius * 2),
    );
    const bounds = nativeAabb(dimensions);
    const nativeCOM = vec3(0.01, -0.02, 0.02);
    const datum = deriveNativeCylinderSupportDatum(
      { ...bounds, dimensions },
      nativeCOM,
      geometry.surfaceY,
    );
    const radius = dimensions.x / 2;
    const halfHeight = dimensions.y / 2;
    const tilt = Math.PI / 4;
    const cosine = Math.cos(tilt);
    const sine = Math.sin(tilt);
    const flatCOMY = geometry.surfaceY + halfHeight + nativeCOM.y;
    const tiltedSupportExtent = radius * sine + halfHeight * cosine;
    const tiltedRotatedCOMY = cosine * nativeCOM.y - sine * nativeCOM.z;
    const tiltedCOMY =
      geometry.surfaceY + tiltedSupportExtent + tiltedRotatedCOMY;

    expect(flatCOMY - nativeCOM.y - halfHeight).toBeCloseTo(
      geometry.surfaceY,
      14,
    );
    expect(tiltedCOMY - tiltedRotatedCOMY - tiltedSupportExtent).toBeCloseTo(
      geometry.surfaceY,
      14,
    );
    expect(flatCOMY).toBeGreaterThanOrEqual(datum);
    expect(tiltedCOMY).toBeGreaterThanOrEqual(datum);

    const energyAt = (centerOfMassY: number) =>
      computeDiagnosticShiftedEnergy(
        entityIds.map((_, index) => ({
          mass: 1,
          inertiaUnitMass: vec3(1, 1, 1),
          centerOfMassY: index === 0 ? centerOfMassY : datum,
          restY: datum,
          linearVelocity: vec3(),
          angularVelocityPrincipal: vec3(),
        })),
        9.81,
        guard.energy.maximumRestComDrop,
      ).shiftedMechanicalEnergy;
    const baselineEnergy = energyAt(datum);

    expect(energyAt(flatCOMY) - baselineEnergy).toBeCloseTo(
      9.81 * (flatCOMY - datum),
      12,
    );
    expect(energyAt(tiltedCOMY) - baselineEnergy).toBeCloseTo(
      9.81 * (tiltedCOMY - datum),
      12,
    );
  });

  it("rejects uncentered, unequal-radius, and non-finite bounds", () => {
    const dimensions = vec3(0.64, 0.12, 0.64);
    const centered = nativeAabb(dimensions);
    expect(() =>
      deriveNativeCylinderSupportDatum(
        {
          ...centered,
          minimum: { ...centered.minimum, x: centered.minimum.x + 0.001 },
          dimensions,
        },
        vec3(),
        0,
      ),
    ).toThrow(RangeError);
    expect(() =>
      deriveNativeCylinderSupportDatum(
        {
          minimum: centered.minimum,
          maximum: { ...centered.maximum, z: centered.maximum.z - 0.001 },
          dimensions,
        },
        vec3(),
        0,
      ),
    ).toThrow(RangeError);
    expect(() =>
      deriveNativeCylinderSupportDatum(
        {
          ...centered,
          minimum: { ...centered.minimum, y: Number.NEGATIVE_INFINITY },
          dimensions,
        },
        vec3(),
        0,
      ),
    ).toThrow(RangeError);
  });
});

describe("writeLoftCoarseMatrix", () => {
  it("exposes the exact unique tuple order from the frozen four axes", () => {
    expect(LOFT_COARSE_TUPLES).toEqual([
      [0.75, 45, 6, -15],
      [0.75, 45, 6, 0],
      [0.75, 45, 6, 15],
      [0.75, 45, 8, -15],
      [0.75, 45, 8, 0],
      [0.75, 45, 8, 15],
      [0.75, 60, 6, -15],
      [0.75, 60, 6, 0],
      [0.75, 60, 6, 15],
      [0.75, 60, 8, -15],
      [0.75, 60, 8, 0],
      [0.75, 60, 8, 15],
      [1, 45, 6, -15],
      [1, 45, 6, 0],
      [1, 45, 6, 15],
      [1, 45, 8, -15],
      [1, 45, 8, 0],
      [1, 45, 8, 15],
      [1, 60, 6, -15],
      [1, 60, 6, 0],
      [1, 60, 6, 15],
      [1, 60, 8, -15],
      [1, 60, 8, 0],
      [1, 60, 8, 15],
    ] satisfies readonly LoftCoarseTuple[]);
    expect(
      new Set(LOFT_COARSE_TUPLES.map((tuple) => tuple.join("/"))).size,
    ).toBe(24);
  });

  it("streams deterministic compact JSON, full precision and exact basic totals", async () => {
    const identity = matrixMetadata();
    const first = await run({ metadata: identity });
    const second = await run({ metadata: identity });
    expect(first.collected.text()).toBe(second.collected.text());
    expect(first.collected.text()).not.toMatch(/:\s|,\s/);
    expect(JSON.parse(first.collected.text())).toMatchObject({
      envelope: {
        caseCount: 24,
        bodyRows: 720,
        contactRows: 0,
        sweepRows: 24,
        executeStepCalls: 24,
        batches: 24,
        tuples: LOFT_COARSE_TUPLES,
      },
    });
    expect(first.collected.text()).toContain('"configHash":"');
    expect(first.result.matrixBytes).toBe(
      new TextEncoder().encode(first.collected.text()).byteLength,
    );
    expect(first.result.envelopeBytes).toBeGreaterThan(0);
    expect(
      first.collected.chunks.every((chunk) => chunk.byteLength <= 256 * 1_024),
    ).toBe(true);
  });

  it("accepts and preserves exact projected native material readbacks", async () => {
    const identity = matrixMetadata();
    const { collected } = await run({ metadata: identity });
    const parsed = JSON.parse(collected.text()) as {
      cases: Array<{
        metadata: {
          materials: Array<{
            bodyId: string;
            shapeIndex: number;
            setter: ReturnType<typeof materialValues>;
            readback: ReturnType<typeof materialValues>;
          }>;
          staticBodies: Array<{
            id: string;
            material: ReturnType<typeof materialValues>;
          }>;
        };
      }>;
    };
    const firstCase = requiredItem(parsed.cases, 0, "serialized first case");
    const firstMaterial = requiredItem(
      firstCase.metadata.materials,
      0,
      "serialized first material",
    );
    expect(firstMaterial.setter.friction).toBe(guard.materials.friction);
    expect(firstMaterial.readback.friction).toBe(
      Math.fround(guard.materials.friction),
    );
    expect(firstMaterial.readback.staticFriction).toBe(
      Math.fround(guard.materials.staticFriction),
    );
    expect(firstMaterial.readback.restitution).toBe(
      Math.fround(guard.materials.restitution),
    );
    expect(firstMaterial.readback.frictionCombine).toBe(
      guard.materials.frictionCombine,
    );
    const support = firstCase.metadata.staticBodies.find(
      (body) => body.id === "support-apron",
    );
    const supportMaterialRecord = firstCase.metadata.materials.find(
      (material) =>
        material.bodyId === "support-apron" && material.shapeIndex === 0,
    );
    expect(support).toBeDefined();
    expect(supportMaterialRecord).toBeDefined();
    expect(support?.material).toEqual(supportMaterialRecord?.readback);
  });

  it("rejects a native material value adjacent to the exact Float32 projection", async () => {
    const identity = matrixMetadata();
    const projected = Math.fround(guard.materials.friction);
    const view = new DataView(new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT));
    view.setFloat32(0, projected);
    view.setUint32(0, view.getUint32(0) + 1);
    const adjacent = view.getFloat32(0);

    await expect(
      run({
        metadata: identity,
        change: (index, current) => {
          if (index !== 0) return current;
          const materials = current.metadata.materials.map(
            (material, materialIndex) =>
              materialIndex === 0
                ? {
                    ...material,
                    readback: { ...material.readback, friction: adjacent },
                  }
                : material,
          );
          return {
            ...current,
            metadata: { ...current.metadata, materials },
          };
        },
      }),
    ).rejects.toMatchObject({ code: "invalid" });
  });

  it("canonicalizes object-key order and preserves negative zero and precision", async () => {
    const identity = matrixMetadata();
    const rowWithPrecision = (tuple: LoftCoarseTuple) => ({
      ...bodyRow(tuple, 0, "button"),
      position: { z: 2, y: 1, x: -0.12345678901234568 },
      angularVelocity: { x: -0, y: 0, z: 0 },
    });
    const first = await run({
      metadata: identity,
      change: (index, current) =>
        index === 0
          ? {
              ...current,
              bodyRows: [
                rowWithPrecision(current.metadata.tuple),
                ...current.bodyRows.slice(1),
              ],
            }
          : current,
    });
    const second = await run({
      metadata: identity,
      change: (index, current) =>
        index === 0
          ? {
              ...current,
              bodyRows: [
                {
                  ...rowWithPrecision(current.metadata.tuple),
                  position: { x: -0.12345678901234568, y: 1, z: 2 },
                  angularVelocity: { z: 0, x: -0, y: 0 },
                },
                ...current.bodyRows.slice(1),
              ],
            }
          : current,
    });
    expect(first.collected.text()).toBe(second.collected.text());
    expect(first.collected.text()).toContain("-0.12345678901234568");
    const parsed = JSON.parse(first.collected.text()) as {
      cases: Array<{
        bodyRows: Array<{
          position: { x: number };
          angularVelocity: { x: number };
        }>;
      }>;
    };
    const firstCase = requiredItem(parsed.cases, 0, "serialized first case");
    const firstRow = requiredItem(
      firstCase.bodyRows,
      0,
      "serialized first body row",
    );
    expect(Object.is(firstRow.position.x, -0.12345678901234568)).toBe(true);
    expect(Object.is(firstRow.angularVelocity.x, -0)).toBe(true);
  });

  it("rejects missing metadata fields, unknown metadata and invalid row shapes", async () => {
    const identity = matrixMetadata();
    const missingMatrixField = { ...identity } as Record<string, unknown>;
    delete missingMatrixField["fixtureId"];
    await expect(
      run({ metadata: missingMatrixField as never }),
    ).rejects.toMatchObject({ code: "invalid" });

    await expect(
      run({
        metadata: identity,
        change: (index, current) => {
          if (index !== 0) return current;
          const metadata = { ...current.metadata } as Record<string, unknown>;
          delete metadata["initialStateHash"];
          return { ...current, metadata: metadata as never };
        },
      }),
    ).rejects.toMatchObject({ code: "invalid" });

    await expect(
      run({
        metadata: identity,
        change: (index, current) => {
          if (index !== 0) return current;
          const dynamicBodies = current.metadata.dynamicBodies.map(
            (body, bodyIndex) =>
              bodyIndex === 0
                ? {
                    ...body,
                    configuredMassProjection: {
                      configuredMass:
                        body.configuredMassProjection.configuredMass,
                      projectedMass:
                        body.configuredMassProjection.projectedMass,
                      tolerance: body.configuredMassProjection.tolerance,
                      withinTolerance: true,
                    } as never,
                  }
                : body,
          );
          return {
            ...current,
            metadata: { ...current.metadata, dynamicBodies },
          };
        },
      }),
    ).rejects.toMatchObject({ code: "invalid" });

    await expect(
      run({
        metadata: identity,
        change: (index, current) =>
          index === 0
            ? {
                ...current,
                metadata: { ...current.metadata, unapproved: true } as never,
              }
            : current,
      }),
    ).rejects.toMatchObject({ code: "invalid" });

    await expect(
      run({
        metadata: identity,
        change: (index, current) => {
          if (index !== 0) return current;
          const staticBodies = current.metadata.staticBodies.map(
            (body, bodyIndex) =>
              bodyIndex === 0 ? { ...body, id: "unrelated-static" } : body,
          );
          return {
            ...current,
            metadata: { ...current.metadata, staticBodies },
          };
        },
      }),
    ).rejects.toMatchObject({ code: "invalid" });

    await expect(
      run({
        metadata: identity,
        change: (index, current) =>
          index === 0
            ? {
                ...current,
                bodyRows: [
                  {
                    ...requiredItem(current.bodyRows, 0, "body row"),
                    rotation: undefined,
                  } as never,
                ],
              }
            : current,
      }),
    ).rejects.toMatchObject({ code: "invalid" });

    await expect(
      run({
        metadata: identity,
        change: (index, current) =>
          index === 0
            ? { ...current, bodyRows: current.bodyRows.slice(0, 15) }
            : current,
      }),
    ).rejects.toMatchObject({ code: "invalid" });

    await expect(
      run({
        metadata: identity,
        change: (index, current) =>
          index === 0
            ? {
                ...current,
                contactRows: [
                  {
                    ...contactRow(current.metadata.tuple),
                    unexpected: true,
                  } as never,
                ],
              }
            : current,
      }),
    ).rejects.toMatchObject({ code: "invalid" });

    await expect(
      run({
        metadata: identity,
        change: (index, current) =>
          index === 0
            ? {
                ...current,
                sweepRows: [
                  {
                    ...requiredItem(current.sweepRows, 0, "sweep row"),
                    maximumPointSweep: { value: 0.001, bodyId: "home-0" },
                  } as never,
                ],
              }
            : current,
      }),
    ).rejects.toMatchObject({ code: "invalid" });

    await expect(
      run({
        metadata: identity,
        change: (index, current) => {
          if (index !== 0) return current;
          const wrongObstacle = sweepRow(current.metadata.tuple, 0, 1);
          return {
            ...current,
            sweepRows: [
              {
                ...wrongObstacle,
                minimumWholeButtonObstacleClearance: {
                  ...wrongObstacle.minimumWholeButtonObstacleClearance,
                  obstaclePair: ["button", "home-2"],
                },
              } as never,
            ],
          };
        },
      }),
    ).rejects.toMatchObject({ code: "invalid" });
  });

  it("rejects invalid native shape and support metadata", async () => {
    const identity = matrixMetadata();
    const mutations: Array<
      (metadata: LoftCoarseCase["metadata"]) => LoftCoarseCase["metadata"]
    > = [
      (metadata) => ({
        ...metadata,
        dynamicBodies: metadata.dynamicBodies.map((body, index) =>
          index === 0 ? { ...body, nativeShapeType: 3 as never } : body,
        ),
      }),
      (metadata) => ({
        ...metadata,
        dynamicBodies: metadata.dynamicBodies.map((body, index) =>
          index === 0
            ? {
                ...body,
                nativeLocalAabb: {
                  ...body.nativeLocalAabb,
                  minimum: {
                    ...body.nativeLocalAabb.minimum,
                    x: body.nativeLocalAabb.minimum.x + 0.001,
                  },
                },
              }
            : body,
        ),
      }),
      ...[
        { nativeShapeType: 2 as const },
        { hasParent: true as never },
        { nativeTopY: 0.1 },
        { position: vec3(0, 0, 0) },
        { rotation: { x: 0, y: 0, z: 0.1, w: 1 } },
        { rotation: { x: 0, y: 0, z: 5e-13, w: 1 } },
        { scaling: vec3(1, 2, 1) },
        { referenceY: 0.01 },
        {
          nativeLocalAabb: {
            minimum: vec3(-331, -0.09, -335),
            maximum: vec3(331, 0.1, 335),
          },
        },
      ].map((supportPatch) => (metadata: LoftCoarseCase["metadata"]) => ({
        ...metadata,
        supportPlane: {
          ...metadata.supportPlane,
          ...supportPatch,
        } as never,
      })),
    ];

    for (const mutate of mutations) {
      await expect(
        run({
          metadata: identity,
          change: (index, current) =>
            index === 0
              ? {
                  ...current,
                  metadata: mutate(current.metadata),
                }
              : current,
        }),
      ).rejects.toMatchObject({ code: "invalid" });
    }
  });

  it("rejects malformed onset subscriptions before case output", async () => {
    const identity = matrixMetadata();
    const base = caseMetadata(0, identity).contactSubscription;
    const invalidSubscriptions: unknown[] = [
      undefined,
      { ...base, eventType: "COLLISION_CONTINUED" },
      { ...base, nativeMask: 0 },
      { ...base, nativeMask: Number.NaN },
      { ...base, nativeMask: 3 },
      { ...base, nativeMask: 0x1_0000_0000 },
      { ...base, bodies: base.bodies.slice(1) },
      { ...base, bodies: [...base.bodies].reverse() },
      {
        ...base,
        bodies: base.bodies.map((body, i) =>
          i === 0 ? { ...body, bodyId: "unknown" } : body,
        ),
      },
      {
        ...base,
        bodies: base.bodies.map((body, i) =>
          i === 0 ? { ...body, observedMask: 2 } : body,
        ),
      },
      {
        ...base,
        bodies: base.bodies.map((body, i) =>
          i === 0 ? { ...body, requestedMask: 2 } : body,
        ),
      },
      {
        ...base,
        bodies: base.bodies.map((body, i) =>
          i === 0 ? { ...body, extra: true } : body,
        ),
      },
    ];
    for (const contactSubscription of invalidSubscriptions) {
      const collected = collectingSink();
      await expect(
        run({
          metadata: identity,
          sink: collected.sink,
          change: (index, current) =>
            index === 0
              ? {
                  ...current,
                  metadata: {
                    ...current.metadata,
                    contactSubscription,
                  } as never,
                }
              : current,
        }),
      ).rejects.toMatchObject({ code: "invalid" });
      expect(collected.text()).not.toContain('"cases":[{');
      expect(collected.aborted).toHaveLength(1);
    }
  });

  it("preserves duplicate callbacks and rejects invalid event names", async () => {
    const identity = matrixMetadata();
    const accepted = await run({
      metadata: identity,
      change: (index, current) =>
        index === 0
          ? {
              ...current,
              contactRows: [
                contactRow(current.metadata.tuple),
                contactRow(current.metadata.tuple),
              ],
            }
          : current,
    });
    expect(accepted.result.contactRows).toBe(2);

    for (const eventType of [
      "COLLISION_CONTINUED",
      "x".repeat(64),
      "x".repeat(65),
    ]) {
      await expect(
        run({
          metadata: identity,
          change: (index, current) =>
            index === 0
              ? {
                  ...current,
                  contactRows: [
                    { ...contactRow(current.metadata.tuple), eventType },
                  ],
                }
              : current,
        }),
      ).rejects.toMatchObject({ code: "invalid" });
    }
  });

  it("canonicalizes dynamic and static contact participants in total order", () => {
    expect(canonicalizeLoftCoarseContactPair("home-6", "button")).toEqual([
      "button",
      "home-6",
    ]);

    expect(
      canonicalizeLoftCoarseContactPair("button", "support-apron"),
    ).toEqual(canonicalizeLoftCoarseContactPair("support-apron", "button"));

    expect(
      canonicalizeLoftCoarseContactPair("support-apron", "goal-frame-5"),
    ).toEqual(["goal-frame-5", "support-apron"]);

    for (const staticId of staticIds) {
      expect(canonicalizeLoftCoarseContactPair("home-6", staticId)).toEqual([
        "home-6",
        staticId,
      ]);
    }
  });

  it("serializes all static IDs and retains symmetric callbacks in occurrence order", async () => {
    const identity = matrixMetadata();
    const tuple = requiredItem(LOFT_COARSE_TUPLES, 0, "tuple 0");
    const staticRows = staticIds.map((staticId) =>
      contactRow(
        tuple,
        0,
        canonicalizeLoftCoarseContactPair("home-6", staticId),
        "COLLISION_STARTED",
      ),
    );
    const callbacks = [
      {
        ...contactRow(
          tuple,
          0,
          canonicalizeLoftCoarseContactPair("support-apron", "button"),
        ),
        point: vec3(1, 0, 0),
      },
      {
        ...contactRow(
          tuple,
          0,
          canonicalizeLoftCoarseContactPair("button", "support-apron"),
        ),
        point: vec3(2, 0, 0),
      },
      contactRow(
        tuple,
        0,
        canonicalizeLoftCoarseContactPair("support-apron", "goal-frame-5"),
      ),
    ];
    const result = await run({
      metadata: identity,
      change: (index, current) =>
        index === 0
          ? { ...current, contactRows: [...staticRows, ...callbacks] }
          : current,
    });
    const parsed = JSON.parse(result.collected.text()) as {
      cases: Array<{
        contactRows: Array<{
          pair: readonly string[];
          eventType: string;
          point: { x: number; y: number; z: number } | null;
        }>;
      }>;
    };
    const firstCase = requiredItem(parsed.cases, 0, "serialized case 0");
    expect(firstCase.contactRows).toHaveLength(10);
    expect(firstCase.contactRows.slice(0, 7).map((row) => row.pair)).toEqual(
      staticIds.map((staticId) => ["home-6", staticId]),
    );
    expect(firstCase.contactRows.slice(7).map((row) => row.pair)).toEqual([
      ["button", "support-apron"],
      ["button", "support-apron"],
      ["goal-frame-5", "support-apron"],
    ]);
    expect(firstCase.contactRows.slice(7, 9).map((row) => row.point)).toEqual([
      vec3(1, 0, 0),
      vec3(2, 0, 0),
    ]);
    expect(firstCase.contactRows.slice(7).map((row) => row.eventType)).toEqual([
      "COLLISION_STARTED",
      "COLLISION_STARTED",
      "COLLISION_STARTED",
    ]);
    expect(result.result.contactRows).toBe(10);
  });

  it("rejects unknown, identical, malformed and reverse-ordered contact pairs", async () => {
    expect(() =>
      canonicalizeLoftCoarseContactPair(
        "unknown-body" as unknown as LoftCoarseContactBodyId,
        "button",
      ),
    ).toThrow(/canonical contact body id/);
    expect(() =>
      canonicalizeLoftCoarseContactPair(
        7 as unknown as LoftCoarseContactBodyId,
        "button",
      ),
    ).toThrow(/canonical contact body id/);
    expect(() => canonicalizeLoftCoarseContactPair("button", "button")).toThrow(
      /endpoints must be distinct/,
    );

    const identity = matrixMetadata();
    const invalidPairs = [
      ["unknown-body", "button"],
      ["button", "button"],
      ["support-apron", "button"],
      ["button"],
      null,
    ];
    for (const pair of invalidPairs) {
      await expect(
        run({
          metadata: identity,
          change: (index, current) =>
            index === 0
              ? {
                  ...current,
                  contactRows: [
                    { ...contactRow(current.metadata.tuple), pair } as never,
                  ],
                }
              : current,
        }),
      ).rejects.toMatchObject({ code: "invalid" });
    }
  });

  it("rejects other guard versions before writing bytes", async () => {
    for (const guardSchemaVersion of [
      guard.schemaVersion - 1,
      guard.schemaVersion + 1,
      guard.schemaVersion + 0.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ]) {
      const collected = collectingSink();
      await expect(
        run({
          metadata: matrixMetadata({ guardSchemaVersion }),
          sink: collected.sink,
        }),
      ).rejects.toMatchObject({ code: "invalid" });
      expect(collected.chunks).toHaveLength(0);
      expect(collected.aborted).toHaveLength(1);
    }
  });

  it("rejects non-finite and over-limit metadata before returning success", async () => {
    const identity = matrixMetadata({ runtimeIdentity: "x".repeat(65_537) });
    await expect(run({ metadata: identity })).rejects.toMatchObject({
      code: "resourceLimit",
    });
    await expect(
      run({
        metadata: matrixMetadata(),
        change: (index, current) => {
          if (index !== 0) return current;
          const bodyRows = current.bodyRows.map((row, rowIndex) =>
            rowIndex === 0 ? { ...row, position: vec3(Number.NaN) } : row,
          );
          return { ...current, bodyRows };
        },
      }),
    ).rejects.toMatchObject({ code: "invalid" });

    await expect(
      run({
        metadata: matrixMetadata({ configHash: "0".repeat(64) }),
      }),
    ).rejects.toMatchObject({ code: "invalid" });
  });

  it("accepts exact per-case and aggregate row/workload limits using a discard sink", async () => {
    const identity = matrixMetadata();
    const counted = countingSink();
    async function* maximumCases() {
      await Promise.resolve();
      for (let index = 0; index < 24; index += 1) {
        yield exactCaseLimits(index, identity);
      }
    }
    const result = await writeLoftCoarseMatrix({
      metadata: identity,
      cases: maximumCases(),
      sink: counted.sink,
      signal: new AbortController().signal,
    });
    expect(result).toMatchObject({
      caseCount: 24,
      bodyRows: guard.artifact.maximumBodyRowsMatrix,
      contactRows: guard.artifact.maximumContactsMatrix,
      sweepRows: guard.workload.maximumNominalTicksPerCase * 24,
      executeStepCalls: guard.workload.maximumExecuteStepCallsMatrix,
      batches: guard.workload.maximumBatchesMatrix,
      wallTimeMs: guard.workload.maximumWallTimeMatrixMs,
    });
    expect(result.matrixBytes).toBe(counted.getBytes());
    expect(result.matrixBytes).toBeLessThanOrEqual(
      guard.artifact.maximumMatrixBytes,
    );
    expect(counted.getLargestChunk()).toBeLessThanOrEqual(256 * 1_024);
  }, 180_000);

  it("rejects body/contact/sweep count and workload values at limit plus one", async () => {
    const identity = matrixMetadata();
    const maxCase = exactCaseLimits(0, identity);
    const firstBodyRow = requiredItem(
      maxCase.bodyRows,
      0,
      "maximum-case body row",
    );
    const firstSweepRow = requiredItem(
      maxCase.sweepRows,
      0,
      "maximum-case sweep row",
    );
    await expect(
      run({
        metadata: identity,
        change: (index, current) =>
          index === 0
            ? { ...current, bodyRows: [...maxCase.bodyRows, firstBodyRow] }
            : current,
      }),
    ).rejects.toMatchObject({ code: "resourceLimit" });
    await expect(
      run({
        metadata: identity,
        change: (index, current) =>
          index === 0
            ? {
                ...current,
                contactRows: Array.from({ length: 8_193 }, () =>
                  contactRow(current.metadata.tuple),
                ),
              }
            : current,
      }),
    ).rejects.toMatchObject({ code: "resourceLimit" });
    await expect(
      run({
        metadata: identity,
        change: (index, current) =>
          index === 0
            ? { ...current, sweepRows: [...maxCase.sweepRows, firstSweepRow] }
            : current,
      }),
    ).rejects.toMatchObject({ code: "invalid" });
    await expect(
      run({
        metadata: identity,
        change: (index, current) =>
          index === 0
            ? {
                ...current,
                sweepRows: [...maxCase.sweepRows, firstSweepRow, firstSweepRow],
              }
            : current,
      }),
    ).rejects.toMatchObject({ code: "resourceLimit" });

    for (const metadataPatch of [
      { executeStepCalls: guard.workload.maximumExecuteStepCallsPerCase + 1 },
      { batches: guard.workload.maximumBatchesPerCase + 1 },
      { wallTimeMs: guard.workload.maximumWallTimePerCaseMs + 1 },
    ]) {
      await expect(
        run({
          metadata: identity,
          change: (index, current) =>
            index === 0
              ? {
                  ...current,
                  metadata: { ...current.metadata, ...metadataPatch },
                }
              : current,
        }),
      ).rejects.toMatchObject({ code: "resourceLimit" });
    }
  });

  it("waits for sink backpressure before consuming the next case", async () => {
    let releaseWrite!: () => void;
    const firstWrite = new Promise<void>((resolve) => {
      releaseWrite = resolve;
    });
    let writeCount = 0;
    let advancedPastFirstCase = false;
    const identity = matrixMetadata();
    const sink: LoftCoarseByteSink = {
      write: async (chunk) => {
        expect(chunk.byteLength).toBeLessThanOrEqual(256 * 1_024);
        writeCount += 1;
        if (writeCount === 1) await firstWrite;
      },
      abort: () => undefined,
    };
    async function* slowCases() {
      await Promise.resolve();
      yield exactCaseLimits(0, identity);
      advancedPastFirstCase = true;
      for (let index = 1; index < 24; index += 1) yield caseAt(index, identity);
    }
    const pending = writeLoftCoarseMatrix({
      metadata: identity,
      cases: slowCases(),
      sink,
      signal: new AbortController().signal,
    });
    while (writeCount === 0)
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(writeCount).toBe(1);
    expect(advancedPastFirstCase).toBe(false);
    releaseWrite();
    await pending;
    expect(advancedPastFirstCase).toBe(true);
  });

  it("aborts promptly when cancellation occurs during a pending sink write", async () => {
    const controller = new AbortController();
    const identity = matrixMetadata();
    let markStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    let releaseWrite!: () => void;
    const unresolvedWrite = new Promise<void>((resolve) => {
      releaseWrite = resolve;
    });
    const aborted: unknown[] = [];
    const sink: LoftCoarseByteSink = {
      write: () => {
        markStarted();
        return unresolvedWrite;
      },
      abort: (reason) => {
        aborted.push(reason);
      },
    };
    async function* firstMaximumCase() {
      await Promise.resolve();
      yield exactCaseLimits(0, identity);
      for (let index = 1; index < 24; index += 1) yield caseAt(index, identity);
    }
    const pending = writeLoftCoarseMatrix({
      metadata: identity,
      cases: firstMaximumCase(),
      sink,
      signal: controller.signal,
    });
    await started;
    controller.abort(new Error("cancel probe"));
    await expect(pending).rejects.toMatchObject({ code: "cancelled" });
    expect(aborted).toHaveLength(1);
    expect(requiredItem(aborted, 0, "abort reason")).toMatchObject({
      code: "cancelled",
    });
    releaseWrite();
  });

  it("rejects sink failures, attempts abort, and never reports success", async () => {
    const failure = new Error("disk write failed");
    const aborted: unknown[] = [];
    const identity = matrixMetadata();
    const sink: LoftCoarseByteSink = {
      write: () => {
        throw failure;
      },
      abort: (reason) => {
        aborted.push(reason);
      },
    };
    const cases = orderedCases(identity, (index, current) =>
      index === 0 ? exactCaseLimits(0, identity) : current,
    );
    await expect(
      writeLoftCoarseMatrix({
        metadata: identity,
        cases,
        sink,
        signal: new AbortController().signal,
      }),
    ).rejects.toBe(failure);
    expect(aborted).toEqual([failure]);
  });

  it("retains both operation and abort failures with the operation error as cause", async () => {
    const failure = new Error("disk write failed");
    const abortFailure = new Error("sink abort failed");
    const identity = matrixMetadata();
    const cases = () =>
      orderedCases(identity, (index, current) =>
        index === 0 ? exactCaseLimits(0, identity) : current,
      );
    const rejection = await writeLoftCoarseMatrix({
      metadata: identity,
      cases: cases(),
      sink: {
        write: () => {
          throw failure;
        },
        abort: () => {
          throw abortFailure;
        },
      },
      signal: new AbortController().signal,
    }).catch((error: unknown) => error);

    expect(rejection).toBeInstanceOf(AggregateError);
    if (!(rejection instanceof AggregateError))
      throw new Error("Expected both failures to be aggregated.");
    expect(rejection.errors).toEqual([failure, abortFailure]);
    expect(rejection.cause).toBe(failure);

    const undefinedAbortRejection = await writeLoftCoarseMatrix({
      metadata: identity,
      cases: cases(),
      sink: {
        write: () => {
          throw failure;
        },
        abort: () => {
          const erroredStream = new ReadableStream<void>({
            start(controller) {
              controller.error(undefined);
            },
          });
          return erroredStream.getReader().closed;
        },
      },
      signal: new AbortController().signal,
    }).catch((error: unknown) => error);

    expect(undefinedAbortRejection).toBeInstanceOf(AggregateError);
    if (!(undefinedAbortRejection instanceof AggregateError)) {
      throw new Error(
        "Expected an undefined abort failure to be retained in the aggregate.",
      );
    }
    expect(undefinedAbortRejection.errors).toEqual([failure, undefined]);
    expect(undefinedAbortRejection.cause).toBe(failure);
  });
});
