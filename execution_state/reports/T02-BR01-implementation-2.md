# T02-BR01 attempt 2 — stop before implementation

## Outcome

**STOPPED before source changes and before applying the input.** The D01 impulse row is accepted and the diagnostic guard now has selected, hashed values, so the earlier attempt-1 missing-config-values finding is resolved. The remaining obstacle is enforceability: the permitted `worldFactory` does not provide the physical support apron required by the guard, and the pinned public physics API has no continuous rotational sweep or within-step trajectory certificate. I cannot implement the required full-collider support proof under these exact write paths without relying on an unverified solver-motion premise or changing scope.

No probe code or browser export was created or changed. No Havok world was created, and no input was applied.

## Exact packet and eligible input

`node scripts/check-completion-plan.mjs --packet T02-BR01` returned **PASS for plan consistency only** and listed the exact three source write paths. Its acceptance does not prove runtime safety.

The D01 artifact at `execution_state/reports/C01-P-run-38100635457-artifacts/counterball-intended-shot-observations/counterball-intended-shot-observations.json` contains six accepted diagnostic rows. The only row permitted by BR01 and the current contract is `impulse=8|aim=straight-at-button`: canonical fixture `counterball-protocol-fixtures-v1`, match `00000000-0000-4000-8000-000000000001`, cap `home-6`, impulse `{x:0,y:0,z:8}` at `{x:0,y:0.06,z:-4}`. It records 291 nominal 1/120-second endpoint steps and 15 bodies settling at 2.425 seconds. The other five matrix rows are not eligible BR01 inputs. The exact-run D01 review accepts these as diagnostic observations, but explicitly does not establish continuous traversal or the guarded substep behavior.

`packages/game-protocol/src/config.ts:58-83` now contains the hashed `diagnosticGuard`: energy 34, maximum rest-height drop 0.01125, support margin 325, maximum point sweep 0.01125, maximum rotation 0.39269908169872414 radians, at most 48 substeps/tick, 86,400 total, 120 per batch, and a 30,000 ms wall limit. `physicsCalibration` remains null. Per CONTRACTS.md:320-332, this diagnostic must use only `diagnosticGuard`; null calibration is not a fallback. The previously absent numeric selections are therefore no longer the blocker.

## Enforceability blockers in the pinned source and exact write scope

1. **The canonical world has no configured support apron.** `games/counterball/src/simulation/worldFactory.ts:211-227` creates the static slab with full extents exactly `(pitchWidth, surfaceThickness, pitchLength)`, currently `(12, 0.2, 20)`. The selected 325-unit margin would require a support slab covering 662 by 670 game units if centered on the same pitch. The factory is a read-only input and is not among the packet's write paths. Adding an extra slab inside the diagnostic would change the existing canonical world; changing the factory needs a separately owned packet. A guard could conservatively abort before the current 12-by-20 slab edge, but that is not the selected config's required physical 325-unit apron and cannot substantiate the stated reach envelope.

2. **There is no pinned continuous rotating-cylinder cast or within-step trajectory readback.** Babylon's `IPhysicsShapeCastQuery` has one rotation and linear start/end positions (`@babylonjs/core/Physics/physicsShapeCastQuery.d.ts:7-31`); the Havok `ShapeCastInput` has the same fixed-orientation form (`@babylonjs/havok/HavokPhysics.d.ts:180-187`). `PhysicsShape.getBoundingBox()` is a single-pose AABB. `HavokPlugin.executeStep` configures the ideal time and calls one `HP_World_Step` (`@babylonjs/core/Physics/v2/Plugins/havokPlugin.js:600-605`); it does not return intermediate transforms. The public shape cast therefore cannot prove the rotational support sweep, and endpoint transforms alone cannot do so.

3. **A geometric envelope is conditional on a speed/energy invariant that the API does not certify for the full Havok step.** Known constructor geometry plus a validated mass-property readback can produce conservative cylinder bounds. The audited public `PhysicsBody.getMassProperties()` path queries active native properties, but it does not expose the low-level result status; the values still require finite/positive validation. An enclosing sphere can bound all orientations if a whole-interval COM speed bound is valid. The guard-feasibility review, `T02-GR01-guard-feasibility-review.md`, finds the arithmetic only conditionally compatible and the overall safety verdict CHANGES_REQUIRED: actual inertia, solver energy behavior, per-substep support enforcement, and target wall-time feasibility remain unproven. D01 used nominal steps, not the proposed 48 explicit substeps. Checking energy after a step cannot prove that no unsupported transient occurred inside that step.

The concrete source construction does make the button/cap cylinder dimensions available from canonical config (`worldFactory.ts:279-311`), and the Havok readback/shape-cast APIs are useful for current properties and fixed-orientation queries. Explicit `executeStep` counting, batching, browser yielding, abort checks, output bounds, and cleanup could be implemented. Those pieces do not fill the physical-apron mismatch or establish the missing whole-interval motion bound. Reaching into the plugin's underscored `_hknp`/body internals or adding unselected native speed-limit settings would violate this packet's no-private-settings boundary.

## Coordinator action needed

This packet cannot safely proceed as written. A separate coordinator-owned decision/packet must either provide the configured physical support extent in the canonical world and an independently accepted enforceable swept-motion premise, or amend the diagnostic contract/config to an actually supported, explicitly fail-closed region and re-review the safety claims. Do not treat the current nominal-step observations or a fixed-orientation cast as that proof. No production calibration, playable match, browser flick, or deployed Havok result follows from this stop.

## Checks and limits

- `node scripts/check-completion-plan.mjs --packet T02-BR01` — **PASS**, plan consistency only.
- Read-only inspection of the exact packet record, listed source/contract inputs, coordinator addenda, pinned Babylon/Havok package declarations and implementations, accepted D01 runtime report, and raw six-row artifact — **completed**.
- Local application install, typecheck, lint, test, build, browser, physics, server, and deployment checks — **NOT RUN**.
- Impulse application and probe result — **NOT RUN**; no simulation was started.
