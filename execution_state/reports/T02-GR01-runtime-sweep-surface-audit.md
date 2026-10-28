# T02-GR01 runtime sweep surface audit

Date: 2026-10-11
Scope: read-only runtime API inventory. This report does not implement the guard and does not unblock T02-L01 or T02-BR01.

## Current guard config and status boundary

The inspected `packages/game-protocol` source now has outer config version 2 and a strict, literal `DiagnosticPhysicsGuard` / `CounterballConfig.diagnosticGuard`. Its documented domain is the accepted D01 fixture input only: cap `home-6`, raw center impulse `{x:0,y:0,z:8}` at `{x:0,y:0.06,z:-4}`. Its guard includes energy 34, maximum rest-height drop 0.01125, support apron 325, full-point sweep per substep 0.01125, rotation per substep about 0.39269908 radians, maximum 48 substeps per tick, 86,400 total substeps, 120 substeps per batch, and 30,000 ms wall time. `physicsCalibration` remains null. I observed the current source values and schema; I did not inspect task status, so this is not a claim that GC02 has passed independent review or that GC01/GC02 is `ACCEPTED`.

The accepted contract text says the guard is only for the explicit diagnostic entry. It is not calibration and cannot be a fallback for ordinary local, AI, online, or deployed play. The guard's presence in the hashed config does not prove any runtime consumes it.

## APIs evidenced by the permitted source

`games/counterball/src/simulation/worldFactory.ts` constructs dynamic caps and the button as `PhysicsBody` instances backed by `PhysicsShapeCylinder`; it sets configured mass with `body.setMassProperties({ mass })` and seeds each body's `TransformNode` position, quaternion, linear velocity, and angular velocity. It constructs the surface as a static `PhysicsShapeBox` whose top is `surfaceY`; its x/z dimensions equal the painted pitch dimensions. It constructs the open goal frame from static cylinders. There is no support apron option or enclosing wall in this factory.

The existing probes use these Babylon Physics V2 surfaces:

- `HavokPlugin.executeStep(deltaSeconds, physicsEngine.getBodies())` to request one explicit physics step. `worldFactory.ts` calls `physicsEngine.setTimeStep(fixedStepSeconds)`. Both `intendedShotProbe.test.ts` and `directImpulseProbe.test.ts` call `executeStep(fixedStepSeconds, ...)` once per 1/120-second nominal tick. The accepted pinned-API contract states that each `executeStep` call performs one `HP_World_Step`; the ideal-step-time setting does not create internal substeps. Therefore the caller can count calls it makes and can pass smaller durations, but current probes do not subdivide or record the selected 48 substeps.
- `PhysicsBody.transformNode.position` and `.rotationQuaternion`, plus `getLinearVelocity()` and `getAngularVelocity()`, provide the body pose and velocity samples used by probes. `applyImpulse(vector, point)` applies the current D01 impulse. `getCollisionObservable()` and `setCollisionCallbackEnabled(true)` record collision callbacks with body identities and, when present, a point. Those callbacks report contacts; an absence of callbacks does not by itself prove no tunnelling.
- `PhysicsShape.material` is assigned and read back in the coefficient probes for friction, static friction, restitution, and combine modes. That proves the Babylon-side property values observed by those probes. The inspected code does not independently read the pinned native Havok solver's effective material state.
- `setMassProperties({ mass })` is used for body creation. None of the inspected world/probe source calls a mass- or inertia-readback method. Thus actual mass/inertia inspection required by the contract is not evidenced here. Do not infer a getter's availability or semantics from `setMassProperties`; verify the pinned Babylon/Havok declarations and fail closed if the needed actual values cannot be read or otherwise established.

`directImpulseProbe.test.ts` uses `NullEngine` and initializes the real pinned Havok WASM package. It records immediate velocities, fixed-tick transforms/velocities, contacts, and settling observations. This is a real WASM diagnostic in a NullEngine host; it is not a real browser-host test. The `browserDirectProbe.ts` and `browserDirectProbe.test.ts` mentioned by the BR01 stop review were absent at that review point. No inspected current source connects `diagnosticGuard` to an explicit browser diagnostic entry.

## Full-collider support and the exact gap

