# Counterball platform implementation contract

Planning date: 10 October 2026. This file specifies implementation work; it does not claim that services, credentials, deployments, or runtime tests exist. Canonical precedence is human instructions, `DECISIONS.md`, `CONTRACTS.md`, `TASKS.md`, then this specialist file. The P-series cards below are supplementary breakdowns of parent T00–T24 tasks, never a second independent schedule. If a shared field is absent from CONTRACTS.md, coordinator freezes its schema in T01 before consumers implement it.

## 1. Scope and responsibility

Cloudflare serves the React/Vite/TypeScript web build and immutable assets, routes API requests, and hosts authoritative rooms in SQLite-backed Durable Objects. Railway runs the Hono/Node/TypeScript identity API and PostgreSQL. Do not connect Workers directly to PostgreSQL. Counterball owns simulation and rules under `games/counterball/src`; the platform invokes contracts from `packages/game-sdk` and `packages/game-protocol` without importing browser rendering. AI matches run locally after the player obtains an identity. Online duels run only against authority.

Create these boundaries, with the coordinator owning root workspace configuration and shared contract changes:

| Owner | Exclusive paths | Responsibility |
|---|---|---|
| Identity agent | `apps/api/**`, coordinator-assigned `infrastructure/database/**` migration | Railway API, PostgreSQL migrations, session and recovery tests |
| Room agent | `apps/realtime/src/rooms/**`, `apps/realtime/test/rooms/**` | Room/matchmaking DOs, storage, tickets at room boundary, recovery tests |
| Edge integration agent | remaining `apps/realtime/**` | Routes, static assets, API proxy, bindings, deployment smoke |
| Physics agent | simulation package named by main plan | Headless Havok runner; no room or authentication changes |
| Coordinator | root tooling and `packages/game-protocol/**` | Approve wire schemas, package scripts, integration and deploy gates |

Never let two agents edit `wrangler.jsonc`, a migration, lockfile, or shared contract at once. A change outside an owner's paths needs a written handoff. Platform agents may use runner fakes for concurrency tests; online release requires the real deployed runner.

## 2. Authority and persistence

One `MatchRoom` DO owns a private room, its two active seats, waiting friends, invited spectators, current match, and the room journal. Route with a stable unguessable `roomId`, using `MATCH_ROOMS.getByName(roomId)`. Membership is persisted, not inferred from a URL. Use a separate `Matchmaker` DO per explicit matchmaking shard and mode; launch uses one casual queue shard with a documented cap. Do not place every room in one DO.

Railway owns players, username uniqueness, session revocation, optional email, recovery credentials, websocket-ticket issuance, and a persisted mirror of completed results. MatchRoom owns invitation capabilities, redemptions, membership, permissions, and authoritative scoring. Railway stores final summaries from the room's result outbox, not per-frame state. Username invitation inbox delivery may use Railway, but cannot become a second membership authority.

Room minimum SQL tables (parameterized queries only): `room_meta`, `members`, `invites`, `matches`, `actions`, `events`, `playback_chunks`, `deadlines`, `result_outbox`. Use schema versioned migrations in constructor initialization. Persist old rows before upgrading them. `actions` has a unique key `(match_id, player_id, action_id)` and canonical command hash; `events` has `(room_id, event_seq)` uniqueness. `matches` contains latest settled checkpoint, current state, pending action reference, and pinned version metadata. Keep action receipts for the whole match and its reconnect/retention period; never prune a live match's receipts. Proposed launch retention: completed room histories expire after 24 hours, except unacknowledged final result/outbox keys. Railway's authenticated idempotent persistence endpoint acknowledges outbox delivery; there is no browser result-ack command. Match state must fit bounded JSON; retain replay chunks separately.

SQLite writes that jointly change checkpoint, receipt, event sequence, score, and deadlines belong in one `storage.transactionSync` callback with no async work. Durable side effects must commit before a success response or broadcast. SQL `BEGIN` is not the DO transaction API. Constructor `blockConcurrencyWhile` is limited to loading and schema initialization; never hold it across simulation or identity network calls. Official API: [SQLite storage transactions](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/).

## 3. Shared wire and version requirements

