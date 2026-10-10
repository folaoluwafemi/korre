# Current browser preview independent source review

Final verdict after coordinator lifecycle repair: **PASS — source review only.** Hosted verification remains pending. This does not accept parent T03 or T02.

## Repair re-review

The initial review below required changes. The coordinator subsequently added `doNotHandleContextLost: true` at `apps/web/src/CounterballPreview.tsx:339`; the actual one-file diff adds that option and its explanatory comment only. I independently inspected the updated source and pinned implementation. `Engines/abstractEngine.pure.d.ts:95` declares the option. `Engines/thinEngine.pure.js:184` guards the automatic restoration handler/listener behind `!this._doNotHandleContextLost`; its alternate branch retains only state invalidation on context loss. Consequently the preview now owns restoration: it stops application rendering on loss, waits for native restoration, and offers manual retry which disposes the old engine and creates another. The old engine no longer queues Babylon's asynchronous resource rebuild. This closes the source race described below, including the queued-rebuild-after-unmount path.

The declaration describes page reload for reusing an engine with this option; this preview instead replaces the engine entirely. Actual manual rebuild and capability-dependent context-loss behavior still require the pending hosted Chromium test. No local checks were run during re-review. No remaining concrete source defect was identified in the assigned scope.

## Initial finding — resolved by the repair above

### P2 — retry is enabled before the existing engine has finished context restoration

`apps/web/src/CounterballPreview.tsx:264` enables retry on the canvas's raw `webglcontextrestored` event. Its listener is registered at line 330, before the engine is constructed at line 331. Retry causes effect cleanup, which disposes the old scene and engine at lines 182–183, then constructs a replacement engine on the same canvas.

The actual pinned Babylon 9.30.0 implementation has another restoration stage: `node_modules/.pnpm/@babylonjs+core@9.30.0/node_modules/@babylonjs/core/Engines/thinEngine.pure.js:192` handles the same DOM event by calling `_restoreEngineAfterContextLost`. In `Engines/abstractEngine.pure.js:244`, that method queues a zero-delay timer which reinitializes the GL context and rebuilds graphics resources before notifying `onContextRestoredObservable` at line 241. That timer has no disposed guard or stored cancellation handle; engine disposal sets `_isDisposed` at line 1525 without cancelling this queued restoration.

Consequently, the application advertises retry readiness before the old engine's deferred resource rebuild completes. A retry or unmount in that interval disposes an engine which still has a queued callback capable of rebuilding resources afterward. This fails the T03 requirement in `knowledge_base/execution/TASKS.md:52` that disposal removes listeners/render-loop/resources, and does not establish the implementation report's claim of a clean rebuild after recovery.

This is a source control-flow finding, **not a reproduced browser failure**. A bounded regression can hold Babylon's deferred restoration callback, dispatch the restored event, and attempt retry/unmount before releasing that callback. The existing E2E test at `tests/e2e/counterball-preview.spec.ts:429` waits for the application's raw-event message and then retries; it does not establish that engine restoration has completed or that no old-engine callback survives disposal.

Repair the restoration ownership explicitly. With automatic engine restoration retained, enable retry only after Babylon's completion observable, detach that observer during cleanup, and account for disposal while restoration is queued. Waiting for the completion observable alone closes the premature-retry path but does not by itself prove the unmount path safe. Alternatively, choose an explicit browser-owned rebuild policy that prevents Babylon from scheduling an automatic rebuild. Add a focused lifecycle regression and keep capability-dependent Chromium coverage labelled accurately. No library source modification is requested.

## Source checks that are coherent

- Pointer drag, pinch, wheel, inspect/reset and native keyboard-accessible buttons change camera alpha/beta/radius/target only. Fixture body transforms and authority are untouched, consistent with `CONTRACTS.md:219`. The scene factory has no DOM input ownership or gameplay wiring.
- Demand rendering caps repeated input at 30 Hz, coalesces queued frames, and schedules a second draw through `scene.executeWhenReady` at component line 373. This handles the first draw preceding shader readiness. Hidden-page handling cancels application frame/timer work and requests a new draw on visibility return.
- Resize observation/window resize request redraw; the engine limits DPR to 1.5. The CSS wraps controls, contains the canvas, and confines `touch-action: none` to the canvas. Startup/render failures and ordinary unmount disconnect observers, remove application listeners and cancel application scheduling through a common idempotent cleanup path. The initial context-restoration exception is resolved at source level as described above.
- Native buttons, disabled states, camera instructions/live status, skip/navigation links, count text and a static scene description are present. Copy continues to state that the game is not playable. The existing 15-piece fixture, open green pitch, goals and four-hole geometry are preserved; no new cultural artwork or gameplay behavior is introduced.
- E2E source exercises real WebGL2, screenshot differences after camera actions, DPR/viewport bounds, resize, idle scheduling, unmount/remount and startup failure/retry. Pinch input is synthetic and the mobile viewport is Chromium emulation; neither proves a physical phone. The test annotates whether context-loss extension coverage actually executes.
- `playwright.config.ts` selects the existing built-directory server when `COUNTERBALL_PREBUILT_PREVIEW=1`; the GitHub workflow sets that variable for E2E after the verify/build step. The preview server serves `apps/web/dist` and does not build it. These are source assertions, not a claim that the new hosted job has passed.

## Evidence and checks

Inspected the current component, stylesheet, E2E suite, scene factory, implementation report, T03 requirements/shared invariants, built-preview configuration/server and pinned Babylon restoration implementation. Read/search commands obtained the source evidence; one malformed search invocation returned exit 1 and was replaced by a successful read/search invocation (exit 0).

No local test, build, typecheck, lint, formatter or server was run. No new screenshot was generated or independently inspected in this review. `pnpm verify`, `pnpm test:integration` and production-built `pnpm test:e2e --workers=1` are **NOT RUN here / pending hosted verification**. The author report accurately records this boundary. Actual screenshots, idle behavior and resource recovery still require that evidence after repair. PostgreSQL identity, physics measurements, deployed runtime and real-phone acceptance are outside this review.
