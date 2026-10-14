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
  simulate(
    input: {
      state: MatchState; command: GameCommand; config: CounterballConfig;
    },
    options?: SimulationRunOptions,
  ): Promise<ShotSimulation>;
}
```

`SimulationRunOptions` is process-local: `{ signal?: { readonly aborted: boolean } }`. A native `AbortSignal` structurally fits this shape. The runner checks it between bounded simulation batches and after yielding. Do not add it to `SimulationInput`, command envelopes, persisted state, or any schema; those stay serializable and unchanged. Cancellation throws the typed `SimulationError` with code `cancelled`. It does not return partial `ShotSimulation`, masquerade as `timeout`/`resourceLimit`, or change timeout semantics. The coordinator must confirm no deployed protocol-v1 consumer rejects the new `game.shot.aborted.reason` value before launch. If such a consumer exists, version the protocol and update compatibility checks before release. Cancellation restores the pre-shot checkpoint and preserves newer pause/terminal state under the existing abort lifecycle.

`CounterballConfig` is defined once in game-protocol, using DECISIONS numeric table and explicit adapter coefficients chosen in T02. Do not import Babylon to define it. A simulator failure throws typed `SimulationError` (`initialization`, `timeout`, `cancelled`, `invalidBody`, `resourceLimit`). An unfinished, timed-out, or cancelled shot is not a settled successful result.

`CounterballConfig.physicsCalibration` is the strict nullable `PhysicsCalibration` object exported from game-protocol. Historical and initial configs keep `null`; a calibrated runner rejects null with `initialization` and never falls back to probe constants. The object fixes schema version 1, Havok 1.3.14 / `adapter-2`, surface/cap/button friction and restitution, cap/button linear and angular damping, normal/restart horizontal impulse maxima and cap application-height offset, `restartLift.mode: "contact-only"`, open-pavement support apron margin, batch-step/wall-time budgets, and translational/angular per-substep tunnelling limits. The runtime config schema checks finite numeric bounds and geometry-dependent limits; serializing a selected calibration inside CounterballConfig makes it part of `configHash`. Null is not a calibration and carries no coefficients.

The engineering schema bounds are provisional input limits, not measured tuning: friction 0..2; restitution and damping 0..1; normal/restart impulse maxima greater than 0 and at most 20; absolute application-height offset at most half the configured cap height; positive apron margin at most 10,000 game units; batch steps 1..120; wall-time budget 100..30,000 ms; translation limit positive and below the smallest configured collider thickness; rotation limit positive and at most pi/4; and substep budget 1..120. The smallest thickness is taken from cap height, button thickness, surface thickness, and twice the goal-frame radius. A selected apron still needs a conservative reachable-distance proof from the accepted impulse/energy envelope and maximum shot duration. It has no wall, does not move a rule crossing plane, and does not grant a restart. If the proven reachable distance exceeds the apron, simulation fails with `resourceLimit`; it must not freeze, teleport, delete, or respawn an entity. Exceeding the batch-step or elapsed wall-time cap is `resourceLimit`; reaching maximum simulated shot duration without settling is `timeout`. These limits do not assert Cloudflare account quotas.

T02-R01 error mapping remains canonical: workload/deadline exhaustion is `resourceLimit`, while cancellation is `cancelled`; neither returns partial success. While the initial calibration is null, the current `PHYSICS_VERSION` remains `havok-1.3.14/adapter-1`; when C02/C03 publish a non-null `adapter-2` calibration, update the physics version stamp and config hash together to `havok-1.3.14/adapter-2`. Diagnostic-only candidate calibrations must carry a visible candidate label and cannot be treated as accepted gameplay config.

Pinned-step API check (Babylon core 9.30.0 and `@babylonjs/havok` 1.3.14): `HavokPlugin.executeStep(delta, bodies)` issues one `HP_World_Step(world, delta)` per world. `HP_World_SetIdealStepTime` adjusts solver parameters for the supplied duration; it is not a request for internal substeps. The canonical runner must divide each requested physics interval into explicit bounded calls, set the ideal step time to each actual substep duration, and record its actual durations/count. The guard uses a conservative total-energy envelope: initial kinetic energy plus the maximum configured impulse work (including its application-point rotational energy) plus the maximum gravitational potential drop allowed by configured geometry and shot duration. Since restitution is at most one and friction is nonnegative, collisions cannot add energy to this bound. For each body derive `vBound = sqrt(2*Emax/mass)`, `omegaBound = sqrt(2*Emax/Imin)` using its minimum principal inertia, and `rMax`, the farthest collider point from its centre of mass. For each configured physics tick `dt`, compute `Nrequired = max(1, ceil(max_i((vBound_i + omegaBound_i*rMax_i)*dt / maxTranslationPerSubstep)), ceil(max_i(omegaBound_i*dt / maxRotationPerSubstep)))`. Execute that tick as `Nrequired` explicit steps of `dt/Nrequired`; record their actual durations and contacts. A candidate cannot be called supported unless `Nrequired <= maxSubsteps` and the required bound is enforceable. The open-pavement margin must be at least `max_i(vHorizontalBound_i*maxShotDurationSeconds + rMax_i)` for every possible starting point on the painted pitch. If safe division requires more than `maxSubsteps`, the API cannot perform a required call, the energy/reach bound cannot be established, or any entity leaves the proven support extent, fail with `resourceLimit`; endpoint-only 120-Hz checks do not prove obstacle traversal. This same runner/config/rules package is used by local, AI, online, and deployed execution.

`restart.clearanceEpsilon` is the provisional positive finite vertical diagnostic margin (D38, initially 0.005 game units). It participates in `configHash`; it is not a foul, placement permission, or source of artificial lift. Diagnostic peak clearance must never be labelled proof of a collision-free obstacle traversal.

Each simulate creates an isolated world from the supplied snapshot and disposes it after the result. One module initialization may be cached as an immutable runtime promise if proven safe. No globally mutable match/world. Run fixed 1/120-second steps; capture beginning and ending frames, 30-Hz interpolable transforms, and all decisive contact/crossing facts. Facts order by step/time with stable tie-break IDs; do not derive rules from downsampled video frames. Same-step contact precedes same-step crossing for attribution only; it does not pretend to prove sub-step contact order.

Rules are pure: `resolveShot(before, command, simulation, config): Resolution`. `Resolution` contains settled match state, domain events, optional restart, outcome, and any safe cap-return operations. Network lifecycle/revisions are applied by application orchestration, not physics.

Current C00-B source inventory, checked before consumer packets are dispatched: `resolveShot`/`Resolution` and stateful command validation are not exported yet; `parseGameCommand` only validates the wire shape. `deriveRestartButtonPose` is exported from `games/counterball/src/features/restarts/domain/placementPose.ts`. `createCounterballScene` currently returns a Babylon `Scene`; it calls `createPieces` but does not expose a stable-ID authoritative pose update or picking API. `GameTransport` is exported by `packages/game-sdk/src/transport.ts`. No local match controller or `SimulationRunner` implementation exists yet; the latter is currently only the protocol interface. Future packets must define exact producer exports before dispatching their consumers and must reuse these canonical protocol types.

The following producer APIs are frozen for their later implementation packets. The signatures are contracts, not claims that these exports already exist:

```ts
type CapReturnOperation = {
  capId: CapEntityId;
  position: Vec3;
  rotation: Quat;
};
type Resolution = {
  state: MatchState;
  events: readonly DomainEvent[];
  restart?: Restart;
  outcome?: MatchOutcome;
  capReturns: readonly CapReturnOperation[];
};
function resolveShot(
  before: MatchState,
  command: GameCommand,
  simulation: ShotSimulation,
  config: CounterballConfig,
): Resolution;
```

`resolveShot` belongs in `games/counterball/src/features/referee/domain/resolveShot.ts`. It is pure and deterministic; it must not mutate any input. Every cap return is listed explicitly, validated by the accepted placement/formation operation, reflected in `state`, and leaves every unrelated body unchanged. `restart` and `outcome`, when present, must agree with `state.restart` and `state.outcome`.

```ts
type CommandActorContext =
  | { kind: "unauthenticated" }
  | { kind: "spectator"; versions: VersionStamp }
  | { kind: "player"; team: TeamId; versions: VersionStamp };
