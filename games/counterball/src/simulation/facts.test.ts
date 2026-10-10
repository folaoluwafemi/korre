import {
  COUNTERBALL_CONFIG_V1,
  COUNTERBALL_PROTOCOL_LIMITS,
  ENTITY_IDS,
  type CounterballConfig,
  type EntityId,
  type PlaybackTransform,
  type Quat,
  type SimulationFact,
  type Vec3,
} from "@korre/game-protocol";
import { describe, expect, it } from "vitest";
import {
  deriveSimulationFacts,
  type PhysicsContactStart,
  type PhysicsStepObservation,
} from "./facts.js";

type PoseOverride = { position?: Vec3; rotation?: Quat };
type PoseOverrides = Partial<Record<EntityId, PoseOverride>>;

function createBodies(overrides: PoseOverrides = {}): PlaybackTransform[] {
  return ENTITY_IDS.map((id) => {
    const position =
      id === "button"
        ? {
            x: 0,
            y:
              COUNTERBALL_CONFIG_V1.geometry.surfaceY +
              COUNTERBALL_CONFIG_V1.geometry.buttonThickness / 2,
            z: 0,
          }
        : {
            x: 0,
            y:
              COUNTERBALL_CONFIG_V1.geometry.surfaceY +
              COUNTERBALL_CONFIG_V1.geometry.capHeight / 2,
            z: id.startsWith("home-") ? -3 : 3,
          };
    const override = overrides[id];
    return {
      id,
      position: override?.position === undefined ? position : { ...override.position },
      rotation:
        override?.rotation === undefined
          ? { x: 0, y: 0, z: 0, w: 1 }
          : { ...override.rotation },
    };
  });
}

function createObservation(
  step: number,
  timeMs: number,
  overrides: PoseOverrides = {},
  contactStarts: readonly PhysicsContactStart[] = [],
): PhysicsStepObservation {
  return {
    step,
    timeMs,
    bodies: createBodies(overrides),
    contactStarts,
  };
}

function rotationAboutZ(degrees: number): Quat {
  const halfAngle = (degrees * Math.PI) / 360;
  return {
    x: 0,
    y: 0,
    z: Math.sin(halfAngle),
    w: Math.cos(halfAngle),
  };
}

function rotationAboutY(degrees: number): Quat {
  const halfAngle = (degrees * Math.PI) / 360;
  return {
    x: 0,
    y: Math.sin(halfAngle),
    z: 0,
    w: Math.cos(halfAngle),
  };
}

function expectFiniteProtocolFacts(facts: readonly SimulationFact[]): void {
  expect(facts.length).toBeLessThanOrEqual(
    COUNTERBALL_PROTOCOL_LIMITS.maxSimulationFactsPerShot,
  );
  expect(JSON.parse(JSON.stringify(facts))).toEqual(facts);
  for (const fact of facts) {
    expect(Object.getPrototypeOf(fact)).toBe(Object.prototype);
    expect(Number.isSafeInteger(fact.step)).toBe(true);
    expect(fact.step).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(fact.timeMs)).toBe(true);
    expect(fact.timeMs).toBeGreaterThanOrEqual(0);
    expect(Object.getPrototypeOf(fact.point)).toBe(Object.prototype);
    expect(
      [fact.point.x, fact.point.y, fact.point.z].every(Number.isFinite),
    ).toBe(true);

    if (fact.type === "contact") {
      expect(ENTITY_IDS.includes(fact.a)).toBe(true);
      expect(ENTITY_IDS.includes(fact.b)).toBe(true);
      expect(ENTITY_IDS.indexOf(fact.a)).toBeLessThan(ENTITY_IDS.indexOf(fact.b));
    } else {
      expect(ENTITY_IDS.includes(fact.entity)).toBe(true);
      expect(["left", "right", "homeEnd", "awayEnd"]).toContain(
        fact.boundary,
      );
      expect(["goal", "out"]).toContain(fact.kind);
    }
  }
}

