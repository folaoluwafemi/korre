import { z } from "zod";
import { COUNTERBALL_PROTOCOL_LIMITS } from "./config.js";
import type {
  ActionEnvelope,
  CounterballConfig,
  ControlEnvelope,
  DiagnosticPhysicsGuard,
  GameCommand,
  MatchState,
  PlaybackFrame,
  PhysicsCalibration,
  RoomCommandEnvelope,
  RestartLoftDiagnosticGuard,
  ServerEvent,
  ShotSimulation,
  VersionStamp,
} from "./types.js";

export const QUATERNION_NORM_TOLERANCE = 0.01;

const finiteNumber = z.number().finite();
const nonNegativeInteger = z.number().int().min(0);
const uuid = z.uuid();

const physicsMaterialCalibrationSchema = z.strictObject({
  friction: finiteNumber.min(0).max(2),
  restitution: finiteNumber.min(0).max(1),
});

const physicsDampingCalibrationSchema = z.strictObject({
  linear: finiteNumber.min(0).max(1),
  angular: finiteNumber.min(0).max(1),
});

const physicsCalibrationSchema: z.ZodType<PhysicsCalibration> = z.strictObject({
  schemaVersion: z.literal(1),
  havokVersion: z.literal("1.3.14"),
  adapterVersion: z.literal("adapter-2"),
  materials: z.strictObject({
    surface: physicsMaterialCalibrationSchema,
    cap: physicsMaterialCalibrationSchema,
    button: physicsMaterialCalibrationSchema,
  }),
  damping: z.strictObject({
    cap: physicsDampingCalibrationSchema,
    button: physicsDampingCalibrationSchema,
  }),
  impulse: z.strictObject({
    normalMax: finiteNumber.positive().max(20),
    restartMax: finiteNumber.positive().max(20),
    applicationHeightOffset: finiteNumber,
  }),
  restartLift: z.strictObject({ mode: z.literal("contact-only") }),
  support: z.strictObject({
    apronMargin: finiteNumber.positive().max(10_000),
  }),
  workload: z.strictObject({
    maxBatchSteps: z.number().int().min(1).max(120),
    maxWallTimeMs: z.number().int().min(100).max(30_000),
  }),
  tunnelling: z.strictObject({
    maxTranslationPerSubstep: finiteNumber.positive(),
    maxRotationPerSubstep: finiteNumber.positive().max(Math.PI / 4),
    maxSubsteps: z.number().int().min(1).max(120),
  }),
});

const diagnosticPhysicsGuardSchema: z.ZodType<DiagnosticPhysicsGuard> =
  z.strictObject({
    schemaVersion: z.literal(1),
    scope: z.literal("browser-direct-impulse-v1"),
    fixtureId: z.literal("counterball-protocol-fixtures-v1"),
    matchId: z.literal("00000000-0000-4000-8000-000000000001"),
    capId: z.literal("home-6"),
    impulse: z.strictObject({
      x: z.literal(0),
      y: z.literal(0),
      z: z.literal(8),
    }),
    applicationPoint: z.strictObject({
      x: z.literal(0),
      y: z.literal(0.06),
      z: z.literal(-4),
    }),
    maxMechanicalEnergy: z.literal(34),
    maxRestHeightDrop: z.literal(0.01125),
    supportApronMargin: z.literal(325),
    tunnelling: z.strictObject({
      maxPointSweepPerSubstep: z.literal(0.01125),
      maxRotationPerSubstep: z.literal(0.39269908169872414),
      maxSubstepsPerTick: z.literal(48),
    }),
    workload: z.strictObject({
      maxTotalSubsteps: z.literal(86_400),
      maxBatchSubsteps: z.literal(120),
      maxWallTimeMs: z.literal(30_000),
    }),
  });

