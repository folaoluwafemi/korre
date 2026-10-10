# Ordered implementation tasks

T00–T24 are the only scheduled parent tasks. Specialist G/P cards explain these tasks; do not schedule them as duplicate work. Large cards must be split into sequential packets of at most five implementation files before dispatch, preserving the parent task gate. Parent is ACCEPTED only when every child is accepted and integration passes.

Every worker reads root AGENTS, DECISIONS, CONTRACTS, and its specialist sections. Allowed writes below are ownership ceilings, not permission for two simultaneous agents to share a subtree. Coordinator assigns exact file names in each packet. All reports go in `execution_state/reports/Txx-implementation.md` and `Txx-review.md`, or suffixed child IDs. The coordinator owns root configuration, package manifests, migrations ordering, shared protocol, and status.

All package names use `@korre/`: web, api, realtime, counterball, game-protocol, game-sdk, identity-client, ui. The T00 coordinator makes these scripts real: root verify/dev/typecheck/lint/test/test:integration/test:e2e/build; package test/typecheck/build. Before dispatch replace shorthand commands below with working exact commands and paths. Do not mark a task READY while its required command is nonexistent.

## T00 — workspace and reproducible checks

Owner: coordinator. Dependencies: none. Writes: root manifests, pnpm-workspace.yaml, tsconfig, lint config, gitignore, README, CI, package manifests, `.env.example`, `VERSIONS.md`, execution_state records.

Steps:
1. Inspect git status, existing files, and applicable instructions. Preserve the knowledge base and local screenshot. Record documentation-only baseline.
2. Create package folders from plan README. Use package exports, strict TypeScript, ESM, and browser/server tsconfigs. Verify compatible exact package versions and Node LTS for CI. Add packageManager pin.
3. Install once, pin dependencies, generate pnpm-lock.yaml. Do not generate a full commercial starter or copy a template application's unrelated features.
4. Add scripts and small import-boundary lint rules. Domain cannot import engine/UI/backend. Protect against floating promises. Wire package tests with no allow-pass-on-empty where a test gate is required.
5. Copy status seed to `execution_state/tasks.json`; create ledger/ownership/decisions/integration records. Root CI runs frozen install and verify. Document optional integration service setup.

Acceptance: clean clone frozen install/typecheck/build works; each workspace resolves imports; no secret file tracked; CI commands exist. Empty placeholder packages may compile but cannot claim feature tests passed. Review root tooling independently. Failure: resolve peer/runtime mismatch before dispatch, record exact versions; do not let workers each install their own toolchain.

## T01 — canonical protocol, config, SDK, and fixtures

