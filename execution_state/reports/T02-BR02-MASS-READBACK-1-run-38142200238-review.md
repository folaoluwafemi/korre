# T02-BR02-MASS-READBACK-1 run 38142200238 evidence review

**Verdict: PASS for the accuracy and provenance of the captured evidence.** This does not pass the diagnostic browser suite or accept BR02/T02: the hosted run failed at the intended pre-shot mass guard.

## Run identity and workflow

The saved step metadata records run `38142200238`, head SHA `bf80bfb028310e77005e74a5b9c41c00bfbe9b98`, and overall conclusion `failure`. Its sole `verify` job has 35 successful steps, one failed step (`Run every produced local diagnostic browser suite`), and one skipped post-step (`Post Run actions/setup-node@v4`). The report's full-log SHA-256 matches the recorded value `B02B9CDA81AFFC75708E9E063D070F53ECE0545BEFDAA22E80FEB7984179C472`. The artifact inventory names the run-specific hosted-checks, diagnostic bundle, browser evidence, Worker, production-browser, and preview artifacts; the observed failures and records are present in the downloaded evidence.

The hosted verification log reports `pnpm verify` passed (29 test files, 161 tests), integration passed (1 test), and built-preview E2E passed (4 tests). These passing checks do not supersede the failed diagnostic step.

## Browser/WASM and mass evidence

Both saved `1-trace.network` files contain actual Chromium HeadlessChrome requests to `http://127.0.0.1:5173/assets/HavokPhysics-BqNY-4N9.wasm`, with response `200`, MIME `application/wasm`, and `Content-Length`/body size `2,094,563` bytes. The direct-flick trace contains one successful response. The retry trace contains the expected first aborted request (`net::ERR_FAILED`) followed by a second successful 200 response of the same size. The network-file SHA-256 values match the hosted report: direct `7B48ED998CC0E7840CCA6E6BB3F27633D7A02E78ED5D0A2365E2D0CB30DFEF5E`; retry `DB09E7D230EE3DA3774544D0EA0A3F4F06D2A6D8CC5293480AA7BF146248DDCD`.

Both Playwright error contexts show the same browser-observed readback:

| Field | Value |
|---|---:|
| Configured button mass | `0.15` |
| Native button mass | `0.15000000596046448` |
| Absolute delta | `5.960464483090178e-9` |
| Existing rejection tolerance | `1.4210854715202004e-14` |

The diagnostic JSON records 2 unexpected failures, 0 passes, 0 skipped tests, and 0 flaky/retried tests; each test result has `retry: 0`. Both failures are the expected `probe-result` wait timing out after the page displays the native-mass guard alert. In the current source, `readBodyMetrics(world)` runs at line 1283, before `selectedBody.applyImpulse(...)` at line 1506. It iterates `ENTITY_IDS`, whose canonical order begins with `button`; the first button mismatch throws before reading any cap masses. Therefore the cap masses are **unmeasured**, and no shot result follows from this run.

The contexts retain the expected static-scene facts (15 pieces, 7 caps per side, one button, four visible holes, open pitch with zero enclosing walls). They contain no `probe-result`, after-shot screenshot, successful transforms, contact result, changed-WebGL-pixel count, or applied-impulse result. This is real browser WASM and a real native button getter observation, but it is not a completed physics trial, flick, or playable-match proof.

## Cleanup evidence boundary

The `counterball-wasm-failure-teardown.json` attachment belongs to the deliberately blocked initial WASM request. It records one blocked request, phase `failed`, baseline/current engine counts of `0/0`, zero active listeners, and zero resize observers. That supports cleanup for the initial WASM-load failure only. The retry then successfully loaded WASM and failed at the same button-mass guard. No lifecycle snapshot after this second failure was captured, so cleanup after the retry mass failure remains **unverified**.

No local app command was run for this review. The run is valid evidence for the browser-native mass discrepancy and the current guard behavior; it is not a successful diagnostic run and does not establish cap mass values or retry-failure cleanup.
