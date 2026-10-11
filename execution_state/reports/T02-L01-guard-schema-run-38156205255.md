# T02-L01-GUARD-SCHEMA-1 hosted verification run 38156205255

Date: 2026-10-11
Workflow: [GitHub Actions CI run 38156205255](https://github.com/folaoluwafemi/korre/actions/runs/38156205255)
Exact source SHA: `970ea3d430fa751aa19ad8a037a359d7b23417c4`
Attempt: 1
Conclusion: **PASS for exact-head hosted verification; final source acceptance is pending a separate source review.**

## Hosted checks

- Focused `packages/game-protocol/src/protocol.test.ts`: **13/13 passed**.
- `pnpm verify`: **29 test files and 164/164 tests passed**; typecheck, lint/format, and build passed. The test summary reported no skips or failures.
- Disposable migration check: both forward-migration checks passed. Dedicated Workers smoke: **1/1 passed**.
- Production diagnostic-exclusion check, exact dry-run Worker package, and production browser package all passed.
- Integration suite: **1/1 passed**.
- Built-preview Playwright suite: **4/4 passed**, with zero skipped, unexpected, or flaky tests.
- Diagnostic Chromium suite: **2/2 passed**, with zero skipped, unexpected, or flaky tests. It covers the existing direct-shot/retry-cleanup diagnostic; it is not the L01 restart matrix.
- The only skipped workflow steps were conditional formatting-suggestion steps that run after failure. No required test or verification step was skipped.

## Artifact and source provenance

Independent exact-run review `execution_state/reports/T02-L01-guard-schema-run-38156205255-independent-review.md` verifies run attempt, exact SHA, all required step conclusions, production/diagnostic build inventories, and all nine run-artifact ZIP sizes and SHA-256 values against GitHub API metadata. Complete run metadata, logs, inventories and extracted artifacts are retained under `execution_state/reports/T02-L01-guard-schema-run-38156205255-independent-artifacts/`.

The production inventory identifies the exact SHA/run/attempt and contains no diagnostic renderer marker. The separate diagnostic inventory is explicitly marked diagnostic-only. The production browser build emitted a 6.27 MB JavaScript chunk (1.38 MB gzip); the build succeeded but reports the standard large-chunk warning, which remains a performance follow-up rather than a schema acceptance failure.

## Scope limits

This verifies the strict protocol/config/schema/hash-fixture change only. Existing Babylon NullEngine tests in `pnpm verify` are not Havok evidence. No L01 matrix, real-Havok restart trial, Cloudflare deployment, playable match, AI, online, or social flow is accepted by this run. The independent final source review remains pending; only after that review may the coordinator accept this schema card and unblock the L01 matrix packet.
