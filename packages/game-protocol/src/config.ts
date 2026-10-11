import type {
  CapEntityId,
  ConfigHash,
  CounterballConfig,
  TeamId,
  VersionStamp,
} from "./types.js";

const config = {
  schemaVersion: 2,
  configVersion: "counterball-config-2",
  geometry: {
    pitchWidth: 12,
    pitchLength: 20,
    surfaceY: 0,
    capRadius: 0.32,
    capHeight: 0.12,
    buttonRadius: 0.13,
    buttonThickness: 0.045,
    goalWidth: 2.4,
    goalHeight: 0.8,
    goalFrameRadius: 0.06,
    surfaceThickness: 0.2,
    penaltyBoxWidth: 5,
    penaltyBoxDepth: 3.5,
  },
  bodies: {
    capsPerTeam: 7,
    capMass: 1,
    buttonMass: 0.15,
  },
  simulation: {
    // Provisional acceleration in game units per second squared. Calibrate in playtest.
    gravity: { x: 0, y: -9.81, z: 0 },
    fixedStepSeconds: 1 / 120,
    maxShotDurationSeconds: 15,
    settleWindowSeconds: 0.5,
    linearSettleThreshold: 0.03,
    angularSettleThreshold: 0.1,
    playbackSamplesPerSecond: 30,
  },
  restart: {
    anchorTolerance: 0.64,
    maxButtonTiltRadians: Math.PI / 3,
    // Provisional diagnostic clearance in arbitrary game units, not a gameplay rule.
    clearanceEpsilon: 0.005,
  },
  action: {
    minimumPower: 0,
    maximumPower: 1,
    maximumPayloadBytes: 4_096,
  },
  match: {
    defaultTargetGoals: 3,
    minimumPrivateTargetGoals: 1,
    maximumPrivateTargetGoals: 10,
  },
  // T02 supplies measured/pinned Havok adapter coefficients. This protocol
  // fixture config intentionally makes no uncalibrated physics claim.
  physicsCalibration: null,
  // GC01 diagnostic policy only; never a gameplay calibration or fallback.
  diagnosticGuard: {
    schemaVersion: 1,
    scope: "browser-direct-impulse-v1",
    fixtureId: "counterball-protocol-fixtures-v1",
    matchId: "00000000-0000-4000-8000-000000000001",
    capId: "home-6",
    impulse: { x: 0, y: 0, z: 8 },
    applicationPoint: { x: 0, y: 0.06, z: -4 },
    maxMechanicalEnergy: 34,
    maxRestHeightDrop: 0.01125,
    supportApronMargin: 325,
    tunnelling: {
      maxPointSweepPerSubstep: 0.01125,
      maxRotationPerSubstep: 0.39269908169872414,
      maxSubstepsPerTick: 48,
    },
    workload: {
      maxTotalSubsteps: 86_400,
      maxBatchSubsteps: 120,
      maxWallTimeMs: 30_000,
    },
  },
} as const satisfies CounterballConfig;

function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

export const COUNTERBALL_CONFIG_V1 = deepFreeze(config);

// Protocol bounds keep every serialized collection and playback payload finite.
// Playback frames include both endpoints: 15 seconds at 30 Hz is 451 frames.
export const COUNTERBALL_PROTOCOL_LIMITS = Object.freeze({
  maxArrayItems: 8_192,
  maxSimulationFactsPerShot: 8_192,
  maxPlaybackFramesPerShot: 451,
  maxPlaybackChunksPerShot: 451,
  maxPlaybackChunkBytes: 32 * 1_024,
  maxPlaybackSnapshotBytes: 1_024 * 1_024,
  maxRoomParticipants: 22,
  maxWaitingPlayerIds: 20,
} as const);

export const PROTOCOL_VERSION = 1 as const;
export const GAME_ID = "counterball" as const;
export const GAME_VERSION = "0.1.0";
export const RULES_VERSION = "counterball-1" as const;
// The adapter suffix is a protocol slot; T02 must prove the real implementation.
export const PHYSICS_VERSION = "havok-1.3.14/adapter-1";

