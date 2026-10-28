# T02-L01-ARTIFACT-1 independent run evidence review

**Verdict: PASS for hosted verification evidence.** This verifies the hosted run and retained artifacts for the serializer packet; it does not accept the packet or establish deployed or playable behavior.

## Provenance

GitHub Actions run [38169119032](https://github.com/folaoluwafemi/korre/actions/runs/38169119032), attempt 1, completed successfully for `folaoluwafemi/korre`, branch `codex/remote-ci-bootstrap`, exact head `0983916d61fc42195558db6d144e540055c94c99`. The full run log, GitHub artifact metadata, and extracted inventory agree on the run. All nine artifact metadata entries identify the same run, branch, and head; their names, sizes, and SHA-256 archive digests match the extracted inventory and the upload-digest lines in the full log.

## Checks and counts

- `verify.log` records `pnpm verify` with **30 test files and 176 tests passed**. The Vitest summary reports 176 of 176 passed, with no skipped tests. The focused protocol log records **13/13**; the dedicated Worker smoke log records **1/1**; the integration log records **1/1**. The migration log verifies the one forward-only migration twice.
- `browser-test-results.json` is tied to the same SHA and run URL. Its stats are **4 expected, 0 skipped, 0 flaky, 0 unexpected**; each of the four results is passed with retry 0. `e2e.log` reports 4 passed.
- `browser-test-results-diagnostic.json` is also tied to the same SHA and run URL. Its stats are **2 expected, 0 skipped, 0 flaky, 0 unexpected**; both diagnostic cases passed with retry 0. The titles are “a real pointer flick runs browser Havok and changes rendered WebGL pixels” and “a blocked real WASM load is visible and retry cleans up before a real shot.” `diagnostic-e2e-files.json` confirms the collected file is `tests/e2e/counterball-direct-probe.spec.ts`; `e2e-diagnostic.log` reports 2 passed.
- The exact-head workflow has only two `if: failure()` steps: “Prepare formatting suggestion after a failed check” and “Upload formatting suggestion.” The run succeeded, and the logs contain the required checks, builds, and browser suites; the only conditional skips are those formatter-suggestion steps. The Playwright JSON results independently show no test skips or retries.

## Artifact and build integrity

I recomputed size and SHA-256 for all **1,152** extracted files (**59,122,070 bytes**): every inventoried path exists and all sizes and hashes match. For `counterball-web-production-0983916d61fc42195558db6d144e540055c94c99`, all **454** manifest entries match their downloaded payloads. For `counterball-web-diagnostic-0983916d61fc42195558db6d144e540055c94c99`, all **213** entries match. Both manifests identify the reviewed SHA, run ID, and attempt. The production manifest says `devHarnessFlag: unset` and has no `CounterballDirectProbe` asset; the diagnostic manifest says `devHarnessFlag: set` and contains the diagnostic asset. The full log also shows the production diagnostic-exclusion check ran before packaging.

## Evidence paths and limits

Reviewed `execution_state/reports/T02-L01-ARTIFACT-1-run-38169119032.md`, `execution_state/reports/T02-L01-ARTIFACT-1-run-38169119032.log`, and the run’s `github-artifact-metadata.json` and `artifact-inventory.json`. Under `counterball-hosted-checks-0983916d61fc42195558db6d144e540055c94c99-run-38169119032-attempt-1/`, I inspected `verify.log`, `protocol.log`, `workers.log`, `migrations.log`, `integration.log`, `e2e.log`, `e2e-diagnostic.log`, `diagnostic-e2e-files.json`, and both `browser-test-results*.json` files. I independently checked both build inventories against their downloaded directories.

The evidence supports hosted validation of this bounded artifact encoder and the recorded browser preview/diagnostic tests. It does not establish a fully playable match, deployed Cloudflare service or deployed Havok behavior, online play, or testing on a physical phone. No local app checks, tests, builds, browser runs, or Cloudflare commands were run during this review.
