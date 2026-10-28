# T02-L01 guard-resolution audit 1

Date: 2026-10-11

## Verdict

**CHANGES_REQUIRED — stop before running the 24 physics trials.** The pinned public runtime can count explicit Havok calls, read sampled state and native mass/material values, and evaluate a conservative per-call geometric envelope. However, the currently accepted hashed diagnostic guard is for one different, exact direct-shot input. The L01 restart-loft matrix is explicitly outside that guard. Reusing it would violate C00; changing the matrix or its energy/sweep limits in the worker packet would invent shared policy. This is a coordinator-owned config/contract gap, not a missing public `executeStep` capability.

The public API also does not expose Havok's internal continuous trajectory or a rotational sweep certificate. A future L01 implementation can report the packet's checked, conservative per-call envelope under an accepted energy/passivity model and keep traversal classified as unproven. It cannot claim that the pinned API alone proves collision-free continuous motion.

## Checks and inspected sources

- `node scripts/check-completion-plan.mjs --packet T02-L01` — **PASS for plan consistency only**. It reports the card ready and lists its one source write path, `games/counterball/src/simulation/loftCoarseProbe.test.ts`. It does not prove guard selection or run physics.
- `knowledge_base/execution/completion/PACKETS.md:25-26` — T02-L01's plan row and its dependent refinement card.
- `knowledge_base/execution/CONTRACTS.md:320-363` — the currently accepted diagnostic-only guard, its exact input scope, limits and failure requirements.
- `execution_state/reports/T02-GR01-pinned-api-audit.md` and `execution_state/reports/T02-GR01-runtime-sweep-surface-audit.md` — API/runtime inventory and its limits.
- `games/counterball/src/simulation/worldFactory.ts:211-228, 303-320` — factory slab, open goal colliders, and canonical dynamic cylinder/mass construction.
- `games/counterball/src/simulation/intendedShotProbe.test.ts:96-97, 128-185, 240-252, 453-520, 617-621` — its candidate values, controlled start state, single-pose cylinder support, nominal-step observations and explicit `continuousTraversalProven: false` limit.
- Installed package metadata and cited declarations/source under `node_modules/.pnpm/@babylonjs+core@9.30.0/` and `node_modules/.pnpm/@babylonjs+havok@1.3.14/` — these package roots report `@babylonjs/core` **9.30.0** and `@babylonjs/havok` **1.3.14**. No install or fetch was performed.

No source, config, contract, catalogue, task or status file was changed. No app build, test, browser, physics, install, Wrangler or deployment command ran.

## The blocking scope mismatch

The packet extraction fixes a 24-case matrix: gaps 0.75/1.0, tilt 45°/60°, impulse magnitudes 6/8, and azimuths −15°/0°/+15°. It asks for restart-loft observations and requires a config-hashed linear/angular substep guard before trial execution.

The accepted C00 diagnostic guard in `CONTRACTS.md:320-363` is `browser-direct-impulse-v1`: the only accepted input is the at-rest fixture, `home-6`, raw `{x:0,y:0,z:8}` applied once at `{x:0,y:0.06,z:-4}`. The contract expressly excludes restart placement, off-centre impulses, initial velocity, extra force and alternative fixtures. Its 34-unit energy envelope and 325-unit apron were selected for that exact trial. L01 instead changes restart placement and obstacle geometry, and its candidates do not use that exact cap/input tuple. `physicsCalibration` remains null and cannot be used as a fallback.

Therefore, the direct-shot guard's presence in the config hash does not authorize L01's separate matrix. In particular, 34 cannot be assumed to cover the changed start-pose potential plus each L01 impulse solely because the largest magnitude is also 8. A coordinator must calculate and freeze a bound for L01's complete start states and inputs. This audit does not determine a replacement number.

There is also a geometry consequence: `worldFactory.ts:211-228` creates a single slab only as wide and long as the painted pitch. The packet's 325-unit open support requirement cannot be met by that unchanged factory slab alone. The public `PhysicsBody.shape` setter/getter (`physicsBody.d.ts:109-119`) and `PhysicsShapeBox` constructor (`physicsShape.d.ts:225-233`) can support a diagnostic-owned replacement in the isolated world; the probe must preserve the existing surface transform, top plane, native material and filters, add no second overlapping floor or walls, and release it in body-before-shape-safe cleanup order. This is implementable in a diagnostic test path, but the 325 value still must be authorized for the L01 matrix by its own hashed guard.

## What the pinned public runtime can and cannot do