const restartLoftDiagnosticGuardSchema: z.ZodType<RestartLoftDiagnosticGuard> =
  z.strictObject({
    schemaVersion: z.literal(1),
    scope: z.literal("restart-loft-coarse-matrix-v1"),
    matrixId: z.literal("counterball-l01-grid-v1"),
    algorithmVersion: z.literal("loft-coarse-probe-v1"),
    protocolVersion: z.literal(1),
    configSchemaVersion: z.literal(3),
    physicsVersion: z.literal("havok-1.3.14/adapter-1"),
    fixture: z.strictObject({
      id: z.literal("counterball-protocol-fixtures-v1"),
      payloadSha256: z.literal(
        "6ce26e4203017e446687dfd8ad95106ba582f09420f8c623129c7d1bbe6b625d",
      ),
    }),
    matchId: z.literal("00000000-0000-4000-8000-000000000001"),
    wasmSha256: z.literal(
      "026917766f534c156286f07975850978dabf17c42e742bbfaaebbcb2215e4e11",
    ),
    matrix: z.strictObject({
      gapOffsets: z.tuple([z.literal(0.75), z.literal(1)]),
      tiltDegrees: z.tuple([z.literal(45), z.literal(60)]),
      impulseMagnitudes: z.tuple([z.literal(6), z.literal(8)]),
      azimuthDegrees: z.tuple([z.literal(-15), z.literal(0), z.literal(15)]),
      nestedAxisOrder: z.tuple([
        z.literal("gap"),
        z.literal("tilt"),
        z.literal("impulse"),
        z.literal("azimuth"),
      ]),
    }),
    setup: z.strictObject({
      selectedCapId: z.literal("home-0"),
      obstacleCapId: z.literal("home-1"),
      buttonId: z.literal("button"),
      selectedCapXZ: z.tuple([z.literal(0), z.literal(-5)]),
      capRestHeight: z.literal("surfaceY+capHeight/2"),
      buttonPoseFunction: z.literal("deriveRestartButtonPose"),
      obstacleGapAxis: z.literal("world-positive-Z"),
      fillerOrder: z.literal("canonical-entity-order"),
      fillerX: z.tuple([z.literal(-4.5), z.literal(4.5)]),
      fillerZ: z.tuple([
        z.literal(-8),
        z.literal(-5),
        z.literal(-2),
        z.literal(1),
        z.literal(4),
        z.literal(7),
      ]),
      initialStateHashAlgorithm: z.literal("hashCanonicalJson-v1"),
      capsIdentityRotation: z.literal(true),
      allDynamicVelocitiesZero: z.literal(true),
      impulseDirection: z.tuple([z.literal(0), z.literal(0), z.literal(1)]),
      impulseApplicationPoint: z.literal("actual-native-world-COM"),
      supportApronMargin: z.literal(325),
    }),
    materials: z.strictObject({
      shapeCount: z.literal(22),
      friction: z.literal(0.15),
      staticFriction: z.literal(0.15),
      restitution: z.literal(0),
      frictionCombine: z.literal("MINIMUM"),
      restitutionCombine: z.literal("MAXIMUM"),
      readbackPolicy: z.literal("exact-setter-value"),
    }),
    energy: z.strictObject({
      formulaVersion: z.literal("shifted-mechanical-energy-v1"),
      gravityMagnitude: z.literal(9.81),
      maximum: z.literal(34),
      maximumRestComDrop: z.literal(0.01125),
      nativeMassProjection: z.literal("Math.fround(configuredMass)"),
      nativeMassToleranceMultiplier: z.literal(64),
      restReference: z.literal("tuple-initial-native-COM-y"),
    }),
    sweep: z.strictObject({
      maximumPointSweepPerCall: z.literal(0.01125),
      maximumRotationPerCall: z.literal(0.39269908169872414),
      maximumCallsPerNominalTick: z.literal(48),
      verticalClearanceMargin: z.literal(0.005),
    }),
    workload: z.strictObject({
      maximumNominalTicksPerCase: z.literal(1800),
      maximumExecuteStepCallsPerCase: z.literal(86400),
      maximumExecuteStepCallsMatrix: z.literal(2073600),
      maximumBatchesPerCase: z.literal(720),
      maximumBatchesMatrix: z.literal(17280),
      maximumCallsPerBatch: z.literal(120),
      maximumWallTimePerCaseMs: z.literal(30000),
      maximumWallTimeMatrixMs: z.literal(720000),
    }),
    artifact: z.strictObject({
      sampleRateHz: z.literal(120),
      maximumBodyRowsPerCase: z.literal(27015),
      maximumBodyRowsMatrix: z.literal(648360),
      maximumContactsPerCase: z.literal(8192),
      maximumContactsMatrix: z.literal(196608),
      maximumSweepRowsPerCase: z.literal(1801),
      maximumBodyOrContactRowBytes: z.literal(512),
      maximumSweepRowBytes: z.literal(1024),
      maximumCaseBytes: z.literal(20971520),
      maximumMatrixBytes: z.literal(504365056),
      maximumCaseMetadataBytes: z.literal(65536),
      maximumMatrixMetadataBytes: z.literal(65536),
      maximumEventTypeBytes: z.literal(64),
    }),
  });

export const TEAM_IDS = ["home", "away"] as const;
export const CAP_IDS = [
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
] as const;
export const ENTITY_IDS = ["button", ...CAP_IDS] as const;

