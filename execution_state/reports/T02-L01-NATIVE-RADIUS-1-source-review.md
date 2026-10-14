# T02-L01-NATIVE-RADIUS-1 source review

**Source verdict: PASS. Runtime: NOT RUN.** The exact source changes implement the packet's conservative native-cylinder COM radius and preserve the existing guard boundary. This review does not establish that the prior hosted failure was caused only by the old radius, nor does it establish matrix or physics success.

## Scope and evidence

The packet extraction `node scripts/check-completion-plan.mjs --packet T02-L01-NATIVE-RADIUS-1` returned plan-consistency PASS for 119 packets with no plan errors. It showed the packet RUNNING (`ready:false` is expected after dispatch); the saved pre-dispatch extraction records `ready:true`. T01 remains ACCEPTED. The exact changed implementation paths are:

- `games/counterball/src/simulation/loftCoarseRunner.ts`
- `games/counterball/src/simulation/nativeCylinderRadius.ts`
- `games/counterball/src/simulation/nativeCylinderRadius.test.ts`

The assigned implementation report is `execution_state/reports/T02-L01-NATIVE-RADIUS-1-implementation.md`. The changed-file hashes recorded there match the current files: runner `bef9c512e59c6e78a17e3f3a2b592b5f96d7b421cb1add98d9a1e27c30327b83`, helper `0035d1b642de11b53faa82a6a94433e83e4d790f0bb49d1f9f380c3e5ed8df41`, and tests `d7a9440918f5ab6d1bb3a1f0602e4086b14146eab5ea7342da02f3b9468d745e`.

## Findings

`nativeCylinderComRadius` validates finite minimum/maximum/dimensions/COM, positive spans, exact span-to-dimension consistency, finite center/offset/intermediate values, and positive finite output. The existing runner has already checked the native shape is the supported dynamic Y-cylinder and validated its geometry, parent/scale, dimensions, and mass properties before calling it. The helper reuses the same `nativeBounds` object returned by the existing shape read; there is no second native bounds call.

For half-height `q`, horizontal cylinder radius `r=max(spanX,spanZ)/2`, AABB midpoint `b`, and COM `c`, the helper computes `hypot(r+hypot(c.x-b.x,c.z-b.z), q+abs(c.y-b.y))`. This is the maximum Euclidean distance from the COM to the validated circular cylinder: the radial and vertical extremes can be attained together, and the radial term uses the circle radius rather than an impossible AABB square corner. It therefore remains a conservative whole-shape rotational point bound for arbitrary finite COM offsets. Any malformed or overflowing input throws; the runner's existing `resourceGuard` maps that to typed `resourceLimit` before the impulse. The previous eight-corner origin radius remains intact and continues to serve apron/obstacle checks. No threshold, energy/drop equation, workload, geometry, material, or physics configuration changed.

The sweep planner receives the single `plannerBodies` array, fixed-step value, and guard object that are then reported in the catch path. Each planner body includes its canonical ID. The catch also includes the underlying message and passes the original thrown value as `resourceFailure` cause. This remains before impulse and stepping and does not duplicate the planner formula.

The pure tests cover the centered bound and exclusion of impossible square corners, translated bounds with simultaneous diagonal and vertical COM offsets, a separate vertical COM offset, endcap-rim containment samples, and rejection of NaN, infinity, reversed/zero/inconsistent spans, overflow, and a non-finite COM result. The existing probe still contains the `48`-calls-per-interval guard case. Test code and source formatting were inspected; no formatter or application command was run.

## Checks and limits

The exact packet extraction was the only command run for this review. No local application tests, typecheck, lint, build, browser, or physics checks ran. The implementation report records its own `git diff --check` exit 0; this reviewer did not rerun it. The 24-case real-Chromium/Havok matrix, exact-SHA CI, artifact validation, and independent runtime review remain required. A passing source review alone does not accept this packet or T02.
