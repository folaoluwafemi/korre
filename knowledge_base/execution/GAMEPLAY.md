# Counterball gameplay implementation specification

Status: execution plan, 10 October 2026. No application code exists yet.

Read `../COUNTERBALL_RULES.md` before this file. Read `CONTRACTS.md` for canonical serialized types.
`CONTRACTS.md` owns exact shared types, fields, discriminants, and lifecycle semantics.
`DECISIONS.md` owns confirmed rules, provisional defaults, and numeric configuration.
The descriptions below use those canonical contracts. Do not create alternate interfaces.
The root plan owns stage names and deployment gates. This file owns gameplay acceptance checks.

## 1. Scope and rule authority

Build seven bottle caps per team and one plastic clothing button.
Use a smooth, open concrete pitch. Pieces can leave the marked pitch.
Keep visible button holes. These holes do not need individual collision shapes.
Use ordinary alternating flicks. A player can select any owned cap.
Ordinary defensive repositioning means flicking a cap without reaching the button.
Ordinary play does not permit dragging caps into new positions.

Fouls, throws, and penalties grant one placed shot. Remove every old two-shot bonus rule.
The awarded player can relocate any one owned cap near the restart anchor.
All other caps stay where physics left them. This includes friendly caps.
The player chooses button placement around the selected cap and button tilt.
A penalty uses the same mechanic at the penalty-box edge.
No corners, goal kicks, offside, timed halves, mandatory goalkeeper restrictions, or extra football rules exist.

Distinguish these statuses in code comments and decision records:

| Status | Meaning |
|---|---|
| Confirmed | The user directly supplied the rule. |
| Working interpretation | A rule follows the current context, but has unresolved wording. |
| Provisional | A practical implementation choice. Do not present this as remembered culture. |
| Tuning | A physical or visual number. Change through focused play tests. |

Keep provisional rules together in canonical versioned `CounterballConfig`.
Record changes in `DECISIONS.md`. Accepted matches retain their original config hash.
Do not block the first physical flick on unresolved rule details.
Do not silently change an unresolved rule during implementation.

## 2. Coordinate system, pieces, and tuning configuration

Use consistent arbitrary game units. These values are not measured pavement dimensions.
Use right-handed domain coordinates: x spans width, y measures height, z spans pitch length.
Choose Babylon's scene handedness explicitly. Translate in the adapter when necessary.
Home defends negative z. Away defends positive z. The surface top is y = 0.
Stable IDs are `home-0` through `home-6`, `away-0` through `away-6`, and `button`.
ID zero can occupy the visual goalkeeper position. ID zero has no special legal rights.

Starter values are tuning defaults, not traditional dimensions:

| Setting | Initial value or constraint |
|---|---|
| Pitch width / length | 12 / 20 |
| Cap radius / height | 0.32 / 0.12 |
| Button radius / thickness | 0.13 / 0.045 |
| Cap mass / button mass | 1 / 0.15 relative units |
| Goal inner width / clear height | 2.4 / 0.8 |
| Penalty area width / depth | 5 / 3.5 |
| Fixed simulation tick | 1/120 second |
| Trajectory sample rate | 30 samples per simulated second |
| Quiet linear / angular speed | 0.03 units/s / 0.10 rad/s |
| Quiet duration | 0.50 second, all active dynamic bodies |
| Maximum shot duration | 15 simulated seconds; timeout aborts and restores |
| Restart anchor tolerance | 0.64 units, one cap diameter |
| Restart button tilt | 0–60 degrees; radians in commands |
| Normalized power | 0–1 |

T02 chooses gravity, contact friction, restitution, damping, maximum speed, clearance epsilon, and impulse limits.
T02 records those values in the one canonical config. No task invents parallel tuning constants.
Record geometry tolerances and solver-search resolution there too.
Avoid decorative surface bumps in collision geometry. The user needs smooth pavement.
Use cap rims and underside details in visuals. Use simple convex collision shapes initially.
Use a solid thin cylinder for button collision. Show four holes through real visual geometry.
Keep physics geometry independent from level-of-detail settings.

Pitch markings describe the playable rectangle. Provide concrete outside the markings.
Give the physics floor a surrounding apron. Mark out-of-bounds before a piece falls into empty space.
A fell-off or very distant cap remains recoverable by its stable ID.
Render posts and crossbar with collision bodies. Decorative net geometry should not snag caps.

## 3. Pure state, actions, and events