export const TeamIdSchema = z.enum(TEAM_IDS);
export const CapEntityIdSchema = z.enum(CAP_IDS);
export const EntityIdSchema = z.enum(ENTITY_IDS);

export const Vec3Schema = z.strictObject({
  x: finiteNumber,
  y: finiteNumber,
  z: finiteNumber,
});

export const QuatSchema = z
  .strictObject({
    x: finiteNumber,
    y: finiteNumber,
    z: finiteNumber,
    w: finiteNumber,
  })
  .superRefine((rotation, context) => {
    const norm = Math.hypot(rotation.x, rotation.y, rotation.z, rotation.w);
    if (Math.abs(norm - 1) > QUATERNION_NORM_TOLERANCE) {
      context.addIssue({
        code: "custom",
        message: `Quaternion norm must be within ${QUATERNION_NORM_TOLERANCE} of 1.`,
      });
    }
  });

export const ConfigHashSchema = z.string().regex(/^[0-9a-f]{64}$/);

export const VersionStampSchema = z.strictObject({
  protocolVersion: z.literal(1),
  gameId: z.literal("counterball"),
  gameVersion: z.string().min(1).max(64),
  rulesVersion: z.literal("counterball-1"),
  physicsVersion: z.string().min(1).max(128),
  configHash: ConfigHashSchema,
});

export const BodyStateSchema = z.strictObject({
  id: EntityIdSchema,
  position: Vec3Schema,
  rotation: QuatSchema,
  linearVelocity: Vec3Schema,
  angularVelocity: Vec3Schema,
});

export const RestartSchema = z.strictObject({
  reason: z.enum(["foul", "out", "penalty"]),
  awardedTeam: TeamIdSchema,
  anchor: Vec3Schema,
});

export const MatchOutcomeSchema = z.strictObject({
  winner: TeamIdSchema.nullable(),
  reason: z.enum(["target", "forfeit", "abandoned"]),
});

export const PlaybackMetadataSchema = z.strictObject({
  shotId: uuid,
  startsAtMs: finiteNumber.min(0),
  durationMs: finiteNumber.min(0).max(15_000),
});

const scoreSchema = z.strictObject({
  home: nonNegativeInteger,
  away: nonNegativeInteger,
});

const formationIdsSchema = z.strictObject({
  home: z.string().min(1).max(64),
  away: z.string().min(1).max(64),
});

function exactlyFifteenUniqueBodies<T extends { id: string }>(
  bodies: T[],
  context: z.RefinementCtx,
): void {
  if (bodies.length !== ENTITY_IDS.length) {
    context.addIssue({
      code: "custom",
      message: `Expected exactly ${ENTITY_IDS.length} bodies.`,
    });
  }

  const seen = new Set<string>();
  for (const [index, body] of bodies.entries()) {
    if (seen.has(body.id)) {
      context.addIssue({
        code: "custom",
        path: [index, "id"],
        message: `Duplicate body ID "${body.id}".`,
      });
    }
    seen.add(body.id);
  }

  for (const expectedId of ENTITY_IDS) {
    if (!seen.has(expectedId)) {
      context.addIssue({
        code: "custom",
        path: ["id"],
        message: `Missing body ID "${expectedId}".`,
      });
    }
  }
}

export const MatchStateSchema = z
  .strictObject({
    versions: VersionStampSchema,
    matchId: uuid,
    stateVersion: nonNegativeInteger,
    status: z.enum(["waiting", "active", "paused", "complete", "abandoned"]),
    phase: z.enum([
      "ready",
      "restartPlacement",
      "simulating",
      "playback",
      "placementBlocked",
    ]),
    activeTeam: TeamIdSchema,
    score: scoreSchema,
    targetGoals: z.number().int().min(1).max(10),
    formationIds: formationIdsSchema,
    bodies: z.array(BodyStateSchema),
    restart: RestartSchema.optional(),
    pendingActionId: uuid.optional(),
    playback: PlaybackMetadataSchema.optional(),
    outcome: MatchOutcomeSchema.optional(),
  })
  .superRefine((state, context) =>
    exactlyFifteenUniqueBodies(state.bodies, context),
  );

const shotCommandSchema = z.strictObject({
  type: z.literal("shot"),
  capId: CapEntityIdSchema,
  yaw: finiteNumber,
  power: finiteNumber.min(0).max(1),
});

const restartShotCommandSchema = z.strictObject({
  type: z.literal("restartShot"),
  capId: CapEntityIdSchema,
  capPosition: Vec3Schema,
  buttonAzimuth: finiteNumber,
  buttonTilt: finiteNumber.min(0).max(Math.PI / 3),
  yaw: finiteNumber,
  power: finiteNumber.min(0).max(1),
});

