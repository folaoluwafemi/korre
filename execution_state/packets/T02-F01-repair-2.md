# T02-F01 repair 2 — resolve certified boundary neighborhoods

Parent: `T02-F01`. This is repair attempt 2 and the final allowed focused repair for the current F01 review cycle. Preserve every original F01 dependency and acceptance condition. Do not accept F01 or T02 from this source repair.

## Inputs and exact ownership

Read `execution_state/packets/T02-F01-facts.md`, `execution_state/packets/T02-F01-repair-1.md`, `execution_state/reports/T02-F01-repair-1-implementation.md`, the full independent finding `execution_state/reports/T02-F01-repair-1-review.md`, `knowledge_base/execution/CONTRACTS.md`, and `knowledge_base/execution/GAMEPLAY.md`.

`/root/toolchain_audit` may write only:

- `games/counterball/src/simulation/facts.ts`
- `games/counterball/src/simulation/facts.test.ts`
- `execution_state/reports/T02-F01-repair-2-implementation.md`

After implementation is saved and the author stops, `/root/foundation_review` independently reviews current source and may write only `execution_state/reports/T02-F01-repair-2-review.md`.

No package, workflow, shared contract, config, scene, status or unrelated source edits. No local application tests/builds/typechecks/lint/browser/physics commands. All app checks run on GitHub.

## Required reproducer and repair

The prior reviewer found that the conservative left-first search can exhaust depth on a clear interval ending at an ordinary root, then throw before visiting the adjacent interval with a valid descending sign bracket. Reproduce this source path with default geometry:

1. Start the flat button wholly inside at `(x=5.8, y=0.0225, z=0)` with identity rotation.
2. Observe `(6.12, 0.0225, 0)` with identity rotation one fixed step later.
3. Observe `(6.14, 0.0225, 0)` with a 10-degree yaw around the vertical y axis at the next fixed step. Use endpoint quaternion `{x:0,y:sin(5°),z:0,w:cos(5°)}`. Keep other bodies unchanged.

The right trailing-support clearance in the final interval is `0.01 - 0.02*t` up to floating-point rounding. The circular cylinder's horizontal support is invariant under this y-axis yaw. There is one descending right-boundary exit at local fraction about 0.5; a conservative global angular bound currently makes the immediately preceding interval unresolved at depth 22 and throws before searching the later sign bracket.

Add a named regression that calls `deriveSimulationFacts` on this path without throwing and asserts exactly one button/right/out crossing, on the second interval, at the earliest root within a justified numeric tolerance. Also preserve the existing equal-sign 85°→95° regression, two-root earliest-crossing case, tangency tests, deterministic ties, sideways/upward goal-drift cases, immutability, contact order and bounded output shape.

Repair the root-search stopping behavior with a justified directional support bound or certified boundary-root neighborhood. Keep the bounded work/depth limits and fail safely when an earlier crossing truly cannot be established. Do not disable uncertainty checks, silently skip an unresolved interval, or replace the algorithm with endpoint-only bisection.

## Required evidence and final stop rule

The implementation report must describe the exact change and confirm no local app command ran. Independent source review is required before hosted execution. Then run this original F01 command on the exact reviewed SHA:

`pnpm --filter @korre/counterball test && pnpm --filter @korre/counterball typecheck && pnpm verify`

Capture exact SHA/run, full logs, collected/passed/skipped counts and actual artifacts. Never weaken or skip the new regression. This is the second and final focused repair attempt under `knowledge_base/execution/SWARM.md`; if review or hosted verification still fails, stop code changes and report the exact evidence plus the smallest coordinator escalation. Parent T02 remains RUNNING until every parent acceptance gate passes.
