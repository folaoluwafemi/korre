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

export interface SimulationRunner {
  simulate(input: SimulationInput): Promise<ShotSimulation>;
}

export type SimulationErrorCode =
  "initialization" | "timeout" | "invalidBody" | "resourceLimit";

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

export type CounterballConfig = {
  schemaVersion: 1;
  configVersion: "counterball-config-1";
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
  physicsCalibration: null;
};

export type ConfigHash = string & { readonly __brand: "ConfigHash" };

export type DomainEvent =
  | { type: "foul.awarded"; restart: Restart; offendingCapId: CapEntityId }
  | { type: "goal.scored"; scoringTeam: TeamId; crossing: CrossingFact }
  | { type: "out.awarded"; restart: Restart; crossing: CrossingFact }
  | { type: "turn.changed"; activeTeam: TeamId }
  | { type: "match.completed"; outcome: MatchOutcome };