export const GameCommandSchema = z.discriminatedUnion("type", [
  shotCommandSchema,
  restartShotCommandSchema,
]);

export const ActionEnvelopeSchema = z.strictObject({
  type: z.literal("game.action"),
  protocolVersion: z.literal(1),
  matchId: uuid,
  actionId: uuid,
  expectedStateVersion: nonNegativeInteger,
  command: GameCommandSchema,
});

export const ControlEnvelopeSchema = z.strictObject({
  type: z.enum(["match.snapshot.request", "match.leave"]),
  protocolVersion: z.literal(1),
  matchId: uuid,
  requestId: uuid,
});

export const ContactFactSchema = z
  .strictObject({
    type: z.literal("contact"),
    step: nonNegativeInteger,
    timeMs: finiteNumber.min(0),
    a: EntityIdSchema,
    b: EntityIdSchema,
    point: Vec3Schema,
  })
  .refine((fact) => fact.a !== fact.b, {
    message: "A body cannot be in contact with itself.",
    path: ["b"],
  });

export const CrossingFactSchema = z.strictObject({
  type: z.literal("crossing"),
  step: nonNegativeInteger,
  timeMs: finiteNumber.min(0),
  entity: EntityIdSchema,
  boundary: z.enum(["left", "right", "homeEnd", "awayEnd"]),
  point: Vec3Schema,
  kind: z.enum(["goal", "out"]),
});

export const SimulationFactSchema = z.discriminatedUnion("type", [
  ContactFactSchema,
  CrossingFactSchema,
]);

export const PlaybackTransformSchema = z.strictObject({
  id: EntityIdSchema,
  position: Vec3Schema,
  rotation: QuatSchema,
});

export const PlaybackFrameSchema = z.strictObject({
  timeMs: finiteNumber.min(0),
  bodies: z
    .array(PlaybackTransformSchema)
    .superRefine(exactlyFifteenUniqueBodies),
});

export const ShotSimulationSchema = z.strictObject({
  shotId: uuid,
  settledBodies: z
    .array(BodyStateSchema)
    .superRefine(exactlyFifteenUniqueBodies),
  facts: z
    .array(SimulationFactSchema)
    .max(COUNTERBALL_PROTOCOL_LIMITS.maxSimulationFactsPerShot),
  frames: z
    .array(PlaybackFrameSchema)
    .min(1)
    .max(COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackFramesPerShot),
  durationMs: finiteNumber.min(0).max(15_000),
  termination: z.literal("settled"),
});

const roomParticipantSchema = z.strictObject({
  playerId: uuid,
  username: z.string().min(1).max(32),
  role: z.enum(["player", "spectator"]),
  team: TeamIdSchema.optional(),
});

export const RoomViewSchema = z
  .strictObject({
    roomId: uuid,
    hostPlayerId: uuid,
    participants: z
      .array(roomParticipantSchema)
      .max(COUNTERBALL_PROTOCOL_LIMITS.maxRoomParticipants),
    waitingPlayerIds: z
      .array(uuid)
      .max(COUNTERBALL_PROTOCOL_LIMITS.maxWaitingPlayerIds),
    targetGoals: z.number().int().min(1).max(10),
    chosenFormations: formationIdsSchema,
  })
  .superRefine((room, context) => {
    const participantIds = room.participants.map(({ playerId }) => playerId);
    if (new Set(participantIds).size !== participantIds.length) {
      context.addIssue({
        code: "custom",
        path: ["participants"],
        message: "Room participant IDs must be unique.",
      });
    }
    if (new Set(room.waitingPlayerIds).size !== room.waitingPlayerIds.length) {
      context.addIssue({
        code: "custom",
        path: ["waitingPlayerIds"],
        message: "Waiting player IDs must be unique.",
      });
    }
  });

const playbackChunkObjectSchema = z.strictObject({
  shotId: uuid,
  chunkIndex: nonNegativeInteger,
  chunkCount: z
    .number()
    .int()
    .min(1)
    .max(COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackChunksPerShot),
  frames: z
    .array(PlaybackFrameSchema)
    .min(1)
    .max(COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackFramesPerShot),
});

type PlaybackChunkValue = {
  shotId: string;
  chunkIndex: number;
  chunkCount: number;
  frames: PlaybackFrame[];
};

function encodedPlaybackChunkBytes(chunk: PlaybackChunkValue): number {
  return new TextEncoder().encode(
    JSON.stringify({
      shotId: chunk.shotId,
      chunkIndex: chunk.chunkIndex,
      chunkCount: chunk.chunkCount,
      frames: chunk.frames,
    }),
  ).byteLength;
}

