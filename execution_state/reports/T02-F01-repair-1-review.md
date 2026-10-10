# T02-F01 repair 1 independent review

Verdict: CHANGES_REQUIRED

Source review only. No local application tests, builds, typechecks, lint, formatter, browser, server or physics commands ran. Hosted exact-head checks remain pending. Only this report was written.

## Inspected scope

I read the original packet, implementation/review reports, repair packet and repair implementation report; inspected current `games/counterball/src/simulation/facts.ts` and `facts.test.ts`; and compared geometry/fact requirements with CONTRACTS and GAMEPLAY. Read-only inspection commands exited 0. Although the repair packet names another reviewer, the coordinator explicitly assigned this re-review to `/root/swarm_review`; I did not author the repair.

## Remaining defect: left-first isolation rejects an ordinary established crossing before reaching its bracket

Path: `games/counterball/src/simulation/facts.ts:570–592`, with the bound at `:494–506`.

The new search safely refuses unproved intervals, but its left-first stopping rule can exhaust depth on the clear interval immediately before a root and throw before visiting the interval containing a straightforward descending bracket. This prevents the required earliest-crossing behavior for an ordinary valid interpolated path, even when the crossing is analytically established. It is a failure to derive a fact, not an unsafe fabricated success.

Concrete source/control-flow reproduction using default geometry:

1. Establish the flat button wholly inside at x=5.8, y=0.0225, z=0.
2. Reach x=6.12 with identity rotation, inserting small intermediate observations as needed.
3. Observe x=6.14 while yaw rotates 10° around the vertical y axis. Use normalized endpoints `{x:0,y:0,z:0,w:1}` and `{x:0,y:sin(5°),z:0,w:cos(5°)}`. Other bodies are unchanged; observation times increase and rule steps do not decrease.

Yaw leaves the cylinder's vertical axis and right-boundary support unchanged. Its trailing clearance is exactly `f(t)=0.01-0.02*t` up to arithmetic rounding, with a descending root at t≈0.5. However, `supportClearanceLipschitz` adds the circumradius times angular travel: L≈0.043, greater than the actual slope magnitude 0.02. The left half's ending clearance is zero (or a tiny positive floating-point residual). Every nested left interval that ends at that root has negative computed Lipschitz lower bound and no negative sampled clearance. At depth 22, neither sign-bracket branch at lines 577–582 qualifies, so line 583 throws. The enclosing call never searches the right half, where the descending sign bracket exists. If rounding creates an unresolved earlier interval rather than an exact zero endpoint, the same depth failure remains possible.

This motion uses only 0.02 centre travel and 10° yaw; centre plus rotational sweep is about 0.043 game units, below a possible translation budget under the default minimum thickness 0.045. It is not inherently an excessive-substep case. The collector should be able to resolve this simple finite path without aborting the whole shot.

Required bounded repair: handle certified boundary/root neighborhoods without treating the preceding clear interval as an unrelated unresolved failure, and/or derive sufficiently tight directional support bounds for invariant cylinder rotations. Preserve the guarantee that an actually unresolved earlier exit cannot be silently skipped. Add a regression for the vertical-yaw crossing above, asserting one earliest right-side out fact and no throw. Also retain the equal-sign 85°→95°, multiple-root, tangency and exact-tie cases. Do not simply disable the uncertainty check or replace it with endpoint-only bisection.

This reproduction was not executed locally. Its branch behavior follows from the inspected equations; hosted execution must confirm the exact finite-precision result and all existing/new regressions.

## Repairs that address the original findings

- The stale centre-only goal boolean is removed. `GoalPassageState` starts at leading-support contact; `facts.ts:937–983` carries the proof through all supplied passage intervals until trailing clearance. A retreat resets the attempt. The new sideways/upward regressions at `facts.test.ts:421–465` retain separate-substep drift, while the centered multi-substep case remains at `:398–419`.
- `provesGoalPassageClear` (`facts.ts:637–697`) requires strict post and crossbar clearance over the whole interpolated passage. It uses midpoint clearance minus a Lipschitz half-interval bound; sampled obstruction, nonfinite values and unresolved depth-12 intervals return false. Floor contact is permitted inclusively. This closes the unsafe stale-goal mechanism in source, subject to hosted verification.
- `quaternionAngularTravelBound` (`:475–487`) is conservative for shortest-arc slerp. For the normalized-lerp branch, physical angular speed is bounded by `4*tan(arc/4)`; using the larger of that and the slerp arc is sound. Multiplying by collider circumradius bounds support-point motion. These bounds can be loose: a floor-level button yawing about y has invariant vertical support but receives a positive vertical Lipschitz estimate, so a clear rotating passage may fail the inclusive floor proof and classify as out. This is an explicit conservative limitation rather than a false goal; consider a tighter directional invariant bound in the bounded repair.
- The new root search no longer silently ignores all equal-sign endpoints. Its lower-bound pruning is conservative and its work/depth limits explicitly fail closed. The unresolved-root handling described above still needs repair before this producer is reliable for routine valid motion.

## Preserved behavior and limits

The frozen engine-free API, canonical ID normalization, input cloning, finite output/fact cap, contact-before-crossing attribution ordering, boundary ties and referee separation remain in source. Linear position/shortest-arc pose interpolation remains explicitly distinct from continuous real Havok travel. Tests add equal-sign rotational and multiple-root cases at `facts.test.ts:508–601`; their execution has not been verified here.

No source/status/config was edited. No test result is claimed. After the bounded repair, independently review source and run the required exact-head GitHub checks with full logs/counts: `pnpm --filter @korre/counterball test && pnpm --filter @korre/counterball typecheck && pnpm verify`. Parent T02 remains unfinished.
