# T02-C2 format repair 1 — hosted Prettier finding

## Trigger and evidence

GitHub Actions run #11 (`38040386810`) on commit `d9881f3b2ff48e9bf016e7423348bfcee3595454` passed workspace/root typecheck and ESLint. Hosted Prettier then reported exactly `games/counterball/src/simulation/sampling.ts` and `games/counterball/src/simulation/sampling.test.ts`. Unit tests, build, integration, browser E2E, and the calibration probe did not run.

## Exact ownership

Coordinator `/root` may edit only:

- `games/counterball/src/simulation/sampling.ts` (pinned Prettier formatting only)
- `games/counterball/src/simulation/sampling.test.ts` (pinned Prettier formatting only)
- `execution_state/packets/T02-C2-format-repair-1.md`
- `execution_state/reports/T02-C2-format-repair-1-implementation.md`
- `execution_state/tasks.json`
- `execution_state/LEDGER.md`
- `execution_state/OWNERSHIP.md`

Independent reviewer `/root/swarm_review` may write only `execution_state/reports/T02-C2-format-repair-1-review.md` after the formatter completes. No overlapping writes are permitted.

## Bounded procedure

Run exactly this one formatting command on the two files named by run #11:

```powershell
pnpm.cmd exec prettier --write games/counterball/src/simulation/sampling.ts games/counterball/src/simulation/sampling.test.ts
```

Then inspect the diff and run `git diff --check`. Do not run local builds, tests, typecheck, lint, another formatter scope, or a server. If formatting or review identifies a non-formatting defect, stop and report the exact evidence; do not expand this packet into a source repair.

## Acceptance

The formatter command and diff check must exit 0, the source diff must be formatting-only, and the independent reviewer must report PASS. This verifies only the bounded formatting repair. C0 and C2 remain unaccepted until a fresh hosted `pnpm verify`, integration, and one-worker Chromium E2E run pass.
