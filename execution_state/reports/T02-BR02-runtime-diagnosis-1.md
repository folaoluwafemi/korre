# T02-BR02 runtime diagnosis 1

**Verdict: CHANGES_REQUIRED.** The exact hosted browser run reached the diagnostic scene and pointer handler, but both attempts failed the same pre-shot Havok mass guard. The Playwright assertion is the final symptom: it waits for a success result while the component has rendered its error state. The injected WASM route was removed before retry; the saved retry trace records a successful WASM response, so a still-active route does not explain the retry failure.

## Exact run and acceptance boundary

Run `38139294487` completed with conclusion `failure` on SHA `de455a083c3ba718e439fa47146dc50e1948f512` (verified in `execution_state/reports/T02-BR02-run-38139294487-step-status.json`). Step 28, “Run every produced local diagnostic browser suite,” failed; the preceding Verify, production exclusion, integration, browser-preview and diagnostic-build/package steps succeeded. The extracted diagnostic E2E artifact selected only `tests/e2e/counterball-direct-probe.spec.ts`. Playwright reports two tests, zero passed, two failed, zero skipped, zero retries (`browser-test-results-diagnostic.json`; `e2e-diagnostic.log`).

BR02 requires an actual pointer flick in the separate diagnostic browser build to return measured real-browser Havok transforms and rendered pixel changes; the retry case must show the blocked-WASM error, cleanup, and then a successful real shot. This run proves neither shot nor pixel-change requirement, so it cannot satisfy BR02.

## What failed

In the ordinary test, the page reached the diagnostic route and its scene facts matched the expected 15 pieces, seven caps per side, four visible button holes, green concrete texture, and no enclosing walls. The saved error context for `a real pointer flick runs browser Havok and changes rendered WebGL pixels` shows the failure UI after the gesture:

- Alert: `Real browser Havok/WASM diagnostic failed: Body button native mass differs from its canonical configured mass.`
- Status: `The diagnostic stopped. Retry to rebuild WebGL and Havok.`
- Retry button is present.

Source explains the failure. `games/counterball/src/simulation/browserDirectProbe.ts:722-807` reads each dynamic body's Havok `getMassProperties()` and rejects a mass that differs from `definition.expectedMass` by more than `64 * Number.EPSILON * max(1, expectedMass)`. The button expectation comes from `COUNTERBALL_CONFIG_V1.bodies.buttonMass` (`:558-570`). `readBodyMetrics(world)` is called at `:1267`; the fixed impulse is applied later at `:1490-1493`. Therefore this specific failure occurs before applying the diagnostic shot impulse. The runtime error omits both the observed native mass and expected mass, so the size and underlying cause of the discrepancy are unknown from this evidence.

The browser trace confirms the app reached `data-phase="failed"` and presents the same error. `flickAndReadTrace()` then fails at `tests/e2e/counterball-direct-probe.spec.ts:110` because it waits up to 120 seconds for `[data-testid="probe-result"]`, which the component renders only after a successful result. The component's catch calls `fail()` (`apps/web/src/CounterballDirectProbe.tsx:407-410`); `fail()` sets the visible alert/status and disposes the scene and engine (`:268-274`). Thus the locator timeout is the test symptom. The concrete runtime blocker is the mass precondition, not a missing pointer gesture or a failed result-pixel assertion.

## Injected WASM failure and retry

The retry test installs a `**/*.wasm*` route that increments its counter and aborts the request (`tests/e2e/counterball-direct-probe.spec.ts:190-195`). Its trace records a GET for `HavokPhysics-BqNY-4N9.wasm` ending in `net::ERR_FAILED`; the visible error is `Failed to fetch`. The attached `counterball-wasm-failure-teardown.json` records `blockedWasmRequests: 1`, `engines: 0` against `baselineEngines: 0`, `activeListeners: 0`, and `activeResizeObservers: 0` in the failed phase. This is evidence that the intentionally blocked first attempt displayed an error and reached its tracked resource baseline.

The test explicitly removes the same handler with `page.unroute("**/*.wasm*", blockWasm)` before clicking Retry (`:236-237`). On retry, the trace's network log contains a second request for the same WASM asset with HTTP 200 and content size 2,094,563 bytes. After the page returns to `ready` and scene facts are checked, the test performs another pointer flick (`:238-244`). Its error context again shows the native button-mass mismatch, and the trace shows the failed phase. Therefore the saved evidence rules out the original route handler continuing to abort the retry request. The retry gets past WASM initialization and fails at the same later mass guard.

The test stops waiting for `probe-result` before it reaches its later unmount and retry-teardown assertions (`:244-253`). The component's failure path calls disposal, but this run does not provide a post-retry lifecycle assertion/attachment. Only cleanup after the intentionally blocked first request is directly measured here; post-retry resource-baseline status remains unverified by this test artifact.

## Evidence and limits

Reviewed the exact run status, full GitHub log, hosted diagnostic E2E log/results, both Playwright error contexts, both `trace.zip` files, and the extracted browser-evidence inventory under `execution_state/reports/T02-BR02-run-38139294487-artifacts/`. The normal trace shows a successful WASM fetch followed by the mass-guard error. The retry trace shows the failed intercepted fetch, the route-removal/retry sequence, a successful second WASM fetch, and the same mass-guard error. Each test has a `direct-probe-before.png`; neither reached the successful result path that attaches after-shot pixels or serialized shot transforms.

No tests, builds, or browser sessions were run for this diagnosis. No source or configuration was changed. The current artifact does not log actual/expected native button mass, so it cannot tell whether the configured value, shape-derived Havok mass, or the strict comparison is the underlying mismatch. It also does not prove collision, cap/button motion, settled transforms, rendered pixel changes, or post-retry resource cleanup. Those require a separately reviewed fix to the mass/configuration premise and a fresh exact-head hosted BR02 run.

## Exact evidence paths

- Acceptance record: `knowledge_base/execution/completion/LOCAL_PACKETS.json:468-518`.
- Exact run/job status and SHA: `execution_state/reports/T02-BR02-run-38139294487-step-status.json`.
- Full run log: `execution_state/reports/T02-BR02-run-38139294487-github.log`.
- Diagnostic output and structured result: `execution_state/reports/T02-BR02-run-38139294487-artifacts/counterball-hosted-checks-de455a083c3ba718e439fa47146dc50e1948f512-run-38139294487-attempt-1/e2e-diagnostic.log` and `.../browser-test-results-diagnostic.json`.
- Ordinary test context/trace: `execution_state/reports/T02-BR02-run-38139294487-artifacts/counterball-browser-evidence/test-results/counterball-direct-probe-a-5d5f3-anges-rendered-WebGL-pixels-chromium/error-context.md` and the sibling `trace.zip`.
- Retry test context/trace: `execution_state/reports/T02-BR02-run-38139294487-artifacts/counterball-browser-evidence/test-results/counterball-direct-probe-a-427ff-leans-up-before-a-real-shot-chromium/error-context.md` and the sibling `trace.zip`. The retry trace also contains the first-failure `counterball-wasm-failure-teardown.json` attachment.