Put no Babylon classes, meshes, scene references, DOM nodes, or Havok handles in domain types.
Use plain finite numbers and arrays. Validate network data before domain use.
Use a monotonic `stateVersion` and `shotId` per match.
Keep wall time out of referee calculations. Referee timestamps use tick plus fractional crossing time.

Use canonical `MatchState`, `VersionStamp`, `TeamId`, `EntityId`, `BodyState`, and `Restart`.

- `versions` contains `protocolVersion`, `gameId`, `gameVersion`, `rulesVersion`, `physicsVersion`, and `configHash`.
- `status` is `waiting`, `active`, `paused`, `complete`, or `abandoned`.
- `phase` is `ready`, `restartPlacement`, `simulating`, `playback`, or `placementBlocked`.
- Status and phase are separate. Completion uses `status: complete`, never a complete phase.
- `score`, `formationIds`, `activeTeam`, `targetGoals`, and exactly 15 `bodies` describe committed gameplay.
- Optional `restart` contains `reason: foul|out|penalty`, `awardedTeam`, and surface-height `anchor`.
- Optional `pendingActionId`, `playback`, and `outcome` follow the lifecycle in `CONTRACTS.md`.
- `stateVersion` is a monotonic revision. `eventSeq` belongs to the wire envelope, not the game state.
- The rule resolver can preserve incident details in domain events. Do not add fields to `Restart` implicitly.

Do not store aim previews or camera state in authoritative match state.
Keep a player's incomplete placement in local UI state until action acceptance.
Canceling a preview restores the last committed visual state.

Use the exact canonical commands inside `ActionEnvelope`:

| Action | Fields | Allowed phase |
|---|---|---|
| `shot` | `capId`, `yaw`, `power` | Active status and `ready` phase |
| `restartShot` | `capId`, `capPosition`, `buttonAzimuth`, `buttonTilt`, `yaw`, `power` | Active status and `restartPlacement` phase |
| Formation selection | Local/lobby preference using the root platform contract; not a `GameCommand` | Before match starts |
| Cancel preview | Local only. Never sends a gameplay action. | Any local placement/aim preview |

Send intent, never client-computed impulse, score, collision facts, or final body poses.
Action envelope contains `type: game.action`, `protocolVersion`, `actionId`, `matchId`, `expectedStateVersion`, and `command`.
Server identity comes from the authenticated transport. The envelope has no client actor/team authority field.
Reject NaN, infinity, missing body IDs, foreign caps, and power outside [0,1].
Yaw and tilt use radians. `yaw=0` points +z; positive yaw points +x.
Convert yaw into the planar impulse direction in the adapter. Bound action payloads to 4 KiB.
Reject ordinary `shot` during restart placement. Reject `restartShot` during ordinary ready phase.
Ownership, turn, room state, and expected version checks happen before physics world creation.

Use atomic `restartShot` rather than separate authoritative relocation actions.
One accepted action contains the complete legal placement and flick.
The server derives the button pose from `capPosition`, `buttonAzimuth`, and `buttonTilt`.
Do not accept arbitrary button coordinates or another cap's displacement.

Use canonical `SimulationFact = ContactFact | CrossingFact`:

- `contact`: `step`, `timeMs`, `a`, `b`, and representative world `point`.
- `crossing`: `step`, `timeMs`, `entity`, `boundary`, `point`, and `kind: goal|out`.
- Boundary is `left`, `right`, `homeEnd`, or `awayEnd`.
- Adapter contact-start filtering stays internal. Do not add a required flag to the shared fact type.
- Swept crossing fraction converts to `timeMs`. Never discard timing through playback downsampling.
- Cap crossings use the same entity-aware fact contract. They do not invent a separate `CapExited` wire type.
- Success is `ShotSimulation.termination: settled`. Timeout or invalid simulation throws typed `SimulationError`.

Internal semantic event names can describe referee outcomes:

- `ShotAccepted`, `ShotResolved`, `FoulAwarded`, `RestartAwarded`.
- `GoalScored`, `FormationReset`, `TurnChanged`, `MatchCompleted`.
- `ActionRejected` and `SimulationFailed` carry stable error codes for application handling.

Do not turn every continuous contact callback into a semantic event.
The adapter maps engine callbacks into stable facts. The referee resolves facts once per accepted shot.
Do not send these conceptual names as alternate transport messages.
Wire events use exact discriminants in `CONTRACTS.md`, including `game.shot.committed` and `game.shot.aborted`.
`game.shot.committed` carries the authoritative `MatchState` after durable result storage.

