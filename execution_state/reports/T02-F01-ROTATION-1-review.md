# T02-F01-ROTATION-1 independent review

SOURCE verdict: PASS

This verdict covers the bounded rotational-support source repair and regression source. Exact-head GitHub tests, typecheck, lint, formatting and builds remain pending. It does not accept F01, parent T02, calibration, real Havok motion or deployment.

## Scope and method

I read the packet, accepted math design/report-only review, implementation report, exact two-file working-tree diff and current relevant helper/call-site/test regions. Read-only inspection commands exited 0. No application modules were executed and no local application command, test, build, typecheck, lint, formatter, browser, physics or service ran. Only this report was written.

The source diff is confined to the assigned `games/counterball/src/simulation/facts.ts` and `facts.test.ts`. Production geometry, calibration, seven-cap rule, referee/restart behavior and protocol types are unchanged. The packet's reference to `deriveCounterballFacts` is a naming typo: the canonical existing export is `deriveSimulationFacts`, which the implementation preserves. No competing export was introduced.

## Rotation and conservative bound

- `facts.ts:422–476` factors sign selection into `shortestArcEndpoints` without changing the negative-dot flip, exact `cosine > 0.9995` NLERP threshold, SLERP weights or final quaternion normalization. The bound and interpolator use that same selection.
- `facts.ts:493–589` forms `end * conjugate(start)` in Hamilton convention. For normalized endpoints this is the world relative rotation. Its normalized vector gives world axis u; the initial symmetry axis is normalized `R(start)e_y`. The cross product yields `s=|u cross v0|`, matching the accepted small-circle derivation. Endpoint-axis geodesic separation is no longer used as path length.
- The actual selected SLERP branch uses `theta*s`; NLERP uses `4*tan(theta/4)*s`. Taking the maximum of dot-based and relative-quaternion angle estimates avoids losing a tiny represented rotation when the dot rounds to one. Equal selected endpoints return zero. Near-degenerate relative axes use the full angular-speed bound rather than estimating an uncertain small-circle radius.
- The implementation adds finite outward allowances before the monotone angle/rate calculation, inflates the normalized-axis sine by an allowance scaled with relative-vector length, caps sine at its mathematical maximum one, and adds an outward final travel allowance. It rejects nonfinite or invalid intermediates. These are engineering floating-point allowances, not a formal interval-arithmetic proof for every JavaScript platform; the accepted report expressly required conservative handling/fallback, which is present in source. Hosted adversarial coverage is still necessary.
- `facts.ts:592–623` multiplies the angular bound by `hypot(radius,height/2)` and adds absolute centre-coordinate travel. This is the accepted finite-cylinder Hausdorff/support bound, including parallel/perpendicular support and nonsmooth cases. Finite final arithmetic is required and outward allowance is added for nonzero bounds.

## Call sites and failure behavior

The edge/trailing root path at `facts.ts:835` and leading/trailing goal-passage search at `:1041` use `supportClearanceLipschitz`; the goal-aperture horizontal and vertical proofs at `:766–779` use the same angular helper and clearance-bound calculation. There is no retained private endpoint-angle bound at these call sites.

Left-first root search, maximum depth 22, 65,536-node cap, refinement and explicit unresolved-interval errors remain unchanged. Goal proof retains strict post/crossbar clearance, inclusive floor contact and depth-12 conservative failure. No uncertain interval is intentionally turned into a clear certificate. The repair makes invariant yaw bounds far tighter, but numerical margins and conservative bounds can still cause a near-tangent/unresolved passage to reject or classify as out. This limitation is permitted by the packet's fail-closed rule; source review does not prove every ordinary motion fits these budgets.

Full-shot contact collection, same-step contact-before-crossing attribution, earliest entity latch, exact boundary ties, canonical/finite fact cap and input cloning remain intact. The observation read at `facts.ts:217–223` now narrows the validated array to `readonly unknown[]` before indexing; the prior unsafe `any` assignment is removed without suppression or weakened validation. Actual ESLint success is NOT RUN here.

## Regression assessment

The added pi/4 test explicitly distinguishes small-circle path from endpoint angle. The `.02`-thickness hidden-crossing fixture preserves the accepted axis/frame construction, positive endpoints/midpoint and negative clearance at epsilon=.0005. Its initial translation is divided into small observations and the sideways button is lifted above the surface. The expected first root is independently bisected on `[0,epsilon]`; the actual fact must be the single step-2 right/out crossing, occur before epsilon, and match that root to eight decimal places. This meaningfully checks the formerly false-pruned early exit rather than accepting a later crossing. The test-only dimensions do not modify production defaults.

Threshold-side cases use .9995001/.9994999 and verify which branch the constructed endpoint dot selects. Their analytic support samples use the branch-specific parameterization, and the actual producer must emit the hidden first exit. These samples support the source test design; they are not a standalone proof of the internal bound or executed evidence.

q/-q equivalence, tiny rotation, exact pi tie, parallel/perpendicular normal and equal radial/axial support cases are present. The prior yaw x=5.8→6.12→6.14 case, 85°→95° equal-sign exit, multiple roots, centered multi-substep goal, sideways/upward drift, tangency, deterministic ties, contact ordering, immutability and bounded output remain in the current test file; the diff does not weaken or remove their assertions.

## Required next evidence

No source blocker was found for this packet. Run the exact reviewed commit on GitHub with `pnpm --filter @korre/counterball test && pnpm --filter @korre/counterball typecheck && pnpm verify`, preserving complete logs, collected/passed/skipped counts and artifacts. In particular, a thrown unresolved-search error in any required success regression remains a failure, not an acceptable skip. Any hosted failure follows this packet's stop/escalation rule. No runtime PASS or task/status transition is claimed by this review.
