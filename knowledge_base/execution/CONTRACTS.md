# Canonical Counterball contracts v1

This file is authoritative for shared names and semantics. T01 converts these definitions to TypeScript and runtime schemas in `packages/game-protocol/src/`. Specialist plans may show conceptual shapes; they must adapt to this file. Changing a public contract requires a coordinator decision and consumer tests.

## Serialization and identity

Use JSON with finite numbers, plain objects, bounded arrays, and no undefined fields. Optional keys are omitted. Never send engine handles, Map, Set, Date, bigint, typed-array objects, NaN, or Infinity. IDs are strings. Match/player/action/invitation IDs use cryptographic UUIDs. Team IDs are `home` and `away`. Entity IDs are `button`, `home-0` … `home-6`, and `away-0` … `away-6`.

`home` defends z = -10 and attacks +z. `away` defends +10 and attacks -z. x is pitch width, y is up, z is pitch length. Angles are radians in payloads. UI degrees convert once at the input boundary. `yaw=0` points +z and positive yaw points +x. `tilt=0` places the button flat; maximum is configured. World distances are consistent arbitrary game units.

```ts
type TeamId = 'home' | 'away';
type EntityId = 'button' | `${TeamId}-${0|1|2|3|4|5|6}`;
type Vec3 = { x: number; y: number; z: number };
type Quat = { x: number; y: number; z: number; w: number };
type VersionStamp = {
  protocolVersion: 1;
  gameId: 'counterball';
  gameVersion: string;
  rulesVersion: 'counterball-1';
  physicsVersion: string; // exact Havok and adapter version
  configHash: string;    // SHA-256 of canonical frozen config JSON
};
type BodyState = {
  id: EntityId;
  position: Vec3;
  rotation: Quat;
  linearVelocity: Vec3;
  angularVelocity: Vec3;
};
type Restart = {
  reason: 'foul' | 'out' | 'penalty';
  awardedTeam: TeamId;
  anchor: Vec3; // authoritative point, y at pitch surface
};
type MatchState = {
  versions: VersionStamp;
  matchId: string;
  stateVersion: number; // monotone revision, see lifecycle below
  status: 'waiting' | 'active' | 'paused' | 'complete' | 'abandoned';
  phase: 'ready' | 'restartPlacement' | 'simulating' | 'playback' | 'placementBlocked';
  activeTeam: TeamId;
  score: Record<TeamId, number>;
  targetGoals: number;
  formationIds: Record<TeamId, string>;
  bodies: BodyState[]; // exactly 15 unique entities
  restart?: Restart;
  pendingActionId?: string;
  playback?: { shotId: string; startsAtMs: number; durationMs: number };
  outcome?: { winner: TeamId | null; reason: 'target'|'forfeit'|'abandoned' };
};
```

Schema constraints: score integers >=0; targetGoals integer 1–10 in private rooms and fixed 3 for public queue; stateVersion integer >=0; quaternion normalized within documented tolerance; bodies exactly one button and seven caps per team. Config contains dimensions, masses, material coefficients, gravity, settle parameters, and rule defaults. Gravity is a finite canonical vector in game units per second squared. Keep it frozen for the life of a match. Tuning does not mutate running rooms.

## Commands

```ts
type ShotCommand = {
  type: 'shot';
  capId: Exclude<EntityId, 'button'>;
  yaw: number;
  power: number; // 0..1, reject outside range instead of silent authority clamp
};
type RestartShotCommand = {
  type: 'restartShot';
  capId: Exclude<EntityId, 'button'>;
  capPosition: Vec3; // near authoritative restart anchor
  buttonAzimuth: number; // position around cap circumference
  buttonTilt: number;    // 0..configured tilt maximum
  yaw: number;
  power: number;
};
type GameCommand = ShotCommand | RestartShotCommand;
type ActionEnvelope = {
  type: 'game.action';
  protocolVersion: 1;
  matchId: string;
  actionId: string;
  expectedStateVersion: number;
  command: GameCommand;
};
```

Do not add a client actor/team field as authority. Derive actor from authenticated connection and slot. Spectators never acquire a player slot by sending commands. Normal `shot` is legal only in ready phase. `restartShot` is legal only in restartPlacement. Placement previews remain client-local and do not relocate world bodies for other participants. Committed restart command atomically validates placement and runs the shot. No separate replayable move-cap command is needed for v1.

