# T02-L01-GUARD-SCHEMA-1 hosted verification run 38155542248

Date: 2026-10-11
Workflow: [GitHub Actions CI run 38155542248](https://github.com/folaoluwafemi/korre/actions/runs/38155542248)
Exact source SHA: `db8436e02f98a7007a9be0f4708dc552f651ef4d`
Conclusion: **FAIL**; schema card remains unaccepted.

## Result

Hosted setup, workspace typechecks, ESLint, disposable PostgreSQL migration checks, and the focused game-protocol contract-test step completed successfully. The focused protocol suite passed 13/13 with zero skipped tests; the Worker smoke suite passed 1/1. `pnpm verify` reached Prettier and failed because `packages/game-protocol/src/schemas.ts` did not match formatting. The hosted suggestion is retained at `execution_state/reports/T02-L01-guard-schema-format-repair-1-artifacts/formatting-repair.patch`; it changes two tuple layouts only. Independent exact-run review at `execution_state/reports/T02-L01-guard-schema-run-38155542248-independent-review.md` returned CHANGES_REQUIRED because full verification and downstream gates were not completed. Its exact run metadata, per-file SHA-256 inventory, complete run log, and the four run artifacts are retained in the adjacent `...-independent-artifacts/` directory.

## Not reached

The verify script stopped after formatting, before unit tests and build. The workflow consequently skipped production diagnostic-exclusion checks, dry-run Worker packaging, production browser packaging, integration tests, built-preview tests, separate diagnostic browser tests, and their result artifacts. No runtime, browser physics, Havok, deployed Worker, playable match, or calibration result is claimed by this run.

## Repair disposition

Coordinator applied only the hosted formatting suggestion to the one assigned schema source file. The exact diff is under independent source review at `execution_state/reports/T02-L01-guard-schema-format-repair-1-review.md`. The exact run evidence review is separately owned by a rotated reviewer. No local application test/build/browser/physics command ran.
