# T02-BR01 diagnostic guard route analysis — independent review

Date: 2026-10-11

## Verdict

**CHANGES_REQUIRED.** The diagnostic-only scope, floor/apron geometry, native mass-property interpretation, swept-shape equations, and workload arithmetic are largely sound as conditional design. However, the proposed energy check does not enforce the energy quantity used to derive its speed bounds. Under the route's signed potential-energy formula, the hashed limit can permit more kinetic energy than 34; that changes the derived call count and apron reach beyond the frozen limits. Clarify and correct the checked energy invariant before implementation. The fallback cleanup path should also avoid releasing a replacement shape while the body may still reference it.

This review accepts no source or runtime behavior. It does not accept BR01, T02, a flick, traversal, or deployed Havok.

## Scope and inputs checked

The exact T02-BR01 record extraction is plan-consistent. It assigns only `browserDirectProbe.ts`, `browserDirectProbe.test.ts`, and `browser.ts` for writes, and requires the C00-frozen bounded fixed-step/yield/resource policy, the accepted D01 input, real browser Havok/WASM, and disposal in every outcome. The proposed diagnostic-owned surface replacement can stay within those paths; ordinary `worldFactory`, shared config and production geometry remain untouched.

I checked the route analysis against C00 in `knowledge_base/execution/CONTRACTS.md`, the GC01/GC02 diagnostic terms in `CONTRACT_WORK.md` and D39, the current hashed guard/config, the pinned Babylon/Havok API audits, the existing factory geometry, the accepted D01 exact-run report, and the earlier guard feasibility review. The plan checker result is document consistency only. No application build, test, browser, physics, or deployment check was run for this review.

## Confirmed design points

- The replacement support box dimensions follow the current centered slab and hashed 325-unit margin: 662 × 0.2 × 670, preserving its top plane, leaving the pitch markings/rule planes unchanged, and adding no walls. This is a diagnostic-local change and is consistent with the open-apron scope.
- For the configured cylinders, `rMax = |c| + sqrt(r² + (h/2)²)` is a conservative radius about the COM. Given a valid full-interval speed bound, `vBound + omegaBound × rMax` bounds point speed; the proposed pre-call whole-shape enclosure and orientation-dependent cylinder support equation are conservative. Subtracting the full point-sweep bound before checking the slab/support plane is appropriately fail-closed. This remains conditional on the energy/speed premise; it is not a pinned Havok continuous-path certificate.
- The native mass-property interpretation is correct for the pinned versions: the returned mass is the current body mass, while principal inertia is documented for unit mass and must be multiplied by mass for energy and angular-speed calculations. Rejecting invalid tuples and not using `computeMassProperties()`' synthetic fallback is appropriate. Shape filter getters read native filter info; a first material read obtains native material through the plugin. These API facts do not prove solver passivity.
- The stated workload arithmetic is exact: 1,800 nominal ticks × 48 calls = 86,400 calls; 120 actual calls per batch gives 720 batches. The route correctly treats 30 seconds as a fail-closed cap, not a predicted completion time, and keeps successful output unavailable after any guard, cancellation, budget, or cleanup failure.
- The D01 evidence is properly bounded to its accepted one-time center impulse and hosted NullEngine/WASM observations. It does not provide the proposed per-substep/browser guard proof. The route also avoids claiming production calibration or an unconditional mathematical certificate for Havok's internal trajectory.

## Blocking energy mismatch

The route derives `vBound = sqrt(2 × 34 / m)` and `omegaBound = sqrt(2 × 34 / Imin)`, then proposes to compute measured mechanical energy as kinetic energy plus *signed* gravitational potential relative to each fixture rest height, and fail only when that value exceeds 34. That check does not imply kinetic energy is at most 34 while a body is below its rest reference.

The configured total dynamic mass is 14.15. At the allowed 0.01125 drop, signed potential relative to those references can be `-14.15 × 9.81 × 0.01125 = -1.561629375`. A state with checked mechanical energy 34 can therefore have kinetic energy 35.561629375. This is a counterexample to the route's implication, not a claim that Havok actually produces that state.

Recomputing the button bounds at 35.561629375 gives `vBound ≈ 21.7751018`, `omegaBound ≈ 328.5054075`, point sweep per nominal tick `≈ 0.5426310`, and a translation requirement of **49** calls at the 0.01125 limit. The 15-second reach plus the button's farthest-point radius becomes approximately **326.75846**, exceeding the hashed 325-unit apron. The current 48-call and 325-apron values are therefore not sufficient under the route's stated signed-energy acceptance test.

The accepted GC01/GC02 arithmetic treats 34 as the maximum available kinetic-energy envelope: initial 32 plus at most 1.561629375 gravity work, rounded up. Make the measured quantity consistent with that envelope. One compatible definition is `Eshift = K + Σ[m_i × g × (y_i - (y_ref,i - 0.01125))]`, using each body's lowest permitted COM height, and fail if that shifted mechanical energy exceeds 34 while retaining the explicit per-body drop guard. It is 33.561629375 at the at-rest fixture and its potential term is nonnegative throughout the admitted domain, so it bounds kinetic energy by 34. Alternatively, retain signed potential at rest-reference zero but enforce an equivalent available-kinetic-energy invariant; merely checking signed mechanical energy ≤34 is not enough. Keep the test and exact energy reference explicit so an independent review can verify the same bound. Do not silently increase the substep/apron values: recomputing from the weaker signed-energy condition exceeds both frozen limits and requires coordinator disposition.

## Cleanup edge case

On the normal path, restoring the original slab shape before disposing the diagnostic replacement is sensible. On restoration failure, the route says to dispose the replacement anyway and only then dispose the world. The pinned Babylon `PhysicsBody.shape` setter updates its JS `_shape` before forwarding to the plugin, and `PhysicsShape.dispose()` releases the native shape immediately. If restoration throws or partially fails, the body may still reference the replacement. Use a failure branch that first disposes/releases the owning surface body/world, then releases the replacement; continue all cleanup attempts and aggregate errors. This follows the existing world cleanup order (bodies before shapes) and avoids assuming a failed detach succeeded.

## Remaining proof boundary

After those design corrections, the proposed real-Chromium hosted falsification checks are appropriate for BR01's diagnostic acceptance. They can reject observed bound violations and show this exact D01 path executes with pinned browser WASM; a successful run still cannot certify every continuous internal Havok trajectory or imply gameplay calibration. No runtime result, guard pass, continuous traversal, browser flick, playability, or deployment is established here.