Owner: coordinator with read-only independent review. Depends T00. Writes: packages/game-protocol/src/{types,schemas,config,index}.ts; its focused tests; packages/game-sdk/src/{manifest,lifecycle,transport,index}.ts; tests/fixtures/*.json.

Steps:
1. Translate CONTRACTS types exactly; use runtime validation for all command/wire boundaries. Freeze config; canonical serialization/hash stable across key insertion order. Do not put Havok/React in these packages.
2. Create fifteen-body initial fixture and foul/out/goal/penalty/blocked fixtures. Tag engine/rule/config version. Verify schema rejects duplicate/missing entity IDs, impossible values, invalid power, and unknown command fields where strict schema is intended.
3. Define game manifest/mount/transport/dispose interfaces; separate platform state from Counterball state.
4. Provide `oppositeTeam`, cap ownership mapping, angle conventions, schema parsing errors, and exact error codes. Avoid duplicate helpers in consumers.

Checks: protocol and SDK unit tests, typecheck, import-boundary lint. Acceptance: fixture parse/round-trip; finite bounded values; stable configHash; compile an example local and network transport against one interface. Gate G0. Contract changes afterwards go through coordinator.

## T02 — isolated headless Havok shot runner

Owner: physics worker. Depends T01. Writes: games/counterball/src/simulation/{havokRuntime,worldFactory,runner,facts,sampling,dispose}.ts and simulation tests. Split into runtime/world and runner/facts packets.

Steps:
1. Inspect pinned Havok package entrypoints and actual shipped WASM, plus official Babylon Physics V2 types. Record actual APIs, not remembered method names.
2. Initialize actual WASM. Build headless world from fixture. Define simple disc/cylinder colliders and stable IDs. Add open support surface, goal geometry, gravity, and material constants. Render crown/button holes later; no mesh holes required in physics.
3. Run fixed steps, collect full-rate contact/crossing facts, sample playback, terminate by sustained movement threshold. Catch invalid/nonfinite body state. Always dispose per-shot world.
4. Apply normal impulse and placed-shot contact/lift mapping. Keep lift tuning explicit; do not assume visual tilt alone creates a reliable Havok jump. Any calibrated impulse mapping must be consistent server/client, versioned, and labelled approximation.

Checks: real engine one cap moves; cap strikes button; button can loft over a cap; out/goal crossing classified; no-contact reposition; never-settling fixture produces typed timeout; repeated create/dispose runs do not reuse another room's bodies. No mocks for these gates. Acceptance: serialization finite; fifteen pieces; result has ending frame/facts; simulated outcome independent of render framerate. Tuning values recorded once in config. Failure: actual initialization errors reported; cannot substitute fake simulation.

## T03 — procedural pitch, caps, and button

Owner: scene worker. Depends T01. Writes: games/counterball/src/scene/{createScene,pitch,caps,button,materials,dispose}.ts, asset source files only within that package. Split scene/pitch and pieces/materials packets.

Steps: create WebGL2 Babylon scene, bright textured green concrete and open edges; marked goals/penalty boxes; seven distinct caps per team; plastic button with visible holes; original nostalgic cap labels; warm light with adjustable shadow cost. Visual geometry uses canonical axes/dimensions. Render fixture transforms. Export mount/update/dispose without owning game rules.

Checks: browser screenshot shows correct pieces and open edges; hole detail visible at normal inspection zoom; resize does not clip HUD region; disposal removes listeners/render loop/resources. No network needed. Acceptance: selected team visually distinguishable beyond colour alone; mobile low quality still recognizable; no trademark artwork downloaded into production by default. Reference screenshot guides controls, not the obsolete wooden enclosure.

## T04 — Cloudflare actual WASM smoke

Owner: coordinator/infrastructure worker with exclusive config paths. Depends T02. Writes: apps/realtime/src/smoke/*, worker entry/config (coordinator), smoke integration tests, infrastructure/cloudflare docs.

Steps: import bundled precompiled WASM according to current Workers rules; adapt headless runner without browser globals; create staging smoke DO; fixed private fixture endpoint invokes real runner and returns bounded summary/final transforms; perform local worker test and bundle dry run, then deployed staging request. Close/delete access to smoke route before production; never expose arbitrary simulation input publicly.

Checks: returned actual WASM/module and adapter versions; cap and button transforms change plausibly; no DOM globals/remote runtime compile/thread requirement; cold initialization and two separate rooms work; errors typed. Evidence includes deployment version, command/request, actual JSON response with no secrets. G1 online feasibility requires deployed proof. If access missing mark only deployed check BLOCKED. After two focused technical repairs, record cause and evaluate Railway runner fallback within the unchanged SimulationRunner. No separate physics research service upfront.

## T05 — first local flick, touch, and camera

Owner: integration coordinator plus input worker. Depends T02,T03. Writes: games/counterball/src/features/flick/presentation/*, camera/presentation/*, local match application integration, apps/web dev harness via coordinator.

Steps: pick owned cap using scene raycast; project aim onto pitch; capture one pointer; pull back sets canonical yaw/power; release submits command; drag back/cancel/pointercancel releases without shot. Empty pitch drag orbits, pinch/wheel zoom; cap aim temporarily disables orbit. Keep preferred view. Use minimal direction/power feedback and a labelled HTML control fallback for keyboard angle/power/fire. Render real runner frames and final snapshot; unlock input only if status is active and the authoritative phase permits a shot. Terminal or paused state never unlocks.

Checks: mouse/touch cancellation; two fingers do not fire duplicate shots; no orbit during aim; resize during drag cancels safely; camera changes no physics state; 30/60-Hz render replay ends at identical stored snapshot. Acceptance: real local shot without manual intervention. Dev harness can use explicit temporary dev identity; not a shipped guest mode. Gate G1 local half.

## T06 — pure referee and turn/scoring rules

Owner: rules worker. Depends T01 (and T02 integration before acceptance). Writes: features/referee/domain/*, features/match/domain/* and tests. No renderer/backend writes.

Steps: implement pure resolveShot per canonical precedence; earliest offending contact; full-shot selected-cap button flag; penalty from defending area; valid whole-button goal and own goal; exits with last-touch attribution; no-event alternation; target completion; apply one placed-shot award. Emit typed domain events, no engine calls. All-body transforms come from simulation, except explicit validated formation/reset/return operations.

Checks: fixtures for hit-opponent/no-button, opponent-then-button no-foul, miss no-contact, reposition, contact chain default, foul+goal, above-crossbar out, own goal, goal+later exit, same-step tie, last-touch out, contacts after exit (exit attribution unchanged, full-shot foul exemption still collected), penalty, restart-shot foul, target score. Inputs immutable; final state schema valid. Acceptance: no extra-shot bank, no duplicated rewards; deterministic reducer for given facts/config. Have reviewer inspect rule fixtures against human corrections. Gate G2 component.

## T07 — formations and legal restarts

Owner: placement worker. Depends T01,T06. Writes: features/formations/domain/*, features/restarts/domain/*, associated tests. UI comes in T08.

Steps: define at least two seven-cap formation arrays with keeper-like position and six outfield caps; mirror by team and prevent initial overlap. Reset both teams to chosen arrays. Compute authoritative foul/exit/penalty anchor. Validate any owned cap relocation excluding its old pose; derive button contact pose from azimuth/tilt; leave all other caps unchanged. Reject overlaps/anchor violations. Search bounded legal space for UI hints and authoritative no-legal-placement detection across every owned cap; do not silently relocate other bodies.

Checks: selecting far-away cap legal; opponent cap illegal; selected old position not obstacle; other friendly/opponent bodies byte-identical after setup; crowded/fully blocked/retry states; boundary and penalty-edge anchors; formation swap valid seven only; zero arbitrary-distance button placement. Acceptance: legal restart can loft via T02; completely blocked case has explicit recoverable state and no invented extra permissions.

## T08 — placed-shot interface and local match HUD

Owner: UI/input worker. Depends T05,T07. Writes: restarts/presentation/*, match/presentation/*, packages/ui copy/styles (exclusive packet); apps/web route integration coordinator.

Steps: select any owned cap; ghost preview relocation in available space near anchor; expose radial position and tilt controls with degree display/radian conversion; show invalid-space reason; confirm/fire one atomic restart command. Present score, whose move, foul/throw-in/penalty, formation choice, snapshot/inspection/leave when online placement is blocked. Dev-only local reset creates a new match at zero score with clear confirmation; never expose it as a traditional restart. No UI term “extra turn.” Plain English functional copy. Use semantic HTML labels, focus, status announcements, large targets; do not disable error access behind canvas.

Checks: rotate/tilt preserves authoritative state until fire; invalid placement cannot fire; blocked state remains responsive; changing camera not changing azimuth; cancel returns same state; keyboard equivalent. Acceptance: user can complete restart without debug controls.

## T09 — full local rule integration

Owner: coordinator. Depends T06,T08. Writes: match/application local controller, tests/integration/local-match.*, tests/e2e/local-match.*, small integration fixes by reassigned ownership.

Steps: connect commands→simulate→resolve→playback→next phase using common lifecycle; expose diagnostics only in test/dev; scripted full first-to-three match includes foul, out, penalty, goal, reset; inject simulation failure restores pre-shot positions and phase; ensure listener/world cleanup after repeated rematches.

Checks: complete match and rematch; no stuck input, no duplicated shots, fifteen IDs after every outcome; reset remains fair and nonoverlapping; version consistency. Gate G2: no manual scene editing needed. Screenshot/copy inspection mandatory. Do not label a completely blocked restart as solved solely by a reset button; record it as provisional game-rule limitation for playtest.

## T10 — one basic AI

Owner: AI worker. Depends T09. Writes: features/ai/{domain,application}/* and tests.

Steps: generate bounded legal candidate shots from nearest cap-to-button geometry and goal aim; add defensive candidates; score goal approach/collision/restart legality; evaluate small candidate subset using isolated same runner with time budget; deterministic seeded tie-breaks for tests only. For blocked restart, return explicit no-legal-action state. AI uses same commands/referee; no teleport or special success rule. One setting only. Run evaluation off input-critical path via worker where packaging permits; cancel on rematch/dispose.

Checks: complete AI match, legal normal/restart, never act in human phase, cancellation, bounded computation, no main-thread freeze during aim. Acceptance: AI is beatable and functional, not advertised as strong. No new difficulty modes. Gate G3 AI half.

## T11 — PostgreSQL migrations and identity service

Owner: API worker; migration ordering coordinator. Depends T01. Writes: apps/api/src/features/identity/{domain,application,infrastructure}/*, tests, migration content assigned in infrastructure/database.

Steps: create players, sessions, recovery codes, match/results, invitation inbox/delivery metadata through additive forward-only staged migrations; unique index on normalized username. Create cryptographic opaque sessions stored hashed with expiry/revocation; case-insensitive race-safe username claim; optional recovery code hash and one-time display; never recover by username. API rejects unknown/malformed fields and limits request sizes. Use parameterized SQL. Rate-limit registration/recovery; secrets env only.

Checks with real local Postgres: concurrent same-name claim gives one winner; SQL injection harmless; session expiry/revocation; name-only login impossible; recovery one-use/rotation; migration forward dry run and code rollback compatibility. Acceptance: new username creates stable player ID, repeat secure session resumes same account, usernames are display/lookup only. Use configurable reasonable name policy; state chosen rules in UI and test them. Public arbitrary session minting must not remain as a dev endpoint.

## T12 — same-origin identity UI and mandatory gate

Owner: web/identity worker. Depends T11,T05. Writes: packages/identity-client/src/*, apps/web/src/features/identity/*, shell routing/edge proxy coordinator.

Steps: labelled “What should we call you?” / “Pick a username and get in.” form; API through same-origin edge/BFF; secure HttpOnly cookie production and documented local dev cookie behaviour. Restore session on reload; claim availability at blur/submit; preserve intended invited match route. No email field required. Every public AI/online route requires identity. Recovery/access management via small settings view. CSP/connect/WASM settings checked in staging; no browser token in localStorage.

Checks: before username, no actual AI/PvP match; taken-name feedback; back/reload/invite preserves destination; unknown cookie rejected; CSRF/origin test; keyboard form. Acceptance: secret authenticates, chosen username alone does not. Gate G3 identity half.

## T13 — edge proxy, authenticated rooms, and slots

Owner: realtime worker. Depends T04,T11,T12. Writes: apps/realtime/src/{edge,auth}/*, rooms/MatchRoom.ts initial membership only, tests. Coordinator owns Wrangler bindings.

Steps: validated same-origin /api proxy to Railway; credential boundary per PLATFORM; server-issued room-bound ticket consumes before socket acceptance; rooms assign two player slots server-side; participants/spectators separate; version/config compatibility handshake. CORS/origin allowlist. Bound unauthenticated attempts, messages, participants. Never trust external X-Player-ID header; strip and replace trusted context.

Checks: forged username/team/header/token rejected; ticket replay/wrong room; missing/expired session; spectator no slot; reconnect same identity same slot; third player queue/spectator as permitted; room cannot start with incompatible stamps. Acceptance: two real clients authenticated, fifteen-body room snapshot, no shot simulation until T14. Gate G4 component.

## T14 — durable authoritative shot transaction

Owner: room authority worker. Depends T13,T06,T07. Writes: rooms action/journal/storage helpers and unit/integration tests. MatchRoom shared entry single-owner packet.

Steps: dedup actor+actionId before revision rejection; persist accepted command/hash/pre-shot state and simulating phase; invoke actual runner; persist committed outcome/frames, outbox, playback version atomically; broadcast only persisted data; rejected input unchanged. Track immutable room version stamps. Bound histories/frame sizes without discarding live dedup records prematurely.

Checks: duplicate during accepted/after committed, same ID changed payload conflict, simultaneous distinct shots one accepted, stale version, opponent shot, NaN, oversized command, failed simulator rollback, two rooms isolation, disconnect/pause/forfeit while runner pending (monotone revision; late result cannot overwrite terminal state). Acceptance: exactly one action effect; no multiple world instances mutating room; real engine tests plus fault injection. No fake physics gate.

## T15 — client authority and shared playback

Owner: multiplayer client worker. Depends T14,T09. Writes: counterball multiplayer adapter via SDK, apps/web online route, tests.

Steps: assemble bounded chunks by shotId/index; server-clock estimate; render shared start/offset; keep authoritative final state independent of camera/render; lock gameplay until server ready; apply snapshot/revision/eventSeq; late joining spectators seek current playback; retries reuse same actionId until terminal receipt. Display reject/abort/reconnect feedback. Server never depends on client playback acknowledgement.

Checks: different cinematic settings same result; slow/late/drop/reorder/duplicate chunk delivery; final snapshot exact; event gap snapshot resync; no new shot while locked. Acceptance: two clients see same score/poses and can finish a match under modest network delay.

## T16 — recovery, hibernation, and result persistence

Owner: recovery worker. Depends T14,T15. Writes: room alarm/recovery/outbox helpers, API result ingestion, fault tests; split DO recovery and API outbox packets.

Steps: durable deadline unlock playback; persist socket attachments needed after hibernation; constructor reload state; accepted/uncommitted recovery aborts and restores pre-shot at newer revision; committed recovery replays stored result; deadlines/presence tracked server-side; disconnect pauses and reconnect window enforced. Result outbox retries idempotently into PostgreSQL with match ID unique result; no data loss if Railway temporarily unavailable.

Checks: kill/restart at accepted, simulated-before-commit, committed-before-broadcast, playback, completed-before-outbox-ack; lost ack; repeated alarm; player returns before/after deadline; both disappear; cold room socket membership rebuilt; no timer-only persistence. Acceptance: no resimulation masquerading as same nondeterministic result; no duplicate result or foul; client can recover snapshot. T16 is mandatory before online gate.

## T17 — authenticated two-browser online match

Owner: coordinator + independent reviewer. Depends T10,T12,T15,T16. Writes: tests/integration/online.*, tests/e2e/online.*, evidence, reassigned fixes.

Steps: run two distinct authenticated browser contexts plus Postgres and worker; complete public/private first-to-three including placed restart/penalty; test reconnect/browser background; check server result row; repeat staging against actual deployed runtime. Dev hotseat or two tabs sharing one player session do not prove two-player identity.

Checks: final state/version/score equal; result persistence one row; forged client cannot change score; spectator privilege test already ready or run in T18; no unresolved critical recovery failures. Gate G4: online match actually completed. If staging unavailable record local pass and deployed external block separately; do not call online launch complete.

## T18 — spectators, private waiting queue, and rematch

Owner: room/social worker. Depends T17. Writes: room membership queue helpers and social UI, split server and UI packets.

Steps: use the canonical room invite command through a local/staging authorized host fixture before T19 supplies production link/inbox UI; no public auth bypass. Add spectator/watch-only role; late join snapshot/playback; queue opt-in; winner stays and next consenting friend gets challenger slot after completion; player leaves gracefully; short acceptance timeout explicitly configurable; no spectator chat/video. Rematch uses fresh match lifecycle/identity association and agreed frozen config, avoids resurrecting prior action IDs.

Checks: two spectators mid-shot, hostile spectator action rejected, disconnected spectator does not forfeit player, queue order/dedup/leave, winner disconnect, challenger declines, rematch no stale state. Acceptance: private room participants can watch and play next without manual backend edits. Limits explicit in config.

## T19 — share links and username invitations

Owner: invitations worker. Depends T18,T11. Writes: MatchRoom invitation capability handlers (exclusive ownership), Railway inbox index/proxy, client invite UI, assigned inbox migrations; split authority/API-index/UI packets.

Steps: MatchRoom owns unique bounded-lifetime revocable invite tokens, redeem/revoke and room/role binding. Railway stores recipient lookup/inbox index only; index failure never grants membership. Add username invite list with clear unknown-name results; shareable URL; identity gate preserves destination; consume/redeem idempotent and membership checked. A link can carry invitation token but never identity session. Avoid external email sends without provider setup. Optional email settings do not make actual email invitations implemented.

Checks: revoked/expired invite, wrong role/room, duplicate redeem, full room queue, malicious URL text, new player onboarding redirect, invite to unknown username. Acceptance: friend can receive link or username inbox invite and join/spectate. If actual email requested/provider connected, add separate child task with delivery/verification evidence; do not pretend queueing an email is delivery.

## T20 — public casual matchmaking

Owner: matchmaking worker. Depends T17,T18. Writes: Matchmaker DO, client queue controller and tests; exclusive paths.

Steps: one queue membership per player/version stamp; pair compatible players; atomic reservation room allocation; idempotent ready confirmation; timeout/cancel returns unmatched player cleanly; no Elo/rank. Define region scope modestly, no premature distributed region algorithm.

Checks: repeated join/cancel, 3-player queue, disconnect during pairing, version mismatch, two coordinators can't allocate player twice; restart Matchmaker preserves/cleans stale entries. Acceptance: two players find and complete a match without knowing room ID.

## T21 — sound, cinematic, visual and mobile polish

Owner: presentation worker. Depends T09,T10,T15. Writes: cinematics/camera presentation, scene/material quality, UI preferences, audio sources. Split by audio/camera/mobile paths.

Steps: short procedural finger/hand placeholder optional; close shot/follow/return camera; independent skip/disable; reduced-motion and audio mute; soft collision/flick/goal sounds only after user gesture; bright original cap artwork, textured pitch, readable controls; low quality disables expensive effects; lazy game/WASM chunks, correct WASM cache/MIME and retry failure screen. Do not add avatar modelling dependency.

Checks: preferred view restoration; skip no altered physics; audio blocked without gesture handled; mute persists; WebGL loss recovery/error; portrait/landscape resize and pointer cancel; keyboard and visible focus; loading retry. Real-phone gate: one documented modest Android Chrome and one real iOS Safari device before supported mobile launch. Targets 30 FPS lower-end/60 capable during play, measurements documented; unavailable device check is BLOCKED, not passed; independent work continues. Gate G6 presentation component, not guaranteed target by screenshot.

## T22 — integrated security, reliability, and QA

Owner: independent QA worker, coordinator assigns fixes. Depends T17,T18,T19,T20,T21. Writes: tests/integration/e2e fixtures, QA reports only; no secretly editing another worker's source.

Steps: execute fixture matrix and complete AI/online/social flows; inject network faults and database outages; session/invite/WS privilege tests; bounded message/frame allocations; inspect bundles for secrets; accessibility manual walkthrough; native phone playtest evidence. Capture desktop/mobile screenshots and actual outcomes. Add tests for defects with meaningful assertions, not snapshots copying implementation.

Acceptance: all critical/high issues fixed or launch-blocked; local verify/integration/e2e passes; zero false green from skipped external suites; exact known limitations. Review every provisional culture choice with user playtest list, without stopping independent technical work for each constant.

## T23 — staging deployment and operational handoff

Owner: coordinator. Depends T22 for final operational acceptance. Prepare config and incrementally deploy staging earlier in T04/T17/T22; those tests must not wait for T23 acceptance. Writes: deployment configuration, CI deploy procedure, migrations runbook, startup README, health checks, rollback docs.

Steps: check authorized access; provision staging only when authorized; declare Worker/DO bindings and SQLite class migrations; Railway API/PG variables and readiness; deploy additive DB migrations, API, worker, web in dependency order; verify same-origin cookie/WS/CSP/WASM; health probes do not disclose secrets. Record build versions and deployment IDs. Test staging rematch/recovery/result persistence. Rollback code compatible with schema; destructive data migrations never automatic.

Acceptance: staging URL and real checks recorded, cold WASM integration, backed-up/verified DB procedure, reversible code rollout and recovery steps. Missing accounts/domain block deployment only. Production publication requires user's requested target/authorization; prepare concrete reviewable staging first.

## T24 — user playtest, production gate, and finish

Owner: coordinator + reviewer. Depends T23. Writes: evidence/final summary/runbook, scoped final fixes.

Steps: present playtest covering feel, cap selection, button holes, normal/restart loft, crowded placement, penalty edge, copy, formations; label D10/D11/D19/D24/D25 defaults. Incorporate user corrections at canonical source and tests, not isolated UI. Obtain target production authorization if not already provided. Re-run impacted suites only; deploy production through documented process; smoke complete match and recovery. Keep unresolved credential/device/publication needs explicit.

Definition of full MVP done: all previous gates accepted, local frozen verify + integration + e2e, real staging/deployed proof, identity/online/results/social flows work, user can launch and play, limitations honest, final URLs/version/startup docs supplied. If production is not authorized, deliver staging as staged-ready and mark production external-blocked, not complete. Finish with a concise outcome, evidence, risks, and remaining human needs.

## Ready work when credentials are absent

T00–T03, T05–T12 and preparation/dry-run portions of T04 remain useful. Do not bypass dependency acceptance for T13 merely because local smoke works. Split `T04-local` and `T04-deployed` in runtime ledger; T04 parent becomes ACCEPTED only after deployed proof or explicitly reviewed runner fallback proof. Prototype preview and user feel review can happen before deployment.

## Specialist task mapping

Gameplay G-cards map to T01–T10 and T21; platform P-cards map to T04,T11–T20,T23. Their numbers are reference sections, not independent scheduled tasks. Coordinator includes exact section headings in each packet after reading the current files.
