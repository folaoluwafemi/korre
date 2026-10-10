# T02-C0 formatting repair 1

## Triggering evidence

GitHub Actions run #9 (`38039744998`) on commit `8140f6700a0954fe576f5f3fe17687e850f0ec59` passed all workspace and root TypeScript checks. The hosted Prettier step then named exactly these two files and stopped before unit tests/build:

- `games/counterball/src/features/restarts/domain/placementPose.ts`
- `games/counterball/src/features/restarts/domain/placementPose.test.ts`

## Exact coordinator write paths

Coordinator `/root` may edit only the two files above for implementation. This packet and `execution_state/reports/T02-C0-format-repair-1-implementation.md` are coordinator-owned execution records. Independent reviewer `/root/swarm_review` may write only `execution_state/reports/T02-C0-format-repair-1-review.md`.

Only apply pinned Prettier formatting. Do not change formulas, validation, tests, behavior, configuration, or any other source path. Do not run a local build, test, typecheck, lint, or server. The only authorized local command is:

`pnpm.cmd exec prettier --write games/counterball/src/features/restarts/domain/placementPose.ts games/counterball/src/features/restarts/domain/placementPose.test.ts`

## Review and acceptance

The reviewer checks the two-file diff against T02-C0, confirms every change is formatting-only, and writes its report only. After a PASS, the coordinator commits and pushes this bounded repair. Hosted GitHub verification, integration, and one-worker Chromium E2E must pass before C0 is accepted. The failed hosted run did not execute tests, builds, integration, or E2E.
