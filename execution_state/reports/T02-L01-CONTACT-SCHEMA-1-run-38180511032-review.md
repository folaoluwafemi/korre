# T02-L01-CONTACT-SCHEMA-1 hosted run review

**Verdict: PASS for the hosted contact-schema checks on the exact reviewed commit.** This verifies the serializer card's hosted checks only. It does not establish deployed Cloudflare Havok or a playable match.

## Run provenance and workflow

`gh run view 38180511032 --json databaseId,headSha,status,conclusion,attempt,jobs,url` reports run **38180511032**, attempt **1**, exact head `e1344960e8e1f5c346861a3fd8eda9b4efa337d1`, completed with conclusion **success**. Its single `verify` job succeeded. Of the 37 reported workflow steps, 35 succeeded and the two conditional formatter-suggestion steps (prepare suggestion and upload suggestion) were skipped on the green run. No test step was skipped.

## Test evidence

- Preserved `verify.log`: **30 test files, 179 tests passed**; no skipped or failed tests (`counterball-verification-log/verify.log`, lines 678–679).
- Focused protocol log: **1 file, 13 tests passed**; no skips (`.../protocol.log`).
- Integration log: **1 file, 1 test passed**; no skips (`.../integration.log`).
- Built preview Playwright JSON: **4 passed, 0 skipped, 0 flaky, 0 unexpected**. Each result has one attempt and the JSON provenance SHA matches the run.
- Diagnostic Playwright JSON: **2 passed, 0 skipped, 0 flaky, 0 unexpected**. Both cases passed on one attempt and the JSON provenance SHA matches the run. The diagnostic discovery file lists `tests/e2e/counterball-direct-probe.spec.ts`.
- The production diagnostic-exclusion workflow step succeeded. Worker packaging was a dry-run build/package check only.

The two Playwright result JSON files and their test entries are under `counterball-browser-evidence/.artifacts/` and are duplicated in the hosted-check artifact. The hosted `verify.log`, protocol/integration/E2E logs, browser result JSON, and diagnostic discovery JSON were inspected directly.

## Evidence integrity and limits

The preserved full GitHub log is **286,007 bytes**, SHA-256 `97d20375957e748f9ed7968ec5cab4b27b329c7218ba5f67f87016b1c2e6b83a`, matching the run report. I independently checked the artifact inventory against the downloaded files: **1,152 entries / 59,121,920 bytes**, with all paths present, no unlisted files, no size mismatches, and all 1,152 SHA-256 values matching.

The run report at `execution_state/reports/T02-L01-CONTACT-SCHEMA-1-run-38180511032.md` explicitly limits the result to the diagnostic contact serializer. The Worker was not deployed, Cloudflare Havok was not exercised, and this run does not prove a playable match. No local application checks were run for this review.

Review commands were read-only GitHub metadata, file inspection, and SHA-256/inventory comparison; no application commands were run.