function checkPlaybackChunkBounds(
  chunk: PlaybackChunkValue,
  context: z.RefinementCtx,
): void {
  if (chunk.chunkIndex >= chunk.chunkCount) {
    context.addIssue({
      code: "custom",
      path: ["chunkIndex"],
      message: "Playback chunk index must be less than chunk count.",
    });
  }
  if (
    encodedPlaybackChunkBytes(chunk) >
    COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackChunkBytes
  ) {
    context.addIssue({
      code: "custom",
      path: ["frames"],
      message: `Encoded playback chunks cannot exceed ${COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackChunkBytes} bytes.`,
    });
  }
}

const playbackChunkSchema = playbackChunkObjectSchema.superRefine(
  checkPlaybackChunkBounds,
);

const serverEventBaseShape = {
  protocolVersion: z.literal(1),
  matchId: uuid,
  eventSeq: z.number().int().min(1),
  serverTimeMs: finiteNumber.min(0),
};

function versionsEqual(left: VersionStamp, right: VersionStamp): boolean {
  return (
    left.protocolVersion === right.protocolVersion &&
    left.gameId === right.gameId &&
    left.gameVersion === right.gameVersion &&
    left.rulesVersion === right.rulesVersion &&
    left.physicsVersion === right.physicsVersion &&
    left.configHash === right.configHash
  );
}

const SessionReadyEventSchema = z.strictObject({
  ...serverEventBaseShape,
  type: z.literal("session.ready"),
  playerId: uuid,
  username: z.string().min(1).max(32),
  role: z.enum(["player", "spectator"]),
  team: TeamIdSchema.optional(),
});

const MatchSnapshotEventSchema = z
  .strictObject({
    ...serverEventBaseShape,
    type: z.literal("match.snapshot"),
    state: MatchStateSchema,
    versions: VersionStampSchema,
    role: z.enum(["player", "spectator"]),
    team: TeamIdSchema.optional(),
    latestEventSeq: nonNegativeInteger,
    playback: PlaybackMetadataSchema.optional(),
    playbackChunks: z
      .array(playbackChunkSchema)
      .max(COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackChunksPerShot)
      .optional(),
    room: RoomViewSchema,
  })
  .superRefine((event, context) => {
    if (event.state.matchId !== event.matchId) {
      context.addIssue({
        code: "custom",
        path: ["state", "matchId"],
        message: "Snapshot state must belong to the event match.",
      });
    }
    if (!versionsEqual(event.state.versions, event.versions)) {
      context.addIssue({
        code: "custom",
        path: ["versions"],
        message: "Snapshot versions must match its state versions.",
      });
    }
    if (event.role === "player" && event.team === undefined) {
      context.addIssue({
        code: "custom",
        path: ["team"],
        message: "A player snapshot requires an assigned team.",
      });
    }
    if (event.role === "spectator" && event.team !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["team"],
        message: "A spectator cannot have an assigned team.",
      });
    }
    const chunks = event.playbackChunks ?? [];
    if (chunks.length > 0 && event.playback === undefined) {
      context.addIssue({
        code: "custom",
        path: ["playbackChunks"],
        message: "Playback chunks require matching playback metadata.",
      });
    }
    const chunkIndexes = new Set<number>();
    let totalChunkBytes = 0;
    for (const [index, chunk] of chunks.entries()) {
      if (event.playback?.shotId !== chunk.shotId) {
        context.addIssue({
          code: "custom",
          path: ["playbackChunks", index, "shotId"],
          message: "Snapshot chunks must match the active playback shot.",
        });
      }
      if (chunkIndexes.has(chunk.chunkIndex)) {
        context.addIssue({
          code: "custom",
          path: ["playbackChunks", index, "chunkIndex"],
          message: "Snapshot playback chunk indexes must be unique.",
        });
      }
      chunkIndexes.add(chunk.chunkIndex);
      if (index > 0 && chunk.chunkCount !== chunks[0]?.chunkCount) {
        context.addIssue({
          code: "custom",
          path: ["playbackChunks", index, "chunkCount"],
          message: "Snapshot chunks must agree on the total chunk count.",
        });
      }
      totalChunkBytes += encodedPlaybackChunkBytes(chunk);
    }
    if (
      totalChunkBytes > COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackSnapshotBytes
    ) {
      context.addIssue({
        code: "custom",
        path: ["playbackChunks"],
        message: `Snapshot playback data cannot exceed ${COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackSnapshotBytes} bytes.`,
      });
    }
  });

