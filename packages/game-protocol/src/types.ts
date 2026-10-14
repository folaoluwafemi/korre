export type TeamId = "home" | "away";
export type CapIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type CapEntityId = `${TeamId}-${CapIndex}`;
export type EntityId = "button" | CapEntityId;

export type Vec3 = { x: number; y: number; z: number };
export type Quat = { x: number; y: number; z: number; w: number };

export type VersionStamp = {
  protocolVersion: 1;
  gameId: "counterball";
  gameVersion: string;
  rulesVersion: "counterball-1";
  physicsVersion: string;
  configHash: string;
};

export type BodyState = {
  id: EntityId;
  position: Vec3;
  rotation: Quat;
  linearVelocity: Vec3;
  angularVelocity: Vec3;
};

export type Restart = {
  reason: "foul" | "out" | "penalty";
  awardedTeam: TeamId;
  anchor: Vec3;
};

export type MatchStatus =
  "waiting" | "active" | "paused" | "complete" | "abandoned";

export type MatchPhase =
  "ready" | "restartPlacement" | "simulating" | "playback" | "placementBlocked";

export type MatchOutcome = {
  winner: TeamId | null;
  reason: "target" | "forfeit" | "abandoned";
};

export type PlaybackMetadata = {
  shotId: string;
  startsAtMs: number;
  durationMs: number;
};

export type MatchState = {
  versions: VersionStamp;
  matchId: string;
  stateVersion: number;
  status: MatchStatus;
  phase: MatchPhase;
  activeTeam: TeamId;
  score: Record<TeamId, number>;
  targetGoals: number;
  formationIds: Record<TeamId, string>;
  bodies: BodyState[];
  restart?: Restart | undefined;
  pendingActionId?: string | undefined;
  playback?: PlaybackMetadata | undefined;
  outcome?: MatchOutcome | undefined;
};

export type ShotCommand = {
  type: "shot";
  capId: CapEntityId;
  yaw: number;
  power: number;
};

export type RestartShotCommand = {
  type: "restartShot";
  capId: CapEntityId;
  capPosition: Vec3;
  buttonAzimuth: number;
  buttonTilt: number;
  yaw: number;
  power: number;
};

export type GameCommand = ShotCommand | RestartShotCommand;

export type ActionEnvelope = {
  type: "game.action";
  protocolVersion: 1;
  matchId: string;
  actionId: string;
  expectedStateVersion: number;
  command: GameCommand;
};

export type ControlEnvelope = {
  type: "match.snapshot.request" | "match.leave";
  protocolVersion: 1;
  matchId: string;
  requestId: string;
};

export type ContactFact = {
  type: "contact";
  step: number;
  timeMs: number;
  a: EntityId;
  b: EntityId;
  point: Vec3;
};

export type CrossingFact = {
  type: "crossing";
  step: number;
  timeMs: number;
  entity: EntityId;
  boundary: "left" | "right" | "homeEnd" | "awayEnd";
  point: Vec3;
  kind: "goal" | "out";
};

export type SimulationFact = ContactFact | CrossingFact;

export type PlaybackTransform = Pick<BodyState, "id" | "position" | "rotation">;
export type PlaybackFrame = {
  timeMs: number;
  bodies: PlaybackTransform[];
};

export type ShotSimulation = {
  shotId: string;
  settledBodies: BodyState[];
  facts: SimulationFact[];
  frames: PlaybackFrame[];
  durationMs: number;
  termination: "settled";
};

export type SimulationInput = {
  state: MatchState;
  command: GameCommand;
  config: CounterballConfig;
};

export type SimulationRunOptions = {
  signal?: { readonly aborted: boolean };
};

export interface SimulationRunner {
  simulate(
    input: SimulationInput,
    options?: SimulationRunOptions,
  ): Promise<ShotSimulation>;
}

export type SimulationErrorCode =
  "initialization" | "timeout" | "cancelled" | "invalidBody" | "resourceLimit";

export type SimulationError = Error & {
  readonly code: SimulationErrorCode;
};