The public runtime can count actual calls. `PhysicsEngine.getBodies()` is declared at core `Physics/v2/physicsEngine.d.ts:108`; `HavokPlugin.executeStep(delta, bodies)` is declared at `Plugins/havokPlugin.d.ts:240`. Its pinned implementation calls `HP_World_SetIdealStepTime` and then `HP_World_Step` at `Plugins/havokPlugin.js:578-608`. Thus a probe can explicitly issue and record each `dt/N` call, enforce call/batch/wall limits, and yield between bounded batches. `HP_World_SetIdealStepTime` configures the solver's intended step size; it is not internal substepping (`HavokPhysics.d.ts:523-528`).

The API can provide the sampled pose and velocities (`physicsBody.d.ts:269, 297`), active mass properties (`physicsBody.d.ts:198`), collision events, native shape material/filter getters, and the shape type. The pinned audit establishes that `PhysicsBody.getMassProperties()` reads the active native tuple; principal inertias are for unit mass and must be multiplied by mass. It also notes that the Babylon wrapper drops the low-level result status, so invalid or unusable values must fail closed. Cylinder radius/height are not available as public readback; the canonical constructor geometry in `worldFactory.ts:303-311` is the source of truth and shape type must be checked. `PhysicsShape.material` can read actual Havok material values through the pinned plugin getter (`havokPlugin.js:1656-1664`); validate dynamic/static friction and restitution as C00 requires.

No pinned API supplies a continuous rotational cylinder sweep or a trajectory between transforms. `physicsShapeCastQuery.d.ts:15-23` has one shape rotation and start/end positions; Havok `ShapeCastInput` likewise has one orientation and linear endpoints (`HavokPhysics.d.ts:180-187`). `HP_Shape_GetBoundingBox` is a single-transform AABB (`HavokPhysics.d.ts:295`). A shape cast or 120-Hz endpoint sample cannot establish continuous obstacle clearance. The accepted contract instead calls for a conservative energy-derived point-speed/angular-speed bound and a pre-call swept envelope. That is a conditional analytic guard, not an API certificate of Havok's internal path or proof of solver passivity.

## Smallest safe coordinator action and bounded next path

Before L01 writes or runs trials, the coordinator should add a separate, strict, config-hashed restart-loft diagnostic guard. Keep the direct-shot `diagnosticGuard` unchanged and keep `physicsCalibration: null`. The new guard must bind the exact 24-case matrix and setup identity, including which geometry/orientation fields azimuth controls, the selected cap, impulse vector/application point, obstacle identity, and fixed-step input. It must contain or derive only explicitly reviewed limits for total energy, allowed COM drop, support apron, point sweep, rotation sweep, substeps, total calls, batch yield, wall time and result size. The coordinator should derive the energy maximum from the worst allowed initial restart pose and each possible impulse/application point, including rotational impulse work and configured gravity/drop; do not copy 34 without showing that arithmetic. Then update the strict protocol type/schema/tests/config and config-hash fixture, the C00 contract text, and the packet/dependency record. The follow-on worker should not edit those shared files.

Once that guard is accepted, the bounded L01 path is:

1. Create the 24 states only through the canonical placement helper and accepted fixture; validate all 15 bodies and finite, at-rest initial conditions. Preserve the packet's deterministic tuple order and exact candidate settings.
2. Create one real pinned-Havok WASM world per trial. Read actual native body mass/inertia and interacting shape material/filter values, validate constructor geometry, and fail before applying an input if any premise is missing or out of domain.
3. Replace only that isolated world's existing surface shape with an open support apron whose extent follows the newly accepted guard. Do not alter `worldFactory` gameplay geometry, add a second floor, or add perimeter walls.
4. For every actual call, compute `Nrequired` from the frozen energy and actual native properties using the C00 linear/angular formula. Reject before the call if `Nrequired` exceeds the frozen cap. Before each call, check all-body COM-drop, apron, full-cylinder support, point-sweep and rotation envelopes; after each call check finite poses, energy, contacts and limits. Count actual `executeStep` calls and yields. Track the button/obstacle complete horizontal-overlap interval using a conservative swept bound, not the existing endpoint-only helper. Fail the candidate if that bound cannot establish the packet's positive clearance.
5. Save the artifact only after all tuples and integrity assertions pass. It may contain zero eligible candidates; preserve `continuousTraversalProven: false` and state that per-call bounds are conditional finite-step diagnostic evidence, not a proof of continuous Havok collision safety.
6. Run the exact hosted `pnpm verify` and have an independent reviewer recompute the matrix, guard, provenance, artifact integrity, and boundary claims. A source test, NullEngine result, endpoint samples, or zero contact events alone cannot satisfy this check.

If the coordinator cannot freeze a separate bound that covers this matrix, the minimum safe alternative is to keep L01 stopped and return to the coordinator for a contract/packet adjustment. Do not use the current direct-shot guard as a proxy.
