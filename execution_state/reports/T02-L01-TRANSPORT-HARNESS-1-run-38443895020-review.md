# T02-L01-TRANSPORT-HARNESS-1 — run 38443895020 independent review

**Evidence review: PASS for the transport test and exact-run provenance. Overall workflow and diagnostic suite: FAIL.**

## Provenance and gate counts

GitHub identifies run `38443895020`, attempt `1`, branch `codex/remote-ci-bootstrap`, commit `92294c26713c54c585db5a40be1c8fb5060ffb32`, job `verify` (`115457155230`), with conclusion `failure`. The archived Playwright JSON independently carries the same commit hash and run URL. GitHub’s artifact API associates the browser-evidence artifact (`11836952611`) and hosted-checks artifact (`11838052138`) with this exact run and SHA.

The job snapshot totals **35 successful, 1 failed, and 4 skipped steps**. Step 31, “Run every produced local diagnostic browser suite,” failed. The three failure-only TypeScript diagnosis steps (14–16) were skipped because Verify passed; post-action 67 was also skipped. Verify, the production diagnostic-absence check, integration, production-preview browser tests, diagnostic bundle build/package, and artifact upload steps passed. The separate production-preview browser log reports 4/4 passing tests.

The diagnostic Playwright JSON reports **3 tests: 1 passed, 2 failed, 0 skipped, 0 flaky**; all have retry `0`. The full step failed because the direct-flick test and the blocked-WASM/retry test failed. The maximum synthetic transport test passed in `10,207 ms`.

## Transport result

The passing transport test ran from the exact commit and its result has no retry. At that source revision it asserts the ready export is synthetic and exactly `504,365,056` bytes, with `256 KiB` chunks, `1,924` chunks, and the expected deterministic pattern. It registers the browser download wait before clicking Download, saves the download to the host, streams it through a 64-KiB buffer, and checks exact byte length and SHA-256. It then submits the matching run/file/length/digest attestation, requires the host acknowledgement to return `true`, and checks the success status stating temporary storage was removed. The `finally` block cleans the browser export and host download, and throws if either cleanup fails. Since the test result is `passed`, these assertions and the cleanup path completed without a reported failure. No synthetic payload was attached.

Thus this exact run proves the full-cap synthetic browser-to-host transport test passed. It does not prove physics or a playable match.

## Other diagnostic failures and viewport evidence

The real pointer-flick test failed while polling for either its result or error element (`counterball-direct-probe.spec.ts:203`); neither appeared within 30 seconds. The trace records viewport `1280×720`, a drag at `x=309.4, y=891.226875`, and, at that action, page scroll top `279` with the canvas rect at top `230.34375` and bottom `719.9375`. The exact test source reads `canvas.boundingBox()`, then takes a canvas screenshot, then uses the earlier box to calculate the pointer coordinates. The trace therefore directly supports a stale-box scroll issue: after the screenshot's scroll, the recorded pointer Y is about 171 pixels below the viewport and canvas. This explains why the gesture did not produce the test's result/error signal; it is not a transport failure or evidence about Havok response.

The blocked-WASM/retry test separately failed because `probe-error` never appeared with the expected `Havok/WASM` text (`:326`). Its trace also records pointer input at `y=891.226875` in a `720`-pixel-high viewport, consistent with a missed off-screen gesture. The available evidence does not establish a separate WASM-loading or layout defect. Both direct-shot test failures remain real suite failures and must not be reported as passing flick/retry checks.

## Acceptance disposition

The original transport card requires the named full-cap test to complete in real Chromium with exact size/digest, cleanup, and no skips/retries. The diagnostic suite collected that named test and it passed with retry `0`; suite-level skips and retries were also `0`. **The transport-specific evidence satisfies those transport acceptance conditions**, alongside the prior independent source PASS at `execution_state/reports/T02-L01-TRANSPORT-HARNESS-1-review.md`. The overall workflow nevertheless remains red because two separate pointer tests failed. This review does not pass those tests, the diagnostic suite as a whole, T02, or any playability/physics gate. The coordinator should preserve the overall run failure while recording any acceptance strictly against the transport card’s stated scope.

## Evidence inspected

- Read-only `gh run view 38443895020` and GitHub artifact metadata for the exact run.
- `execution_state/reports/T02-L01-TRANSPORT-HARNESS-1-run-38443895020-artifacts/counterball-browser-evidence/.artifacts/browser-test-results-diagnostic.json`
- Exact run's `counterball-hosted-checks-.../e2e-diagnostic.log`, `e2e.log`, and `verify.log`.
- Error contexts and Playwright traces for the two failed diagnostic tests.
- Read-only source at `92294c26713c54c585db5a40be1c8fb5060ffb32` for the transport E2E and diagnostic component.
