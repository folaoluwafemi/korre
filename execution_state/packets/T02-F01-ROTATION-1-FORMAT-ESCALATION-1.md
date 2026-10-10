# T02-F01-ROTATION-1-FORMAT-ESCALATION-1 — hosted format-failure escalation

Parent: T02
Role: coordinator report-only gate
Purpose: classify GitHub run 38087201307 and, if independently accepted, authorize one bounded formatting-only successor card. This packet does not authorize source edits or accept F01/T02.

## Read first

- `execution_state/packets/T02-F01-ROTATION-1.md`
- `execution_state/reports/T02-F01-ROTATION-1-implementation.md`
- `execution_state/reports/T02-F01-ROTATION-1-review.md`
- `execution_state/reports/T02-F01-ROTATION-1-run-38087201307.md`
- `execution_state/reports/T02-F01-ROTATION-1-run-38087201307-github.log`
- `execution_state/reports/T02-F01-ROTATION-1-run-38087201307-artifacts/formatting-repair/formatting-repair.patch`
- `execution_state/reports/T02-F01-ROTATION-1-run-38087201307-artifacts/counterball-hosted-checks-21ab540352c88f11ba15c8a2f4bb883c2ad71c61-run-38087201307-attempt-1/verify.log`
- `games/counterball/src/simulation/facts.ts`
- `games/counterball/src/simulation/facts.test.ts`
- `knowledge_base/execution/CONTRACTS.md`
- `knowledge_base/execution/SWARM.md`

## Exact ownership

The coordinator owns this packet and runtime metadata. The report author may write only `execution_state/reports/T02-F01-ROTATION-1-format-escalation-1.md`. The independent reviewer may write only `execution_state/reports/T02-F01-ROTATION-1-format-escalation-1-review.md`. Neither role may modify source, CI, contracts, catalogues, or runtime status.

## Required analysis

1. Classify run 38087201307 on SHA `21ab540352c88f11ba15c8a2f4bb883c2ad71c61` from its preserved full log and uploaded logs. Record the checks that passed and the steps that did not run.
2. Confirm whether the sole `pnpm verify` blocker is formatting on the two source/test paths already owned by T02-F01-ROTATION-1, after all typechecks and ESLint passed.
3. Inspect the exact uploaded `formatting-repair.patch`; do not apply it. Confirm its path list and whether every hunk is formatting-only. The earlier `git apply --stat` and `git apply --check` results are evidence of scope and applicability, not permission to edit.
4. State whether a separate repair card may safely apply only that exact patch, with no source-semantic or physics/default change. The card must require independent source review and a fresh exact-SHA GitHub run.
5. State that the focused Counterball test command did not run separately, unit tests/build did not run, downstream integration/browser checks were skipped, and no real-Havok observation or playable-flow evidence resulted.

## Checks and acceptance

- `node scripts/check-completion-plan.mjs --packet T02-F01-ROTATION-1-FORMAT-ESCALATION-1`: exact report-only record is ready; this is documentation validation only.
- `git apply --stat execution_state/reports/T02-F01-ROTATION-1-run-38087201307-artifacts/formatting-repair/formatting-repair.patch`: confirms the patch path list is exactly `facts.ts` and `facts.test.ts`.
- `git apply --check execution_state/reports/T02-F01-ROTATION-1-run-38087201307-artifacts/formatting-repair/formatting-repair.patch`: confirms applicability without changing the worktree.
- Independent escalation review: PASS only if the report accurately distinguishes passed checks from skipped checks, the patch touches only the two owned paths, every hunk is formatting-only, and a successor is limited to applying that exact patch followed by independent review and hosted verification.

This report-only gate permits no local app install, build, test, typecheck, formatter, browser, physics, or dry-run command. GitHub run 38087201307 is the only app execution evidence in scope.

## Stop conditions

- If any patch hunk changes behavior, any path is outside the two owned files, or the failure is more than formatting, do not authorize the formatting repair; prepare a narrower escalation.
- If the review does not PASS, do not edit source or dispatch a successor.
- A PASS authorizes only creation of one exact-patch repair card. It does not mark the implementation verified, accept F01/T02, unblock consumers, or permit a deployment claim.
