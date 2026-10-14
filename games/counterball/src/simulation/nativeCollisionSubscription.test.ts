import type { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody.js";
import { ENTITY_IDS } from "@korre/game-protocol";
import { describe, expect, it } from "vitest";
import type { LoftCoarseContactBodyId } from "./loftCoarseProbe.js";
import { configureNativeCollisionOnsets } from "./nativeCollisionSubscription.js";

const staticContactBodyIds = [
  "goal-frame-0",
  "goal-frame-1",
  "goal-frame-2",
  "goal-frame-3",
  "goal-frame-4",
  "goal-frame-5",
  "support-apron",
] as const satisfies readonly LoftCoarseContactBodyId[];

const canonicalBodyIds: readonly LoftCoarseContactBodyId[] = [
  ...ENTITY_IDS,
  ...staticContactBodyIds,
];

type StubOptions = Readonly<{
  setterFailureId?: LoftCoarseContactBodyId;
  getterFailureId?: LoftCoarseContactBodyId;
  readback?: (
    bodyId: LoftCoarseContactBodyId,
    requestedMask: number,
  ) => number;
}>;

function makeBodies(options: StubOptions = {}) {
  const operations: string[] = [];
  const bodies = canonicalBodyIds.map((bodyId) => {
    let currentMask = 0;
    const body: Pick<PhysicsBody, "setEventMask" | "getEventMask"> = {
      setEventMask(mask) {
        operations.push(`set:${bodyId}:${mask}`);
        if (bodyId === options.setterFailureId) {
          throw new Error(`set failed for ${bodyId}`);
        }
        currentMask = mask;
      },
      getEventMask() {
        operations.push(`get:${bodyId}`);
        if (bodyId === options.getterFailureId) {
          throw new Error(`get failed for ${bodyId}`);
        }
        return options.readback
          ? options.readback(bodyId, currentMask)
          : currentMask;
      },
    };
    return { bodyId, body };
  });

  return { bodies, operations };
}

describe("configureNativeCollisionOnsets", () => {
  it("sets all canonical bodies before exact readbacks and returns facts", () => {
    const { bodies, operations } = makeBodies();
    const result = configureNativeCollisionOnsets({ value: 0x8000_0000 }, bodies);

    expect(operations).toEqual([
      ...canonicalBodyIds.map((id) => `set:${id}:2147483648`),
      ...canonicalBodyIds.map((id) => `get:${id}`),
    ]);
    expect(result).toEqual({
      eventType: "COLLISION_STARTED",
      nativeMask: 0x8000_0000,
      bodies: canonicalBodyIds.map((bodyId) => ({
        bodyId,
        requestedMask: 0x8000_0000,
        observedMask: 0x8000_0000,
      })),
    });
  });

  it("rejects malformed flags before touching any body", () => {
    const invalidFlags: readonly unknown[] = [
      undefined,
      null,
      8,
      [],
      { value: "8" },
      { value: Number.NaN },
      { value: Number.POSITIVE_INFINITY },
      { value: 1.5 },
      { value: 0 },
      { value: 3 },
      { value: 0x1_0000_0000 },
      { value: Number.MAX_SAFE_INTEGER },
    ];

    for (const startedFlag of invalidFlags) {
      const { bodies, operations } = makeBodies();
      expect(() =>
        configureNativeCollisionOnsets(startedFlag, bodies),
      ).toThrow();
      expect(operations).toEqual([]);
    }
  });

  it("rejects missing, duplicate, and out-of-order IDs before setting", () => {
    const { bodies, operations } = makeBodies();
    const first = bodies[0];
    const second = bodies[1];
    if (first === undefined || second === undefined) {
      throw new Error("Expected canonical bodies.");
    }
    const duplicate = [...bodies.slice(0, -1), first];
    const outOfOrder = [...bodies];
    outOfOrder.splice(0, 2, second, first);
    const invalidLists = [bodies.slice(0, -1), duplicate, outOfOrder];

    for (const suppliedBodies of invalidLists) {
      expect(() =>
        configureNativeCollisionOnsets({ value: 8 }, suppliedBodies),
      ).toThrow();
      expect(operations).toEqual([]);
    }
  });

  it("fails closed if a required read method is absent", () => {
    const { bodies, operations } = makeBodies();
    const last = bodies.at(-1);
    if (last === undefined) throw new Error("Expected canonical body.");
    const malformedBodies = bodies.map((entry) =>
      entry === last
        ? {
            bodyId: entry.bodyId,
            body: {
              setEventMask: entry.body.setEventMask.bind(entry.body),
            } as unknown as Pick<PhysicsBody, "setEventMask" | "getEventMask">,
          }
        : entry,
    );

    expect(() =>
      configureNativeCollisionOnsets({ value: 8 }, malformedBodies),
    ).toThrow();
    expect(operations).toEqual([]);
  });

  it("propagates a setter failure before any readback", () => {
    const failingId = canonicalBodyIds[3];
    if (failingId === undefined) throw new Error("Expected canonical body.");
    const { bodies, operations } = makeBodies({ setterFailureId: failingId });

    expect(() =>
      configureNativeCollisionOnsets({ value: 8 }, bodies),
    ).toThrow(`set failed for ${failingId}`);
    expect(operations).toEqual(
      canonicalBodyIds.slice(0, 4).map((id) => `set:${id}:8`),
    );
  });

  it("propagates a getter failure after all masks were set", () => {
    const failingId = canonicalBodyIds[3];
    if (failingId === undefined) throw new Error("Expected canonical body.");
    const { bodies, operations } = makeBodies({ getterFailureId: failingId });

    expect(() =>
      configureNativeCollisionOnsets({ value: 8 }, bodies),
    ).toThrow(`get failed for ${failingId}`);
    expect(operations).toEqual([
      ...canonicalBodyIds.map((id) => `set:${id}:8`),
      ...canonicalBodyIds.slice(0, 4).map((id) => `get:${id}`),
    ]);
  });

  it("reads every body then rejects a missing or mismatched native mask", () => {
    const { bodies, operations } = makeBodies({
      readback: (bodyId, mask) => {
        if (bodyId === canonicalBodyIds[5]) return Number.NaN;
        if (bodyId === canonicalBodyIds[8]) return undefined as never;
        return mask;
      },
    });

    expect(() =>
      configureNativeCollisionOnsets({ value: 8 }, bodies),
    ).toThrow("did not retain the onset mask");
    expect(operations).toEqual([
      ...canonicalBodyIds.map((id) => `set:${id}:8`),
      ...canonicalBodyIds.map((id) => `get:${id}`),
    ]);
  });
});