## 4. Referee: collision meaning and event ordering

The confirmed foul is opponent-cap contact without touching the button during the shot.
Contact order does not matter. Button contact after opponent contact still removes that foul.
This is not a first-contact football rule.

Explicit selected-cap collision default D31 from `CONTRACTS.md`:

1. Track opponent contact by the selected shooting cap.
2. Track button contact by that same selected cap throughout the complete shot.
3. Friendly-cap contact alone does not create a foul.
4. Chain collisions by another cap do not create a new foul initially.
5. Count real physics contact starts, not proximity, mesh intersection, or pre-existing resting contacts.
6. Record the first eligible opponent-contact point as the foul incident location.
7. Decide the foul only when the bounded shot finishes.

The chain-collision interpretation remains unconfirmed. Keep the eligibility function pure and isolated.
Test indirect button contact separately. Do not call that confirmed legal play until the user confirms causality.
Selected-cap versus opponent-cap contact at t1, then selected-cap versus button at t2, must remain legal.
Avoid resetting contact flags at the first possible goal or out crossing.
Pending goal presentation must wait for final adjudication.

At every fixed tick, inspect the swept button pose between previous and current transforms.
Use the button's projected support extent, not only its centre, for full-body boundary crossings.
Tilt changes the button's support extent. Goal checks must account for that orientation.
Interpolate the crossing fraction. A fast button must not skip a boundary or narrow goal mouth.
Trigger bodies can assist debugging. They do not replace swept mathematical goal and exit detection.

Goal default: the whole button crosses the goal line inside both posts and below the crossbar.
Tangency at a post or crossbar is not fully clear. A partly crossed button is not a goal.
A crossing over the crossbar or outside the posts is an out-of-bounds incident.
Goal-line exits outside the goal use the same throw restart. Do not invent corners or goal kicks.
Assign a valid goal to the team attacking the crossed goal, including an own goal.

Latch the earliest full-button terminal crossing in a shot: goal or ordinary exit.
Further crossings cannot create another goal or a second exit event.
Continue simulation to settling. Continue contact collection through the complete bounded shot.
If the 15-second limit expires, abort and restore. Do not adjudicate an unfinished shot.
This is a provisional whole-shot rule. It can count late contacts beyond the pitch markings.
That choice preserves the stated button-contact exemption until shot completion.

Resolve in this exact order:

1. Invalid simulation: restore pre-shot state. Award no score, foul, or turn change.
2. Foul: suppress any goal during this shot. Award one restart to the opponent.
3. Classify the foul as penalty when the foul point lies inside the shooter's defending penalty rectangle.
4. Otherwise, valid earliest goal: update score, reset formations, and mark complete if the target is reached.
5. Otherwise, earliest ordinary exit: award the restart opposite the D23 last-touch team.
6. Otherwise, ordinary completed shot: switch active team.
7. Return any exited caps using the separate cap-return policy.

The foul-over-goal rule is provisional. The foul-over-exit precedence is also provisional.
No event grants stacked shots. A foul during a restart grants the opponent another restart.
A legal restart without another terminal event switches active team normally.

Penalty point: provisional centre of the penalty-box edge facing midfield.
For home, use (x = 0, z = -length/2 + penaltyDepth).
For away, mirror z. The incident point remains in the event for explanation.
Rectangle edges count as inside the penalty area, with the same geometry epsilon.
This point is not the regular football penalty spot. The user specified the box edge.

Out-of-bounds responsibility follows D23/D32: last touching team at or before the current shot's earliest exit.
Use the shooting team only when no button contact exists in that shot.
Clear attribution at every shot start. Do not carry a last-touch team between shots.
Collect all contacts for the full-shot foul exemption. Exit attribution uses contacts through the earliest crossing time.
Same-step contact precedes crossing for attribution only, as specified in `CONTRACTS.md`.
Do not treat that ordering as proof of physical sub-step contact order.

After a goal, reset caps to selected formations and button to centre.
Provisional: the conceding team takes the next ordinary turn.
Choose the initial team from a recorded random seed once. Never choose again on reconnect.

Cap exits alone cause no foul. Return the cap near its exit point after adjudication.
Use a deterministic nearest-clear-position search with ID ordering when multiple caps return.
Never overlap the button, another cap, or a post. Do not move another piece to make room.
If no clear return position exists, mark the cap return unresolved and use the blocked-state handling below.
Cap-return policy is provisional, not a confirmed traditional rule.