export type ActionRejectionCode =
  | "notAuthenticated"
  | "notPlayer"
  | "notYourShot"
  | "staleState"
  | "wrongPhase"
  | "invalidCommand"
  | "invalidPlacement"
  | "busy"
  | "versionMismatch";

export type ServerEventBase = {
  protocolVersion: 1;
  matchId: string;
  eventSeq: number;
  serverTimeMs: number;
};

export type SessionReadyEvent = ServerEventBase & {
  type: "session.ready";
  playerId: string;
  username: string;
  role: "player" | "spectator";
  team?: TeamId | undefined;
};

export type RoomParticipant = {
  playerId: string;
  username: string;
  role: "player" | "spectator";
  team?: TeamId | undefined;
};

export type RoomView = {
  roomId: string;
  hostPlayerId: string;
  participants: RoomParticipant[];
  waitingPlayerIds: string[];
  targetGoals: number;
  chosenFormations: Record<TeamId, string>;
};

export type PlaybackChunk = {
  shotId: string;
  chunkIndex: number;
  chunkCount: number;
  frames: PlaybackFrame[];
};

export type MatchSnapshotEvent = ServerEventBase & {
  type: "match.snapshot";
  state: MatchState;
  versions: VersionStamp;
  role: "player" | "spectator";
  team?: TeamId | undefined;
  latestEventSeq: number;
  playback?: PlaybackMetadata | undefined;
  playbackChunks?: PlaybackChunk[] | undefined;
  room: RoomView;
};

export type GameActionAcceptedEvent = ServerEventBase & {
  type: "game.action.accepted";
  actionId: string;
  resultingStateVersion: number;
  shotId: string;
};

export type GameActionRejectedEvent = ServerEventBase & {
  type: "game.action.rejected";
  actionId: string;
  code: ActionRejectionCode;
  currentStateVersion: number;
};

export type GamePlaybackStartEvent = ServerEventBase & {
  type: "game.playback.start";
  shotId: string;
  startsAtMs: number;
  durationMs: number;
  frameCount: number;
  chunkCount: number;
  resultingStateVersion: number;
};

export type GamePlaybackChunkEvent = ServerEventBase & {
  type: "game.playback.chunk";
} & PlaybackChunk;

export type GameShotCommittedEvent = ServerEventBase & {
  type: "game.shot.committed";
  actionId: string;
  shotId: string;
  state: MatchState;
};

export type GameShotAbortedEvent = ServerEventBase & {
  type: "game.shot.aborted";
  actionId: string;
  reason: SimulationErrorCode;
  state: MatchState;
};

export type MatchPresenceEvent = ServerEventBase & {
  type: "match.presence";
  room: RoomView;
};

export type MatchCompletedEvent = ServerEventBase & {
  type: "match.completed";
  state: MatchState;
  outcome: MatchOutcome;
};

export type ServerEvent =
  | SessionReadyEvent
  | MatchSnapshotEvent
  | GameActionAcceptedEvent
  | GameActionRejectedEvent
  | GamePlaybackStartEvent
  | GamePlaybackChunkEvent
  | GameShotCommittedEvent
  | GameShotAbortedEvent
  | MatchPresenceEvent
  | MatchCompletedEvent;

export type RoomCommand =
  | {
      type: "invite";
      role: "player" | "spectator";
      recipientPlayerId?: string | undefined;
      maxRedemptions: number;
    }
  | { type: "revokeInvite"; invitationId: string }
  | { type: "redeemInvite"; token: string }
  | { type: "joinQueue" }
  | { type: "leaveQueue" }
  | { type: "setFormation"; formationId: string }
  | { type: "startMatch" }
  | { type: "requestRematch" };

export type RoomCommandEnvelope = {
  type: "room.command";
  protocolVersion: 1;
  roomId: string;
  requestId: string;
  command: RoomCommand;
};

export type RoomCommandSuccess = {
  requestId: string;
  room: RoomView;
  matchId: string;
};

export type InvitationCreated = RoomCommandSuccess & {
  invitationId: string;
  token: string;
  expiresAtMs: number;
};

export type RoomCommandFailure = {
  requestId: string;
  code: string;
  message: string;
};