const GameActionAcceptedEventSchema = z.strictObject({
  ...serverEventBaseShape,
  type: z.literal("game.action.accepted"),
  actionId: uuid,
  resultingStateVersion: nonNegativeInteger,
  shotId: uuid,
});

const ActionRejectionCodeSchema = z.enum([
  "notAuthenticated",
  "notPlayer",
  "notYourShot",
  "staleState",
  "wrongPhase",
  "invalidCommand",
  "invalidPlacement",
  "busy",
  "versionMismatch",
]);

const GameActionRejectedEventSchema = z.strictObject({
  ...serverEventBaseShape,
  type: z.literal("game.action.rejected"),
  actionId: uuid,
  code: ActionRejectionCodeSchema,
  currentStateVersion: nonNegativeInteger,
});

const GamePlaybackStartEventSchema = z.strictObject({
  ...serverEventBaseShape,
  type: z.literal("game.playback.start"),
  shotId: uuid,
  startsAtMs: finiteNumber.min(0),
  durationMs: finiteNumber.min(0).max(15_000),
  frameCount: z
    .number()
    .int()
    .min(1)
    .max(COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackFramesPerShot),
  chunkCount: z
    .number()
    .int()
    .min(1)
    .max(COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackChunksPerShot),
  resultingStateVersion: nonNegativeInteger,
});

const GamePlaybackChunkEventSchema = z
  .strictObject({
    ...serverEventBaseShape,
    type: z.literal("game.playback.chunk"),
    ...playbackChunkObjectSchema.shape,
  })
  .superRefine((event, context) => checkPlaybackChunkBounds(event, context));

const GameShotCommittedEventSchema = z.strictObject({
  ...serverEventBaseShape,
  type: z.literal("game.shot.committed"),
  actionId: uuid,
  shotId: uuid,
  state: MatchStateSchema,
});

const GameShotAbortedEventSchema = z.strictObject({
  ...serverEventBaseShape,
  type: z.literal("game.shot.aborted"),
  actionId: uuid,
  reason: z.enum([
    "initialization",
    "timeout",
    "cancelled",
    "invalidBody",
    "resourceLimit",
  ]),
  state: MatchStateSchema,
});

const MatchPresenceEventSchema = z.strictObject({
  ...serverEventBaseShape,
  type: z.literal("match.presence"),
  room: RoomViewSchema,
});

const MatchCompletedEventSchema = z.strictObject({
  ...serverEventBaseShape,
  type: z.literal("match.completed"),
  state: MatchStateSchema,
  outcome: z.strictObject({
    winner: TeamIdSchema.nullable(),
    reason: z.enum(["target", "forfeit", "abandoned"]),
  }),
});

export const ServerEventSchema = z.discriminatedUnion("type", [
  SessionReadyEventSchema,
  MatchSnapshotEventSchema,
  GameActionAcceptedEventSchema,
  GameActionRejectedEventSchema,
  GamePlaybackStartEventSchema,
  GamePlaybackChunkEventSchema,
  GameShotCommittedEventSchema,
  GameShotAbortedEventSchema,
  MatchPresenceEventSchema,
  MatchCompletedEventSchema,
]);

const inviteCommandSchema = z
  .strictObject({
    type: z.literal("invite"),
    role: z.enum(["player", "spectator"]),
    recipientPlayerId: uuid.optional(),
    maxRedemptions: z.number().int().min(1).max(20),
  })
  .superRefine((invite, context) => {
    if (invite.role === "player" && invite.maxRedemptions !== 1) {
      context.addIssue({
        code: "custom",
        path: ["maxRedemptions"],
        message: "A direct player invite can be redeemed only once.",
      });
    }
  });

export const RoomCommandSchema = z.discriminatedUnion("type", [
  inviteCommandSchema,
  z.strictObject({ type: z.literal("revokeInvite"), invitationId: uuid }),
  z.strictObject({
    type: z.literal("redeemInvite"),
    token: z.string().min(32).max(512),
  }),
  z.strictObject({ type: z.literal("joinQueue") }),
  z.strictObject({ type: z.literal("leaveQueue") }),
  z.strictObject({
    type: z.literal("setFormation"),
    formationId: z.string().min(1).max(64),
  }),
  z.strictObject({ type: z.literal("startMatch") }),
  z.strictObject({ type: z.literal("requestRematch") }),
]);

export const RoomCommandEnvelopeSchema = z.strictObject({
  type: z.literal("room.command"),
  protocolVersion: z.literal(1),
  roomId: uuid,
  requestId: uuid,
  command: RoomCommandSchema,
});

const roomCommandSuccessSchema = z.strictObject({
  requestId: uuid,
  room: RoomViewSchema,
  matchId: uuid,
});

