import { describe, expect, it } from "vitest";
import fixtureJson from "../../../tests/fixtures/counterball-v1.json";
import {
  CAP_IDS,
  ENTITY_IDS,
  COUNTERBALL_PROTOCOL_LIMITS,
  PROTOCOL_VERSION,
  ActionEnvelopeSchema,
  ConfigHashSchema,
  CounterballConfigSchema,
  MatchStateSchema,
  RoomViewSchema,
  ShotSimulationSchema,
  SimulationFactSchema,
  canonicalJson,
  hashCanonicalJson,
  hashCounterballConfig,
  oppositeTeam,
  parseActionEnvelope,
  parseGameCommand,
  parseMatchState,
  parseServerEvent,
  parseVersionStamp,
  teamForCapId,
  COUNTERBALL_CONFIG_V1,
} from "./index.js";
import type {
  GameCommand,
  MatchState,
  PhysicsCalibration,
  SimulationRunOptions,
  SimulationFact,
  VersionStamp,
} from "./types.js";
import { ProtocolParseError } from "./schemas.js";

function createPhysicsCalibration(): PhysicsCalibration {
  const smallestColliderThickness = Math.min(
    COUNTERBALL_CONFIG_V1.geometry.capHeight,
    COUNTERBALL_CONFIG_V1.geometry.buttonThickness,
    COUNTERBALL_CONFIG_V1.geometry.surfaceThickness,
    COUNTERBALL_CONFIG_V1.geometry.goalFrameRadius * 2,
  );

  return {
    schemaVersion: 1,
    havokVersion: "1.3.14",
    adapterVersion: "adapter-2",
    materials: {
      surface: { friction: 0.5, restitution: 0.1 },
      cap: { friction: 0.4, restitution: 0.2 },
      button: { friction: 0.3, restitution: 0.2 },
    },
    damping: {
      cap: { linear: 0.05, angular: 0.05 },
      button: { linear: 0.05, angular: 0.05 },
    },
    impulse: {
      normalMax: 10,
      restartMax: 12,
      applicationHeightOffset: 0,
    },
    restartLift: { mode: "contact-only" },
    support: { apronMargin: 20 },
    workload: { maxBatchSteps: 120, maxWallTimeMs: 15_000 },
    tunnelling: {
      maxTranslationPerSubstep: smallestColliderThickness / 2,
      maxRotationPerSubstep: Math.PI / 8,
      maxSubsteps: 120,
    },
  };
}

type PrimitivePath = readonly (number | string)[];

function getPrimitivePaths(
  value: unknown,
  path: PrimitivePath = [],
): PrimitivePath[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      getPrimitivePaths(entry, [...path, index]),
    );
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, entry]) =>
      getPrimitivePaths(entry, [...path, key]),
    );
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return [path];
  }
  return [];
}

function changePrimitiveAtPath(
  value: unknown,
  path: PrimitivePath,
  depth = 0,
): unknown {
  if (depth === path.length) {
    if (typeof value === "string") {
      return `${value}-changed`;
    }
    if (typeof value === "number") {
      return value + 1;
    }
    if (typeof value === "boolean") {
      return !value;
    }
    throw new TypeError("Expected a string, number, or boolean guard leaf.");
  }

  const part = path[depth];
  if (part === undefined) {
    throw new TypeError("Guard leaf path ended unexpectedly.");
  }
  if (Array.isArray(value)) {
    if (typeof part !== "number") {
      throw new TypeError("Array guard path must use a numeric index.");
    }
    const entries: readonly unknown[] = value;
    return entries.map((entry, index) =>
      index === part ? changePrimitiveAtPath(entry, path, depth + 1) : entry,
    );
  }
  if (value !== null && typeof value === "object") {
    if (typeof part !== "string") {
      throw new TypeError("Object guard path must use a string key.");
    }
    const record = value as Record<string, unknown>;
    return {
      ...record,
      [part]: changePrimitiveAtPath(record[part], path, depth + 1),
    };
  }
  throw new TypeError("Guard leaf path crossed a primitive value.");
}

function isDeepFrozen(value: unknown): boolean {
  if (value === null || typeof value !== "object") {
    return true;
  }
  return Object.isFrozen(value) && Object.values(value).every(isDeepFrozen);
}

type NativeAbortSignalFits =
  AbortSignal extends NonNullable<SimulationRunOptions["signal"]>
    ? true
    : false;