export type RoomCommandResponse =
  RoomCommandSuccess | InvitationCreated | RoomCommandFailure;

export type PhysicsMaterialCalibration = {
  friction: number;
  restitution: number;
};

export type PhysicsDampingCalibration = {
  linear: number;
  angular: number;
};

/** Versioned, config-hashed Havok inputs. Values remain null until measured. */
export type PhysicsCalibration = {
  schemaVersion: 1;
  havokVersion: "1.3.14";
  adapterVersion: "adapter-2";
  materials: {
    surface: PhysicsMaterialCalibration;
    cap: PhysicsMaterialCalibration;
    button: PhysicsMaterialCalibration;
  };
  damping: {
    cap: PhysicsDampingCalibration;
    button: PhysicsDampingCalibration;
  };
  impulse: {
    normalMax: number;
    restartMax: number;
    applicationHeightOffset: number;
  };
  restartLift: { mode: "contact-only" };
  support: { apronMargin: number };
  workload: { maxBatchSteps: number; maxWallTimeMs: number };
  tunnelling: {
    maxTranslationPerSubstep: number;
    maxRotationPerSubstep: number;
    maxSubsteps: number;
  };
};

/** Fixed envelope for the accepted D01 browser direct-impulse diagnostic only. */
export type DiagnosticPhysicsGuard = {
  schemaVersion: 1;
  scope: "browser-direct-impulse-v1";
  fixtureId: "counterball-protocol-fixtures-v1";
  matchId: "00000000-0000-4000-8000-000000000001";
  capId: "home-6";
  impulse: { x: 0; y: 0; z: 8 };
  applicationPoint: { x: 0; y: 0.06; z: -4 };
  maxMechanicalEnergy: 34;
  maxRestHeightDrop: 0.01125;
  supportApronMargin: 325;
  tunnelling: {
    maxPointSweepPerSubstep: 0.01125;
    maxRotationPerSubstep: 0.39269908169872414;
    maxSubstepsPerTick: 48;
  };
  workload: {
    maxTotalSubsteps: 86400;
    maxBatchSubsteps: 120;
    maxWallTimeMs: 30000;
  };
};