type CommandValidationResult =
  | { valid: true; command: GameCommand }
  | { valid: false; code: ActionRejectionCode };
function validateGameCommand(
  state: MatchState,
  action: ActionEnvelope,
  actor: CommandActorContext,
  config: CounterballConfig,
): CommandValidationResult;
```

`validateGameCommand` belongs beside the controller in `games/counterball/src/features/match/application/localMatchController.ts`. `actor` is constructed from the authenticated session and match membership (or an explicit development session); it is never read from `ActionEnvelope`. It checks protocol/config versions, state version, role/team, match status, active turn, phase, command shape/range and restart placement through the accepted placement service. Invalid results never mutate or replace `state`. Server authentication still occurs before this game API is called.

```ts
type CounterballPieceRegistry = ReadonlyMap<EntityId, PieceAssembly>;
function createCounterballPresentation(
  scene: Scene,
  bodies: readonly BodyState[],
  config?: Readonly<CounterballConfig>,
): CounterballPieceRegistry;
function updateCounterballPresentation(
  registry: CounterballPieceRegistry,
  bodies: readonly PlaybackTransform[],
): void;
function pickCounterballEntity(
  registry: CounterballPieceRegistry,
  pickInfo: PickingInfo,
): EntityId | null;
```

These exports belong in `games/counterball/src/scene/presentation.ts` and `games/counterball/src/browser.ts`. Creation returns all 15 stable-ID pieces from `createPieces`; updates require exactly one finite transform per ID and change presentation only. Only the corresponding body meshes are pickable; a result is resolved by registry mesh identity, never a name/index or protocol mutation. `PlaybackFrame.bodies` is passed directly to the update API. The scene owner remains responsible for disposal.

```ts
type LocalMatchControllerOptions = {
  initialState: MatchState;
  config: CounterballConfig;
  runner: SimulationRunner;
  session: GameSession & { role: "player"; team: TeamId };
};
function createLocalMatchController(
  options: LocalMatchControllerOptions,
): GameTransport;
```

The controller export belongs in `games/counterball/src/features/match/application/localMatchController.ts` and implements the existing SDK `GameTransport` with one checkpoint → validate → simulate → resolve → playback → phase-release pipeline. It owns abort restoration and disposal; it does not create identity or expose a public guest path. Public AI/online access remains behind the unique-username identity gate.

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

## Diagnostic-only direct-shot guard

The browser direct-shot diagnostic is a separate, narrowly scoped experiment. It uses the strict `CounterballConfig.diagnosticGuard` field added by the reviewed config-schema-2 amendment; it does not populate `physicsCalibration`, which remains `null` until C02/C03 have accepted physical measurements. The diagnostic guard is included in the canonical config hash and is consumed only by the explicit diagnostic entry. A calibrated local, AI, online, or deployed runner must use `physicsCalibration` and reject `null`; it must not fall back to this diagnostic envelope. The existing protocol version remains 1 because no wire message shape changes; `CounterballConfig.schemaVersion` and `configVersion` advance to 2.

The only accepted input is the D01 at-rest canonical fixture: select `home-6`, apply exactly `{x:0,y:0,z:8}` at `{x:0,y:0.06,z:-4}`, once. This is raw Havok impulse evidence, not a normalized player power or a general command mapping. No restart, off-centre impulse, initial velocity, extra force, or alternative fixture is inside this guard.

The coordinator-selected diagnostic energy ceiling is 34 game-energy units. The initial centre impulse contributes `8²/(2×1)=32`. The fallback maximum centre-of-mass drop is 0.01125 game units below each body's at-rest reference height over the entire trial. If all 14.15 units of dynamic mass reach that bound under configured gravity magnitude 9.81, gravitational work is `14.15×9.81×0.01125=1.561629375`; rounding the sum 33.561629375 upward to 34 leaves 0.438370625 units of rounding allowance, not evidence of solver passivity. The probe must enforce this global drop bound over every swept substep and abort before any next step whose conservative swept bound could cross it. It also checks observed total mechanical energy at every step and fails on energy above 34. Loft remains allowed. This is a finite energy fallback, not a claim of continuous floor contact or measured solver passivity.

Before applying the impulse, the probe reads the actual pinned Havok material and mass properties from the constructed shapes/bodies. Static/dynamic friction must be finite and nonnegative, restitution finite and in `[0,1]`, and actual mass/inertias must support the conservative configured bounds. If these facts are unavailable or outside the domain, stop with `resourceLimit`; do not assume undocumented defaults or change D01 material setup.

For every shape, use its minimum principal inertia and farthest collider radius. At energy 34 derive `vBound=sqrt(2E/mass)` and `omegaBound=sqrt(2E/Imin)`. For a nominal tick `dt=1/120`, compute the required calls using the pinned C00 combined linear/angular sweep expression and the configured translation/rotation limits. The selected limits are 0.01125 game units per full-collider point per actual Havok call and `pi/8` radians per call. The maximum derived count is 48 calls per nominal tick, below the frozen 48-call cap. If actual properties or any observed energy require more, return `resourceLimit`; do not clamp a count or proceed with a larger step.

The physical open support apron extends 325 game units beyond every painted edge and has no wall. A conservative full-collider swept bound must remain inside this support extent. Vertically, the guard allows at most 0.01125 COM drop below each initial rest reference; the 0.20-thick support slab and maximum 0.01125 full-collider point sweep prevent one call from crossing the slab. Check the whole swept interval, not only endpoint transforms. Painted pitch boundaries, goal rules, visible green concrete and button-hole presentation do not change.

The workload is 15 seconds, 1,800 nominal ticks, at most 86,400 actual public `HavokPlugin.executeStep` calls per trial (1,800×48), at most 120 actual calls between host yields, and at most 30,000 ms wall time. `maxBatchSteps` means actual Havok calls, never nominal ticks. The resulting maximum is 720 batches. Budget exhaustion, cancellation, an unsupported sweep, energy/property mismatch, missing fact, or elapsed wall cap returns a typed non-settled failure and no partial successful result. The limits bound work but do not claim a 30-second run will succeed. Protocol fact/frame maxima remain the existing canonical limits.

The strict field shape is:

```ts
type DiagnosticPhysicsGuard = {
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
    maxRotationPerSubstep: Math.PI / 8;
    maxSubstepsPerTick: 48;
  };
  workload: {
    maxTotalSubsteps: 86400;
    maxBatchSubsteps: 120;
    maxWallTimeMs: 30000;
  };
};
```

The runtime schema is strict and rejects an altered input identity or any extra field. The world uses the diagnostic apron only for the explicit probe while calibration is null; the playable runner continues to require and use `physicsCalibration`. The guard has no hidden fallback mode.

This envelope changes the canonical config hash and advances `CounterballConfig.schemaVersion` and `configVersion` to 2. It leaves protocol version 1 and the physics adapter version unchanged. It does not accept C02 calibration, all-15-body settling, collision-free button traversal, real-browser interaction, T02, T05 or deployed Havok; every config-hash fixture must be updated with the implementation.

## Diagnostic-only restart-loft guard

The restart-loft coarse matrix has a separate strict `restartLoftDiagnosticGuard`; it does not broaden or replace `diagnosticGuard` (`browser-direct-impulse-v1`) and does not populate `physicsCalibration`. The protocol wire version remains 1. The later, separately reviewed schema implementation advances only the outer `CounterballConfig.schemaVersion` and `configVersion` from 2 to 3; the existing direct-shot guard and both nested guard schema versions remain unchanged. Local match, AI, online, and deployed gameplay continue to require non-null accepted `physicsCalibration` and must never read either diagnostic guard as a fallback.

The complete versioned field inventory, identity and fixture-hash procedure, exact 24-case setup, native Havok/material preflight, shifted-energy and full-collider sweep checks, workload/serialization ceilings, settlement and candidate eligibility rules are frozen in [the T02-L01 restart-loft contract work](completion/CONTRACT_WORK.md#t02-l01-strict-restart-loft-diagnostic-guard). It is an explicitly bounded diagnostic over the public pinned-Havok `executeStep` calls; it does not claim a low-level WASM substep count or continuous-motion proof. Every diagnostic material, energy, clearance and workload selection remains provisional and cannot select gameplay physics or cultural rules.

The full matrix is not placed in the page DOM or returned as one page-evaluation/IPC value. The browser emits a download only after all matrix assertions pass. The Playwright host saves it under `test-results/`, streams the saved file to verify byte limits, digest and matrix totals, atomically renames it only after verification, and attaches the final path. Any failed assertion, limit, cancellation, integrity check or host write leaves no successful artifact. No restart-loft source trial is authorized until the guard/schema contracts and the exact runtime packet are independently accepted.


## Accepted L01 support datum amendment — 2026-10-14

This controlling diagnostic clause supersedes prior L01 tuple-initial COM references and related version/metadata semantics only. Independent corrected proposal review PASS: execution_state/reports/T02-L01-SUPPORT-DATUM-contract-proposal-2-review.md. Source/runtime acceptance remains separate. D01 unchanged.

For each already validated native unparented unit-scale local Y cylinder, require native local AABB exactly symmetric about zero in X/Y/Z, and finite positive exact native dimensions with equal X/Z. Otherwise typed resourceLimit before impulse/step. Let r=max(native spanX,spanZ)/2, q=native spanY/2, c=actual native local COM. Set restDatumY=surfaceY+min(r,q)-hypot(c.x,c.y,c.z); require every intermediate finite. For arbitrary body rotation, vertical support of cylinder is r*sqrt(1-nY²)+q*abs(nY)>=min(r,q), and rotated COM displacement is >=-norm(c). Thus any supported whole cylinder has COM>=datum. Explicitly prove native apron top (unparented unit-scale identity-rotation transform positionY+raw native AABB maxY)>=surfaceY before using the plane. No invented native values or extra reads.

At every existing energy/drop/sweep check use this constant datum, preserving dropLimit .01125, Eshift<=34, gravity9.81, point sweep .01125, rotation pi/8, calls48, apron325 and every workload/artifact cap. Energy remains sum of actual kinetic energy plus m*g*(COMY-(datum-.01125)); potential is nonnegative inside the drop guard. Actual initial elevations are charged to energy, not removed. Initial COM still must match the hashed tuple pose under existing transform check and all velocities exactly zero; it no longer equals the lower support datum. Exact native post-impulse prediction must pass34 before applying the sole planar COM impulse. Formula is generic existing computeDiagnosticShiftedEnergy; only L01 supplies the new datum.

Version canonical config to schema4/configVersion counterball-config-4; L01 guard schema2/configSchemaVersion4, algorithm loft-coarse-probe-v2, energy formulaVersion shifted-mechanical-energy-v2, restReference native-cylinder-support-COM-lower-bound-y. Keep protocol1, scope restart-loft-coarse-matrix-v1, matrixId counterball-l01-grid-v1, full24 tuples and physics/calibration unchanged. Config hash and all fixture configHash leaves must update; omitted-configHash fixture payload stays identical, raw fixture SHA must update in runner and E2E.

Artifact guard identity rejects old semantics. Retain existing maximumCandidateRelativeComDrop field shape, explicitly define it for guard2 as max(restDatumY-currentCOMY), and independently recompute from centered native geometry/COM facts. Add nativeShapeType:2 (raw pinned native CYLINDER value) and nativeLocalAabb:{minimum:Vec3,maximum:Vec3} to each dynamic native fact. Add supportPlane:{referenceY:number,nativeTopY:number,nativeShapeType:3,nativeLocalAabb:{minimum:Vec3,maximum:Vec3},position:Vec3,rotation:Quat,scaling:Vec3,hasParent:false} to case metadata. Pinned Babylon PhysicsShapeType defines CYLINDER=2 and BOX=3; protocol/validator keep strict diagnostic literals without importing Babylon. Strict runner/writer/host validators require exact finite symmetric bounds, observed dimensions equal max-min and equal X/Z; recompute datum from raw bounds/COM. Require supportPlane.referenceY equal configured surfaceY. All validators require raw shapeType3, finite exact symmetric positive bounds matching recorded apron dimensions, hasParent=false, scaling=(1,1,1), identity rotation, and canonical apron position (0,surfaceY-surfaceThickness/2,0). Require finite nativeTopY exactly equal position.y+nativeLocalAabb.maximum.y and >=referenceY. Dynamic shapeType must exactly2 in runner/writer/host. Producer captures these actual observed transform/bounds/type values from existing reads; no placeholders/configured substitute. Preserve existing exact transform guards. Update exact-key validators, fixture builders and negative tests together; guard2/algorithm2 identifies these diagnostic metadata semantics. A floor datum may exceed current COM only by the unchanged .01125 margin; no automatic clamping.

## Native collision-onset diagnostic policy — config5/guard3

This amendment supersedes only L01 contact-subscription evidence semantics and version identities in the preceding guard. Every physical/numeric energy/sweep/workload/artifact limit and the24tuple grid stays unchanged. D01 and product rules stay unchanged. Actual runtime proof and fullmatrix acceptance remain mandatory.

1. Configure every15dynamic and7static body before the first actual step to subscribe natively to COLLISION_STARTED only using public PhysicsBody.setEventMask. Read the named enum's actual positive safe power-of-two native value from pinned initialized Havok; fail closed on unexpected representation/value. Public getEventMask must return that exact value for each22body before any impulse/step. Never alter collision/filter/shape/force/solver settings.
2. Preserve every delivered native start callback in occurrence order, including both mirrored observer notifications and repeated contact episodes. No post-callback filter/dedup/truncation. Any delivered event whose type differs from COLLISION_STARTED fails. Keep original finite point/pair/call/tick provenance and every existing8192/196608/bytes/workload/time bound.
3. Emit an exact case-level contactSubscription record: eventType COLLISION_STARTED, nativeMask integer, and22 canonical ordered body records {bodyId,requestedMask,observedMask}. Require each requested/observed mask equal the native named flag. Writer/host validate exactkeys/types/order/masks/identity and reject wrong/missing/continued data.
4. Keep full15-body initial/endpoints, every actual-substep sweep/energy/support guard, conservative complete overlap clearance, whole-button before/after crossing and all15body settlement unchanged. Eligibility's no-button-obstacle-contact proof uses any observed start of that pair; its initial whole-button-before-obstacle check excludes an existing unobserved initial obstacle contact. Started identifies first touching, so omitting repeated Continued notifications does not discard contact occurrence. This premise must be reviewed and proven in real native positive/negative contact tests, not asserted from a mock.
5. Advance canonical config schema5/configVersion counterball-config-5, guard schema3/configSchemaVersion5, algorithmVersion loft-coarse-probe-v3. Add strict hashed contactPolicy { eventType: "COLLISION_STARTED", nativeSubscription: "started-only", readback: "all-22-exact", callbackRetention: "all-delivered-including-symmetric" }. Keep all physical/numeric guard values, energy formula/support datum and24tuples unchanged; protocol1 and null calibration remain. Update all8fixtureconfigHash leaves through canonicalhash, preserve omitted-configHash payload digest, and independently freeze rawbytepins. Reject prior identities.
6. Before accepting full24 successor, require realbrowser native onset positive/negative/contact-episode evidence, exact22maskreadbacks, complete unchangedmatrix validation/download, zero test skips/retries and independent source/fullartifact review. Passing producer/schema tests alone never accepts physics. Native onset chatter that still exceeds budgets remains a real failure; do not raise caps or hide it.

Internal adapter boundary: `games/counterball/src/simulation/nativeCollisionSubscription.ts` exports `configureNativeCollisionOnsets(startedFlag: unknown, orderedBodies: readonly { bodyId: LoftCoarseContactBodyId; body: Pick<PhysicsBody, "setEventMask" | "getEventMask"> }[]): LoftContactSubscription`. It has no package-barrel export. `LoftContactSubscription` is readonly `{ eventType: "COLLISION_STARTED"; nativeMask: number; bodies: readonly { bodyId: LoftCoarseContactBodyId; requestedMask: number; observedMask: number }[] }`. Body IDs/order are15 canonical ENTITY_IDS followed by goal-frame-0..5 and support-apron. Reject missing/duplicate/out-of-order bodies. Native started flag is the actual runtime enum object `.value`, checked as a positive safe single unsigned32bit flag; primitives and malformed values failclosed. Use public body methods only, setall22 then readall22, and return facts only after all match. These mocked-method unit tests prove adapter validation only; native eventdelivery/22mask proof and matrix stay separate required gates.
