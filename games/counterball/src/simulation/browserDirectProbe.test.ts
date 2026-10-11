import { COUNTERBALL_CONFIG_V1, ENTITY_IDS } from "@korre/game-protocol";
import { describe, expect, it } from "vitest";
import {
  checkDiagnosticSweptEnvelope,
  cleanupDiagnosticResources,
  computeDiagnosticShiftedEnergy,
  createDiagnosticSweepGuard,
  deriveDiagnosticSweepPlan,
  errorWithCleanup,
  formatNativeMassMismatch,
  isDiagnosticShiftedEnergyWithinLimit,
  normalizeDiagnosticError,
  resourceGuard,
  type DiagnosticEnergyBody,
  type DiagnosticSweepPlanBody,
} from "./browserDirectProbe.js";

const gravity = Math.abs(COUNTERBALL_CONFIG_V1.simulation.gravity.y);
const maximumDrop = COUNTERBALL_CONFIG_V1.diagnosticGuard.maxRestHeightDrop;
const maximumEnergy = COUNTERBALL_CONFIG_V1.diagnosticGuard.maxMechanicalEnergy;

describe("browser direct diagnostic mass message", () => {
  it("prints all mass values without precision loss", () => {
    expect(
      formatNativeMassMismatch(
        "button",
        0.15,
        0.15000000000000002,
        1.4210854715202004e-14,
      ),
    ).toBe(
      "Body button native mass 0.15000000000000002 differs from canonical configured mass 0.15 (absolute difference 2.7755575615628914e-17; tolerance 1.4210854715202004e-14).",
    );
  });
});

function makeEnergyBodies(): DiagnosticEnergyBody[] {
  return ENTITY_IDS.map((id) => {
    const isButton = id === "button";
    const radius = isButton
      ? COUNTERBALL_CONFIG_V1.geometry.buttonRadius
      : COUNTERBALL_CONFIG_V1.geometry.capRadius;
    const height = isButton
      ? COUNTERBALL_CONFIG_V1.geometry.buttonThickness
      : COUNTERBALL_CONFIG_V1.geometry.capHeight;
    return {
      mass: isButton
        ? COUNTERBALL_CONFIG_V1.bodies.buttonMass
        : COUNTERBALL_CONFIG_V1.bodies.capMass,
      inertiaUnitMass: {
        x: (3 * radius * radius + height * height) / 12,
        y: (radius * radius) / 2,
        z: (3 * radius * radius + height * height) / 12,
      },
      centerOfMassY: 0.06,
      restY: 0.06,
      linearVelocity: { x: 0, y: 0, z: 0 },
      angularVelocityPrincipal: { x: 0, y: 0, z: 0 },
    };
  });
}

function makeSweepPlanBodies(): DiagnosticSweepPlanBody[] {
  return makeEnergyBodies().map((body, index) => {
    const isButton = ENTITY_IDS[index] === "button";
    const radius = isButton
      ? COUNTERBALL_CONFIG_V1.geometry.buttonRadius
      : COUNTERBALL_CONFIG_V1.geometry.capRadius;
    const height = isButton
      ? COUNTERBALL_CONFIG_V1.geometry.buttonThickness
      : COUNTERBALL_CONFIG_V1.geometry.capHeight;
    return {
      mass: body.mass,
      minimumUnitInertia: Math.min(
        body.inertiaUnitMass.x,
        body.inertiaUnitMass.y,
        body.inertiaUnitMass.z,
      ),
      maximumUnitInertia: Math.max(
        body.inertiaUnitMass.x,
        body.inertiaUnitMass.y,
        body.inertiaUnitMass.z,
      ),
      farthestPointRadius: Math.hypot(radius, height / 2),
    };
  });
}