## 5. Restart geometry and crowded placement

The anchor is the incident point for a foul, the boundary exit for a throw, or the penalty-edge point.
Project the original event onto y = 0. Keep the exact source event separately.
For throws, place the button centre far enough inside the boundary for the whole button to be in play.
The inward inset is the oriented button support radius plus clearance epsilon.
This inset is a geometry requirement, not permission to move the restart across the pitch.

Use a pure placement solver. Input includes state, selected cap, anchor, radial angle, tilt, and cap-centre choice.
Output includes derived cap pose, derived button pose, legal/illegal, and a stable reason code.
Ignore the selected cap's old pose during overlap tests. Every other cap remains an obstacle.
`capPosition` must remain inside the canonical 0.64-unit anchor tolerance.
Derive the button pose by tangent contact at `buttonAzimuth` around the cap.
Require the button near the same incident and entirely inside the marked pitch.
Radial angle is measured in the pitch plane. Tilt describes the button inclination against the cap rim.
The server computes all poses using the same geometry function as the preview.

Derive tangency from actual proxy dimensions. Do not fake an overlapping button against a cap.
Use oriented convex overlap checks for tilted button versus all other pieces.
Permit button/cap contact at the configured clearance tolerance. T02 owns the interpenetration limit.
Prefer one cap impulse, with loft produced through cap/button contact in the shared physical simulation.
If physical loft fails, T02 can define a calibrated impulse mapping as an explicit approximation.
Record the lift mapping and coefficients in the canonical config. Do not add hidden arbitrary button velocity.
Version the approximation and use identical authoritative/local implementations.
The test report distinguishes collision-only loft from any calibrated assisted mapping.

Provide two restart controls: placement around the cap and button tilt.
Show the restart anchor, legal placement preview, available angular region, and clear rejection text.
Do not allow release while preview placement is illegal.
Allow the player to change the selected owned cap without committing any relocation.
Show all nonselected caps at their settled poses throughout preview.

Crowded solver procedure:

1. Search player-selected cap centres within the configured 0.64-unit anchor bound.
2. Keep the button inside the pitch and goal-post geometry.
3. Reject candidates overlapping other caps or static obstacles.
4. Sample angles at the solver resolution recorded by T02 for automatic legal suggestions.
5. Sample anchor offsets using the deterministic radial resolution recorded by T02.
6. Never widen past 0.64 units. Show the selected anchor offset in the preview.
7. Rank by minimum anchor displacement, then angular deviation, then stable numeric ordering.
8. Revalidate the chosen pose continuously, and validate again on the authority.

Never clear other friendly caps or opponent caps. Never move them without an accepted physics shot.
Reject one invalid candidate without leaving `restartPlacement`.
Enter D25's blocked treatment only after the bounded search finds no legal placement for any owned cap.
Use `phase: placementBlocked` and pause the match without moving other pieces.
Keep the committed match state and incident record intact.
Offer `match.snapshot.request`, inspect another cap, and `match.leave` through the canonical control envelope.
Snapshot refresh changes no game revision and does not guarantee newly available space.
Leaving a confirmed blocked match marks it abandoned with no winner.
Local development reset creates a new match at zero score. It is not a legal restart action.
Never show an automatic room reset as a traditional rule or solve a blocked match by clearing pieces.
Before the complete-rules gate, test blocked-layout recovery and verify both participants see the same state.
Report blocked frequency. Ask for a new remembered rule only if an actual layout requires one.

## 6. Physics adapter and simulation lifecycle

Use canonical `SimulationRunner.simulate({state, command, config}): Promise<ShotSimulation>`.
The request contains `MatchState`, validated `GameCommand`, and frozen `CounterballConfig`.
The result contains `shotId`, `settledBodies`, `facts`, `frames`, `durationMs`, and `termination: settled`.
Use canonical `PlaybackFrame` with time and pose-only body transforms.
The local AI match and online authority use this same request/result model.
Do not use independent client physics to adjudicate an online shot.

Keep Havok inside `src/simulation`. Keep rendering inside `src/scene`.
Start with one physics adapter and one pure referee. Do not build a generic simulation framework.
The adapter owns WASM initialization, body IDs, contact subscriptions, stepping, and disposal.
The referee receives serializable facts. It never inspects Babylon bodies directly.

Resolve one shot as follows:

