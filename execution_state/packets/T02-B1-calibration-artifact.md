# T02-B1: retain the real Havok calibration matrix as a CI artifact

## Trigger and evidence

GitHub Actions run #6 on commit `80cd26b` passed `pnpm verify`, integration, and all three one-worker Chromium tests. The calibration probe therefore passed all 480 real-Havok-WASM trials on the GitHub runner. However, Vitest suppressed the passing test's `console.info` payload; querying the completed run logs found no `COUNTERBALL_CALIBRATION_PROBE` record. T02 still needs the full measured matrix for coefficient review, so pass/fail alone is insufficient.

## Exact worker write paths

Worker `/root/toolchain_audit` may edit only:

- `games/counterball/src/simulation/calibrationProbe.test.ts`
- `execution_state/reports/T02-B1-calibration-artifact-implementation.md`

Add an explicit opt-in via `COUNTERBALL_CALIBRATION_OUTPUT`: when that environment variable is set, write the completed probe metadata and full 480 observations as JSON to that path. Create the parent directory if needed. Do this only after the probe assertions complete. Keep normal runs silent of filesystem artifact writes when the variable is absent. Retain the current passing `console.info` record if helpful; do not change test assertions, probe matrix/order, candidate values, physics inputs, world lifetime, or observations.

## Exact coordinator-only shared paths

The coordinator alone may edit:

- `.github/workflows/ci.yml`
- `.gitignore`
- `execution_state/tasks.json`
- `execution_state/LEDGER.md`

Set `COUNTERBALL_CALIBRATION_OUTPUT=.artifacts/counterball-calibration-observations.json` on the `pnpm verify` step. Add a following `actions/upload-artifact@v4` step guarded with `if: always()` and `if-no-files-found: ignore`, named `counterball-calibration-observations`, to upload that path even if a later verification stage fails. Ignore `.artifacts/` in Git. Do not grant workflow write permissions or commit from CI.

## Independent review

Reviewer: `/root/foundation_review`.

Reviewer report-only write path:

- `execution_state/reports/T02-B1-calibration-artifact-review.md`

Review the source and coordinator workflow changes against this packet. Confirm the artifact is opt-in, contains the entire passed probe record, uploads without credentials or workflow write permission, and cannot be mistaken for deployed Cloudflare evidence. No local build/test/lint/typecheck/formatter/server commands. Do not edit implementation/config/status paths.

## Acceptance

1. The coordinator configuration requests the exact artifact path and uploads it using the existing read-only GitHub workflow permissions.
2. The worker output file contains metadata plus exactly 480 observation records when the probe succeeds.
3. Independent source/config review passes.
4. A new hosted run passes verification and publishes the artifact; parse and preserve the actual data under `execution_state/reports` and obtain independent measurement review before coordinator coefficient selection.

## Environment

No local build or test commands. Hosted GitHub Actions is the verification target. Do not call this artifact a deployed-Cloudflare Havok result; T04 remains a separate gate.