The coordinator publishes runtime validators, types, and JSON fixtures in `packages/game-protocol` before consumers. Use exactly `ActionEnvelope`, `MatchState`, `VersionStamp`, and events defined in CONTRACTS.md. Do not wrap them in a competing generic payload envelope.

- ActionEnvelope is `game.action` with protocolVersion 1, matchId, actionId, expectedStateVersion, and command. `shot` uses capId/yaw/power; `restartShot` also uses capPosition/buttonAzimuth/buttonTilt. Derive actor from authenticated socket/slot; do not accept client score, contact facts, arbitrary impulses, other-cap transforms, or final state.
- `MatchState.versions` pins gameId, gameVersion, rulesVersion, physicsVersion, configHash; config hash includes canonical rules and tuning. MatchState holds monotonic stateVersion and phase/status. There is no matchEpoch wire field; every rematch has a fresh matchId.
- Events use canonical discriminator names, eventSeq and serverTimeMs. `game.action.accepted`, `game.action.rejected`, `game.playback.start`, `game.playback.chunk`, `game.shot.committed`, `game.shot.aborted` must retain exact canonical payload fields. Stored action statuses are ACCEPTED/COMMITTED/ABORTED; these are storage internals, not a new receipt status envelope.
- Use the canonical lower-camel rejection codes: notAuthenticated, notPlayer, notYourShot, staleState, wrongPhase, invalidCommand, invalidPlacement, busy, versionMismatch. Payload reuse conflict rejects as invalidCommand with a coordinator-approved reason rather than inventing an uppercase wire code. HTTP availability/rate-limit errors and room commands need explicit T01 schemas, not copy-pasted game rejection variants.
- `match.snapshot` contains canonical state/versions/role/team/eventSeq/playback fields; room roster/queue may be separately defined by T01. No email, session/recovery hashes, invite tokens, or others' tickets. Do not introduce `RoomSnapshot` as a second match snapshot interface.

Reject incompatible protocol before membership upgrade. Reject a game/physics version unsupported by the running room rather than simulating with new settings. Pin match versions at creation; deployment must either continue support for active match versions or drain matchmaking and finish/abort those matches before removing old code. A fresh rematch matchId prevents old actions applying. eventSeq orders room events, stateVersion protects current game state; neither substitutes for the other.

Every durable game mutation advances stateVersion, including acceptance, settlement, and abort restoration. Room-only changes advance eventSeq without changing game stateVersion. Multiple browser tabs for one player may observe, but only the current per-seat `controlEpoch` may mutate; assigning a replacement controller invalidates older attachments. Match config values come from the canonical game package, not backend copies.

The n+1/n+2/n+3 sequence below assumes no intervening durable status mutation. Disconnect pause/resume can add revisions during a shot. Transactions always increment the current persisted revision; never overwrite it using stale arithmetic. Reservation generation/action ID guards settlement even if presence has advanced stateVersion.

## 4. Action lifecycle and crash recovery

Implement these steps in order, with fault injection after every numbered boundary:

1. Decode a bounded message, validate schema/versions, authenticate socket, check current membership/control epoch. Lookup action receipt **before** checking expected version/turn. Matching ID and matching canonical command returns its existing canonical accepted/committed/aborted events even if the room has advanced. Same ID and different command rejects as invalidCommand with an approved idempotency-conflict reason. An unauthorized caller cannot lookup another player's receipt.
2. In one transaction, validate status/turn/phase, placement/power limits, no pending shot, and expectedStateVersion n. Save the full pre-shot checkpoint; insert ACCEPTED action and command; reserve the room, set simulating phase at n+1 with pendingActionId, append game.action.accepted, and persist recovery deadline. Retried accepted IDs never start a second runner.
3. Ensure the single DO alarm points to the earliest pending deadline. If alarm scheduling fails, do not run simulation; leave the journal discoverable for reconciliation. Every constructor/request/alarm recovery entry reconciles pending actions and deadlines, so a crash in the scheduling gap cannot permanently lock a room. Cold initialization abandons reservations from a prior instance; normal requests only abort expired/unowned reservations, never a healthy runner owned by the current instance. A persisted reservation generation plus process-instance ID distinguishes these cases.
4. Invoke `SimulationRunner.simulate({state: preShot, command, config})`; then pure `resolveShot(preShot, command, simulation, config)` from the canonical game rules. Runner returns ShotSimulation, not a platform resolution. It does not write storage, advance turns, broadcast, or ask clients to simulate.
5. Commit resolved state in playback phase at n+2, bounded frames/facts, COMMITTED action, chunks/hash, canonical game.shot.committed/playback events, required result outbox if terminal, and playback deadline atomically. Guard commit using pending action ID plus reservation generation, not just an in-memory flag; an abort/room termination must make stale runner completion harmless.
6. Broadcast only committed data. Socket send failure cannot undo a committed result; reconnect reads its result. Use canonical startsAtMs and durationMs with initial 300 ms lead. Match phase prevents the next action until playback deadline; cinematic skip changes local camera only. No client acknowledgment is needed to advance gameplay.
7. Alarm releases playback to the stored resolved next phase (ready/restartPlacement/placementBlocked) at n+3, preserving complete/abandoned/paused status where applicable; publish a canonical snapshot. Final score/outcome never changes because of playback. New matches/queue promotion require opt-in after completed playback, never replace a match while viewers still replay it.