describe("browser direct diagnostic guard math", () => {
  it("uses the lower permitted COM height as the shifted potential reference", () => {
    const bodies = makeEnergyBodies();
    const { kineticEnergy, shiftedMechanicalEnergy } =
      computeDiagnosticShiftedEnergy(bodies, gravity, maximumDrop);

    expect(kineticEnergy).toBe(0);
    expect(shiftedMechanicalEnergy).toBeCloseTo(1.561629375, 12);

    const impulseTarget = 32;
    const selected = bodies[1];
    if (selected === undefined)
      throw new Error("Selected cap fixture is missing.");
    selected.linearVelocity.x = Math.sqrt((2 * impulseTarget) / selected.mass);
    const afterImpulse = computeDiagnosticShiftedEnergy(
      bodies,
      gravity,
      maximumDrop,
    );
    expect(afterImpulse.kineticEnergy).toBeCloseTo(32, 12);
    expect(afterImpulse.shiftedMechanicalEnergy).toBeCloseTo(33.561629375, 12);
    expect(
      isDiagnosticShiftedEnergyWithinLimit(
        afterImpulse.shiftedMechanicalEnergy,
        maximumEnergy,
      ),
    ).toBe(true);
  });

  it("accepts exactly the selected energy limit and rejects the next representable excess", () => {
    expect(isDiagnosticShiftedEnergyWithinLimit(34, 34)).toBe(true);
    expect(
      isDiagnosticShiftedEnergyWithinLimit(34 + Number.EPSILON * 34, 34),
    ).toBe(false);
    expect(
      isDiagnosticShiftedEnergyWithinLimit(Number.POSITIVE_INFINITY, 34),
    ).toBe(false);
  });

  it("accepts the exact per-body drop boundary and rejects any further drop", () => {
    const atBoundary = makeEnergyBodies();
    const first = atBoundary[0];
    if (first === undefined) throw new Error("Fixture body is missing.");
    first.centerOfMassY = first.restY - maximumDrop;
    expect(() =>
      computeDiagnosticShiftedEnergy(atBoundary, gravity, maximumDrop),
    ).not.toThrow();

    first.centerOfMassY -= Number.EPSILON * 4;
    expect(() =>
      computeDiagnosticShiftedEnergy(atBoundary, gravity, maximumDrop),
    ).toThrow(/below its permitted rest-height drop/);
  });

  it("rejects malformed native mass, inertia, pose, and velocity values", () => {
    const corruptions: Array<(body: DiagnosticEnergyBody) => void> = [
      (body) => {
        body.mass = Number.NaN;
      },
      (body) => {
        body.inertiaUnitMass.y = 0;
      },
      (body) => {
        body.centerOfMassY = Number.POSITIVE_INFINITY;
      },
      (body) => {
        body.linearVelocity.z = Number.NaN;
      },
      (body) => {
        body.angularVelocityPrincipal.x = Number.NEGATIVE_INFINITY;
      },
    ];

    for (const corrupt of corruptions) {
      const bodies = makeEnergyBodies();
      const first = bodies[0];
      if (first === undefined) throw new Error("Fixture body is missing.");
      corrupt(first);
      expect(() =>
        computeDiagnosticShiftedEnergy(bodies, gravity, maximumDrop),
      ).toThrow(RangeError);
    }
  });

  it("uses 48 full-precision substeps and fails closed when 49 are required", () => {
    const guard = createDiagnosticSweepGuard(COUNTERBALL_CONFIG_V1);
    const planBodies = makeSweepPlanBodies();
    const plan = deriveDiagnosticSweepPlan(
      planBodies,
      COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds,
      guard,
    );

    expect(plan.substepsPerTick).toBe(48);
    expect(plan.maximumPointSweep).toBeLessThanOrEqual(
      guard.maxPointSweepPerSubstep,
    );
    expect(plan.maximumRotationSweep).toBeLessThanOrEqual(
      guard.maxRotationPerSubstep,
    );

    const lessInertButton = planBodies.map((body, index) =>
      ENTITY_IDS[index] === "button"
        ? { ...body, minimumUnitInertia: 0.004 }
        : body,
    );
    expect(() =>
      deriveDiagnosticSweepPlan(
        lessInertButton,
        COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds,
        guard,
      ),
    ).toThrow(/exceed the hashed guard/);
  });

  it("allows exact swept-apron contact at the limit and rejects an outside epsilon", () => {
    const sweptBody = {
      centerOfMass: { x: 3, y: 1, z: 0 },
      originY: 1,
      axisY: 1,
      radius: 0.25,
      height: 0.25,
      farthestPointRadius: 0.5,
      restY: 1,
      linearSpeedBound: 0.5,
      pointSpeedBound: 0.5,
    };
    const limits = {
      deltaSeconds: 1,
      pitchWidth: 2,
      pitchLength: 2,
      supportApronMargin: 3,
      surfaceUnderside: -100,
      maxRestHeightDrop: 0.01125,
    };

    expect(
      checkDiagnosticSweptEnvelope(
        { ...sweptBody, linearSpeedBound: 0 },
        limits,
      ).apronClearance,
    ).toBe(0);
    expect(() =>
      checkDiagnosticSweptEnvelope(
        {
          ...sweptBody,
          centerOfMass: { x: 3.000001, y: 1, z: 0 },
          linearSpeedBound: 0,
        },
        limits,
      ),
    ).toThrow(/swept guard would be crossed/);
  });

  it("rejects a conservative COM drop that crosses the separate rest-height limit", () => {
    const body = {
      centerOfMass: { x: 0, y: 1, z: 0 },
      originY: 1,
      axisY: 1,
      radius: 0.25,
      height: 0.25,
      farthestPointRadius: 0.5,
      restY: 1,
      linearSpeedBound: 0.02,
      pointSpeedBound: 0,
    };
    expect(() =>
      checkDiagnosticSweptEnvelope(body, {
        deltaSeconds: 1,
        pitchWidth: 12,
        pitchLength: 20,
        supportApronMargin: 325,
        surfaceUnderside: -100,
        maxRestHeightDrop: maximumDrop,
      }),
    ).toThrow(/swept guard would be crossed/);
  });

  it("assembles all six sweep limits from the frozen outer guard", () => {
    expect(createDiagnosticSweepGuard(COUNTERBALL_CONFIG_V1)).toEqual({
      maxMechanicalEnergy: 34,
      maxRestHeightDrop: 0.01125,
      supportApronMargin: 325,
      maxPointSweepPerSubstep: 0.01125,
      maxRotationPerSubstep: Math.PI / 8,
      maxSubstepsPerTick: 48,
    });
  });
});