/** Strict config-hashed identity and bounds for the restart-loft diagnostic only. */
export type RestartLoftDiagnosticGuard = {
  schemaVersion: 3;
  scope: "restart-loft-coarse-matrix-v1";
  matrixId: "counterball-l01-grid-v1";
  algorithmVersion: "loft-coarse-probe-v3";
  protocolVersion: 1;
  configSchemaVersion: 5;
  physicsVersion: "havok-1.3.14/adapter-1";
  contactPolicy: {
    eventType: "COLLISION_STARTED";
    nativeSubscription: "started-only";
    readback: "all-22-exact";
    callbackRetention: "all-delivered-including-symmetric";
  };
  fixture: {
    id: "counterball-protocol-fixtures-v1";
    payloadSha256: "6ce26e4203017e446687dfd8ad95106ba582f09420f8c623129c7d1bbe6b625d";
  };
  matchId: "00000000-0000-4000-8000-000000000001";
  wasmSha256: "026917766f534c156286f07975850978dabf17c42e742bbfaaebbcb2215e4e11";
  matrix: {
    gapOffsets: readonly [0.75, 1];
    tiltDegrees: readonly [45, 60];
    impulseMagnitudes: readonly [6, 8];
    azimuthDegrees: readonly [-15, 0, 15];
    nestedAxisOrder: readonly ["gap", "tilt", "impulse", "azimuth"];
  };
  setup: {
    selectedCapId: "home-0";
    obstacleCapId: "home-1";
    buttonId: "button";
    selectedCapXZ: readonly [0, -5];
    capRestHeight: "surfaceY+capHeight/2";
    buttonPoseFunction: "deriveRestartButtonPose";
    obstacleGapAxis: "world-positive-Z";
    fillerOrder: "canonical-entity-order";
    fillerX: readonly [-4.5, 4.5];
    fillerZ: readonly [-8, -5, -2, 1, 4, 7];
    initialStateHashAlgorithm: "hashCanonicalJson-v1";
    capsIdentityRotation: true;
    allDynamicVelocitiesZero: true;
    impulseDirection: readonly [0, 0, 1];
    impulseApplicationPoint: "actual-native-world-COM";
    supportApronMargin: 325;
  };
  materials: {
    shapeCount: 22;
    friction: 0.15;
    staticFriction: 0.15;
    restitution: 0;
    frictionCombine: "MINIMUM";
    restitutionCombine: "MAXIMUM";
    readbackPolicy: "exact-setter-value";
  };
  energy: {
    formulaVersion: "shifted-mechanical-energy-v2";
    gravityMagnitude: 9.81;
    maximum: 34;
    maximumRestComDrop: 0.01125;
    nativeMassProjection: "Math.fround(configuredMass)";
    nativeMassToleranceMultiplier: 64;
    restReference: "native-cylinder-support-COM-lower-bound-y";
  };
  sweep: {
    maximumPointSweepPerCall: 0.01125;
    maximumRotationPerCall: 0.39269908169872414;
    maximumCallsPerNominalTick: 48;
    verticalClearanceMargin: 0.005;
  };
  workload: {
    maximumNominalTicksPerCase: 1800;
    maximumExecuteStepCallsPerCase: 86400;
    maximumExecuteStepCallsMatrix: 2073600;
    maximumBatchesPerCase: 720;
    maximumBatchesMatrix: 17280;
    maximumCallsPerBatch: 120;
    maximumWallTimePerCaseMs: 30000;
    maximumWallTimeMatrixMs: 720000;
  };
  artifact: {
    sampleRateHz: 120;
    maximumBodyRowsPerCase: 27015;
    maximumBodyRowsMatrix: 648360;
    maximumContactsPerCase: 8192;
    maximumContactsMatrix: 196608;
    maximumSweepRowsPerCase: 1801;
    maximumBodyOrContactRowBytes: 512;
    maximumSweepRowBytes: 1024;
    maximumCaseBytes: 20971520;
    maximumMatrixBytes: 504365056;
    maximumCaseMetadataBytes: 65536;
    maximumMatrixMetadataBytes: 65536;
    maximumEventTypeBytes: 64;
  };
};

export type CounterballConfig = {
  schemaVersion: 5;
  configVersion: "counterball-config-5";
  geometry: {
    pitchWidth: number;
    pitchLength: number;
    surfaceY: number;
    capRadius: number;
    capHeight: number;
    buttonRadius: number;
    buttonThickness: number;
    goalWidth: number;
    goalHeight: number;
    goalFrameRadius: number;
    surfaceThickness: number;
    penaltyBoxWidth: number;
    penaltyBoxDepth: number;
  };
  bodies: {
    capsPerTeam: 7;
    capMass: number;
    buttonMass: number;
  };
  simulation: {
    gravity: Vec3;
    fixedStepSeconds: number;
    maxShotDurationSeconds: number;
    settleWindowSeconds: number;
    linearSettleThreshold: number;
    angularSettleThreshold: number;
    playbackSamplesPerSecond: number;
  };
  restart: {
    anchorTolerance: number;
    maxButtonTiltRadians: number;
    clearanceEpsilon: number;
  };
  action: {
    minimumPower: 0;
    maximumPower: 1;
    maximumPayloadBytes: number;
  };
  match: {
    defaultTargetGoals: 3;
    minimumPrivateTargetGoals: 1;
    maximumPrivateTargetGoals: 10;
  };
  physicsCalibration: PhysicsCalibration | null;
  diagnosticGuard: DiagnosticPhysicsGuard;
  restartLoftDiagnosticGuard: RestartLoftDiagnosticGuard;
};

export type ConfigHash = string & { readonly __brand: "ConfigHash" };

export type DomainEvent =
  | { type: "foul.awarded"; restart: Restart; offendingCapId: CapEntityId }
  | { type: "goal.scored"; scoringTeam: TeamId; crossing: CrossingFact }
  | { type: "out.awarded"; restart: Restart; crossing: CrossingFact }
  | { type: "turn.changed"; activeTeam: TeamId }
  | { type: "match.completed"; outcome: MatchOutcome };