The existing `intendedShotProbe.test.ts` has an analytic `cylinderVerticalSupport(radius, height, quaternion)` helper. It computes the vertical support of an oriented cylinder from its pose and records button-to-obstacle vertical clearance only after a full nominal step and only while sampled horizontal center distance is within the sum of configured radii. It labels `continuousTraversalProven: false`. This is useful endpoint geometry, not a substep swept-collider certificate. The direct-impulse and coefficient probes also observe transforms after one fixed-duration call; neither consumes the diagnostic guard or performs a pre-step support check.

The exact unimplemented invariant is: before every actual Havok call, conservatively bound the full oriented collider's complete motion over that call and prove it stays within the 325-unit horizontal support apron, does not exceed the global 0.01125 rest-height-drop bound, and stays within the per-call point-sweep/rotation limits; establish that the next step will not cross any bound, record the actual call duration/count and contacts, account for energy/material/mass properties, and abort before an unsafe call with `resourceLimit`. Endpoint transforms cannot prove the swept interval. A built-in Havok shape sweep is not used or evidenced by the inspected source; the contract could instead be implemented with a conservative analytic bound from known cylinder geometry, sampled pose/velocities, and the accepted energy guard, but that needs independent mathematical and implementation review. Actual solver mass/inertia/material readback remains a separate API-verification dependency.

The current fixed slab spans only `pitchWidth` by `pitchLength`, and no probe can keep a body supported after it exits the painted area. The diagnostic needs an isolated open support apron; it must not add walls or alter painted crossing planes. The vertical policy is a maximum drop from fixture rest height, not a continuous-contact requirement, so the button may be airborne. It must still fail before the whole-collider swept bound can pass below the supported height or leave the apron.

## Smallest candidate runtime packet paths

Subject to accepted GC01/GC02 inputs and a verified pinned API, the smallest reviewable runtime change appears to require:

1. `games/counterball/src/simulation/worldFactory.ts` — add an explicit diagnostic-only construction path for the hashed open support apron, keeping ordinary match geometry and behavior unchanged.
2. `games/counterball/src/simulation/worldFactory.test.ts` — verify the diagnostic support extent is open (no perimeter walls), correct, and inaccessible through ordinary match construction.
3. New `games/counterball/src/simulation/diagnosticSweep.ts` and `games/counterball/src/simulation/diagnosticSweep.test.ts` — isolate and test conservative full-cylinder sweep, orientation, vertical drop, energy, and fail-closed checks before each physics call. Only use engine mass/material data after the exact pinned readback APIs are verified.
4. `games/counterball/src/simulation/directImpulseProbe.test.ts` — integrate the guard for the unchanged D01 input; explicitly execute/count bounded substeps, check all dynamic bodies and contacts, enforce batch/yield/wall limits, and emit no successful result after any failed proof.

That set would establish the guarded real-WASM probe in the current NullEngine harness only. If BR01 acceptance requires the contract's actual browser-host diagnostic, add the already-planned browser direct-probe entry and its browser test as a separate explicitly bounded packet; do not present the Node NullEngine run as browser proof.

## Inputs, outputs, and limits

Inputs consulted: `execution_state/reports/T02-L01-review.md`; `execution_state/reports/T02-L01-implementation.md`; `execution_state/reports/T02-BR01-stop-review-1.md`; `execution_state/reports/T02-BR01-implementation-1.md`; `knowledge_base/execution/CONTRACTS.md` diagnostic guard and pinned-step sections; `packages/game-protocol/src/types.ts`, `schemas.ts`, and `config.ts`; `games/counterball/src/simulation/worldFactory.ts`, `havokRuntime.ts`, `sampling.ts`, `intendedShotProbe.test.ts`, `directImpulseProbe.test.ts`, and `calibrationProbe.test.ts`.

Output: source-grounded inventory of the current stepping, pose, velocity, contact, material, and mass APIs; the missing continuous swept support / pre-step enforcement; and a candidate bounded runtime path set. No source, config, contract, status, task catalogue, or ownership file was changed. No build, test, install, browser, physics, server, or deployment command ran. This audit does not accept or unblock L01/BR01, prove any runtime invariant, or claim a browser flick, traversal, playability, calibration, or deployed Havok result.