Restart validation: selected cap belongs to awarded team; capPosition within configured anchor tolerance and at valid surface height; preserve all other cap transforms; compute button contact position from azimuth/tilt and geometry rather than accepting arbitrary button position; no illegal overlap; finite yaw/tilt/power; valid match status/revision. Reject an individual invalid placement with a specific reason and retain restart phase. Enter placementBlocked only if the bounded search confirms no legal placement for any owned cap. A blocked-state UI can request a fresh snapshot, inspect another cap, or leave the match; it must never grant teleport/move-other-cap permission. Local development reset starts a new match at zero score, not a legal game action. Do not expose automatic reset as a traditional restart rule.

Platform control messages are separate from GameCommand. Define a bounded `ControlEnvelope` with protocolVersion=1, matchId, requestId, and type `match.snapshot.request` or `match.leave`. Snapshot request changes no game revision. A player leave normally forfeits to the present opponent; leaving a confirmed placementBlocked match marks it abandoned with no winner, visibly labelled as an unresolved placement case. A spectator leave affects only membership. D25 is a provisional safeguard, not a solved cultural rule; a frequent blocked case is a launch issue that needs user playtest input.

## Simulation boundary

```ts
type ContactFact = {
  type: 'contact'; step: number; timeMs: number;
  a: EntityId; b: EntityId; point: Vec3;
};
type CrossingFact = {
  type: 'crossing'; step: number; timeMs: number;
  entity: EntityId;
  boundary: 'left'|'right'|'homeEnd'|'awayEnd';
  point: Vec3;
  kind: 'goal'|'out';
};
type SimulationFact = ContactFact | CrossingFact;
type PlaybackFrame = { timeMs: number; bodies: Pick<BodyState,'id'|'position'|'rotation'>[] };
type ShotSimulation = {
  shotId: string;
  settledBodies: BodyState[];
  facts: SimulationFact[];
  frames: PlaybackFrame[];
  durationMs: number;
  termination: 'settled';
};
interface SimulationRunner {
  simulate(input: {
    state: MatchState; command: GameCommand; config: CounterballConfig;
  }): Promise<ShotSimulation>;
}
```

`CounterballConfig` is defined once in game-protocol, using DECISIONS numeric table and explicit adapter coefficients chosen in T02. Do not import Babylon to define it. A simulator failure throws typed `SimulationError` (`initialization`, `timeout`, `invalidBody`, `resourceLimit`). An unfinished or timed-out shot is not a settled successful result.

Each simulate creates an isolated world from the supplied snapshot and disposes it after the result. One module initialization may be cached as an immutable runtime promise if proven safe. No globally mutable match/world. Run fixed 1/120-second steps; capture beginning and ending frames, 30-Hz interpolable transforms, and all decisive contact/crossing facts. Facts order by step/time with stable tie-break IDs; do not derive rules from downsampled video frames. Same-step contact precedes same-step crossing for attribution only; it does not pretend to prove sub-step contact order.

Rules are pure: `resolveShot(before, command, simulation, config): Resolution`. `Resolution` contains settled match state, domain events, optional restart, outcome, and any safe cap-return operations. Network lifecycle/revisions are applied by application orchestration, not physics.

## Event and rule ordering

1. Validate before simulation. Invalid action changes no state and grants no shot.
2. Determine a button-touch flag for the selected cap during the entire shot. Proposed causal scope: only selected cap's opponent contacts create the ordinary foul. Record this as default; do not turn resting or secondary chain contacts into invented fouls.
3. If selected cap contacts opponent and never touches button, award opponent a foul/penalty. Choose earliest offending contact point. Determine penalty from that point in the shooting team's defending box. This invalidates a goal credited to the offending team for that shot; ignore secondary exit reward rather than stack awards. Opponent own-goal handling in that shot must be explicit in fixture tests; initial default foul wins all outcomes.
4. Otherwise take the earliest decisive whole-button crossing. Valid goal between posts/below height credits the attacking side, even on an own goal, resets formations, then conceding team starts. If target reached mark complete. A goal-plane crossing outside mouth/above height is out.
5. Out awards a placed restart to opposite last touching team at or before the first crossing in the current shot, falling back to shooting team if no touch was recorded. Later contacts never reattribute that exit. Same-step contact tie-break follows the fact-order rule above. Anchor is projected exit point. End-line outs are handled by this same rule; no corners or goal kicks in v1.
6. With no foul/goal/out, retain settled positions and alternate to opposite shooting team.
7. Any awarded restart uses one shot then ordinary alternation, unless that shot itself awards a new restart/goal. No bonus-shot bank exists.

Foul detection scope, all-outcome foul precedence, last-touch exits, and geometry are defaults D20–D26, not historical facts. Reviewer must compare GAMEPLAY against these rules and report disagreement before implementing.

## Wire events and playback