1. Validate the snapshot and intent. Preserve a pre-shot checkpoint.
2. Create an isolated world using the pinned physics config.
3. Restore all body poses and velocities. Settled committed poses start with zero velocities.
4. For restarts, apply the validated cap/button placement before the impulse.
5. Enable collision callbacks and clear per-shot accumulators.
6. Apply one planar impulse to the selected cap at its calibrated strike point.
7. Advance exactly one fixed tick at a time. Collect callbacks before deriving boundary facts.
8. Sample poses every four ticks for 30 Hz playback.
9. Finish successfully after the quiet window. Maximum duration throws `SimulationError: timeout`.
10. Return `ShotSimulation`. Pure `resolveShot(before, command, simulation, config)` derives the `Resolution`.
11. Dispose transient worlds, subscriptions, and native bodies even after failure.

Do not let the render loop step the same physics world in parallel.
Local real-time rendering may display samples or read a single stepped world.
Headless authority needs no canvas, cameras, textures, or mesh materials.
Use the supported transform/physics initialization required by the pinned Babylon version.
If Babylon's required imports depend on browser globals, isolate or replace those imports in the adapter.
The Cloudflare runtime compatibility gate belongs to the root/backend plan.

Fixed tick does not guarantee byte-identical Havok results across platforms.
Version config and engine packages. Send authoritative trajectories and final state online.
Test within physical tolerances. Do not assert cross-browser byte equality.
Lock local/server version differences out of active rooms.

Use `HavokPlugin(false, initializedHavok)` and explicit timestep only after checking the pinned type declarations.
`false` selects the fixed-time mode in current source. Avoid private members and hidden scene stepping methods.
Current plugin exposes `executeStep`, timestep control, collision observables, and velocity controls.
The implementation must compile against the installed public interfaces before selecting a stepping call path.
Use either one documented engine stepping path or one public plugin stepping path. Never both.
Do not copy version-one `PhysicsImpostor` examples into this version-two implementation.

Add a bounded workload guard separate from simulated-duration limits.
Yield between batches where the runtime requires cooperative scheduling.
A cancellation aborts the runner and preserves the pre-shot committed state.
Initialization failure, timeout, invalid body, or resource limit throws the corresponding typed `SimulationError`.
No finite capped-duration result becomes an artificial settled success.
Application orchestration restores the checkpoint and records `game.shot.aborted` at a new revision.
Frequent timeouts fail the physics gate and require tuning.

## 7. Seven-cap formations

Store formations as normalized coordinates within each defending half.
Each formation has exactly seven stable slots, including one visual goalkeeper slot.
Offer provisional presets `1-2-3-1`, `1-3-2-1`, and `1-2-2-2`.
The first digit includes the visual goalkeeper. Explain that counting scheme in development docs.
Formation names are UI arrangements, not asserted historical names.
Map normalized slots through one function. Mirror the away team through the pitch centre.
Validate pairwise clearances, pitch bounds, and centre-button clearance during match creation.
Use ID-to-slot mapping consistently after every goal reset.
Do not randomize caps on reset. Keep the player's chosen formation throughout the match.
Changing formations belongs before the match, unless later product rules explicitly permit changes.

## 8. Basic AI with bounded work

AI submits the same validated gameplay actions as a human.
AI cannot teleport during ordinary turns, move extra caps, bypass crowded placement, or read future outcomes.
Use a reproducible AI seed for any variation.

First AI procedure:

1. For each owned cap, derive a direction toward the button.
2. Prefer a cap behind the button relative to the attacking goal.
3. Penalize paths blocked by opponent caps before reaching the button.
4. Generate low, medium, and high powers for promising directions.
5. Include a safe defensive repositioning candidate when no direct strike is clear.
6. For restarts, ask the same legal placement solver for suggestions.
7. Try ground shots first. Add a small legal tilt option for crowded restarts.
8. Score goal progress, button reach, foul risk, and safe final position.
9. Submit one action. Keep candidate generation and scoring pure.

Start with a geometric heuristic. Do not build machine learning or a large search engine.
Optional forward simulation uses the canonical isolated-world runner for at most eight candidate shots initially.
Never mutate the live state during candidate evaluation.
AI target: legal action within 500 ms for heuristic mode on a normal mobile browser.
Cap optional physics search at 1.5 seconds. Use the best validated candidate if the budget expires.
Expose AI thinking feedback without blocking camera movement or mute controls.

