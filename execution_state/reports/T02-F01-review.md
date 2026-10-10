# T02-F01 independent source review

Verdict: CHANGES_REQUIRED

This is source/control-flow review only. No local application tests, builds, typechecks, lint, formatter, install, server or physics execution ran. Hosted checks remain pending. This report does not accept T02 or certify real Havok behavior.

## Inputs inspected

I read `execution_state/packets/T02-F01-facts.md`, `execution_state/reports/T02-F01-implementation.md`, the actual `facts.ts` and `facts.test.ts`, and the relevant canonical CONTRACTS/GAMEPLAY sections. Read-only file inspection commands exited 0. The reproductions below are derived from the source equations and branches; they were not executed as tests.

## 1. Earlier goal-mouth latch can award a goal after the button leaves the opening

Priority: high. Paths: `games/counterball/src/simulation/facts.ts:744–756`, `:565–586`.

The collector records `fitsGoalMouth` only when the centre crosses an end plane. `crossingForInterval` later sets `kind = "goal"` solely from that cached boolean. It computes the trailing-support crossing pose but never checks its mouth clearance, nor the intervening passage.

Concrete source reproduction with default geometry, a flat button, y=0.0225, all other canonical bodies unchanged and no contacts:

1. Initial button centre: x=1.0, z=9.8.
2. Centre beyond the away end: x=1.0, z=10.05.
3. Later centre: x=1.05, z=10.2.

Supply increasing observation times and nondecreasing rule steps. Insert enough intermediate collinear observations to keep each physical displacement within a configured substep bound; the result is unchanged. The centre-plane event has x=1.0 and horizontal support 0.13, so the cached check is true: 1.13 < the inner-post coordinate 1.14. At the trailing-support event z=10.13, interpolation through the later interval gives x=1.026666…, so the complete button reaches x=1.156666… > 1.14. Lines 581–586 nevertheless classify the event as a goal. An upward drift across the crossbar produces the same stale-latch problem.

This violates GAMEPLAY:174–180 (oriented whole-button clearance, tangency is not clear, outside/high passages are out), CONTRACTS:226, and the packet requirement to check the complete oriented button against both posts and crossbar. Keeping a centre-pass decision across substeps is useful, but a previously clear centre pose cannot authorize a later nonclear whole passage.

Required repair: preserve the multi-substep passage state while validating the actual whole passage, including the final full-crossing pose and any relevant intervening orientation/position extrema. A tangent or outside/high passage must remain out. If the supplied history cannot establish the required clearance, fail explicitly instead of emitting a goal. Add sideways and upward drift regressions spanning separate substeps, retaining the existing centered multi-substep goal test.

## 2. Endpoint sign gating misses a rotational whole-body exit and return

Priority: high. Paths: `games/counterball/src/simulation/facts.ts:475–497`, `:565–574`.

`findDescendingRoot` immediately returns undefined whenever the ending clearance is nonnegative. With changing orientation, cylinder support is nonlinear under quaternion slerp. Equal-sign endpoints do not establish that the entire interpolated interval stayed inside. Even an angular substep guard does not make that support function monotone.

Concrete source reproduction at the right plane x=6, with default button radius R=0.13 and half-height h=0.0225:

- First establish a wholly-inside observation (for example x=5.8).
- Move to a partially crossed centre x=6.03 with rotation 85° around z; the path can be split into small physical substeps.
- Keep the centre x=6.03 and rotate from 85° to 95° in one observed interval, using normalized quaternions `{x:0,y:0,z:sin(theta/2),w:cos(theta/2)}`. All other bodies remain unchanged.

The implementation's x support is `R*abs(cos(theta)) + h*abs(sin(theta))`. At 85° and 95° it is approximately 0.033745, making trailing clearance `-0.03 + support` positive. At the interpolated midpoint, 90°, support is 0.0225 and trailing clearance is -0.0075: the whole button exits and returns during the supplied interpolated interval. Line 480 skips the interval because its end clearance is positive, so no crossing is emitted. The rotation is only 10° and its maximum rotational sweep is approximately 0.023 game units; this is compatible with a translation bound below the default smallest thickness 0.045. The omission is therefore not solved merely by the frozen 45° maximum angular guard.

This violates the packet's interpolated-orientation/whole-body swept crossing requirement and GAMEPLAY:172–175,184. The earliest full exit must latch even if a later interpolated pose returns inside.

Required repair: find the earliest descending crossing over the interpolated support function without assuming monotonicity from endpoint signs. Use a justified bounded root/extrema method, or explicitly reject an interval whose crossing cannot be established. Add the equal-sign rotational exit/return regression and cases with more than one root; preserve exact tangency and deterministic boundary ties.

## Other reviewed behavior

- The exported observation/contact/function API matches the packet and uses canonical protocol types. No Babylon, browser or referee imports occur.
- Input normalization clones finite poses/contact points, requires all 15 unique canonical IDs, normalized quaternions, initial step/time zero, increasing times and nondecreasing steps. It does not mutate caller data. Completeness of the supplied physical history remains a producer obligation; this pure function cannot prove that omitted observations never existed.
- Contact pair normalization and sorting preserve canonical IDs and deterministic point tie-breaks. Same-rule-step contacts precede crossings for attribution, consistent with CONTRACTS:139; supplied contact time is preserved. This order does not claim substep contact chronology.
- Support formulas use cylinder dimensions and orientation. Linear centre interpolation and shortest-arc quaternion slerp are explicit. Crossing points/times use those physical observations, not playback frames. Finite output and the 8,192-fact limit fail closed instead of returning partial results.
- The current tests cover fixed-orientation exits, constant-mouth centered goal latching, static post/crossbar tangency, exact corner ties, normalization, ordering and immutability. They do not cover either counterexample above. Inspection does not establish that these tests pass.
- Geometry emits facts only; scoring, fouls, restarts and role decisions remain outside this module. The earliest entity crossing is latched while full-shot contacts continue to be collected, which preserves the intended separation.

## Verification required after repair

Independently review the repaired two-file source and added regressions, then run the packet's checks on GitHub: `pnpm --filter @korre/counterball test && pnpm --filter @korre/counterball typecheck && pnpm verify`. Preserve the exact SHA, complete logs, collected/passed/skipped counts and artifacts. No runtime PASS or parent acceptance is claimed here. Only this assigned review report was written.