Every server event has `protocolVersion:1`, `matchId`, `eventSeq`, `serverTimeMs`, and a discriminated `type`. Event sequence is per-room and separate from stateVersion. Additive optional fields may be compatible; changing required fields increments protocolVersion.

Required events: `session.ready`, `match.snapshot`, `game.action.accepted`, `game.action.rejected`, `game.playback.start`, `game.playback.chunk`, `game.shot.committed`, `game.shot.aborted`, `match.presence`, `match.completed`.

- `match.snapshot`: state, versions, role (`player`/`spectator`), assigned team if player, latest eventSeq, current stored playback metadata/chunks if active. No secrets.
- accepted: actionId, resulting stateVersion, shotId. Persist before broadcasting.
- rejected: actionId, code (`notAuthenticated`, `notPlayer`, `notYourShot`, `staleState`, `wrongPhase`, `invalidCommand`, `invalidPlacement`, `busy`, `versionMismatch`), currentStateVersion. Rejections do not increment game revision.
- playback start: shotId, startsAtMs, durationMs, frameCount, chunkCount, resulting stateVersion.
- chunk: shotId, chunkIndex, chunkCount, frames. Frames <=32 KiB encoded per chunk. Do not mix shots. Bounded frame count derived from configured duration/sample rate.
- committed: actionId, shotId, final authoritative MatchState. Result persisted even if no socket receives it.
- aborted: actionId, reason, restored MatchState with a new revision. Retrying a failed shot requires a new actionId; duplicate original returns its recorded abort.

Protocol-v1 collection and playback limits are fixed: no JSON array has more than 8,192 items; one simulation has at most 8,192 facts; one shot has at most 451 playback frames (15 seconds at 30 Hz, including both endpoints) and at most 451 chunks; a chunk index is less than its chunk count; the UTF-8 JSON encoding of `{shotId, chunkIndex, chunkCount, frames}` is at most 32,768 bytes; stored chunks in one snapshot total at most 1,048,576 encoded bytes. Snapshot chunks must refer to the snapshot's playback shot and use unique indexes and a consistent chunk count. A room view has at most 22 participants and 20 waiting-player IDs. Reject values above these limits at the protocol boundary; a simulation that exceeds its fact or frame budget fails with the typed `resourceLimit` error rather than returning a partial successful result.

During online playback, client renders frames while keeping authoritative final state separately. Never enable next shot before server says ready/restartPlacement. A late join receives stored playback offset = max(0, serverNow-startsAt); after playback end use final state. Estimate server clock offset from bounded ping samples. A player's disabled cinematic changes camera only; never sends a gameplay action.

## Durable action lifecycle and revisions

For ready state version n:

1. Validate session/slot/rules/command and dedup `(matchId, playerId, actionId)`.
2. In one durable transaction save pre-shot snapshot, accepted command/hash, action record status ACCEPTED, and phase simulating at version n+1. Prevent any second distinct command while busy.
3. Simulate outside storage transaction. Reentrancy must see busy state. Abort safely on error.
4. In one transaction save settled resolution, complete frames/facts or bounded result data, action status COMMITTED, playback phase/version n+2, and result outbox if match ended.
5. Broadcast stored result. Use one server start timestamp with a short configured lead (initial 300ms).
6. Durable alarm releases playback at deadline to ready or restartPlacement and increments to n+3 for a still-active match. Complete/abandoned matches remain terminal and never accept shots; playback completion may clear presentation metadata without restoring active status. Do not rely only on setTimeout that disappears on hibernation.

The n+1/n+2/n+3 example assumes no intervening durable mutation. Always increment the current persisted revision, never overwrite it from captured n. Track a private pending reservation ID/generation; commit only if that reservation still owns the shot. Disconnect may pause the room while simulation is pending. That accepted shot can settle/commit, but paused status survives and no new action is legal until reconnect. Forfeit/abandon cancels the reservation so late simulation results cannot overwrite a terminal state. Recovery must test these races.

On crash with ACCEPTED but no COMMITTED result, restore pre-shot bodies/rules at a new monotone revision and mark action ABORTED. Preserve newer connection/pause state and any terminal outcome; do not restore a full stale snapshot over those updates. Do not resimulate a non-deterministic command and claim the same result. On COMMITTED recovery reuse stored results/frames. Preserve all completed dedup records for match lifetime. The result outbox is acknowledged by the idempotent Railway persistence endpoint, not by browsers; persist its result key until that server acknowledgement. No client result-ack command exists. Transaction/outbox specifics are in PLATFORM.md.

## Room commands and social view

Private room identity persists across matches. `roomId` is distinct from `matchId`; each rematch gets a fresh matchId. Never overload a match ID to identify a long-lived friend room. HTTP request idempotency uses actor+roomId+requestId. Match control envelopes stay as defined above; do not invent competing `sync` or `leaveRoom` names.