## 9. Scene, input, camera, and cinematics

The scene reads snapshots and trajectories. It does not decide whose turn or whether a goal counts.
Show team ownership, selected cap, power, active player, scores, and current restart reason clearly.
Use bottle-cap metallic rims, printed tops, scuffs, warm light, and smooth green concrete.
Use generic procedural cap art first. Do not let unavailable branded assets block the physical prototype.
Keep the button holes visible at the ordinary camera distance through scale and contrast.

Pointer flow:

1. Tap/click an owned cap to select.
2. Pull away from the desired shot direction.
3. Preview aim and bounded power.
4. Release to submit once. A cancel control clears the preview.

Capture the active pointer. Treat `pointercancel`, lost capture, or browser blur as cancellation.
An aim gesture cannot also orbit the camera. Set a clear gesture ownership state.
Begin drag only above a small threshold, initially 8 CSS pixels.
Use planar world projection for aim, then derive canonical yaw once at the input boundary.
Clamp power visibly. Do not allow zero-length drags to fire.
Provide keyboard selection, aim adjustment, power adjustment, confirm, and cancel where practical.
Keep key and touch actions inside the same action-builder validation path.

Camera controls: orbit, zoom, reset, and saved player view.
Camera state is local. Never send the camera to the authoritative simulator.
Keep all pieces reachable with camera controls at portrait and landscape sizes.
Disable cinematic camera movement under reduced-motion preference by default.

Cinematic playback is optional and skippable.
Save the user's camera transform before the cinematic, then restore it exactly.
Skip finishes visual playback and applies the authoritative final snapshot once.
Skip never advances turns twice or changes a physics result.
Input also requires active status and the correct phase. Finishing terminal playback never enables another shot.
Under D33, an accepted shot can commit after disconnect, but the paused status survives.
Use pending labels during shot playback. Announce goal/foul only after authority resolves the shot.
Show trajectory at the same shared start time online.
Late viewers receive the current trajectory and elapsed position from the root transport design.
No imported realistic hand is required for launch.

## 10. Small tasks, ownership, and evidence

The G-cards below are specialist references for scheduled T-tasks in `TASKS.md`.
Do not schedule G-cards separately or treat these reference paths as a second ownership grant.
The coordinator gives each worker exact files through the canonical T-task packet.
Integration edits need the coordinator's explicit handoff.
Create feature folders only when needed. Do not create empty architectural layers.
Shared types remain owned by the contract steward.

| Task | Owner and files | Prerequisite | Acceptance evidence |
|---|---|---|---|
| G01: config and geometry | Gameplay agent: `features/match/domain/config.ts`, `geometry.ts` | Shared contracts frozen | Finite dimensions; correct home/away mirroring; invalid config rejection. |
| G02: formation mapping | Gameplay agent: `features/formations/domain/*` | G01 | At least two presets have 7 slots each; no overlap; reset preserves ID mapping. |
| G03: physics world | Physics agent: `simulation/havok-world.ts`, `physics-config.ts` | G01, pinned packages | Headless and browser world initialize; all 15 pieces have stable IDs; cleanup succeeds. |
| G04: one flick | Physics agent: `simulation/resolve-shot.ts` | G03 | One impulse, fixed steps, finite poses, real cap/button contact, sampled trajectory. |
| G05: collision facts | Physics agent: `simulation/contact-recorder.ts`, `boundary-detector.ts` | G04 | Stable contact IDs; no resting-contact foul; swept high-speed crossing checks pass. |
| G06: pure referee | Gameplay agent: `features/referee/domain/*` | G01, fact contract | Every adjudication fixture below passes without Havok or DOM imports. |
| G07: restart solver | Gameplay agent: `features/restarts/domain/*` | G01, G06 | Any owned cap; exact unmoved other poses; tangent geometry; blocked result explicit. |
| G08: local match orchestration | Gameplay agent: `features/match/application/*` | G04–G07 | No input during running shot; errors restore checkpoint; scores and turns commit once. |
| G09: scene assets | Visual agent: `scene/{pitch,pieces,lighting}.ts` | G01 | Shared cap geometry; visible button holes; graphics setting cannot change outcomes. |
| G10: flick and restart UI | Visual agent: `features/flick/presentation/*`, `features/restarts/presentation/*` | G07–G09 | Touch cancel, legal placement preview, tilt control, and exact action intent. |
| G11: camera and playback | Visual agent: `features/{camera,cinematics}/presentation/*`, `scene/playback.ts` | G08–G10 | Saved view restored; skip idempotent; reduced motion; latest final snapshot exact. |
| G12: basic AI | AI agent: `features/ai/{domain,application}/*` | G06–G08 | Seeded legal decisions; no mutation; bounded latency; restart solver reused. |
| G13: gameplay verification | QA agent: colocated tests, `tests/gameplay/*` | G01–G12 | Fixtures, physical checks, mobile evidence, and open decisions recorded. |