function crossingFacts(
  facts: readonly SimulationFact[],
): Extract<SimulationFact, { type: "crossing" }>[] {
  expectFiniteProtocolFacts(facts);
  return facts.filter(
    (fact): fact is Extract<SimulationFact, { type: "crossing" }> =>
      fact.type === "crossing",
  );
}

function firstCrossing(facts: readonly SimulationFact[]) {
  const crossing = crossingFacts(facts)[0];
  if (crossing === undefined) {
    throw new Error("Expected a crossing fact.");
  }
  return crossing;
}

function boundaryGeometry(
  boundary: "left" | "right" | "homeEnd" | "awayEnd",
  config: Readonly<CounterballConfig> = COUNTERBALL_CONFIG_V1,
): { axis: "x" | "z"; plane: number; inwardSign: 1 | -1 } {
  switch (boundary) {
    case "left":
      return {
        axis: "x",
        plane: -config.geometry.pitchWidth / 2,
        inwardSign: 1,
      };
    case "right":
      return {
        axis: "x",
        plane: config.geometry.pitchWidth / 2,
        inwardSign: -1,
      };
    case "homeEnd":
      return {
        axis: "z",
        plane: -config.geometry.pitchLength / 2,
        inwardSign: 1,
      };
    case "awayEnd":
      return {
        axis: "z",
        plane: config.geometry.pitchLength / 2,
        inwardSign: -1,
      };
  }
}

function crossingPair(
  entity: EntityId,
  boundary: "left" | "right" | "homeEnd" | "awayEnd",
  config: Readonly<CounterballConfig> = COUNTERBALL_CONFIG_V1,
  extraOverrides: PoseOverrides = {},
): [PhysicsStepObservation, PhysicsStepObservation] {
  const { axis, plane, inwardSign } = boundaryGeometry(boundary, config);
  const radius =
    entity === "button"
      ? config.geometry.buttonRadius
      : config.geometry.capRadius;
  const offset = radius + 0.05;
  const startPosition = {
    x: 0,
    y:
      entity === "button"
        ? config.geometry.surfaceY + config.geometry.buttonThickness / 2
        : config.geometry.surfaceY + config.geometry.capHeight / 2,
    z: 0,
    ...extraOverrides[entity]?.position,
  };
  const startCoordinate = plane + inwardSign * offset;
  const endCoordinate = plane - inwardSign * offset;
  const endPosition = { ...startPosition };
  startPosition[axis] = startCoordinate;
  endPosition[axis] = endCoordinate;
  const intervalMs = config.simulation.fixedStepSeconds * 1_000;
  return [
    createObservation(0, 0, {
      ...extraOverrides,
      [entity]: {
        ...extraOverrides[entity],
        position: startPosition,
      },
    }),
    createObservation(1, intervalMs, {
      ...extraOverrides,
      [entity]: {
        ...extraOverrides[entity],
        position: endPosition,
      },
    }),
  ];
}