const invitationCreatedSchema = roomCommandSuccessSchema.extend({
  invitationId: uuid,
  token: z.string().min(32).max(512),
  expiresAtMs: finiteNumber.min(0),
});

const roomCommandFailureSchema = z.strictObject({
  requestId: uuid,
  code: z.string().min(1).max(64),
  message: z.string().min(1).max(256),
});

export const RoomCommandResponseSchema = z.union([
  invitationCreatedSchema,
  roomCommandSuccessSchema,
  roomCommandFailureSchema,
]);

export const CounterballConfigSchema: z.ZodType<CounterballConfig> = z
  .strictObject({
    schemaVersion: z.literal(3),
    configVersion: z.literal("counterball-config-3"),
    geometry: z.strictObject({
      pitchWidth: finiteNumber.positive(),
      pitchLength: finiteNumber.positive(),
      surfaceY: finiteNumber,
      capRadius: finiteNumber.positive(),
      capHeight: finiteNumber.positive(),
      buttonRadius: finiteNumber.positive(),
      buttonThickness: finiteNumber.positive(),
      goalWidth: finiteNumber.positive(),
      goalHeight: finiteNumber.positive(),
      goalFrameRadius: finiteNumber.positive(),
      surfaceThickness: finiteNumber.positive(),
      penaltyBoxWidth: finiteNumber.positive(),
      penaltyBoxDepth: finiteNumber.positive(),
    }),
    bodies: z.strictObject({
      capsPerTeam: z.literal(7),
      capMass: finiteNumber.positive(),
      buttonMass: finiteNumber.positive(),
    }),
    simulation: z.strictObject({
      gravity: z.strictObject({
        x: finiteNumber,
        y: finiteNumber,
        z: finiteNumber,
      }),
      fixedStepSeconds: finiteNumber.positive(),
      maxShotDurationSeconds: finiteNumber.positive(),
      settleWindowSeconds: finiteNumber.positive(),
      linearSettleThreshold: finiteNumber.positive(),
      angularSettleThreshold: finiteNumber.positive(),
      playbackSamplesPerSecond: z.number().int().positive(),
    }),
    restart: z.strictObject({
      anchorTolerance: finiteNumber.positive(),
      maxButtonTiltRadians: finiteNumber.min(0).max(Math.PI / 3),
      clearanceEpsilon: finiteNumber.positive(),
    }),
    action: z.strictObject({
      minimumPower: z.literal(0),
      maximumPower: z.literal(1),
      maximumPayloadBytes: z.number().int().positive(),
    }),
    match: z.strictObject({
      defaultTargetGoals: z.literal(3),
      minimumPrivateTargetGoals: z.literal(1),
      maximumPrivateTargetGoals: z.literal(10),
    }),
    physicsCalibration: physicsCalibrationSchema.nullable(),
    diagnosticGuard: diagnosticPhysicsGuardSchema,
    restartLoftDiagnosticGuard: restartLoftDiagnosticGuardSchema,
  })
  .superRefine((config, context) => {
    const calibration = config.physicsCalibration;
    if (calibration === null) {
      return;
    }

    if (
      Math.abs(calibration.impulse.applicationHeightOffset) >
      config.geometry.capHeight / 2
    ) {
      context.addIssue({
        code: "custom",
        path: ["physicsCalibration", "impulse", "applicationHeightOffset"],
        message:
          "Application height offset must stay within half the cap height.",
      });
    }

    const smallestColliderThickness = Math.min(
      config.geometry.capHeight,
      config.geometry.buttonThickness,
      config.geometry.surfaceThickness,
      config.geometry.goalFrameRadius * 2,
    );
    if (
      calibration.tunnelling.maxTranslationPerSubstep >=
      smallestColliderThickness
    ) {
      context.addIssue({
        code: "custom",
        path: ["physicsCalibration", "tunnelling", "maxTranslationPerSubstep"],
        message:
          "Translation per substep must be less than the smallest configured collider thickness.",
      });
    }
  });

export const ProtocolParseErrorCode = "invalidPayload" as const;

export type ProtocolIssue = {
  path: (string | number)[];
  code: string;
  message: string;
};

export class ProtocolParseError extends Error {
  readonly code = ProtocolParseErrorCode;
  readonly issues: ProtocolIssue[];

  constructor(issues: ProtocolIssue[]) {
    super("Protocol payload is invalid.");
    this.name = "ProtocolParseError";
    this.issues = issues;
  }
}

