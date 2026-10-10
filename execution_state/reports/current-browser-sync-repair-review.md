# Browser resize/context synchronization repair — independent review

**Source verdict: PASS. Runtime verdict: PASS for the bounded repair, verified in the final hosted addendum below.** No parent-task acceptance or physical-phone proof is claimed.

Reviewed the exact one-file diff in `tests/e2e/counterball-preview.spec.ts`, `current-browser-sync-repair.md`, run-25 JSON results and its two actual error contexts, the existing render-wait helper, and relevant primary API documentation. No production component, CSS, fixture or physics code changes are included.

## Historical evidence

Run `38057030306` / `3ef3e784151ac68fee293f1001346f0d71496725` recorded a mobile backing-width assertion of expected ≤524 versus observed 1821 on its initial attempt; that test passed on retry and its JSON status is **flaky**, not an unconditional clean pass. The context-loss test's JSON annotation says the extension was supported; both attempts failed waiting 15 seconds for restored status. Its error context still shows the lost-context message. The ordinary scene/remount and home tests passed. This evidence is a diagnosis input, not a pass for the current repair.

## Independent source findings

- **Resize synchronization measures real backing dimensions.** After each viewport change, the test waits for a new animation-frame request and an empty pending-frame set using the unchanged helper, then polls actual canvas `width`/`height` against current CSS bounds and `min(devicePixelRatio, 1.5)`. CSS and backing dimensions must all be positive. This prevents a zero-size canvas from satisfying the cap. Original exact viewport sizes, document/body no-horizontal-overflow checks, and both original backing-dimension cap assertions still run afterward. The test does not replace them with an attribute, remove the 1.5 limit, alter the existing +2-pixel rounding allowance, skip a viewport or change product sizing.
- **The wait is bounded without an increased deadline.** Added `expect.poll` calls retain the default bounded assertion timeout; neither the existing 60-second test timeout nor the render helper's assertions are changed. Polling acknowledges the asynchronous resize/render lifecycle while continuing to fail if real buffers never settle within the same cap. The reported immediate stale backing width is consistent with this missing synchronization; actual recovery remains to be executed.
- **The retained handle matches WebGL semantics.** `canvas.evaluateHandle` obtains the extension before losing the context. Its Boolean capability check handles null; when supported, both `loseContext()` and `restoreContext()` execute against that same browser object via `JSHandle.evaluate`, without another post-loss extension lookup. The extension remains connected across loss, and restoration is asynchronous with a real restored event; the test correctly waits for lost UI before requesting restore and for restored UI afterward. These semantics are specified by [Khronos WEBGL_lose_context](https://registry.khronos.org/webgl/extensions/WEBGL_lose_context/). Playwright's [JSHandle API](https://playwright.dev/docs/api/class-jshandle#js-handle-evaluate) documents passing the referenced in-page object to the callback and explicit disposal.
- **This exercises native recovery rather than synthesizing events.** The patch invokes actual extension methods. Lost alert, disabled retry, restored alert, enabled retry, actual manual restart and real WebGL2 afterward remain strict requirements. The handle is released in `finally` across success/failure. Unsupported-extension coverage retains its annotation and does not claim the recovery branch executed. The cast describes the native object's two methods; it does not supply fake methods.
- **Other meaningful assertions are preserved.** Real camera screenshot differences, HTML/keyboard controls, synthetic pinch, strict seven-plus-seven count/scene checks, initial unsupported preflight failure, later partial-constructor failure, listener/frame baselines, zero leaked registry entries and successful retry with one actual engine remain unchanged. Scroll normalization and final home/inspect reachability checks are retained. No assertion is weakened or conditionally skipped beyond the already-existing capability branch.

No concrete source defect was identified in this bounded synchronization repair. The author's report accurately marks the new runtime checks pending and does not turn the historical retry into proof of the repair.

## Verification boundary

Read-only diff/source/artifact inspection and bounded JSON result analysis only. No local test, build, formatter, lint, typecheck, install, server or application process was run. No agent was spawned; only this report was written.

Fresh hosted evidence must show Verify/integration success and all four production-built E2E tests' actual statuses/attempts, plus whether context-loss recovery executed. Inspect the JSON report and actual screenshots before runtime PASS. Browser emulation/synthetic input remain distinct from physical-phone acceptance. A runtime addendum can be written here after the coordinator provides the new run/artifacts.

## Final hosted runtime addendum

Independently queried [run 38057543954](https://github.com/folaoluwafemi/korre/actions/runs/38057543954) and confirmed completed/success for commit `22a7375e1b57a01d1bd91e23f18749ed7096d4a8`. The downloaded `.artifacts/final-status.json` records successful Verify, integration, built-browser testing and evidence/build uploads. Current reviewed component/spec/browser export/Playwright configuration have no diff from that hosted commit.

Independently parsed `.artifacts/final-browser/.artifacts/browser-test-results.json`: expected=4, skipped=0, unexpected=0, flaky=0, no global errors. Every test has exactly one passed result with retry=0 and no result errors:

- Real scene, idle scheduling, cleanup/remount: 2,840 ms.
- WebGL startup failure, native context loss/recovery, partial constructor failure/retry: 2,691 ms.
- Mobile orbit, keyboard, touch zoom and resize: 5,739 ms.
- Home/static-build identification: 269 ms.

The JSON server configuration is `node scripts/serve-preview.mjs apps/web/dist 5173`, with reuseExistingServer=false. Thus this is the remotely built production preview, not a local development server. The recovery test's annotation explicitly records `WEBGL_lose_context supported; exercising loss and recovery.` With that true branch and the passing test body, actual extension loss/restore, disabled retry while lost, restored status, manual retry and real WebGL2 afterward executed. Its unconditional subsequent partial-constructor cleanup/retry assertions also executed; they were not bypassed by a missing capability.

The mobile test passed without retry after both resize transitions and retained the actual positive backing-buffer/DPR, exact viewport, no-overflow, camera-image and final page-start reachability assertions. The earlier flaky stale-buffer failure is resolved for this hosted attempt, without weakening its bound.

I opened all three actual PNGs under `.artifacts/final-browser/execution_state/reports/`. `T03-preview.png` shows the whole bright green open pitch, both goals/markings and seven distinct caps on each team. `T03-inspection.png` visibly renders the button's four open holes against the pitch. `T03-narrow-viewport.png` shows wrapped readable controls/navigation and scene canvas at the mobile width; its custom camera crops parts of the pitch as expected after orbit/zoom, rather than claiming to be a whole-pitch shot. Static/nonplayable copy is visible. Full-page screenshots alone do not establish viewport reachability; the passing strict assertions supply that evidence.

**Runtime verdict: PASS for the synchronization repair and current static preview's tested browser behavior.** Mobile evidence remains 390×844 Chromium device emulation with synthetic pinch, not an actual phone. It proves no playable match, production deployment, successful physical loft, or parent T02 completion. No local tests/builds/services were run during this review; only the assigned reports were changed.
