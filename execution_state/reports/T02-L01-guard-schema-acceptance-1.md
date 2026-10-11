# T02-L01-GUARD-SCHEMA-1 acceptance

Date: 2026-10-11
Status: **ACCEPTED — schema/config/fixture scope only**

## Accepted evidence

- Exact five-path source review PASS on `970ea3d430fa751aa19ad8a037a359d7b23417c4`: `execution_state/reports/T02-L01-guard-schema-final-source-review-970ea3d.md`.
- Exact-head hosted evidence review PASS for GitHub run [38156205255](https://github.com/folaoluwafemi/korre/actions/runs/38156205255): `execution_state/reports/T02-L01-guard-schema-run-38156205255-independent-review.md`.
- Coordinator hosted run record: `execution_state/reports/T02-L01-guard-schema-run-38156205255.md`.
- Hosted focused protocol suite: 13/13 passed. `pnpm verify`: 29 test files, 164/164 tests, typecheck, lint/format and build passed. Integration passed 1/1, built preview 4/4, diagnostic Chromium 2/2, all without test skips or flaky retries. All nine GitHub artifact archives matched API byte sizes and SHA-256 digests.
- The bounded source repairs were independently reviewed: exhaustive boolean-leaf coverage, the safe recursive array callback typing, and exact hosted Prettier formatting.

The accepted implementation is restricted to the strict hashed `restartLoftDiagnosticGuard`, outer config/schema version 3, updated eight fixture `configHash` leaves, and accompanying protocol/config tests. The wire protocol remains v1; the existing direct-shot guard remains unchanged; `physicsCalibration` remains `null`; no diagnostic guard consumer was added.

## Acceptance boundary

This does **not** accept parent T02 or child T02-L01. It proves no real-Havok restart matrix, deployed Cloudflare Havok, calibrated playable physics, local match, AI, online play, or social flow. Those remain separate cards. The successful browser tests are the existing direct-shot/retry diagnostics only. The production browser build also retains the reported 6.27 MB chunk / 1.38 MB gzip warning as a performance follow-up.

T02-L01's original dependencies are unchanged. With the strict guard/schema card accepted, the original bounded restart-loft diagnostic is now eligible to proceed under T02; it must still pass real Chromium with pinned Havok and its complete artifact/review requirements before L01 or T02 can be accepted.