One agent can own multiple sequential tasks. Do not require thirteen simultaneous agents.
Suggested first parallel work: G02, G03, and scene visual sketches after G01 and contracts freeze.
Referee work can use synthetic facts while physics work progresses.
Restart geometry and input integration remain sequential after their shared contract review.

Every task report includes changed files, decisions, exact check command, result, and next dependency.
No task can claim completion through screenshots alone when the task owns domain rules.
No task can claim mobile readiness through desktop viewport resizing alone.

## 11. Verification cases and thresholds

Use table-driven pure tests for rules. Use a small real-Havok suite for physical integration.
Keep numerical tolerances explicit. Store failed shot inputs for reproduction.

### Pure referee fixtures

| Fixture | Expected result |
|---|---|
| Clean cap/button strike | Turn alternates; no restart. |
| Opponent contact, no button contact | Opponent receives one foul restart at first eligible contact. |
| Opponent contact then button contact | No stated foul. |
| Button contact then opponent contact | No stated foul. |
| Friendly contact only | No foul. |
| Miss both button and opponent | Legal defensive/missed shot; turn alternates. |
| Foul inside own penalty area | One penalty restart at configured box edge. |
| Foul inside opponent penalty area | Ordinary foul restart. |
| Foul exactly on own area edge | Penalty under provisional inclusive-edge policy. |
| Full goal crossing and no foul | One goal; exact selected formations reset. |
| Partial crossing only | No goal. |
| Goal crossing followed by another goal crossing | One goal maximum. |
| Goal and qualifying foul in same bounded shot | No goal; foul restart. |
| Exit then qualifying foul | Foul restart under provisional precedence. |
| Clear goal then later exit | Goal remains earliest terminal event. |
| Out after latest button contact by opponent cap | Opponent concedes; shooting team receives restart under D23. |
| Out without any cap/button contact during the shot | Shooting team concedes; opposite team receives restart. |
| Out after contacts by both teams | Team of latest eligible cap/button contact concedes. |
| Opponent contact with button only after exit | Earlier exit attribution unchanged; later selected-cap button contact can still exempt foul. |
| Over crossbar or outside posts | Throw restart at crossing point. |
| Own goal | Opponent scores; conceding team starts. |
| Restart creates another foul | One new opponent restart, no bonus-shot counter. |
| Third goal at default target | Complete; no further input accepted. |
| Invalid simulation | Same score, turn, and body poses as pre-shot checkpoint. |
| Complete match finishes visual playback | Terminal status persists; every new gameplay command fails. |
| Disconnect while accepted shot runs | Result can commit; paused status persists and new gameplay commands fail. |

### Placement fixtures

- Every cap ID can take a restart. A foreign or missing cap fails validation.
- Nonselected cap poses remain exactly equal before and after placement validation.
- Cap anchor displacement never exceeds 0.64 units under D25.
- Throw placements keep the entire oriented button inside the pitch.
- Low and high tilt cannot intersect another cap, post, or concrete surface beyond tolerance.
- Previews and authority derive matching poses within 0.001 game unit and 0.1 degree.
- Symmetric home/away fixtures mirror correctly.
- Fully crowded anchors produce `placementBlocked` only after checking all owned caps, without moving obstacles.
- One blocked cap with another legal cap does not pause the match.
- Snapshot refresh changes no revision. Leaving a confirmed blocked match creates abandoned outcome without a winner.
- A development reset starts a fresh match with zero scores and new action identity.
- Placement suggestions return the same candidate for the same state and input.

### Physical fixtures

