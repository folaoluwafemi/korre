# T02-F01-ROTATION-1-FORMAT-REPAIR-2 — apply the exact hosted formatting patch

Parent: T02
Role: worker source repair after accepted report-only escalation
Author: `/root/toolchain_audit`
Independent reviewer: `/root/foundation_review`
Hosted verification and shared status: coordinator only

## Accepted prerequisites

- `parent:T01`
- `T02-F01-math-escalation-1`
- `T02-C0`
- `T02-C2`
- `C00-A`
- `C00`
- `T02-F01-ROTATION-1-FORMAT-ESCALATION-1`
- `T02-F01-ROTATION-1-CI-FAIL-ESCALATION-1`
- `T02-F01-ROTATION-1-CI-FAIL-ESCALATION-2`

The semantic implementation remains CHANGES_REQUIRED only because hosted Prettier stopped the full check. Its independent source review passed. This card changes formatting only and accepts neither F01 nor T02.

## Objective and exact inpu

Apply only this GitHub-generated artifact:

`execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-run-38090063627-artifacts/formatting-repair/formatting-repair.patch`

Pinned patch SHA-256: `c1a80ffd8ad4bcf4eb8f566df92dd02ac7b765e791d8612608aace1e65007bfe`. The patch base and current source blob are `22aa7cb06fcedae871970bd92c7f8420ef14ed26`. It contains exactly two formatting hunks in `games/counterball/src/simulation/facts.ts`.

## Read inputs

- `execution_state/packets/T02-F01-ROTATION-1-SEMANTIC-REPAIR-2.md`
- `execution_state/packets/T02-F01-ROTATION-1-CI-FAIL-ESCALATION-2.md`
- `execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-implementation.md`
- `execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-review.md`
- `execution_state/reports/T02-F01-ROTATION-1-ci-fail-escalation-2.md`
- `execution_state/reports/T02-F01-ROTATION-1-ci-fail-escalation-2-review.md`
- `execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-run-38090063627.md`
- The exact formatting patch named above
- `games/counterball/src/simulation/facts.ts`
- `execution_state/reports/T02-F01-math-escalation-1.md`
- `execution_state/reports/T02-F01-math-escalation-1-review.md`
- `knowledge_base/execution/CONTRACTS.md`
- `knowledge_base/execution/DECISIONS.md`
- `knowledge_base/execution/SWARM.md`
- `knowledge_base/execution/completion/OPERATIONS.md`

## Exact ownership

The author may edit only `games/counterball/src/simulation/facts.ts` and `execution_state/reports/T02-F01-ROTATION-1-format-repair-2-implementation.md`. The independent reviewer may write only `execution_state/reports/T02-F01-ROTATION-1-format-repair-2-review.md`. The coordinator owns this packet/catalogue, `execution_state/tasks.json`, ledger/ownership/integration notes, Git commit/push, hosted checks, run evidence and final status. Do not edit tests, config, contracts, lockfiles, workflow, physics behavior or any other source file. Do not run a formatter or local application command.

## Required repair

1. Extract this exact packet with `node scripts/check-completion-plan.mjs --packet T02-F01-ROTATION-1-FORMAT-REPAIR-2`.
2. Before applying, recompute the patch SHA-256 and current `facts.ts` Git blob, then run `git apply --stat` and `git apply --check`. Stop if any value differs from the pinned input.
3. Apply the exact saved patch with `git apply`; do not recreate it or run Prettier.
4. Inspect the resulting one-file diff against the saved patch. Confirm the two reflowed expressions, source behavior and accepted math remain unchanged. Run `git diff --check`.
5. Save the implementation report with the patch digest, base/current blob, exact changed path, diff review, commands/results, and explicit “no application checks run.” Stop writing for independent review.

## Required checks and acceptance

- Packet extraction: exact card is ready with accepted prerequisites; plan check only.
- Patch identity/applicability: exact digest and base match, only `facts.ts` is in the patch, `git apply --check` passes, application produces only the pinned diff, and `git diff --check` passes.
- Independent source review: PASS confirms the diff is byte-for-byte the authorized formatting patch and has no behavior, test, contract or default change.
- After source review, coordinator commits/pushes the exact reviewed tree and runs the full GitHub `ci` workflow. Require Worker smoke, migrations, protocol tests, full `pnpm verify`, integration and production browser E2E with no required skips. Preserve exact SHA, run, complete logs, test counts and artifact metadata. A hosted failure keeps this packet and F01 CHANGES_REQUIRED; another repair needs a new reviewed escalation.

This packet can accept only the formatting repair after source review and the full exact-SHA hosted check. F01 requires its complete fact assertions to pass; T02, deployed Havok, the first browser flick and playability remain separate.

## Negative cases and stop conditions

- Do not run Prettier or hand-edit equivalent line wraps; the saved patch is the only authorized source change.
- Do not change the support bound, root expectation/tolerance, search limits, tangency allowance, goal classification, physics defaults or tests.
- Do not accept from source review, `git apply --check`, the earlier failing run, or any artifact upload alone.
- If the patch SHA/base/scope differs, if extra paths change, or if hosted verification fails, preserve evidence and stop. Any later source edit needs its own bounded independently reviewed authorization.
