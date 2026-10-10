# T02-B2 hosted formatting repair 1

## Objective and trigger

Repair the single Prettier finding from hosted GitHub Actions run `38042116007` on commit `7779b2e742f96025d8ac975c999d1a1b01713d82`. Run #17 passed workspace typecheck and ESLint, then Prettier reported only `games/counterball/src/simulation/intendedShotProbe.test.ts`. Unit tests, build, probe execution, integration and E2E did not run.

## Exact ownership

Coordinator may edit only:

- `games/counterball/src/simulation/intendedShotProbe.test.ts`
- `execution_state/reports/T02-B2-format-repair-1-implementation.md`

Independent reviewer `/root/foundation_review` may write only:

- `execution_state/reports/T02-B2-format-repair-1-review.md`

No other source, workflow, contract, config, fixture, test, package manifest, task, or ledger path is part of the formatter edit. Coordinator task/ownership records may be updated separately after the result is observed.

## Required action

Run exactly this one lightweight local command from the repository root:

`pnpm.cmd exec prettier --write games/counterball/src/simulation/intendedShotProbe.test.ts`

Do not run a build, unit test, integration test, browser test, typecheck, lint, server, or a formatter over another path. After the formatter, inspect the exact one-file diff and run `git diff --check` only.

## Acceptance

1. The pinned formatter exits 0 on exactly the CI-reported source file.
2. The resulting diff is formatting-only; probe inputs, measurements, cleanup/error handling, assertions, and the null clearance-epsilon classification are unchanged.
3. `git diff --check` exits 0.
4. Save the command/result, exact changed paths, and checks not run in the implementation report.
5. Independent review passes the exact diff before push. Hosted full verification is still required afterward; no runtime or probe result is established by formatting.

## Failure handling

This is formatting repair attempt 1 for run #17. If the formatter or review fails, stop and report the exact output. Permit one focused second attempt only if the cause is clear; after two unsuccessful attempts, escalate per `knowledge_base/execution/SWARM.md`.