describe("browser direct diagnostic error codes", () => {
  it("maps guard RangeErrors to resourceLimit while preserving typed failures", () => {
    const rangeFailure = new RangeError("unsupported swept interval");
    let normalized: unknown;
    try {
      resourceGuard(() => {
        throw rangeFailure;
      });
    } catch (error) {
      normalized = error;
    }
    expect(normalized).toBeInstanceOf(Error);
    const guardError = normalized as Error & { code?: string; cause?: unknown };
    expect(guardError.code).toBe("resourceLimit");
    expect(guardError.cause).toBe(rangeFailure);

    const cancellation = Object.assign(new Error("cancelled"), {
      code: "cancelled" as const,
    });
    expect(normalizeDiagnosticError(cancellation, "resourceLimit")).toBe(
      cancellation,
    );
  });

  it("normalizes unexpected failures and retains the selected code through cleanup errors", () => {
    const unexpected = new Error("unexpected setup failure");
    const initialization = normalizeDiagnosticError(
      unexpected,
      "initialization",
    );
    expect(initialization.code).toBe("initialization");
    expect(initialization.cause).toBe(unexpected);

    const resourceFailure = normalizeDiagnosticError(
      new RangeError("unsupported guard inputs"),
      "resourceLimit",
    );
    const combined = errorWithCleanup(resourceFailure, [
      new Error("cleanup failure"),
    ]);
    expect(combined.code).toBe("resourceLimit");
  });
});

describe("browser direct diagnostic cleanup ordering", () => {
  it("restores before releasing the apron on the normal path", () => {
    const order: string[] = [];
    const errors = cleanupDiagnosticResources({
      removeObservers: [() => order.push("observer")],
      replacementAttached: true,
      restoreSurface: () => order.push("restore"),
      disposeReplacement: () => order.push("replacement"),
      disposeWorld: () => order.push("world"),
    });

    expect(errors).toEqual([]);
    expect(order).toEqual(["observer", "restore", "replacement", "world"]);
  });

  it("keeps the replacement alive until world teardown after restore failure", () => {
    const order: string[] = [];
    const restoreError = new Error("restore failed");
    const errors = cleanupDiagnosticResources({
      removeObservers: [],
      replacementAttached: true,
      restoreSurface: () => {
        order.push("restore");
        throw restoreError;
      },
      disposeReplacement: () => order.push("replacement"),
      disposeWorld: () => order.push("world"),
    });

    expect(errors).toEqual([restoreError]);
    expect(order).toEqual(["restore", "world", "replacement"]);
  });

  it("does not release the replacement when world teardown fails", () => {
    const order: string[] = [];
    const restoreError = new Error("restore failed");
    const teardownError = new Error("world teardown failed");
    const errors = cleanupDiagnosticResources({
      removeObservers: [],
      replacementAttached: true,
      restoreSurface: () => {
        order.push("restore");
        throw restoreError;
      },
      disposeReplacement: () => order.push("replacement"),
      disposeWorld: () => {
        order.push("world");
        throw teardownError;
      },
    });

    expect(errors).toEqual([restoreError, teardownError]);
    expect(order).toEqual(["restore", "world"]);
  });
});
