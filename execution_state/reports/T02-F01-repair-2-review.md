# T02-F01 repair 2 independent review

**Verdict: CHANGES_REQUIRED.** The named yaw regression is fixed, and the source retains fail-closed search structure, but the new angular travel bound is not conservative for general shortest-arc quaternion motion. Hosted exact-SHA verification remains pending. This was the final allowed repair attempt in this F01 repair cycle.

## Scope and evidence

I inspected the exact T02-F01 catalogue record, both repair packets and implementation reports, the two original F01 review reports, the current `facts.ts` and `facts.test.ts`, and the relevant contracts, decisions, task card, swarm repair limit, and continuation notes. `node scripts/check-completion-plan.mjs --packet T02-F01` exited 0 and returned the ready packet record; that is plan consistency only. No application test, typecheck, build, lint, formatter, browser, server, or physics command ran.

## Blocking finding: endpoint axis angle is not an upper bound on axis travel

In `games/counterball/src/simulation/facts.ts:482-501`, `cylinderAxisAngularTravelBound` measures `axisArc = acos(dot(axisA, axisB))`, then multiplies that endpoint angle by `max(1, 4*tan(quaternionArc/4)/quaternionArc)`. The function comment says the cylinder axis follows a spherical arc whose length is the endpoint angle. That is only true when the rotated cylinder axis traces a great circle. Under a general fixed-axis shortest-arc quaternion SLERP, it traces a small circle; its path length can exceed the endpoint geodesic angle.

Let the physical quaternion rotation angle be `theta`, and let the rotation axis make angle `beta` with the button's vertical symmetry axis. During SLERP, that symmetry axis travels at angular speed `theta * sin(beta)`. Its endpoint separation is `alpha = 2 * asin(sin(theta/2) * sin(beta))`. As `beta` approaches zero, the ratio of actual path length to `alpha` approaches `theta / (2 * sin(theta/2))`. At the contract's allowed per-substep maximum `theta = pi/4`, that factor is about `1.02617`; the implemented multiplier `4*tan(theta/4)/theta` is only about `1.01305`. So even a valid 45-degree SLERP interval can have more axis travel than the bound reports. The normalized-lerp speed multiplier does not repair this path-versus-endpoint gap; its near-identical-rotation branch has the same issue at a smaller scale.

This matters because `supportClearanceLipschitz` uses this value to certify lower clearance in both `findDescendingRoot` (`facts.ts:508-520, 541-610`) and `provesGoalPassageClear` (`facts.ts:657-712`). An understated bound can make a genuinely unresolved subinterval appear clear, so the otherwise left-first search may prune a hidden whole-button exit or certify a goal aperture passage incorrectly. The depth-22/node-65,536 limits and explicit throw for unresolved regions are good, but they only fail closed when the Lipschitz bound is valid.

A future bounded fix must bound the maximum parameterized travel of the symmetry axis along the actual SLERP/NLERP curve, or reject intervals it cannot certify. Add a regression with a tilted rotation axis (small-circle axis path) and a clearance near the boundary; retain the exact yaw, equal-sign/multiple-root, and aperture tests. Do not accept this source by relying on the existing vertical-yaw regression, because that case has zero symmetry-axis travel by construction.

## Other reviewed behavior

- The required x=5.8 → 6.12 → 6.14, 10-degree vertical-yaw regression is present in `facts.test.ts:562-591`. With the flat button's horizontal support unchanged by yaw, its expected single step-2 crossing at the half-interval is consistent with the fixture.
- The prior 85°→95° positive-endpoint/negative-midpoint regression and 80°→100° multiple-root earliest-crossing case remain (`facts.test.ts:518-560, 593-642`). Goal tangency, sideways/upward passage drift, and centered passage cases remain as well.
- Root isolation remains bounded, left-first, and throws if it cannot prove or bracket an earlier interval. The issue above undermines its certificate; I found no new endpoint-only fallback or silent skip.
- `supportExtent` uses the oriented finite-cylinder support expression, so the geometry remains whole-button rather than center-only. Inputs are normalized into new maps/objects, canonical entity IDs are checked, contacts and crossings are deterministically sorted, same-step contacts precede crossings, finite protocol output is checked, and the protocol fact-count limit is enforced. The tests still cover immutability, exact ties, attribution order, invalid histories, and bounded output.
- Scope remains the assigned facts producer and its tests; no referee or presentation behavior was added.

## Stop and next action

No source change was made. Because repair attempt 2 exhausted the packet's repair allowance, stop this repair cycle and keep T02-F01 in CHANGES_REQUIRED. The coordinator should record the bound defect and, if continuing, issue a separately bounded math-design escalation for a proved axis-path bound and targeted regression. Do not claim hosted or physical verification: the exact reviewed-SHA GitHub command and results are still pending.