describe("pure simulation fact derivation", () => {
  it("normalizes contacts for every canonical ID and returns plain finite facts", () => {
    const contacts: PhysicsContactStart[] = ENTITY_IDS.map((id, index) => ({
      a: id,
      b: ENTITY_IDS[(index + 1) % ENTITY_IDS.length]!,
      point: { x: index / 10, y: 0.2, z: -index / 5 },
    }));
    const facts = deriveSimulationFacts(
      [
        createObservation(0, 0),
        createObservation(
          1,
          COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds * 1_000,
          {},
          contacts,
        ),
      ],
      COUNTERBALL_CONFIG_V1,
    );

    const contactFacts = facts.filter((fact) => fact.type === "contact");
    expectFiniteProtocolFacts(facts);
    expect(contactFacts).toHaveLength(ENTITY_IDS.length);
    for (const fact of contactFacts) {
      expect(ENTITY_IDS.includes(fact.a)).toBe(true);
      expect(ENTITY_IDS.includes(fact.b)).toBe(true);
      expect(ENTITY_IDS.indexOf(fact.a)).toBeLessThan(ENTITY_IDS.indexOf(fact.b));
      expect(Object.getPrototypeOf(fact)).toBe(Object.prototype);
      expect(Object.getPrototypeOf(fact.point)).toBe(Object.prototype);
      expect(Object.keys(fact).sort()).toEqual([
        "a",
        "b",
        "point",
        "step",
        "timeMs",
        "type",
      ]);
      expect([fact.step, fact.timeMs, fact.point.x, fact.point.y, fact.point.z].every(Number.isFinite)).toBe(true);
    }

    const json = JSON.stringify(facts);
    expect(JSON.parse(json)).toEqual(facts);
    expect(facts.length).toBeLessThanOrEqual(
      COUNTERBALL_PROTOCOL_LIMITS.maxSimulationFactsPerShot,
    );
  });

  it("sorts exact contact ties independently of callback insertion order", () => {
    const contacts: PhysicsContactStart[] = [
      { a: "away-2", b: "home-5", point: { x: 1, y: 0, z: 0 } },
      { a: "away-0", b: "button", point: { x: 0, y: 0, z: 1 } },
      { a: "home-3", b: "button", point: { x: 0, y: 1, z: 0 } },
    ];
    const timeMs = COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds * 1_000;
    const forward = deriveSimulationFacts(
      [createObservation(0, 0), createObservation(1, timeMs, {}, contacts)],
      COUNTERBALL_CONFIG_V1,
    );
    const reverse = deriveSimulationFacts(
      [
        createObservation(0, 0),
        createObservation(1, timeMs, {}, [...contacts].reverse()),
      ],
      COUNTERBALL_CONFIG_V1,
    );

    expectFiniteProtocolFacts(forward);
    expectFiniteProtocolFacts(reverse);
    expect(forward).toEqual(reverse);
    expect(forward.map((fact) => fact.type === "contact" && [fact.a, fact.b])).toEqual([
      ["button", "away-0"],
      ["button", "home-3"],
      ["home-5", "away-2"],
    ]);
  });

  it("does not mutate observations, contact points, config, or source poses", () => {
    const contacts: PhysicsContactStart[] = [
      { a: "home-0", b: "button", point: { x: 1, y: 2, z: 3 } },
    ];
    const observations = [
      createObservation(0, 0),
      createObservation(
        1,
        COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds * 1_000,
        {},
        contacts,
      ),
    ];
    const before = JSON.stringify({ observations, config: COUNTERBALL_CONFIG_V1 });
    const facts = deriveSimulationFacts(observations, COUNTERBALL_CONFIG_V1);
    expectFiniteProtocolFacts(facts);
    const contact = facts.find((fact) => fact.type === "contact");
    if (contact?.type !== "contact") {
      throw new Error("Expected the contact input to produce a fact.");
    }
    contact.point.x = 99;

    expect(JSON.stringify({ observations, config: COUNTERBALL_CONFIG_V1 })).toBe(
      before,
    );
  });

  it.each([
    { entity: "button" as const, boundary: "left" as const, kind: "out" as const },
    { entity: "button" as const, boundary: "right" as const, kind: "out" as const },
    { entity: "button" as const, boundary: "homeEnd" as const, kind: "goal" as const },
    { entity: "button" as const, boundary: "awayEnd" as const, kind: "goal" as const },
    { entity: "home-0" as const, boundary: "left" as const, kind: "out" as const },
    { entity: "home-1" as const, boundary: "right" as const, kind: "out" as const },
    { entity: "away-0" as const, boundary: "homeEnd" as const, kind: "out" as const },
    { entity: "away-1" as const, boundary: "awayEnd" as const, kind: "out" as const },
  ])("reports a whole-body $entity crossing at $boundary", (fixture) => {
    const [before, after] = crossingPair(fixture.entity, fixture.boundary);
    const crossing = firstCrossing(
      deriveSimulationFacts([before, after], COUNTERBALL_CONFIG_V1),
    );
    const { axis, plane } = boundaryGeometry(fixture.boundary);

    expect(crossing).toMatchObject({
      entity: fixture.entity,
      boundary: fixture.boundary,
      kind: fixture.kind,
      step: after.step,
    });
    expect(crossing.point[axis]).toBeCloseTo(plane, 10);
  });

  it("sweeps a fast whole-button exit between the recorded endpoints", () => {
    const intervalMs = COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds * 1_000;
    const boundary = boundaryGeometry("right");
    const startX = 4;
    const endX = 8;
    const buttonRadius = COUNTERBALL_CONFIG_V1.geometry.buttonRadius;
    const trailingEdgeExitX = boundary.plane + buttonRadius;
    const facts = deriveSimulationFacts(
      [
        createObservation(0, 0, {
          button: { position: { x: startX, y: 0.0225, z: 0 } },
        }),
        createObservation(1, intervalMs, {
          button: { position: { x: endX, y: 0.0225, z: 0 } },
        }),
      ],
      COUNTERBALL_CONFIG_V1,
    );
    const crossing = firstCrossing(facts);

    expect(crossing.boundary).toBe("right");
    expect(crossing.kind).toBe("out");
    expect(crossing.timeMs).toBeCloseTo(
      ((trailingEdgeExitX - startX) / (endX - startX)) * intervalMs,
      10,
    );
    expect(crossing.point.x).toBeCloseTo(boundary.plane, 10);
  });

  it("waits until the trailing support clears after partial entry", () => {
    const intervalMs = COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds * 1_000;
    const boundary = boundaryGeometry("right");
    const buttonRadius = COUNTERBALL_CONFIG_V1.geometry.buttonRadius;
    const partial = deriveSimulationFacts(
      [
        createObservation(0, 0, {
          button: { position: { x: 5.7, y: 0.0225, z: 0 } },
        }),
        createObservation(1, intervalMs, {
          button: { position: { x: 6.05, y: 0.0225, z: 0 } },
        }),
      ],
      COUNTERBALL_CONFIG_V1,
    );
    const fullyExited = deriveSimulationFacts(
      [
        createObservation(0, 0, {
          button: { position: { x: 5.7, y: 0.0225, z: 0 } },
        }),
        createObservation(1, intervalMs, {
          button: { position: { x: 6.05, y: 0.0225, z: 0 } },
        }),
        createObservation(2, intervalMs * 2, {
          button: {
            position: {
              x: boundary.plane + buttonRadius + 0.02,
              y: 0.0225,
              z: 0,
            },
          },
        }),
      ],
      COUNTERBALL_CONFIG_V1,
    );

    expect(crossingFacts(partial)).toEqual([]);
    expect(firstCrossing(fullyExited).step).toBe(2);
  });

  it("keeps a goal-mouth decision when the center crossed in an earlier substep", () => {
    const intervalMs = COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds * 1_000;
    const facts = deriveSimulationFacts(
      [
        createObservation(0, 0, {
          button: { position: { x: 0, y: 0.0225, z: 9.8 } },
        }),
        createObservation(1, intervalMs, {
          button: { position: { x: 0, y: 0.0225, z: 10.05 } },
        }),
        createObservation(2, intervalMs * 2, {
          button: { position: { x: 0, y: 0.0225, z: 10.2 } },
        }),
      ],
      COUNTERBALL_CONFIG_V1,
    );

    const crossing = firstCrossing(facts);
    expect(crossing.boundary).toBe("awayEnd");
    expect(crossing.kind).toBe("goal");
    expect(crossing.step).toBe(2);
  });

  it("rejects sideways drift out of the post opening during the full passage", () => {
    const intervalMs = COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds * 1_000;
    const facts = deriveSimulationFacts(
      [
        createObservation(0, 0, {
          button: { position: { x: 1, y: 0.0225, z: 9.8 } },
        }),
        createObservation(1, intervalMs, {
          button: { position: { x: 1, y: 0.0225, z: 10.05 } },
        }),
        createObservation(2, intervalMs * 2, {
          button: { position: { x: 1.05, y: 0.0225, z: 10.2 } },
        }),
      ],
      COUNTERBALL_CONFIG_V1,
    );

    const crossing = firstCrossing(facts);
    expect(crossing.boundary).toBe("awayEnd");
    expect(crossing.kind).toBe("out");
    expect(crossing.step).toBe(2);
  });

  it("rejects upward drift over the crossbar during the full passage", () => {
    const intervalMs = COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds * 1_000;
    const facts = deriveSimulationFacts(
      [
        createObservation(0, 0, {
          button: { position: { x: 0, y: 0.0225, z: 9.8 } },
        }),
        createObservation(1, intervalMs, {
          button: { position: { x: 0, y: 0.0225, z: 10.05 } },
        }),
        createObservation(2, intervalMs * 2, {
          button: { position: { x: 0, y: 1.5, z: 10.2 } },
        }),
      ],
      COUNTERBALL_CONFIG_V1,
    );

    const crossing = firstCrossing(facts);
    expect(crossing.boundary).toBe("awayEnd");
    expect(crossing.kind).toBe("out");
    expect(crossing.step).toBe(2);
  });

  it("uses quaternion orientation when deriving whole-button support", () => {
    const intervalMs = COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds * 1_000;
    const uprightAcrossX: Quat = {
      x: 0,
      y: 0,
      z: Math.SQRT1_2,
      w: Math.SQRT1_2,
    };
    const flat = deriveSimulationFacts(
      [
        createObservation(0, 0, {
          button: { position: { x: 5.84, y: 0.0225, z: 0 } },
        }),
        createObservation(1, intervalMs, {
          button: { position: { x: 6.08, y: 0.0225, z: 0 } },
        }),
      ],
      COUNTERBALL_CONFIG_V1,
    );
    const tilted = deriveSimulationFacts(
      [
        createObservation(0, 0, {
          button: {
            position: { x: 5.84, y: 0.0225, z: 0 },
            rotation: uprightAcrossX,
          },
        }),
        createObservation(1, intervalMs, {
          button: {
            position: { x: 6.08, y: 0.0225, z: 0 },
            rotation: uprightAcrossX,
          },
        }),
      ],
      COUNTERBALL_CONFIG_V1,
    );

    expect(crossingFacts(flat)).toEqual([]);
    expect(firstCrossing(tilted).boundary).toBe("right");
  });

  it("finds the rotational exit when both interval endpoint clearances are positive", () => {
    const intervalMs = COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds * 1_000;
    const { buttonRadius, buttonThickness, pitchWidth } =
      COUNTERBALL_CONFIG_V1.geometry;
    const clearanceAt = (degrees: number): number => {
      const radians = (degrees * Math.PI) / 180;
      const support =
        buttonRadius * Math.abs(Math.cos(radians)) +
        (buttonThickness / 2) * Math.abs(Math.sin(radians));
      return pitchWidth / 2 - 6.03 + support;
    };
    expect(clearanceAt(85)).toBeGreaterThan(0);
    expect(clearanceAt(95)).toBeGreaterThan(0);
    expect(clearanceAt(90)).toBeLessThan(0);

    const facts = deriveSimulationFacts(
      [
        createObservation(0, 0, {
          button: { position: { x: 5.8, y: 0.0225, z: 0 } },
        }),
        createObservation(1, intervalMs, {
          button: {
            position: { x: 6.03, y: 0.0225, z: 0 },
            rotation: rotationAboutZ(85),
          },
        }),
        createObservation(2, intervalMs * 2, {
          button: {
            position: { x: 6.03, y: 0.0225, z: 0 },
            rotation: rotationAboutZ(95),
          },
        }),
      ],
      COUNTERBALL_CONFIG_V1,
    );

    const crossing = firstCrossing(facts);
    expect(crossing.boundary).toBe("right");
    expect(crossing.kind).toBe("out");
    expect(crossing.step).toBe(2);
    expect(crossing.timeMs).toBeGreaterThan(intervalMs);
    expect(crossing.timeMs).toBeLessThan(intervalMs * 1.5);
  });

  it("finds one earliest right exit through an ordinary vertical-axis yaw", () => {
    const intervalMs = COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds * 1_000;
    const facts = deriveSimulationFacts(
      [
        createObservation(0, 0, {
          button: { position: { x: 5.8, y: 0.0225, z: 0 } },
        }),
        createObservation(1, intervalMs, {
          button: { position: { x: 6.12, y: 0.0225, z: 0 } },
        }),
        createObservation(2, intervalMs * 2, {
          button: {
            position: { x: 6.14, y: 0.0225, z: 0 },
            rotation: rotationAboutY(10),
          },
        }),
      ],
      COUNTERBALL_CONFIG_V1,
    );
    const rightOuts = crossingFacts(facts).filter(
      (crossing) =>
        crossing.entity === "button" &&
        crossing.boundary === "right" &&
        crossing.kind === "out",
    );

    expect(rightOuts).toHaveLength(1);
    expect(rightOuts[0]?.step).toBe(2);
    expect(rightOuts[0]?.timeMs).toBeCloseTo(intervalMs * 1.5, 6);
  });

  it("latches the earliest descending root when a rotation interval has multiple roots", () => {
    const intervalMs = COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds * 1_000;
    const { buttonRadius, buttonThickness, pitchWidth } =
      COUNTERBALL_CONFIG_V1.geometry;
    const clearanceAt = (degrees: number): number => {
      const radians = (degrees * Math.PI) / 180;
      const support =
        buttonRadius * Math.abs(Math.cos(radians)) +
        (buttonThickness / 2) * Math.abs(Math.sin(radians));
      return pitchWidth / 2 - 6.03 + support;
    };
    expect(clearanceAt(80)).toBeGreaterThan(0);
    expect(clearanceAt(100)).toBeGreaterThan(0);
    expect(clearanceAt(90)).toBeLessThan(0);

    const facts = deriveSimulationFacts(
      [
        createObservation(0, 0, {
          button: { position: { x: 5.8, y: 0.0225, z: 0 } },
        }),
        createObservation(1, intervalMs, {
          button: {
            position: { x: 6.03, y: 0.0225, z: 0 },
            rotation: rotationAboutZ(80),
          },
        }),
        createObservation(2, intervalMs * 2, {
          button: {
            position: { x: 6.03, y: 0.0225, z: 0 },
            rotation: rotationAboutZ(100),
          },
        }),
        createObservation(3, intervalMs * 3, {
          button: {
            position: { x: 6.03, y: 0.0225, z: 0 },
            rotation: rotationAboutZ(80),
          },
        }),
      ],
      COUNTERBALL_CONFIG_V1,
    );

    const crossings = crossingFacts(facts).filter(
      (crossing) => crossing.entity === "button" && crossing.boundary === "right",
    );
    expect(crossings).toHaveLength(1);
    expect(crossings[0]?.kind).toBe("out");
    expect(crossings[0]?.step).toBe(2);
    expect(crossings[0]?.timeMs).toBeLessThan(intervalMs * 1.5);
  });

  it.each([
    { label: "centered clear passage", x: 0, y: 0.0225, kind: "goal" },
    { label: "outside the post opening", x: 1.2, y: 0.0225, kind: "out" },
    {
      label: "exact post tangency",
      x:
        COUNTERBALL_CONFIG_V1.geometry.goalWidth / 2 -
        COUNTERBALL_CONFIG_V1.geometry.goalFrameRadius -
        COUNTERBALL_CONFIG_V1.geometry.buttonRadius,
      y: 0.0225,
      kind: "out",
    },
    {
      label: "exact crossbar tangency",
      x: 0,
      y:
        COUNTERBALL_CONFIG_V1.geometry.surfaceY +
        COUNTERBALL_CONFIG_V1.geometry.goalHeight -
        COUNTERBALL_CONFIG_V1.geometry.goalFrameRadius -
        COUNTERBALL_CONFIG_V1.geometry.buttonThickness / 2,
      kind: "out",
    },
  ])("classifies $label using the entire oriented button", (fixture) => {
    const [before, after] = crossingPair("button", "awayEnd", undefined, {
      button: { position: { x: fixture.x, y: fixture.y, z: 0 } },
    });
    const crossing = firstCrossing(
      deriveSimulationFacts([before, after], COUNTERBALL_CONFIG_V1),
    );

    expect(crossing.kind).toBe(fixture.kind);
  });

  it("emits exact corner ties in stable boundary order", () => {
    const intervalMs = COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds * 1_000;
    const facts = deriveSimulationFacts(
      [
        createObservation(0, 0, {
          button: { position: { x: 5.8, y: 0.0225, z: 9.8 } },
        }),
        createObservation(1, intervalMs, {
          button: { position: { x: 6.2, y: 0.0225, z: 10.2 } },
        }),
      ],
      COUNTERBALL_CONFIG_V1,
    );
    const crossings = crossingFacts(facts);

    expect(crossings.map(({ boundary }) => boundary)).toEqual([
      "right",
      "awayEnd",
    ]);
    expect(crossings[0]?.timeMs).toBeCloseTo(crossings[1]?.timeMs ?? -1, 12);
  });

  it("orders same-step contacts before crossings for attribution", () => {
    const intervalMs = COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds * 1_000;
    const facts = deriveSimulationFacts(
      [
        createObservation(0, 0, {
          button: { position: { x: 0, y: 0.0225, z: 9.7 } },
        }),
        createObservation(
          1,
          intervalMs,
          { button: { position: { x: 0, y: 0.0225, z: 10.5 } } },
          [{ a: "away-0", b: "button", point: { x: 0.1, y: 0.1, z: 9.9 } }],
        ),
      ],
      COUNTERBALL_CONFIG_V1,
    );

    expectFiniteProtocolFacts(facts);
    expect(facts.map((fact) => fact.type)).toEqual(["contact", "crossing"]);
    expect(facts[0]?.timeMs).toBeGreaterThan(facts[1]?.timeMs ?? Number.POSITIVE_INFINITY);
  });

  it("rejects invalid history and bounds output to the protocol fact limit", () => {
    const intervalMs = COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds * 1_000;
    expect(() => deriveSimulationFacts([], COUNTERBALL_CONFIG_V1)).toThrow(
      TypeError,
    );
    expect(() =>
      deriveSimulationFacts(
        [
          createObservation(0, 0),
          createObservation(0, 0),
        ],
        COUNTERBALL_CONFIG_V1,
      ),
    ).toThrow(TypeError);

    const tooManyContacts = Array.from(
      { length: COUNTERBALL_PROTOCOL_LIMITS.maxSimulationFactsPerShot + 1 },
      () => ({ a: "button" as const, b: "home-0" as const, point: { x: 0, y: 0, z: 0 } }),
    );
    expect(() =>
      deriveSimulationFacts(
        [
          createObservation(0, 0),
          createObservation(1, intervalMs, {}, tooManyContacts),
        ],
        COUNTERBALL_CONFIG_V1,
      ),
    ).toThrow(RangeError);
  });
});
