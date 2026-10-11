# T02-L01-GUARD-SCHEMA-1 formatting repair 1 implementation

Date: 2026-10-11
Owner: coordinator
Status: IMPLEMENTED; independent source review PASS; exact hosted rerun pending
Failure class: hosted Prettier check for `packages/game-protocol/src/schemas.ts`
Bounded attempt: 1 of 2 for this distinct formatting failure

## Trigger

GitHub Actions run [38155542248](https://github.com/folaoluwafemi/korre/actions/runs/38155542248) on exact SHA `db8436e02f98a7007a9be0f4708dc552f651ef4d` passed hosted setup, workspace typecheck, ESLint, and the focused game-protocol contract-test step, then failed `pnpm verify` because Prettier reported only `packages/game-protocol/src/schemas.ts`. The run stopped before unit tests, build, integration, or browser checks. See the exact-run coordinator record at `execution_state/reports/T02-L01-guard-schema-run-38155542248.md` and GitHub's formatting suggestion at `execution_state/reports/T02-L01-guard-schema-format-repair-1-artifacts/formatting-repair.patch`.

## Bounded change

Applied the two formatting-only tuple layout changes from the hosted Prettier patch to `packages/game-protocol/src/schemas.ts`. The values, ordering, schemas, exports, and runtime behavior are unchanged. No formatter, application test, install, build, browser, physics, or deployment command ran locally.

## Checks actually run

- `git apply --check -- execution_state/reports/T02-L01-guard-schema-format-repair-1-artifacts/formatting-repair.patch` — PASS.
- `git diff --check -- packages/game-protocol/src/schemas.ts` — PASS.

The exact source diff is released for independent review. It must be published and rechecked on GitHub before this schema card can be accepted.

The rotated source review passed at `execution_state/reports/T02-L01-guard-schema-format-repair-1-review.md`. Exact-run evidence review for prior run 38155542248 returned CHANGES_REQUIRED because formatting stopped the full verification; that result is recorded separately and is not acceptance.