type CanonicalJson =
  | null
  | boolean
  | number
  | string
  | CanonicalJson[]
  | { [key: string]: CanonicalJson };

function canonicalize(
  value: unknown,
  ancestors = new Set<object>(),
): CanonicalJson {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(
        "Canonical config cannot contain non-finite numbers.",
      );
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (ancestors.has(value)) {
      throw new TypeError(
        "Canonical config cannot contain circular references.",
      );
    }
    if (value.length > COUNTERBALL_PROTOCOL_LIMITS.maxArrayItems) {
      throw new TypeError(
        `Canonical arrays cannot contain more than ${COUNTERBALL_PROTOCOL_LIMITS.maxArrayItems} items.`,
      );
    }
    ancestors.add(value);
    if (Object.getOwnPropertySymbols(value).length > 0) {
      throw new TypeError("Canonical config arrays cannot have symbol keys.");
    }
    const canonicalArray: CanonicalJson[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (descriptor === undefined) {
        throw new TypeError("Canonical config cannot contain sparse arrays.");
      }
      if (!("value" in descriptor)) {
        throw new TypeError(
          "Canonical config arrays cannot contain accessors.",
        );
      }
      canonicalArray.push(canonicalize(descriptor.value, ancestors));
    }
    if (Object.getOwnPropertyNames(value).length !== value.length + 1) {
      throw new TypeError("Canonical config arrays cannot have custom keys.");
    }
    ancestors.delete(value);
    return canonicalArray;
  }

  if (typeof value === "object") {
    const prototype = Reflect.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError("Canonical config values must be plain objects.");
    }
    if (ancestors.has(value)) {
      throw new TypeError(
        "Canonical config cannot contain circular references.",
      );
    }
    ancestors.add(value);
    const keys = Object.keys(value);
    if (
      Object.getOwnPropertySymbols(value).length > 0 ||
      Object.getOwnPropertyNames(value).length !== keys.length
    ) {
      throw new TypeError(
        "Canonical config objects cannot have hidden or symbol keys.",
      );
    }
    // A null prototype ensures an own `__proto__` key stays JSON data instead
    // of invoking Object.prototype's legacy setter during canonicalization.
    const canonicalObject = Object.create(null) as {
      [key: string]: CanonicalJson;
    };
    for (const key of keys.sort()) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || !("value" in descriptor)) {
        throw new TypeError(
          "Canonical config objects cannot contain accessors.",
        );
      }
      if (descriptor.value === undefined) {
        throw new TypeError(
          "Canonical config cannot contain undefined values.",
        );
      }
      canonicalObject[key] = canonicalize(descriptor.value, ancestors);
    }
    ancestors.delete(value);
    return canonicalObject;
  }

  throw new TypeError(
    `Canonical config cannot contain ${typeof value} values.`,
  );
}

export function canonicalJson(value: unknown): string {
  const serialized = JSON.stringify(canonicalize(value));
  if (serialized === undefined) {
    throw new TypeError("Canonical config did not serialize to JSON.");
  }
  return serialized;
}

export async function hashCanonicalJson(value: unknown): Promise<ConfigHash> {
  const input = new TextEncoder().encode(canonicalJson(value));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", input);
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return hash as ConfigHash;
}

export const hashCounterballConfig = (): Promise<ConfigHash> =>
  hashCanonicalJson(COUNTERBALL_CONFIG_V1);

export async function createVersionStamp(): Promise<VersionStamp> {
  return {
    protocolVersion: PROTOCOL_VERSION,
    gameId: GAME_ID,
    gameVersion: GAME_VERSION,
    rulesVersion: RULES_VERSION,
    physicsVersion: PHYSICS_VERSION,
    configHash: await hashCounterballConfig(),
  };
}

export function oppositeTeam(team: TeamId): TeamId {
  return team === "home" ? "away" : "home";
}

export function teamForCapId(capId: CapEntityId): TeamId {
  return capId.startsWith("home-") ? "home" : "away";
}