function collectJsonIssues(
  value: unknown,
  path: (string | number)[] = [],
  ancestors = new Set<object>(),
): ProtocolIssue[] {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return [];
  }
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? []
      : [
          {
            path,
            code: "non_finite_number",
            message: "JSON numbers must be finite.",
          },
        ];
  }
  if (typeof value === "undefined") {
    return [
      {
        path,
        code: "undefined_value",
        message: "Protocol objects must omit undefined values.",
      },
    ];
  }
  if (typeof value !== "object") {
    return [
      {
        path,
        code: "non_json_value",
        message: `Protocol payloads cannot contain ${typeof value} values.`,
      },
    ];
  }
  if (ancestors.has(value)) {
    return [
      {
        path,
        code: "circular_reference",
        message: "Protocol payloads cannot be circular.",
      },
    ];
  }
  ancestors.add(value);

  let issues: ProtocolIssue[];
  if (Array.isArray(value)) {
    issues = [];
    if (value.length > COUNTERBALL_PROTOCOL_LIMITS.maxArrayItems) {
      issues.push({
        path,
        code: "array_too_large",
        message: `Protocol arrays cannot contain more than ${COUNTERBALL_PROTOCOL_LIMITS.maxArrayItems} items.`,
      });
      ancestors.delete(value);
      return issues;
    }
    if (
      Object.getOwnPropertySymbols(value).length > 0 ||
      Object.getOwnPropertyNames(value).length !== value.length + 1
    ) {
      issues.push({
        path,
        code: "array_extra_key",
        message: "Protocol arrays cannot contain custom keys.",
      });
    }
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) {
        issues.push({
          path: [...path, index],
          code: "sparse_array",
          message: "Protocol arrays cannot contain holes.",
        });
      } else {
        const descriptor = Object.getOwnPropertyDescriptor(
          value,
          String(index),
        );
        if (descriptor === undefined || !("value" in descriptor)) {
          issues.push({
            path: [...path, index],
            code: "accessor_value",
            message: "Protocol arrays cannot contain accessors.",
          });
        } else {
          issues.push(
            ...collectJsonIssues(descriptor.value, [...path, index], ancestors),
          );
        }
      }
    }
  } else {
    const prototype = Reflect.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      issues = [
        {
          path,
          code: "non_plain_object",
          message: "Protocol objects must be plain JSON objects.",
        },
      ];
    } else if (
      Object.getOwnPropertySymbols(value).length > 0 ||
      Object.getOwnPropertyNames(value).length !== Object.keys(value).length
    ) {
      issues = [
        {
          path,
          code: "hidden_or_symbol_key",
          message: "Protocol objects cannot contain hidden or symbol keys.",
        },
      ];
    } else {
      issues = [];
      for (const key of Object.keys(value)) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (descriptor === undefined || !("value" in descriptor)) {
          issues.push({
            path: [...path, key],
            code: "accessor_value",
            message: "Protocol objects cannot contain accessors.",
          });
        } else {
          issues.push(
            ...collectJsonIssues(descriptor.value, [...path, key], ancestors),
          );
        }
      }
    }
  }

  ancestors.delete(value);
  return issues;
}

export function parseWithSchema<TSchema extends z.ZodType>(
  schema: TSchema,
  payload: unknown,
): z.output<TSchema> {
  const jsonIssues = collectJsonIssues(payload);
  if (jsonIssues.length > 0) {
    throw new ProtocolParseError(jsonIssues);
  }
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new ProtocolParseError(
      result.error.issues.map((issue) => ({
        path: issue.path.map((part) =>
          typeof part === "symbol" ? part.toString() : part,
        ),
        code: issue.code,
        message: issue.message,
      })),
    );
  }
  return result.data;
}

export const parseActionEnvelope = (payload: unknown): ActionEnvelope =>
  parseWithSchema(ActionEnvelopeSchema, payload);

export const parseControlEnvelope = (payload: unknown): ControlEnvelope =>
  parseWithSchema(ControlEnvelopeSchema, payload);

export const parseGameCommand = (payload: unknown): GameCommand =>
  parseWithSchema(GameCommandSchema, payload);

export const parseMatchState = (payload: unknown): MatchState =>
  parseWithSchema(MatchStateSchema, payload);

export const parseRoomCommandEnvelope = (
  payload: unknown,
): RoomCommandEnvelope => parseWithSchema(RoomCommandEnvelopeSchema, payload);

export const parseServerEvent = (payload: unknown): ServerEvent =>
  parseWithSchema(ServerEventSchema, payload);

export const parseShotSimulation = (payload: unknown): ShotSimulation =>
  parseWithSchema(ShotSimulationSchema, payload);

export const parseVersionStamp = (payload: unknown): VersionStamp =>
  parseWithSchema(VersionStampSchema, payload);
