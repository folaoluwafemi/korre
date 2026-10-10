# T02-F01 repair 1 — continuous whole-body crossing boundaries

Parent packet: `T02-F01`. Status: RUNNING repair 1 after independent review returned CHANGES_REQUIRED. Preserve every original T02-F01 dependency and acceptance requirement; this repair does not accept F01 or parent T02.

## Inputs and exact ownership

Read the original F01 packet and implementation report, the full first review `execution_state/reports/T02-F01-review.md`, `knowledge_base/execution/CONTRACTS.md`, and `knowledge_base/execution/GAMEPLAY.md`.

Author `/root/toolchain_audit` may write only:

- `games/counterball/src/simulation/facts.ts`
- `games/counterball/src/simulation/facts.test.ts`
- `execution_state/reports/T02-F01-repair-1-implementation.md`

After the author stops, `/root/foundation_review` independently reviews current source and may write only `execution_state/reports/T02-F01-repair-1-review.md`.

No shared contracts/config/status, package, workflow, scene/runtime, or other source edits. All app checks run on GitHub. Do not accept a Node-only, mocked, endpoint-only, or partial-data substitute.

## Required repairs

1. **Revalidate the full goal passage.** Do not let a clear center-plane snapshot alone authorize a goal that is no longer inside the opening when the trailing support clears or during the intervening passage. Check the full oriented button against both posts and crossbar throughout the relevant interpolated passage. Preserve the centered multi-substep goal case. Add separate-substep sideways and upward/crossbar drift regressions; tangency and any unestablished clearance must fail closed as `out` or explicit invalid input, never as goal.
2. **Find the earliest whole-body exit without endpoint monotonicity.** The right-side support clearance can be positive at both endpoints and negative inside when orientation changes. Reproduce the reviewed path: first wholly inside near x=5.8, then center x=6.03 with z rotation 85°, followed by an interval at the same center rotating to 95°. The interpolated 90° pose is outside although both interval endpoints are inside. Detect and latch the earliest descending whole-body crossing. Add this equal-sign regression and a case with more than one root. Use a justified bounded root/extrema method over shortest-arc slerp or reject intervals whose crossing cannot be established; never silently omit the crossing.
3. Preserve deterministic exact-tie ordering, contact attribution order, finite/bounded canonical facts, input immutability, all existing geometry cases, and the explicit limit that interpolation cannot prove collision-free travel between observations.

## Required checks and stop rule

The implementation report records source evidence and confirms no local app commands ran. After independent source review, run the original F01 GitHub command on the exact reviewed commit:

`pnpm --filter @korre/counterball test && pnpm --filter @korre/counterball typecheck && pnpm verify`

Capture exact SHA/run, full logs, collected/passed/skipped counts and artifacts. Follow `knowledge_base/execution/SWARM.md`: at most two focused repairs for the same failure. Never weaken or skip the new geometry cases. After two unsuccessful repairs, stop code changes and report the exact failure, evidence, and smallest escalation to the coordinator.
