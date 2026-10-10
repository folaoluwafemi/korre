# T02-F01-ROTATION-1-CI-FAIL-ESCALATION-2 — classify exact-head formatting failure

Parent: T02
Role: coordinator report-only failure gate
Purpose: classify GitHub run 38090063627 after the reviewed semantic repair. This card authorizes no source edit and accepts neither F01 nor T02.

## Accepted prerequisites

- `parent:T01`
- `T02-F01-math-escalation-1`
- `T02-C0`
- `T02-C2`
- `C00-A`
- `C00`
- `T02-F01-ROTATION-1-FORMAT-ESCALATION-1`
- `T02-F01-ROTATION-1-CI-FAIL-ESCALATION-1`

The semantic source attempt `T02-F01-ROTATION-1-SEMANTIC-REPAIR-2` is CHANGES_REQUIRED after hosted verification. Its report, review, exact run and generated formatting artifact are evidence inputs, not accepted dependencies.

## Read inputs

- `execution_state/packets/T02-F01-ROTATION-1-SEMANTIC-REPAIR-2.md`
- `execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-implementation.md`
- `execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-review.md`
- `execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-run-38090063627.md`
- `execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-run-38090063627-github.log`
- `execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-run-38090063627-metadata.json`
- `execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-run-38090063627-artifacts/counterball-verification-log/verify.log`
- `execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-run-38090063627-artifacts/formatting-repair/formatting-repair.patch`
- `games/counterball/src/simulation/facts.ts`
- `execution_state/reports/T02-F01-math-escalation-1.md`
- `execution_state/reports/T02-F01-math-escalation-1-review.md`
- `knowledge_base/execution/CONTRACTS.md`
- `knowledge_base/execution/DECISIONS.md`
- `knowledge_base/execution/SWARM.md`
- `knowledge_base/execution/completion/OPERATIONS.md`

## Exact ownership

The coordinator owns runtime status, catalogues, this packet and integration metadata. The report author may write only `execution_state/reports/T02-F01-ROTATION-1-ci-fail-escalation-2.md`. The independent reviewer may write only `execution_state/reports/T02-F01-ROTATION-1-ci-fail-escalation-2-review.md`. Neither may edit source, tests, config, contracts, CI, or shared task/status files. Do not apply the generated patch or run local application commands.

## Required analysis

1. Confirm exact run URL, checked SHA `e9d7aee4a3202b2e0a14bfb6a6f62bf967a62669`, conclusion, workflow step counts, and every non-success step from preserved metadata.
2. Inspect `verify.log`: all workspace typechecks completed; ESLint passed; Prettier failed only on `games/counterball/src/simulation/facts.ts`; unit tests and build did not run. Distinguish the separately passing 11 protocol tests, one Workers smoke test, and migration checks from the full suite.
3. Inspect the exact generated patch and current file. Confirm the patch is for the exact committed blob, contains only Prettier line wrapping, changes only `facts.ts`, and applies cleanly. Record its digest. Do not apply it.
4. Inventory hosted artifacts and their hashes. State that the screenshots are prior T03 evidence and that no browser preview build, integration run, fresh gameplay, deployed Havok proof, or full application test result exists for this SHA.
5. Recommend only a separately materialized exact-patch formatting card, or stop if the patch is not purely formatting. Preserve the accepted math and all semantic expectations; do not run a formatter or modify acceptance to get green.

## Checks and acceptance

- `node scripts/check-completion-plan.mjs --packet T02-F01-ROTATION-1-CI-FAIL-ESCALATION-2`: exact report-only packet is ready; documentation validation only.
- Read-only audit of run 38090063627, full log, metadata, `verify.log`, exact patch and preserved artifact inventory.
- `git apply --stat` and `git apply --check` on the exact hosted patch, plus SHA-256 comparison; these inspect applicability and do not apply it.
- Independent escalation review: PASS only if run counts, failure stage, patch identity/scope, test limits and artifact claims match exact evidence, with no source edit authorized except through a separate bounded card.

## Stop conditions

- If the patch changes runtime behavior, uses the wrong base blob, or does not apply cleanly, stop and leave F01 CHANGES_REQUIRED.
- Do not claim that the protocol tests, Worker smoke test or older screenshots prove the full suite, a browser flick, or deployed physics.
- Even after escalation PASS, F01/T02 stay unaccepted until the separate formatting card, independent source review, and complete exact-SHA hosted checks pass with no required checks skipped.