```ts
type RoomCommand =
  | { type:'invite'; role:'player'|'spectator'; recipientPlayerId?:string; maxRedemptions:number }
  | { type:'revokeInvite'; invitationId:string }
  | { type:'redeemInvite'; token:string }
  | { type:'joinQueue' }
  | { type:'leaveQueue' }
  | { type:'setFormation'; formationId:string }
  | { type:'startMatch' }
  | { type:'requestRematch' };
type RoomCommandEnvelope = {
  type:'room.command'; protocolVersion:1; roomId:string;
  requestId:string; command:RoomCommand;
};
type RoomView = {
  roomId:string; hostPlayerId:string;
  participants: { playerId:string; username:string; role:'player'|'spectator'; team?:TeamId }[];
  waitingPlayerIds:string[];
  targetGoals:number;
  chosenFormations: Record<TeamId,string>;
};
```

`match.snapshot` additionally contains `room: RoomView`. This is metadata, not another match state. Roster/queue changes use `match.presence` with the new RoomView. Waiting rooms have a waiting MatchState but no shots permitted. Room creation takes targetGoals once (public=3/private1..10); freeze it when match starts. Each player sets their own chosen formation only while waiting or offering rematch. Server validates supported seven-cap preset and prevents actor from changing the other team. Start requires two authenticated consenting players and host authorization; a start invitation/ready confirmation is explicit in UI, not inferred from a spectator joining. `requestRematch` records that player's consent; new match starts only when both seats consent. Winner/queue promotions similarly require consent.

Host alone issues/revokes invitations. Direct player invite maxRedemptions=1; spectator link bounded1..20. Tokens use secure randomness and DO stores only hashes/roles/expiry/recipient binding and redemption history. Redeem requires authenticated player and current invitation permissions; handle repeated redemption idempotently and never promote spectator to player by a request field. MatchRoom alone decides authorization. Railway stores recipient inbox index and public invitation metadata; any index/retry failure cannot grant access.

`room.command` goes through an authenticated Worker HTTP route, not an invented raw gameplay WebSocket frame before membership exists. Suggested canonical routing: `POST /realtime/v1/rooms` creates a room; `POST /realtime/v1/rooms/:roomId/commands` sends RoomCommandEnvelope; `GET /realtime/v1/rooms/:roomId/socket` upgrades authorized socket. Validate exact Origin/CSRF for mutations and membership before returning private RoomView. Room responses `{requestId,room:RoomView,matchId:string}`; invite creation adds `{invitationId,token,expiresAtMs}` only for requesting authorized host. Invalid replies use bounded `{requestId,code,message}` without revealing private roster/tokens. Username lookup/inbox goes through `/api/v1/invitations` GET and username lookup POST; unknown recipient gets generic actionable outcome. T01 defines strict schemas, including these room payloads.

Required result ingestion is service-only `POST /internal/v1/match-results` on Railway: matchId, frozen versions/configHash, participant player IDs, final score/outcome, completedAtMs, payload hash. Verify shared service credential and signed/trusted caller, unique matchId plus hash. Return `{matchId,payloadHash,persisted:true}` only after PostgreSQL commit. Duplicate same payload returns same ack; conflicting payload fails and alerts. Public edge whitelist excludes internal route. The DO outbox persists until this ack; browsers never acknowledge database persistence.

## SDK lifecycle

`GameManifest` includes id, version, name, minPlayers=2, maxPlayers=2, supportsSpectators=true, modes=['ai','online']; local development hotseat is a diagnostic, not a launch mode. `GameModule.mount({container,session,transport,preferences})` returns `dispose()` and bounded preference methods. A required local identity provider can issue a development identity for testing, labelled dev-only; it must not ship a guest bypass.

Transport provides typed `sendAction`, `subscribe`, `getSnapshot`, `connect`, and `dispose`. Local AI transport uses the same action/resolution contracts but no server authority cost. Counters-specific camera and rules never enter the platform SDK.

## Shared invariants for every task

- Exactly 15 unique pieces; seven caps per team; no overlaps in fresh formations.
- Neither mesh disposal nor camera movement mutates authority.
- Every accepted shot resolves, aborts, or is visibly blocked. No silently discarded command.
- At most one simulation per match; no cross-room world state.
- Restarts move only chosen cap and button, within validated space.
- Session identity and membership determine action rights, never username/client claims.
- Same committed result for players and spectators; duplicate requests grant no second shot.
- Config/rules/engine versions frozen per room; changed versions do not join incompatible rooms silently.
