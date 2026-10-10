# T02-B1 formatting repair 1

## Trigger

GitHub Actions run #7 passed all package/root TypeScript checks, then root Prettier reported only `games/counterball/src/simulation/calibrationProbe.test.ts`. The upload step ran with `if: always()` and `if-no-files-found: ignore`; since `pnpm verify` stopped before tests, no calibration artifact was produced.

## Exact path and operation

Coordinator write path:

- `games/counterball/src/simulation/calibrationProbe.test.ts`

Run Prettier on that one file only. Preserve artifact writer behavior, probe tests, all 480 trials, and physics semantics. Do not edit other source, workflow, or `.gitignore` paths in this packet.

Implementation report:

- `execution_state/reports/T02-B1-format-repair-1-implementation.md`

Independent reviewer: `/root/foundation_review`, report-only path:

- `execution_state/reports/T02-B1-format-repair-1-review.md`

Reviewer confirms the diff since run #7 is formatting-only and retains the exact env-gated artifact logic.

## Environment and acceptance

The sole local operation is the short Prettier formatting command on the listed file; no local build, test, lint, typecheck, or server command. Independent review and hosted verification are required. A hosted run must pass and publish the artifact before any measurements are claimed.
