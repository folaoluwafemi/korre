# T02-F01-ROTATION-1-FORMAT-REPAIR-1 — apply the pinned formatting artifact

Parent: T02
Role: worker source-only repair
Purpose: apply the exact formatting-only patch independently reviewed in `T02-F01-ROTATION-1-FORMAT-ESCALATION-1`. This repair does not authorize semantic edits or accept F01/T02.

## Accepted prerequisites and exact input

- `parent:T01`
- `T02-F01-math-escalation-1`
- `T02-C0`
- `T02-C2`
- `C00-A`
- `C00`
- `T02-F01-ROTATION-1-FORMAT-ESCALATION-1`

The only patch input is:

`execution_state/reports/T02-F01-ROTATION-1-run-38087201307-artifacts/formatting-repair/formatting-repair.patch`

Pinned SHA-256: `7e9ff75e71a6fdee218317d253e07ffb339446d372e4ef44c9a5044c6db460aa`.

## Exact ownership

The implementation author may write only:

- `games/counterball/src/simulation/facts.ts`
- `games/counterball/src/simulation/facts.test.ts`
- `execution_state/reports/T02-F01-ROTATION-1-format-repair-1-implementation.md`

The independent reviewer may write only:

- `execution_state/reports/T02-F01-ROTATION-1-format-repair-1-review.md`

The coordinator owns catalogues, status, integration, workflow, commit/push and hosted evidence. No local application install, build, test, typecheck, lint, formatter, browser, physics or deployment command is authorized by this card.

## Required work

1. Verify the pinned patch SHA-256 matches the value above and `git apply --check` succeeds.
2. Apply only that patch. Do not run a formatter and do not edit any other source, test, config, contract, or workflow file.
3. Inspect the resulting diff and confirm it contains exactly the two authorized files and is byte-for-byte the effect of the pinned patch.
4. Write an implementation report with the patch hash, exact changed paths, diff check, and an explicit statement that no application check ran.
5. Stop for independent source review. Do not commit, push, or claim hosted verification.

## Checks and acceptance

- Patch SHA-256 equals the pinned digest.
- `git apply --check execution_state/reports/T02-F01-ROTATION-1-run-38087201307-artifacts/formatting-repair/formatting-repair.patch` exits 0 before application.
- The patch is applied without modification; the source diff has exactly two paths and matches the patch's intended changes.
- `git diff --check` exits 0.
- Independent review confirms the diff is exactly formatting-only and limited to the two paths.
- No app tests/builds run in this card. After independent review, the coordinator must run the exact reviewed commit through the existing GitHub workflow; this card is not verified until that hosted run and required downstream checks pass.

## Negative cases and stop conditions

- Do not alter the patch, run Prettier, fix unrelated issues, change behavior, modify physics defaults, or edit any third path.
- If the patch digest, applicability, scope, or exact diff differs, stop without source changes and report `CHANGES_REQUIRED`.
- If the independent review does not pass, preserve evidence and follow the bounded escalation procedure; do not retry source edits without a newly accepted escalation.
- A source-review PASS or formatting-only diff does not prove physics, gameplay, the deployed Havok gate, or acceptance of F01/T02.
