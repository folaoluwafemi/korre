# T02-BR02-MASS-READBACK-1 hosted readback — run 38142200238

## Exact execution

- Commit: `bf80bfb028310e77005e74a5b9c41c00bfbe9b98` (`Capture exact browser mass readback`).
- GitHub workflow: [ci run 38142200238](https://github.com/folaoluwafemi/korre/actions/runs/38142200238); job 114478184325.
- Run started at `2026-10-11T13:11:40Z`; job ended at `2026-10-11T13:18:31Z` with overall conclusion `failure`.
- Workflow steps: 35 success, one failed, one skipped. The one failure is the expected diagnostic-browser gate; the skipped step is `Post Run actions/setup-node@v4`. All other setup, verification, package, upload, and cleanup steps succeeded.
- Full hosted log: `execution_state/reports/T02-BR02-MASS-READBACK-1-run-38142200238-github.log` (354,524 bytes; SHA-256 `B02B9CDA81AFFC75708E9E063D070F53ECE0545BEFDAA22E80FEB7984179C472`). Step metadata and uploaded-artifact inventory are adjacent JSON files with the run ID.

Downloaded artifact root: `execution_state/reports/T02-BR02-MASS-READBACK-1-run-38142200238-browser-evidence/`; hosted-check logs root: `execution_state/reports/T02-BR02-MASS-READBACK-1-run-38142200238-hosted-checks/`.

## Checks that passed

- `pnpm verify`: PASS. Typecheck, lint/format, all package tests and builds completed. Vitest reported 29 test files and 161 tests passed; no skipped unit tests were reported. Full log: `execution_state/reports/T02-BR02-MASS-READBACK-1-run-38142200238-hosted-checks/verify.log` (898,498 bytes; SHA-256 `C154E5E187F003CB538106F693F9DC78A81FF7E7E0D307DB444C4A796B5DA00F`).
- Production diagnostic-renderer exclusion: PASS.
- Dry-run Worker packaging, production browser build, separate diagnostic browser build and their artifact uploads: PASS.
- Integration: 1 test passed. Built-browser preview: 4 tests passed in 11.8 seconds.

## Real Chromium and Havok observation

The focused diagnostic suite executed in Chromium with zero skipped, zero retries, zero passed, and two failed tests (`expected: 0`, `unexpected: 2`, `skipped: 0`, `flaky: 0`; duration 245.95 seconds). Both tests performed the real pointer gesture and stopped before an impulse because `readBodyMetrics()` rejected the first entity, `button`. The exact visible browser message in both Playwright error contexts was:

```text
Real browser Havok/WASM diagnostic failed: Body button native mass 0.15000000596046448 differs from canonical configured mass 0.15 (absolute difference 5.960464483090178e-9; tolerance 1.4210854715202004e-14).
```

This is the actual browser getter readback, not the formatter test example. The pinned Havok asset `HavokPhysics-BqNY-4N9.wasm` was requested by Chromium and returned HTTP 200 with 2,094,563 response-body bytes in the direct-flick trace. In the retry test, the first request was intentionally aborted, then after route removal the second WASM request returned HTTP 200 with the same body size. This proves that the check ran with the real browser WASM artifact; it does not prove a completed trial.

The Playwright error context includes the accepted 15-piece scene facts: seven caps per side, one button, four visible button holes, green-concrete texture, and no enclosing walls. It shows the diagnostic in its stopped/error state. There is no `probe-result`, after-shot screenshot, body transform, contact, changed-pixel count, or successful impulse result. This run is a measured pre-shot failure, not a flick or playable match. Since the existing loop throws on the button first, all cap masses remain unmeasured and are explicitly outside this result.

The retry case recorded one intentionally blocked WASM request and a clean teardown for that initial failure: baseline engines 0, engines 0, listeners 0, resize observers 0, phase `failed`. The decoded attachment is `execution_state/reports/T02-BR02-MASS-READBACK-1-run-38142200238-wasm-failure-teardown.json` (SHA-256 `4AF816644B628B29FAA86B385929E0152FE659846B03E60DE80B8E1A050DD2C8`). It then loaded WASM successfully but reached the same button-mass error. Cleanup after that second failure was not captured, so retry teardown remains unverified.

## Preserved evidence and hashes

- Focused Playwright JSON: `execution_state/reports/T02-BR02-MASS-READBACK-1-run-38142200238-hosted-checks/browser-test-results-diagnostic.json` (18,923 bytes; SHA-256 `180EDFD5BD5D543F8CA6D0F3BEE94CB1BFAD8A385E7D632680204C745DB398F1`). Its stats say 0 passed, 2 unexpected, 0 skipped, 0 flaky.
- Diagnostic E2E log: `execution_state/reports/T02-BR02-MASS-READBACK-1-run-38142200238-hosted-checks/e2e-diagnostic.log` (7,345 bytes; SHA-256 `A538A8341902C73EF3FC63D19B2A213E7F91E9666916E1D71D00BA2C979138BC`).
- Real-flick browser error context: `execution_state/reports/T02-BR02-MASS-READBACK-1-run-38142200238-browser-evidence/test-results/counterball-direct-probe-a-5d5f3-anges-rendered-WebGL-pixels-chromium/error-context.md` (SHA-256 `17A4BBECA80083D19663AD70D00FA872514CEFD2BAFD22E161A86AEECAD2D474`). Its trace archive is `trace.zip` (SHA-256 `0528384AC296E773032718102738A74B007F3EEBC0C9F9E628F207146181B371`); its `1-trace.network` records the WASM 200 response (SHA-256 `7B48ED998CC0E7840CCA6E6BB3F27633D7A02E78ED5D0A2365E2D0CB30DFEF5E`).
- Retry browser error context: `execution_state/reports/T02-BR02-MASS-READBACK-1-run-38142200238-browser-evidence/test-results/counterball-direct-probe-a-427ff-leans-up-before-a-real-shot-chromium/error-context.md` (SHA-256 `5F9EAAA56476B4563E10491F77775BFDFE6089C260E784EB66B151124C69D056`). Its trace archive is `trace.zip` (SHA-256 `63E40153EAA27E3F8D5C96056C2FCB9CEDE95F35157B0A1F3B33A90F7914B96A`); its `1-trace.network` records the aborted request followed by the WASM 200 response (SHA-256 `DB09E7D230EE3DA3774544D0EA0A3F4F06D2A6D8CC5293480AA7BF146248DDCD`).
- Both before-gesture PNGs have SHA-256 `223994F54259139FA7BD97B70706D0692DBAA63DC362EB4C15238A9F2DD5E37D`; there is no after-gesture PNG.
- Downloaded artifacts are retained under the roots stated above. The complete artifact inventory is `execution_state/reports/T02-BR02-MASS-READBACK-1-run-38142200238-artifact-inventory.json` (SHA-256 `D707DCCFE719267396C47A41111F19FDEB3D839204654714D206CCBD4F1EE270`).

## Acceptance boundary and next step

The amended mass-readback card has its real numeric browser evidence and its hosted `pnpm verify` passed. The expected diagnostic suite did not pass because the guard correctly stopped before impulse; it must not be counted as a successful shot. The exact-run review is pending, so the card and T02/BR02 are not yet ACCEPTED. The next step after evidence review is a separately bounded, evidence-led native-mass comparison repair; do not widen the existing tolerance or claim any cap result from this run.
