# T02-F01-ROTATION-1-CI-FAIL-ESCALATION-1 — classify exact-head fact failures

Parent: T02
Role: coordinator report-only failure gate
Purpose: classify GitHub run 38088587482 after the exact formatting-only repair. This card authorizes no source change and accepts neither F01 nor T02.

## Accepted prerequisites

- `parent:T01`
- `T02-F01-math-escalation-1`
- `T02-C0`
- `T02-C2`
- `C00-A`
- `C00`
- `T02-F01-ROTATION-1-FORMAT-ESCALATION-1`

The source repair and exact-hosted-run attempt being classified is `T02-F01-ROTATION-1-FORMAT-REPAIR-1`, which remains CHANGES_REQUIRED. Its failure is evidence, not a dependency that can unblock new source work.

## Read inputs

- `execution_state/packets/T02-F01-ROTATION-1.md`
- `execution_state/packets/T02-F01-ROTATION-1-FORMAT-REPAIR-1.md`
- `execution_state/reports/T02-F01-ROTATION-1-format-repair-1-review.md`
- `execution_state/reports/T02-F01-ROTATION-1-format-repair-1-implementation.md`
- `execution_state/reports/T02-F01-ROTATION-1-format-repair-1-run-38088587482.md`
- `execution_state/reports/T02-F01-ROTATION-1-run-38088587482-github.log`
- `execution_state/reports/T02-F01-ROTATION-1-run-38088587482-artifacts/counterball-hosted-checks-efd6f567a35b29313ceda1c82dcc7b3b73b1298d-run-38088587482-attempt-1/verify.log`
- The calibration/intended-shot JSON and artifact inventory under `execution_state/reports/T02-F01-ROTATION-1-run-38088587482-artifacts/`
- `games/counterball/src/simulation/facts.ts`
- `games/counterball/src/simulation/facts.test.ts`
- `execution_state/reports/T02-F01-math-escalation-1.md`
- `execution_state/reports/T02-F01-math-escalation-1-review.md`
- `knowledge_base/execution/CONTRACTS.md`
- `knowledge_base/execution/DECISIONS.md`
- `knowledge_base/execution/SWARM.md`

## Exact ownership

The coordinator owns runtime status, catalogues, this packet and integration metadata. The report author may write only `execution_state/reports/T02-F01-ROTATION-1-ci-fail-escalation-1.md`. The independent reviewer may write only `execution_state/reports/T02-F01-ROTATION-1-ci-fail-escalation-1-review.md`. Neither may edit source, tests, config, contracts, CI, or shared task/status files. No local app test/build/typecheck/lint/format/browser/physics/deployment command is allowed.

## Required analysis

1. Confirm exact run URL, checked-out SHA, conclusion, all workflow pass/fail/skip counts, and the full `pnpm verify` suite counts from the preserved evidence.
2. Classify the seven failing `facts.test.ts` cases individually. Separate signed-zero JSON normalization and exact contact ordering from crossing-root precision/search termination and goal/out/tangency classification. Cite exact source/test lines and fixture expectations.
3. Determine whether the failure groups can be addressed safely in one bounded successor on the existing two source-owned paths or need sequential cards. Any proposed card must preserve all seven existing expectations and the accepted conservative-support derivation; do not loosen tolerances, change expected results, skip ambiguous intervals, raise bounds, or alter physics defaults.
4. Confirm that typecheck, ESLint and Prettier passed; the unit-test phase failed; build, integration and Chromium E2E were skipped. The passing 480-trial calibration and 40-trial intended-shot outputs are diagnostic artifact evidence only, not proof of deployed Havok or playability. The browser screenshots are prior T03 evidence, not fresh gameplay.
5. Recommend either one exact, bounded successor card with its inputs, two-file write paths, checks and stop conditions, or stop for a narrower review. Only a separate source card after this escalation receives source-edit authorization.

## Checks and acceptance

- `node scripts/check-completion-plan.mjs --packet T02-F01-ROTATION-1-CI-FAIL-ESCALATION-1`: exact report-only packet is ready; documentation validation only.
- Read-only review of GitHub run 38088587482, its complete log, extracted verification log, artifact metadata and saved file hashes.
- Independent escalation review: PASS only if the report accurately accounts for the seven failures and skipped work, keeps diagnostic artifact limits clear, preserves the accepted math/contracts, and authorizes no source change except through a separate bounded card.

## Stop conditions

- If the report cannot explain the exact failures from current source/tests or finds a contract ambiguity, stop and keep F01 CHANGES_REQUIRED; request the smallest actual rule clarification only if needed.
- If any proposed fix relies on weakening tests, uncertified sampling, unbounded retries or changed gameplay/physics defaults, do not authorize it.
- Even after escalation PASS, F01/T02 stay unaccepted until the separate source card passes independent review and full exact-SHA hosted verification with no required checks skipped.
