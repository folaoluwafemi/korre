import { ENTITY_IDS } from "@korre/game-protocol";
import type { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody.js";
import type { LoftCoarseContactBodyId } from "./loftCoarseProbe.js";

type OrderedContactBody = Readonly<{
  bodyId: LoftCoarseContactBodyId;
  body: Pick<PhysicsBody, "setEventMask" | "getEventMask">;
}>;

type ContactSubscriptionBody = Readonly<{
  bodyId: LoftCoarseContactBodyId;
  requestedMask: number;
  observedMask: number;
}>;

export type LoftContactSubscription = Readonly<{
  eventType: "COLLISION_STARTED";
  nativeMask: number;
  bodies: readonly ContactSubscriptionBody[];
}>;

const staticContactBodyIds = [
  "goal-frame-0",
  "goal-frame-1",
  "goal-frame-2",
  "goal-frame-3",
  "goal-frame-4",
  "goal-frame-5",
  "support-apron",
] as const satisfies readonly LoftCoarseContactBodyId[];

const canonicalContactBodyIds: readonly LoftCoarseContactBodyId[] = [
  ...ENTITY_IDS,
  ...staticContactBodyIds,
];

function nativeStartedMask(startedFlag: unknown): number {
  if (
    typeof startedFlag !== "object" ||
    startedFlag === null ||
    Array.isArray(startedFlag) ||
    !("value" in startedFlag)
  ) {
    throw new Error("The native collision-started flag has an invalid shape.");
  }

  const value = startedFlag.value;
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value <= 0 ||
    value > 0xffff_ffff ||
    (value & (value - 1)) !== 0
  ) {
    throw new Error("The native collision-started flag is not one uint32 bit.");
  }

  return value;
}

// A boolean result keeps Array.isArray from widening the typed readonly input.
function isArrayValue(value: unknown): boolean {
  return Array.isArray(value);
}

export function configureNativeCollisionOnsets(
  startedFlag: unknown,
  orderedBodies: readonly OrderedContactBody[],
): LoftContactSubscription {
  const nativeMask = nativeStartedMask(startedFlag);

  if (
    !isArrayValue(orderedBodies) ||
    orderedBodies.length !== canonicalContactBodyIds.length
  ) {
    throw new Error("Native collision bodies are missing or duplicated.");
  }

  for (let index = 0; index < canonicalContactBodyIds.length; index += 1) {
    const entry = orderedBodies[index];
    if (
      entry === undefined ||
      entry.bodyId !== canonicalContactBodyIds[index] ||
      typeof entry.body?.setEventMask !== "function" ||
      typeof entry.body?.getEventMask !== "function"
    ) {
      throw new Error("Native collision bodies are not in canonical order.");
    }
  }

  for (const entry of orderedBodies) {
    entry.body.setEventMask(nativeMask);
  }

  const bodies = orderedBodies.map((entry) => ({
    bodyId: entry.bodyId,
    requestedMask: nativeMask,
    observedMask: entry.body.getEventMask(),
  }));

  if (bodies.some((entry) => entry.observedMask !== nativeMask)) {
    throw new Error("A native collision body did not retain the onset mask.");
  }

  return {
    eventType: "COLLISION_STARTED",
    nativeMask,
    bodies,
  };
}