- Straight strike: button moves forward after cap contact. No NaN or hidden button impulse.
- Missed shot: selected cap slides, decelerates, and settles without moving the button.
- Rim strike: button gains lateral motion without tunneling through the cap.
- Loft: a legal tilt within 0–60 degrees clears one stationary cap at moderate power.
- Loft uses collision response or the explicit versioned T02 calibrated mapping. No hidden force exists.
- Button falls back to the surface and settles within 15 seconds in at least 95% of tuning fixtures.
- At the maximum configured speed, 100 narrow-goal trials produce no missed swept crossing.
- High-speed body/body trial: no cap passes through a stationary cap in 100 trials.
- If collision tunneling remains, reduce speed or increase tick rate before release.
- Settled poses remain within 0.002 game unit over a further one simulated second without new impulse.
- Restore-and-resolve on one pinned runtime stays within 0.01 game unit in repeated fixture runs.
- That repeatability threshold is a debugging check, not an online determinism contract.
- Dispose/recreate 50 worlds without increasing retained body count or callback subscriptions.
- Report real memory measurements if available. Do not invent a fixed WASM heap size.

### Mobile and interaction checks

Test at least one real Android Chrome device and one real iPhone Safari device before supported mobile launch.
Both real-device checks are mandatory. A missing device blocks that release check, not independent development.
Record device, OS, browser, viewport, graphics setting, and build version.
Target median 30 FPS or better during a shot at low graphics on the chosen baseline device.
Target p95 pointer-preview latency below 100 ms.
Use 44 CSS-pixel minimum primary controls. Verify portrait 360×640 and landscape layouts.
Verify aim, cancel, cap selection, camera orbit, zoom, and restart controls without gesture interference.
Switch tabs during drag: no accidental shot. Resume during playback: final authoritative state appears.
Skip cinematics repeatedly: one state commit and exact camera restoration.
Mute persists locally. No audio plays before permitted user interaction.
Test low graphics with the same input: game outcome does not change.
Verify visible button holes on the baseline screen without zooming.
Run 20 AI decisions from varied layouts. Every action passes the ordinary validator.
Run 10 complete human/AI matches. No phase deadlocks or extra caps appear.

## 12. Gates and unresolved decisions

The one-flick gate needs G01, G03, G04, and a basic scene.
The complete local-rules gate needs referee fixtures, placement fixtures, goal resets, and recoverable blocked-placement handling.
The local-AI gate needs complete local rules, legal AI decisions, and mobile interaction evidence.
The online gate needs the actual authoritative runtime shot runner and the root recovery checks.

The following wording or implementation gaps need explicit decisions. They do not block the first flick:

1. Does an indirect cap collision count as button contact or opponent contact for foul purposes?
2. Do contacts after the earliest goal/exit crossing remain part of the same shot?
3. Does a foul override an earlier exit, as provisionally chosen here?
4. Does the provisional D23 last-touch exit rule match the user's remembered play?
5. Can any goal count during a fouling shot, especially an own goal?
6. Which exact penalty-box edge position should remain after the first play test?
7. Does the D25 refresh/leave treatment remain acceptable during real crowded-restart playtests?
8. Is returning exited caps near their exit point acceptable?
9. Should any visual goalkeeper gain restrictions later? None exist now.
10. Is loft convincing with the declared T02 physical or calibrated launch mapping?

Do not repeatedly ask the user for tuning choices. Implement provisional defaults and show a playable result.
Ask for remembered rules only when a real fixture demonstrates why a rule choice changes play.
Keep user-facing labels as Foul, Throw-in, and Penalty. “Set play” remains an internal proposal.

## 13. Current official implementation references

Checked 10 October 2026. Recheck the installed package declarations when implementation begins.
The current source links can change. Pin npm versions and record the matching source commit.

- [Babylon physics introduction](https://doc.babylonjs.com/features/introductionToFeatures/chap9/physics/): version-two Havok setup and basic bodies.
- [Official physics-engine guide source](https://github.com/BabylonJS/Documentation/blob/master/content/features/featuresDeepDive/physics/v2/usingPhysicsEngine.md): engine setup and stepping concepts.
- [Official Havok plugin implementation](https://github.com/BabylonJS/Babylon.js/blob/master/packages/dev/core/src/Physics/v2/Plugins/havokPlugin.ts): fixed-time constructor mode and public adapter methods.
- [Official version-two plugin interface](https://github.com/BabylonJS/Babylon.js/blob/master/packages/dev/core/src/Physics/v2/IPhysicsEnginePlugin.ts): collision-event, impulse, timestep, and geometry type contracts.
- [Official Havok bindings](https://github.com/BabylonJS/havok/blob/main/packages/havok/HavokPhysics.d.ts): WASM initialization and native binding boundary.

These references verify adapter concepts. They do not establish Counterball's traditional rules.