const nativeAbortSignalFits: NativeAbortSignalFits = true;

type FixtureCase = {
  versions: VersionStamp;
  stateRef: "initial" | "placementBlocked";
  ruleBasis: string;
  command?: GameCommand;
  facts?: SimulationFact[];
  expected: Record<string, unknown>;
};

type ProtocolFixture = {
  schemaVersion: number;
  id: string;
  note: string;
  versions: VersionStamp;
  states: { initial: MatchState; placementBlocked: MatchState };
  cases: Record<string, FixtureCase>;
};

const fixture = fixtureJson as ProtocolFixture;

describe("Counterball v1 protocol", () => {
  it("parses the tagged initial state and every rule reference case", () => {
    expect(fixture.schemaVersion).toBe(1);
    expect(parseVersionStamp(fixture.versions)).toEqual(fixture.versions);
    expect(parseMatchState(fixture.states.initial).bodies).toHaveLength(15);
    expect(parseMatchState(fixture.states.placementBlocked).phase).toBe(
      "placementBlocked",
    );

    for (const scenario of Object.values(fixture.cases)) {
      expect(scenario.versions).toEqual(fixture.versions);
      expect(parseVersionStamp(scenario.versions)).toEqual(scenario.versions);
      expect(fixture.states[scenario.stateRef]).toBeDefined();
      if (scenario.command !== undefined) {
        expect(parseGameCommand(scenario.command)).toEqual(scenario.command);
      }
      for (const fact of scenario.facts ?? []) {
        expect(SimulationFactSchema.parse(fact)).toEqual(fact);
      }
    }

    expect(Object.keys(fixture.cases).sort()).toEqual([
      "blocked",
      "foul",
      "goal",
      "out",
      "penalty",
    ]);
  });

  it("keeps cancellation local and distinguishes it in aborted-shot events", () => {
    expect(nativeAbortSignalFits).toBe(true);

    const options: SimulationRunOptions = { signal: { aborted: true } };
    expect(options.signal?.aborted).toBe(true);

    const initial = fixture.states.initial;
    const event = {
      type: "game.shot.aborted" as const,
      protocolVersion: 1 as const,
      matchId: initial.matchId,
      eventSeq: 1,
      serverTimeMs: 1,
      actionId: "00000000-0000-4000-8000-000000000070",
      reason: "cancelled" as const,
      state: initial,
    };
    expect(parseServerEvent(event)).toEqual(event);

    for (const reason of [
      "initialization",
      "timeout",
      "invalidBody",
      "resourceLimit",
    ] as const) {
      expect(parseServerEvent({ ...event, reason })).toMatchObject({
        type: "game.shot.aborted",
        reason,
      });
    }

    expect(() => parseServerEvent({ ...event, reason: "settled" })).toThrow(
      ProtocolParseError,
    );
    expect(() =>
      parseServerEvent({ ...event, transientSignal: options.signal }),
    ).toThrow(ProtocolParseError);
  });

  it("requires exactly one button and fourteen unique legal caps", () => {
    const initial = structuredClone(fixture.states.initial);
    expect(initial.bodies.map(({ id }) => id).sort()).toEqual(
      [...ENTITY_IDS].sort(),
    );

    const duplicate = structuredClone(initial);
    duplicate.bodies[1]!.id = "button";
    expect(() => parseMatchState(duplicate)).toThrow(ProtocolParseError);

    const missing = structuredClone(initial);
    missing.bodies.pop();
    expect(() => parseMatchState(missing)).toThrow(ProtocolParseError);
  });

  it("rejects extra command keys and invalid powers, vectors, and restart angles", () => {
    const base = {
      type: "game.action" as const,
      protocolVersion: 1 as const,
      matchId: fixture.states.initial.matchId,
      actionId: "00000000-0000-4000-8000-000000000002",
      expectedStateVersion: 0,
      command: {
        type: "shot" as const,
        capId: "home-0" as const,
        yaw: 0,
        power: 0.5,
      },
    };
    expect(ActionEnvelopeSchema.parse(base)).toEqual(base);
    expect(() =>
      ActionEnvelopeSchema.parse({
        ...base,
        command: { ...base.command, team: "home" },
      }),
    ).toThrow();
    expect(() =>
      ActionEnvelopeSchema.parse({
        ...base,
        command: { ...base.command, power: 1.01 },
      }),
    ).toThrow();
    expect(() =>
      ActionEnvelopeSchema.parse({
        ...base,
        command: { ...base.command, power: Number.NaN },
      }),
    ).toThrow();

    const restart = {
      ...base,
      command: {
        type: "restartShot" as const,
        capId: "home-2" as const,
        capPosition: { x: 0, y: 0, z: 0 },
        buttonAzimuth: Math.PI,
        buttonTilt: Math.PI / 6,
        yaw: 0,
        power: 0.5,
      },
    };
    expect(ActionEnvelopeSchema.parse(restart)).toEqual(restart);
    expect(() =>
      ActionEnvelopeSchema.parse({
        ...restart,
        command: {
          ...restart.command,
          buttonTilt: Math.PI,
        },
      }),
    ).toThrow();
    expect(() =>
      ActionEnvelopeSchema.parse({
        ...restart,
        command: {
          ...restart.command,
          capPosition: { x: Number.POSITIVE_INFINITY, y: 0, z: 0 },
        },
      }),
    ).toThrow();
  });

  it("checks quaternion normalization and rejects undefined protocol values", () => {
    const initial = structuredClone(fixture.states.initial);
    initial.bodies[0]!.rotation.w = 1.005;
    expect(MatchStateSchema.parse(initial)).toBeDefined();

    initial.bodies[0]!.rotation.w = 1.02;
    expect(() => parseMatchState(initial)).toThrow(ProtocolParseError);

    const action = {
      type: "game.action" as const,
      protocolVersion: 1 as const,
      matchId: fixture.states.initial.matchId,
      actionId: "00000000-0000-4000-8000-000000000003",
      expectedStateVersion: 0,
      command: {
        type: "shot" as const,
        capId: "home-0" as const,
        yaw: 0,
        power: 0.5,
        team: undefined,
      },
    };
    expect(() => parseActionEnvelope(action)).toThrow(ProtocolParseError);
  });

  it("validates snapshot version correspondence by values, not object key order", () => {
    const versions = {
      configHash: fixture.versions.configHash,
      physicsVersion: fixture.versions.physicsVersion,
      rulesVersion: fixture.versions.rulesVersion,
      gameVersion: fixture.versions.gameVersion,
      gameId: fixture.versions.gameId,
      protocolVersion: fixture.versions.protocolVersion,
    };
    const event = {
      type: "match.snapshot" as const,
      protocolVersion: 1 as const,
      matchId: fixture.states.initial.matchId,
      eventSeq: 1,
      serverTimeMs: 0,
      state: fixture.states.initial,
      versions,
      role: "player" as const,
      team: "home" as const,
      latestEventSeq: 1,
      room: {
        roomId: "00000000-0000-4000-8000-000000000010",
        hostPlayerId: "00000000-0000-4000-8000-000000000011",
        participants: [],
        waitingPlayerIds: [],
        targetGoals: 3,
        chosenFormations: { home: "classic-seven", away: "classic-seven" },
      },
    };
    expect(parseServerEvent(event).type).toBe("match.snapshot");
    expect(() =>
      parseServerEvent({
        ...event,
        versions: { ...versions, configHash: "0".repeat(64) },
      }),
    ).toThrow();
    expect(RoomViewSchema.parse(event.room)).toBeDefined();
  });

  it("freezes the shared config and hashes canonical JSON with SHA-256", async () => {
    expect(CounterballConfigSchema.parse(COUNTERBALL_CONFIG_V1)).toEqual(
      COUNTERBALL_CONFIG_V1,
    );
    expect(Object.isFrozen(COUNTERBALL_CONFIG_V1)).toBe(true);
    expect(Object.isFrozen(COUNTERBALL_CONFIG_V1.geometry)).toBe(true);
    expect(COUNTERBALL_CONFIG_V1.schemaVersion).toBe(3);
    expect(COUNTERBALL_CONFIG_V1.configVersion).toBe("counterball-config-3");
    expect(PROTOCOL_VERSION).toBe(1);
    expect(COUNTERBALL_CONFIG_V1.bodies.capsPerTeam).toBe(7);
    expect(COUNTERBALL_CONFIG_V1.geometry.goalFrameRadius).toBe(0.06);
    expect(COUNTERBALL_CONFIG_V1.geometry.surfaceThickness).toBe(0.2);
    expect(COUNTERBALL_CONFIG_V1.physicsCalibration).toBeNull();
    expect(COUNTERBALL_CONFIG_V1.diagnosticGuard.schemaVersion).toBe(1);
    expect(Object.isFrozen(COUNTERBALL_CONFIG_V1.diagnosticGuard)).toBe(true);
    expect(COUNTERBALL_CONFIG_V1.restart.clearanceEpsilon).toBe(0.005);
    for (const clearanceEpsilon of [0, -0.001, NaN, Infinity]) {
      expect(
        CounterballConfigSchema.safeParse({
          ...COUNTERBALL_CONFIG_V1,
          restart: { ...COUNTERBALL_CONFIG_V1.restart, clearanceEpsilon },
        }).success,
      ).toBe(false);
    }

    const left = { z: [2, { b: true, a: 1 }], a: "counterball" };
    const right = { a: "counterball", z: [2, { a: 1, b: true }] };
    expect(canonicalJson(left)).toBe(canonicalJson(right));
    expect(await hashCanonicalJson(left)).toBe(await hashCanonicalJson(right));
    expect(await hashCanonicalJson("")).toBe(
      "12ae32cb1ec02d01eda3581b127c1fee3b0dc53572ed6baf239721a03d82e126",
    );

    const ownProtoKey = JSON.parse('{"__proto__":{"a":1}}') as Record<
      string,
      unknown
    >;
    const canonicalWithProtoKey = canonicalJson(ownProtoKey);
    expect(canonicalWithProtoKey).toBe('{"__proto__":{"a":1}}');
    expect(canonicalWithProtoKey).not.toBe(canonicalJson({}));
    expect(await hashCanonicalJson(ownProtoKey)).not.toBe(
      await hashCanonicalJson({}),
    );

    const configHash = await hashCounterballConfig();
    expect(ConfigHashSchema.parse(configHash)).toBe(configHash);
    expect(configHash).toBe(fixture.versions.configHash);
  });

  it("accepts only the fixed diagnostic guard and hashes it separately from calibration", async () => {
    const guard = COUNTERBALL_CONFIG_V1.diagnosticGuard;
    expect(
      CounterballConfigSchema.parse(COUNTERBALL_CONFIG_V1).diagnosticGuard,
    ).toEqual(guard);

    const invalidGuards: unknown[] = [
      { ...guard, scope: "generic-impulse" },
      { ...guard, fixtureId: "other-fixture" },
      { ...guard, matchId: "00000000-0000-4000-8000-000000000002" },
      { ...guard, capId: "away-6" },
      { ...guard, impulse: { ...guard.impulse, z: 9 } },
      {
        ...guard,
        applicationPoint: { ...guard.applicationPoint, y: 0.061 },
      },
      { ...guard, maxMechanicalEnergy: 35 },
      { ...guard, maxRestHeightDrop: 0.012 },
      { ...guard, supportApronMargin: 324 },
      {
        ...guard,
        tunnelling: { ...guard.tunnelling, maxPointSweepPerSubstep: 0.012 },
      },
      {
        ...guard,
        tunnelling: {
          ...guard.tunnelling,
          maxRotationPerSubstep: Math.PI / 4,
        },
      },
      {
        ...guard,
        tunnelling: { ...guard.tunnelling, maxSubstepsPerTick: 47 },
      },
      {
        ...guard,
        workload: { ...guard.workload, maxTotalSubsteps: 86_399 },
      },
      {
        ...guard,
        workload: { ...guard.workload, maxBatchSubsteps: 119 },
      },
      {
        ...guard,
        workload: { ...guard.workload, maxWallTimeMs: 29_999 },
      },
      { ...guard, unexpected: true },
      { ...guard, tunnelling: { ...guard.tunnelling, unexpected: true } },
    ];

    for (const diagnosticGuard of invalidGuards) {
      expect(
        CounterballConfigSchema.safeParse({
          ...COUNTERBALL_CONFIG_V1,
          diagnosticGuard,
        }).success,
      ).toBe(false);
    }

    expect(
      CounterballConfigSchema.safeParse({
        ...COUNTERBALL_CONFIG_V1,
        diagnosticGuard: null,
      }).success,
    ).toBe(false);
    expect(COUNTERBALL_CONFIG_V1.physicsCalibration).toBeNull();
    expect(
      await hashCanonicalJson({
        ...COUNTERBALL_CONFIG_V1,
        diagnosticGuard: { ...guard, maxMechanicalEnergy: 35 },
      }),
    ).not.toBe(await hashCanonicalJson(COUNTERBALL_CONFIG_V1));
  });

  it("strictly pins every restart-loft diagnostic guard field in the config hash", async () => {
    const guard = COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard;
    expect(
      CounterballConfigSchema.parse(COUNTERBALL_CONFIG_V1)
        .restartLoftDiagnosticGuard,
    ).toEqual(guard);
    expect(isDeepFrozen(guard)).toBe(true);

    const paths = getPrimitivePaths(guard);
    expect(paths.length).toBeGreaterThan(0);
    expect(paths).toContainEqual(["setup", "capsIdentityRotation"]);
    expect(paths).toContainEqual(["setup", "allDynamicVelocitiesZero"]);
    const baselineHash = await hashCounterballConfig();
    for (const path of paths) {
      const changedGuard = changePrimitiveAtPath(guard, path);
      expect(
        CounterballConfigSchema.safeParse({
          ...COUNTERBALL_CONFIG_V1,
          restartLoftDiagnosticGuard: changedGuard,
        }).success,
      ).toBe(false);
      expect(
        await hashCanonicalJson({
          ...COUNTERBALL_CONFIG_V1,
          restartLoftDiagnosticGuard: changedGuard,
        }),
      ).not.toBe(baselineHash);
    }

    expect(
      CounterballConfigSchema.safeParse({
        ...COUNTERBALL_CONFIG_V1,
        restartLoftDiagnosticGuard: null,
      }).success,
    ).toBe(false);
    expect(
      CounterballConfigSchema.safeParse({
        ...COUNTERBALL_CONFIG_V1,
        restartLoftDiagnosticGuard: {
          ...guard,
          matrix: { ...guard.matrix, unexpected: true },
        },
      }).success,
    ).toBe(false);
  });

  it("validates the nullable versioned calibration without changing null fixtures", async () => {
    const calibration = createPhysicsCalibration();
    const calibratedConfig = {
      ...COUNTERBALL_CONFIG_V1,
      physicsCalibration: calibration,
    };

    expect(CounterballConfigSchema.parse(COUNTERBALL_CONFIG_V1)).toEqual(
      COUNTERBALL_CONFIG_V1,
    );
    expect(CounterballConfigSchema.parse(calibratedConfig)).toEqual(
      calibratedConfig,
    );
    expect(await hashCanonicalJson(calibratedConfig)).not.toBe(
      await hashCanonicalJson(COUNTERBALL_CONFIG_V1),
    );

    const smallestColliderThickness = Math.min(
      COUNTERBALL_CONFIG_V1.geometry.capHeight,
      COUNTERBALL_CONFIG_V1.geometry.buttonThickness,
      COUNTERBALL_CONFIG_V1.geometry.surfaceThickness,
      COUNTERBALL_CONFIG_V1.geometry.goalFrameRadius * 2,
    );
    const invalidCalibrations: unknown[] = [
      { ...calibration, schemaVersion: 2 },
      { ...calibration, havokVersion: "1.3.13" },
      { ...calibration, adapterVersion: "adapter-1" },
      { ...calibration, unexpected: true },
      {
        ...calibration,
        materials: {
          ...calibration.materials,
          surface: { ...calibration.materials.surface, friction: -0.01 },
        },
      },
      {
        ...calibration,
        materials: {
          ...calibration.materials,
          cap: { ...calibration.materials.cap, restitution: 1.01 },
        },
      },
      {
        ...calibration,
        damping: {
          ...calibration.damping,
          button: { ...calibration.damping.button, angular: Infinity },
        },
      },
      {
        ...calibration,
        impulse: { ...calibration.impulse, normalMax: 0 },
      },
      {
        ...calibration,
        impulse: { ...calibration.impulse, restartMax: 20.01 },
      },
      {
        ...calibration,
        impulse: {
          ...calibration.impulse,
          applicationHeightOffset: COUNTERBALL_CONFIG_V1.geometry.capHeight,
        },
      },
      { ...calibration, restartLift: { mode: "assisted" } },
      { ...calibration, support: { apronMargin: 0 } },
      { ...calibration, support: { apronMargin: 10_000.01 } },
      {
        ...calibration,
        workload: { ...calibration.workload, maxBatchSteps: 120.5 },
      },
      {
        ...calibration,
        workload: { ...calibration.workload, maxWallTimeMs: 99 },
      },
      {
        ...calibration,
        tunnelling: {
          ...calibration.tunnelling,
          maxTranslationPerSubstep: smallestColliderThickness,
        },
      },
      {
        ...calibration,
        tunnelling: {
          ...calibration.tunnelling,
          maxRotationPerSubstep: Math.PI / 4 + 0.001,
        },
      },
      {
        ...calibration,
        tunnelling: { ...calibration.tunnelling, maxSubsteps: 121 },
      },
    ];

    for (const physicsCalibration of invalidCalibrations) {
      expect(
        CounterballConfigSchema.safeParse({
          ...COUNTERBALL_CONFIG_V1,
          physicsCalibration,
        }).success,
      ).toBe(false);
    }
  });

  it("rejects values JSON would silently normalize before hashing or parsing", () => {
    const sparse: unknown[] = [];
    sparse.length = 1;
    expect(() => canonicalJson(sparse)).toThrow(/sparse arrays/);

    const circular: Record<string, unknown> = {};
    circular["self"] = circular;
    expect(() => canonicalJson(circular)).toThrow(/circular references/);
    expect(() => canonicalJson({ omitted: undefined })).toThrow(
      /undefined values/,
    );

    let getterWasRead = false;
    const accessor = Object.defineProperty({}, "power", {
      enumerable: true,
      get() {
        getterWasRead = true;
        return 0.5;
      },
    });
    expect(() => canonicalJson(accessor)).toThrow(/accessors/);
    expect(getterWasRead).toBe(false);

    let payloadGetterWasRead = false;
    const command = {
      type: "shot",
      capId: "home-0",
      yaw: 0,
    };
    Object.defineProperty(command, "power", {
      enumerable: true,
      get() {
        payloadGetterWasRead = true;
        return 0.5;
      },
    });
    const payload = {
      type: "game.action",
      protocolVersion: 1,
      matchId: fixture.states.initial.matchId,
      actionId: "00000000-0000-4000-8000-000000000040",
      expectedStateVersion: 0,
      command,
    };
    expect(() => parseActionEnvelope(payload)).toThrow(ProtocolParseError);
    expect(payloadGetterWasRead).toBe(false);
  });

  it("maps every cap to one side without adding client authority", () => {
    expect(oppositeTeam("home")).toBe("away");
    expect(oppositeTeam("away")).toBe("home");
    expect(CAP_IDS).toHaveLength(14);
    expect(CAP_IDS.filter((id) => teamForCapId(id) === "home")).toHaveLength(7);
    expect(CAP_IDS.filter((id) => teamForCapId(id) === "away")).toHaveLength(7);
  });

  it("bounds playback, simulation facts, room queues, and encoded chunks", () => {
    const initial = fixture.states.initial;
    const frame = {
      timeMs: 0,
      bodies: initial.bodies.map(({ id, position, rotation }) => ({
        id,
        position,
        rotation,
      })),
    };
    const shotId = "00000000-0000-4000-8000-000000000050";
    const chunk = {
      shotId,
      chunkIndex: 0,
      chunkCount: 1,
      frames: [frame],
    };
    const chunkEvent = {
      type: "game.playback.chunk" as const,
      protocolVersion: 1 as const,
      matchId: initial.matchId,
      eventSeq: 2,
      serverTimeMs: 1,
      ...chunk,
    };
    expect(parseServerEvent(chunkEvent).type).toBe("game.playback.chunk");
    expect(() => parseServerEvent({ ...chunkEvent, chunkIndex: 1 })).toThrow(
      ProtocolParseError,
    );

    const oversizedFrames = Array.from({ length: 32 }, (_, index) => ({
      ...frame,
      timeMs: index * (1_000 / 30),
    }));
    const encodedChunk = JSON.stringify({ ...chunk, frames: oversizedFrames });
    expect(new TextEncoder().encode(encodedChunk).byteLength).toBeGreaterThan(
      COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackChunkBytes,
    );
    expect(() =>
      parseServerEvent({ ...chunkEvent, frames: oversizedFrames }),
    ).toThrow(ProtocolParseError);

    const playbackSnapshot = {
      type: "match.snapshot" as const,
      protocolVersion: 1 as const,
      matchId: initial.matchId,
      eventSeq: 3,
      serverTimeMs: 2,
      state: initial,
      versions: initial.versions,
      role: "player" as const,
      team: "home" as const,
      latestEventSeq: 3,
      playback: { shotId, startsAtMs: 0, durationMs: 15_000 },
      playbackChunks: [chunk],
      room: {
        roomId: "00000000-0000-4000-8000-000000000060",
        hostPlayerId: "00000000-0000-4000-8000-000000000061",
        participants: [],
        waitingPlayerIds: [],
        targetGoals: 3,
        chosenFormations: { home: "classic-seven", away: "classic-seven" },
      },
    };
    expect(parseServerEvent(playbackSnapshot).type).toBe("match.snapshot");
    expect(() =>
      parseServerEvent({
        ...playbackSnapshot,
        playbackChunks: [chunk, chunk],
      }),
    ).toThrow(ProtocolParseError);
    expect(() =>
      parseServerEvent({
        ...playbackSnapshot,
        playback: {
          ...playbackSnapshot.playback,
          shotId: "00000000-0000-4000-8000-000000000051",
        },
      }),
    ).toThrow(ProtocolParseError);

    const nearLimitFrames: (typeof frame)[] = [];
    for (let index = 0; index < 451; index += 1) {
      const candidateFrames = [
        ...nearLimitFrames,
        { ...frame, timeMs: index * (1_000 / 30) },
      ];
      const candidateChunk = JSON.stringify({
        shotId,
        chunkIndex: 0,
        chunkCount: COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackChunksPerShot,
        frames: candidateFrames,
      });
      const candidateSize = new TextEncoder().encode(candidateChunk).byteLength;
      if (
        candidateSize >
        COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackChunkBytes - 128
      ) {
        break;
      }
      nearLimitFrames.push(candidateFrames[candidateFrames.length - 1]!);
    }
    const chunkCount =
      Math.floor(
        COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackSnapshotBytes /
          new TextEncoder().encode(
            JSON.stringify({
              shotId,
              chunkIndex: 0,
              chunkCount: COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackChunksPerShot,
              frames: nearLimitFrames,
            }),
          ).byteLength,
      ) + 1;
    const largeSnapshotChunks = Array.from(
      { length: chunkCount },
      (_, index) => ({
        shotId,
        chunkIndex: index,
        chunkCount,
        frames: nearLimitFrames,
      }),
    );
    const largeSnapshotBytes = largeSnapshotChunks.reduce(
      (total, snapshotChunk) =>
        total +
        new TextEncoder().encode(JSON.stringify(snapshotChunk)).byteLength,
      0,
    );
    expect(largeSnapshotBytes).toBeGreaterThan(
      COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackSnapshotBytes,
    );
    expect(chunkCount).toBeLessThanOrEqual(
      COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackChunksPerShot,
    );
    expect(() =>
      parseServerEvent({
        ...playbackSnapshot,
        playbackChunks: largeSnapshotChunks,
      }),
    ).toThrow(ProtocolParseError);

    const baseSimulation = {
      shotId,
      settledBodies: initial.bodies,
      facts: [],
      frames: [frame],
      durationMs: 15_000,
      termination: "settled" as const,
    };
    expect(() =>
      ShotSimulationSchema.parse({
        ...baseSimulation,
        frames: Array.from(
          { length: COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackFramesPerShot + 1 },
          (_, index) => ({ ...frame, timeMs: index * (1_000 / 30) }),
        ),
      }),
    ).toThrow();
    const fact: SimulationFact = {
      type: "contact",
      step: 1,
      timeMs: 1,
      a: "home-0",
      b: "away-0",
      point: { x: 0, y: 0, z: 0 },
    };
    expect(
      ShotSimulationSchema.safeParse({
        ...baseSimulation,
        facts: Array.from(
          { length: COUNTERBALL_PROTOCOL_LIMITS.maxSimulationFactsPerShot + 1 },
          () => fact,
        ),
      }).success,
    ).toBe(false);

    const room = {
      roomId: "00000000-0000-4000-8000-000000000060",
      hostPlayerId: "00000000-0000-4000-8000-000000000061",
      participants: [],
      waitingPlayerIds: Array.from(
        { length: COUNTERBALL_PROTOCOL_LIMITS.maxWaitingPlayerIds + 1 },
        (_, index) =>
          `00000000-0000-4000-8000-${String(index + 100).padStart(12, "0")}`,
      ),
      targetGoals: 3,
      chosenFormations: { home: "classic-seven", away: "classic-seven" },
    };
    expect(() => RoomViewSchema.parse(room)).toThrow();
  });
});
