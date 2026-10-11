# T02-BR01 attempt 5 independent source review

Date: 2026-10-11

## Verdict

- SOURCE: PASS for the attempt-5 changes and the bounded T02-BR01 source criteria reviewed here.
- RUNTIME: NOT RUN. This review does not establish compilation or browser execution.

I extracted T02-BR01 with `node scripts/check-completion-plan.mjs --packet T02-BR01`. The packet requires a bounded diagnostic using the canonical browser Havok/worldFactory route, one accepted D01 candidate, frozen C00 limits, typed observations/errors, and cleanup; it forbids a production power mapping or playable route. I read the attempt-5 implementation report, accepted attempt-4 source review, and the two probe files in scope.

## Findings

The attempt-5 error aggregation removes the unsafe cast reported by the previous hosted check. At `browserDirectProbe.ts:616-627`, the function creates an `AggregateError` containing the original failure and cleanup failures, then attaches the original typed simulation code with `Object.assign`. The resulting intersection is structurally compatible with `SimulationError`; no cast is needed. The existing test at `browserDirectProbe.test.ts:284-305` confirms the selected `resourceLimit` code survives cleanup aggregation. The original error remains part of the aggregate's `errors` list.

At `browserDirectProbe.ts:758-772`, all four optional native mass properties (`centerOfMass`, `inertia`, `inertiaOrientation`, and `mass`) are checked for absence before use. The `fail` helper returns `never`, so the subsequent local bindings are narrowed to present values. Missing properties fail closed as `resourceLimit`; the existing finite, positive, configured-mass, inertia, and normalized-orientation checks then validate the values. This addresses the TS18048, TS2345, and TS2322 diagnostics reported by run 38112815977 at the dereferences and assignments in this block. The source change is a plausible static fix; without a typecheck I cannot report that CI now passes.

The six-field guard assembly, 34-unit shifted-energy ceiling and permitted-drop invariant, D01-guarded single impulse, swept support checks, fixed substep/workload limits, and cleanup behavior reviewed in attempt 4 remain present. The attempt-5 diff around those areas is formatting reflow, plus the two described error-handling fixes; I found no changed guard value or alternate authority in these probe files.

## Limits

No app typecheck, lint, test, build, browser automation, Havok simulation, deployment, or runtime artifact review was run. Hosted verification on a new exact head remains necessary. This review does not claim a browser flick, calibrated physics, deployed Havok, continuous traversal, playability, or T02 acceptance.
