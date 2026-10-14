# T02-L01-NATIVE-RADIUS-1 implementation report

## Result

Implemented the exact native Y-cylinder COM-radius correction and bounded failure disclosure in the packet's three source paths. The saved pre-dispatch extraction reports `ready:true`; the current packet checker reports plan consistency `PASS` and `ready:false` because this packet is already `RUNNING`. The packet review and independent radius proposal review are both recorded as `PASS`; inherited T01 is accepted. No task/status, catalogue, contract, workflow, or other source paths were changed.

## Changes

- Added internal pure helper `nativeCylinderComRadius` in `games/counterball/src/simulation/nativeCylinderRadius.ts`. It validates finite bounds/dimensions/COM, strictly positive and consistent spans, and finite intermediate/result values. It computes `hypot(r + hypot(COMx−midX, COMz−midZ), halfY + abs(COMy−midY))`, with `r=max(spanX,spanZ)/2`, and throws on malformed or overflowing input.
- Updated `loftCoarseRunner.ts` to pass its existing validated `nativeBounds` into `radiiFromBounds`; no second native bounds read is made. Only `farthestPointRadius` now uses the exact cylinder helper, with helper rejection normalized by the existing `resourceGuard` to `resourceLimit` before any impulse or physics step. The existing eight-corner `farthestOriginRadius`, native shape/type/trigger/parent/scale/dimension/property checks, and downstream support/obstacle use remain in place. Removed the now-unused AABB-corner `distance` helper.
- Materialized the 15 planner inputs once with body IDs and passed that same array, the same `fixedStepSeconds`, and the same `sweepGuard` to `deriveDiagnosticSweepPlan`. If it throws, the typed `resourceLimit` message now includes those exact planner inputs, tick duration, guard, and the underlying error message; the original error remains attached as cause. This is still before impulse and physics stepping, and does not copy or alter planner equations.
- Added pure tests for the centered cylinder bound excluding square corners, translated bounds with diagonal COM offset, vertical COM offset, sampled endcap rim containment, and fail-closed non-finite/reversed/zero/inconsistent/overflowing inputs.

## Evidence and limits

The assigned scoped `git diff --check -- games/counterball/src/simulation/loftCoarseRunner.ts games/counterball/src/simulation/nativeCylinderRadius.ts games/counterball/src/simulation/nativeCylinderRadius.test.ts` exited 0. Source SHA-256 values:

- `games/counterball/src/simulation/loftCoarseRunner.ts`: `bef9c512e59c6e78a17e3f3a2b592b5f96d7b421cb1add98d9a1e27c30327b83`
- `games/counterball/src/simulation/nativeCylinderRadius.ts`: `0035d1b642de11b53faa82a6a94433e83e4d790f0bb49d1f9f380c3e5ed8df41`
- `games/counterball/src/simulation/nativeCylinderRadius.test.ts`: `d7a9440918f5ab6d1bb3a1f0602e4086b14146eab5ea7342da02f3b9468d745e`

No application test, typecheck, lint, build, browser, or physics command ran locally. The new pure tests and full 24-case real-Chromium/Havok matrix remain unrun; source review and the exact-SHA GitHub gates are pending. Run 38628031652's generic error does not prove the radius was the only cause. No guard threshold, energy, workload/artifact cap, config/hash, shape, force, solver, or rest semantics changed, and no matrix acceptance is claimed.