Failure rule: a thrown runner error, non-finite bodies, invalid result, missing pinned version, exceeded budget, or crash before result commit produces one durable ABORTED receipt. Restore pre-shot bodies/rules/turn while preserving newer authoritative pause/connection state and terminal outcomes; do not replace current state wholesale with a stale checkpoint. Assign a new monotonic stateVersion and append game.shot.aborted. A new shot needs a new actionId. A duplicate failed ID returns recorded ABORTED; it does not retry. A terminal forfeit/abandon cancels the reservation before any restoration, retains terminal outcome, and prevents granting another shot. Never charge a goal, foul, or forfeit for a server simulation failure itself.

On DO wake with ACCEPTED and no committed result, abort and restore once. Do not rerun Havok to guess a prior result: physics equivalence across runtimes is not assumed. On wake with COMMITTED but missed broadcast, return the stored canonical result and trajectory; never simulate again. No frame-level engine snapshot is needed for launch. Checkpoints are authoritative settled rule/body states and the pre-shot reservation state.

Recovery and reconnect timeouts share **one** alarm. Persist logical deadlines and schedule the earliest; alarm handler claims and processes due deadlines idempotently, then schedules the next. At-least-once alarm execution must not duplicate a forfeit or queue promotion. Recheck action status/membership/deadline generation before doing work. [Official alarm behavior](https://developers.cloudflare.com/durable-objects/api/alarms/) documents one alarm and repeated delivery.

Final result persistence is mandatory in T16. Atomically write a result_outbox row with terminal room outcome. Its payload contains matchId, authenticated participant IDs/team mapping, frozen versions, score, winner/reason, completion timestamp, and canonical result hash; no frames or secrets. Service-only Railway `POST /internal/v1/match-results` validates service credential/schema and transactionally commits one result row under unique matchId before returning acknowledgement. Same ID/same hash returns the original persisted acknowledgement; same ID/different hash fails closed and records an operational conflict, never overwrites the result. Only after a durable Railway response does DO mark outbox ACKNOWLEDGED. Lost HTTP acknowledgement retries the same payload. Retry deadlines persist on the room's shared alarm with bounded exponential backoff and jitter; an outage pauses export, not gameplay. Keep unacknowledged terminal key/payload past replay cleanup. Parent T01 freezes endpoint schema; API schema includes results table and participant associations, with parameterized writes. This endpoint is excluded from public edge proxy allowlist.

Blocked control behavior follows canonical ControlEnvelope: `match.snapshot.request` is read-only, `match.leave` by a normal player forfeits to a present opponent, and leave from confirmed placementBlocked abandons with no winner. Spectator leave affects only membership. Do not add a production reset/teleport action. Check terminal commands against reservation generation so a late runner cannot resurrect abandoned gameplay.

## 5. Authoritative playback and reconnect

Send canonical game.playback.chunk messages after settlement. Client physics is disabled during online replay; presentation interpolates server samples and then snaps to the canonical final state. Use 30 samples/second, 15 unique bodies, beginning/end frames, 15-second simulation maximum, and 32 KiB encoded chunk ceiling; input action limit is 4 KiB. Keep transport JSON. Choose limits in canonical contracts, not independently in transport/rendering. No unbounded broadcast loop or history array.

Use canonical ControlEnvelope `match.snapshot.request` with matchId/requestId; return canonical match.snapshot. Only use optional event-tail cursors if T01 explicitly includes them in its schema; no implicit sync message. A late viewer receives playback metadata/chunks and computes position from measured server clock offset. If current server time exceeds playback end, show settled state immediately. Deduplicate events by eventSeq and results by actionId. A page in the background may skip animation and request a fresh snapshot when foregrounded.

Reconnect authenticates anew; a username cannot reclaim a seat. The 60-second grace starts only after the last live controlling/player connection disconnects, and is persisted. Cancel only the matching disconnect generation on valid reconnect. Set match status paused and reject fresh shots while either player is absent. A previously accepted simulation and its committed playback may finish; preserve paused status on release, resume the stored next phase only when both players return. Keep simulation settlement and playback deadlines separate from disconnect deadline. Forfeit cannot invalidate an already committed shot; a forfeit/abandonment during simulation aborts its reservation before applying terminal outcome so a stale runner cannot commit. Both players absent closes/abandons match after grace rather than awarding arbitrary victory. Player disconnect while spectators remain still starts player grace. A session revoked during a socket lifetime must close/invalidate that user's controller: refresh validation on mutating messages and maintain a bounded identity-check lifetime; fail closed during identity-service failure for new mutations while allowing authorized state replay.

Use hibernating WebSockets accepted with `ctx.acceptWebSocket`. Store only connection ID, player ID, validated session reference, role/control epoch, and expiry in serialized attachment, and reconstruct authoritative role from storage. Never store full replay or durable membership only in attachments. Avoid permanent timers; alarms advance deadlines. [Cloudflare WebSocket hibernation](https://developers.cloudflare.com/durable-objects/best-practices/websockets/) documents reinitialization and attachments.

## 6. Identity and account recovery

Username is required before either game mode. Proposed initial validation: 3–24 ASCII letters/digits/underscore, case-insensitive unique key, display spelling retained; UI explains rules clearly. It is acceptable to revise international character support later without changing player IDs. Create a random persistent UUID player ID. PostgreSQL uniqueness decides concurrent claims; UI prechecks are advisory. No password/email/signup ceremony required for first play.

Issue an opaque cryptographically random session token, store only SHA-256 token digest with playerId, created/expires/revoked timestamps, and rotate on recovery. Proposed session lifetime 30 days; explicit logout revokes session. Proxy API through web origin and set `__Host-korre_session` with `HttpOnly; Secure; SameSite=Lax; Path=/`, no Domain. Local dev uses an explicitly development-only cookie name/secure setting; test production attributes. Mutating endpoints require exact allowed Origin plus CSRF token bound to session; never use permissive credentialed CORS. Enforce TLS and do not store credentials in localStorage. Cookies/rotation guidance: [MDN Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie) and [OWASP session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

Offer an optional high-entropy recovery code once after identity creation, with copy/download and a clear lost-access explanation. Store only its digest; recovery rate limits by IP and account, returns generic failure, consumes/rotates code, revokes existing sessions, and issues a fresh session transactionally. A username alone is never a secret. If user declines recovery and loses cookie with no verified email, do not invent a backdoor. Optional email is not mandatory for play; omit verification/recovery email sending until an actual provider and verification flow are implemented. Do not call unverified email a recovery method.

Minimum PostgreSQL tables: `players(id, username_display, username_key UNIQUE, created_at)`, `sessions(token_hash UNIQUE, player_id, expires_at, revoked_at)`, `recovery_codes(code_hash UNIQUE, player_id, consumed_at)`, `socket_tickets(ticket_hash UNIQUE, player_id, session_id, room_id, requested_role, expires_at, consumed_at)`, and T16 `match_results(match_id PRIMARY KEY, result_hash, result_json, recorded_at)` plus participant associations. An optional invitation-inbox table stores delivery/read state and room references only, never duplicate capability redemption/membership truth. Optional email belongs in a separate nullable field/table, never exposed in room state. Include useful lookup indexes and forward-only migrations. Railway API connects via private DATABASE_URL; no public database exposure required. [Railway PostgreSQL configuration](https://docs.railway.com/databases/postgresql).

### HTTP routes

All identity routes are `/api/v1/*`, JSON with shared validators and byte limits. `POST /players` claims username and returns public identity plus CSRF token; `GET /session` returns current public identity; `DELETE /session` logs out; `POST /recovery` redeems code; service-only `POST /socket-tickets` produces a one-use ticket bound to identity, room, requested role, audience, expiry (provisional 60 seconds). Initial creation/recovery require exact Origin and JSON content type but cannot require a pre-existing session CSRF token; authenticated account mutations do. Creation/recovery have stricter rate limits than reads. Startup fails if required secrets or DB schema are missing. Health endpoint reports availability, not credentials.

The edge proxies only whitelisted routes/methods to a fixed Railway origin. Strip user-supplied forwarded identity/secret headers; send an edge service credential and trusted request metadata. Railway rejects service-only ticket issuance/redemption without that credential. Use the secure same-origin session cookie for browser WS upgrade: the edge validates Origin, sends the cookie to Railway over authenticated server-to-server transport, and obtains a one-use room-bound ticket. Forward that ticket privately to MatchRoom, which atomically consumes it at Railway before accepting the websocket. Ticket is never in browser URL or logs. Public `/socket-tickets` is unnecessary under this default; implement it as an internal service-only route. If a separate-origin integration is later required, use short-lived ticket in the first WS auth message with bounded preauth connection lifetime and no gameplay before authentication; that is a contract change, not a second launch path. A requested spectator role can never be promoted merely because a ticket says player; MatchRoom checks membership/available seat. Return retryable unavailable if identity redemption fails, not anonymous membership.

## 7. Friends, invitations, waiting queue, and casual matchmaking

Authenticated room creation makes creator host and initial player. Private join needs an invitation: an existing username invitation binds to player ID; a share link is an unguessable, role-scoped, revocable capability with expiry and redemption count stored as digest. Suggested defaults: 24-hour expiry, one redemption per direct seat invite; host can issue separate multi-use spectator links with explicit cap. Invited person must still have a username/session. Show only generic invalid/expired invite errors; never leak room roster before access.

Use canonical RoomCommandEnvelope with type `room.command`, protocolVersion 1, roomId, requestId and command union `invite`/`revokeInvite`/`redeemInvite`/`joinQueue`/`leaveQueue`/`setFormation`/`startMatch`/`requestRematch`. Command details and validators are T01 coordinator-owned and specified in CONTRACTS, with idempotency and role checks. Use canonical ControlEnvelope `match.snapshot.request`/`match.leave` for match inspection/exit; no competing sync/leaveRoom gameplay messages. Snapshot room metadata lives in the canonical `room` field, not a second MatchState interface. Queue order is server FIFO, duplicates suppressed by playerId. A spectator can join a player waiting queue only with appropriate player invitation, not by sending a different role field. Proposed launch caps: 8 waiting players, 20 invited spectators per private room; shared config controls these. These are operational defaults, not traditional rules.

Winner-stays is provisional default. After completed playback, atomically offer promotion using still-eligible live queue entries; winner stays only if present/willing and next friend opts in, otherwise release seat. New match uses fresh matchId and reset formations. Queue promotion only happens once per ended matchId. Host departure does not destroy an active duel; transfer room management to earliest remaining eligible player. Spectators cannot start matches, change settings, invite players, or shoot.

Casual matchmaking pairs authenticated players once. Each entry has enqueueId, playerId, expiry, status and allocationId. Matchmaker persists a RESERVED pair before room creation; room initialization is idempotent by allocationId. If creation acknowledgment fails, retry the same room allocation, never issue two rooms. On completion mark entries MATCHED. Client retries/query retrieve existing allocation. Cancel races are resolved in one matchmaker transaction; cancel after allocation returns existing match rather than rematching. Use an alarm for expiring entries; prevent one player holding multiple active casual reservations. No rankings or rating calculations.

## 8. Havok deployed smoke before broad backend work

This is an integration gate inside the product, not a standalone benchmark project. Build the actual headless `SimulationRunner` and invoke it through MatchRoom in staging with the actual 14 caps/button/pitch geometry and one ordinary shot. Prove WASM initialization, rigid bodies/contact events, finite output, goal/foul facts shape, settlement, disposal, stored result, and client replay payload. Also exercise a lofted restart because 3D contact and tilt are launch requirements.

Workers only instantiate precompiled WASM modules and do not provide threads. Bundle the pinned Havok WASM as a module and adapt its official initialization hook; do not fetch arbitrary bytes and call runtime compilation or import the DOM Babylon scene engine. Headless math/NullEngine choices require compatibility inspection in the installed Babylon package. [Workers WASM capabilities](https://developers.cloudflare.com/workers/runtime-apis/webassembly/).

Memory is per isolate, not a reserved per-room allocation. Do not promise 80 MiB per room. Real smoke logs must record build/WASM hash, initialization/result/error, CPU evidence available from provider, output size, and repeated two-room completion without isolate failure. A small handful of product smoke shots is sufficient; no synthetic scaling matrix or month-long physics selection exercise. Current deploy/provider budgets must be read at implementation time; [official Workers limits](https://developers.cloudflare.com/workers/platform/limits/) are not proof of Havok compatibility.

If smoke fails, record exact error and minimal repro within the product. Keep local AI progress moving. First try only concrete compatibility fixes. If Cloudflare cannot run the actual module within runtime constraints, coordinator may substitute the already specified runner interface with a Railway adapter. Do not implement both runners speculatively or mark online complete with a fake runner. No client-authority fallback.

## 9. Configuration and deployment gates

Create `apps/realtime/wrangler.jsonc`, source export classes `MatchRoom` and `Matchmaker`, bindings `MATCH_ROOMS`/`MATCHMAKER`, immutable `ASSETS`, migrations `new_sqlite_classes`, staging/production environments, and generated Env types. Pin current verified Wrangler/dependency versions in lockfile. Use a recent tested compatibility date (initial proposal 2026-10-10), enable only tested flags, and observability with redaction. Verify each environment explicitly has correct DO namespace/assets/vars; environment binding inheritance must not be assumed. Append migration tags; never rename/delete a live DO class casually. [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/), [Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/).

Edge non-secret vars: `IDENTITY_API_ORIGIN`, `APP_ORIGIN`, allowed origins, runtime retention/cap settings. Edge secret: `IDENTITY_SERVICE_SECRET`. Railway secrets: private `DATABASE_URL`, matching `IDENTITY_SERVICE_SECRET`, any recovery/CSRF configuration keys required by selected implementation. Store secrets only in secret managers or ignored local files; supply `.dev.vars.example` and `.env.example` with placeholders. No Cloudflare admin token in browser/API runtime.

Required scripts, to be created by coordinator before task assignment: root `pnpm typecheck`, `pnpm lint`, `pnpm test`; packages `@korre/api`, `@korre/realtime`; API `db:migrate`, `dev`; edge `dev`, `test`, `smoke:staging`. Do not pretend these commands already exist. Main plan can rename once before contract freeze.

Development commands after scaffold (PowerShell, one command at a time):

```text
pnpm --filter @korre/api db:migrate
pnpm --filter @korre/api dev
pnpm --filter @korre/realtime exec wrangler types
pnpm --filter @korre/realtime exec wrangler dev
pnpm --filter @korre/realtime test
pnpm --filter @korre/realtime exec wrangler deploy --dry-run --env staging
```

Staging deployment after concrete build/tests and authenticated account access:

```text
pnpm --filter @korre/realtime exec wrangler whoami
pnpm --filter @korre/realtime exec wrangler secret put IDENTITY_SERVICE_SECRET --env staging
pnpm --filter @korre/realtime exec wrangler deploy --env staging
pnpm --filter @korre/realtime smoke:staging
```

Use Railway's existing authorized project if available; otherwise identify required project access as a real credential dependency after local code is ready. Configure service root `apps/api`, build/start commands from its package scripts, private PostgreSQL reference, and a pre-deploy migration that fails closed. Never run destructive migration against production. Take/verify backups before production schema changes. Public publication/deployment approval, if applicable, is a final reviewable step; plan writing needs no credentials.

Production gate: clean install/build/type/lint/domain/security tests; actual staging Havok gate; two independent authenticated browser clients complete duel and reconnect; third invited spectator cannot act; recovery exercised with expendable staging account; secret-free artifacts/logs; migration/rollback operational notes. Rollback app code only when stored schema/protocol remains compatible; roll forward a bad data migration using a new migration. Freeze new matches for breaking version updates.

## 10. Atomic task cards and evidence

Every parent T-task submits files changed, commands actually run, results, fixture IDs, known limits, and next task. Never label an unrun check PASS. The following P-cards are supplementary acceptance breakdowns; parent TASKS.md alone schedules work and status. Independent identity and room-fake work may run in parallel only when their parent task dependencies permit.

| ID | Task / exclusive owner | Dependency | Acceptance evidence |
|---|---|---|---|
| P01 | Coordinator freezes validators, version and runner fixtures | main scaffold | invalid schema/NaN/unknown action rejected, two consumers import same validator |
| P02 | Edge scaffold, DO migrations/types and dry-run | P01 | generated Env, bundled assets/WASM, valid config, no browser dependencies in server bundle |
| P03 | Physics + edge deployed real shot smoke | P02 + real runner | staging hash/log + ordinary and lofted shot persisted with finite settled bodies |
| P04 | Identity database/session claim/recovery | P01 | race for username resolves once; cookie/CSRF/recovery tests pass |
| P05 | Edge whitelist proxy/ticket handshake | P02,P04 | forged Origin/ticket/role rejected; consumed ticket reuse rejected |
| P06 | Room journal/reservation reducer using runner fake | P01,P02 | concurrent submissions one acceptance; duplicate same payload receipt; altered payload conflict |
| P07 | Real runner settlement and abort restoration | P03,P06 | all fault boundaries produce committed result once or restored state once |
| P08 | Playback chunks/snapshot/reconnect/deadline alarm | P05,P07 | late client aligns; dropped broadcast reconstructs; alarm retry no duplicate forfeit |
| P09 | Invitations/queue/host transfer | P08 | scope/expiry/revoke/queue races tested; spectator authority denied |
| P10 | Casual queue reservation/allocation recovery | P08 | retry returns same room; canceled entries not allocated twice |
| P11 | Two-player + spectator staging browser gate | P09,P10 | full match, restart/penalty, reconnect mid-shot and mid-playback, mobile backgrounding evidence |
| P12 | Production review/release runbook | P11 + all main-plan gates | version drain strategy, backups, concrete deployment artifact, credential needs identified |

Do not combine P04–P10 into one open-ended "build backend" prompt. An implementation agent receives one card and exact files, tests, fixtures, and dependency evidence. Coordinator reviews before assigning downstream work.

## 11. Required security and failure tests

Identity: concurrent case-insensitive username claims; invalid/oversize username; missing/expired/revoked cookie; cookies correct in production; foreign Origin and missing CSRF denied; session fixation impossible; recovery wrong code/generic error/rate limit; consumed code reuse denied; recovery revokes old session; username alone never authenticates; credentials absent from logs and room snapshots.

Transport: invalid JSON/binary/oversize frame; nested/unknown fields; infinity/NaN and excessive power; wrong protocol/hash or previous matchId; stolen/reused/expired/cross-room ticket; origin mismatch; spoofed actor/header; seat controller replaced; spectator sends every mutation type; revoked player with open socket; identity unavailable fails closed; message floods have bounded cost and explicit rejection.

Authority: stale state returns current version without shot; same action submitted concurrently or by two tabs starts one runner; ID reused with changed payload conflicts; action lookup authorized; invalid selected cap/overlap/restart location denied by rules contract; final-state payload rejected; accept/commit/broadcast crash boundaries; stale asynchronous completion after abort cannot alter state; non-finite runner result restores exactly; no goal/forfeit from server failure.

Recovery/social: wake during ACCEPTED aborts once; wake after COMMITTED replays without simulation; lost last event gives snapshot; deadline alarm repeated; one player reconnects on deadline edge; both absent; pause during acceptance does not regress revision on settlement; spectator presence does not suppress grace; invitation revoked during redemption; queue duplicate/promotion/rematch races; casual allocation crash after reservation and after room init returns same room; expired/canceled entries do not re-enter silently.

Test durable behavior with official Workers Vitest integration and local workerd, plus explicit staging smoke. Ordinary Node mocks alone cannot prove WebSocket hibernation, WASM, DO storage transactions, or deployed behavior. Keep runtime checks small and tied to product invariants.

