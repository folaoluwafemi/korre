# Run 22 browser repair

## Scope and evidence

Reviewed the run 22 Playwright error contexts under `.artifacts/run22-browser/test-results/`, the E2E spec, the preview component/styles, and the pinned Babylon 9.30.0 engine source. The observed CSS file is `apps/web/src/styles.css`.

The mobile error context records the `Inspect four-hole button` locator at viewport ratio 0 only after the test has interacted with the controls and canvas, resized from 390×844 to 1280×900 and back, then checked visibility without resetting the document scroll position. The same test had already checked the 390×844 dimensions, horizontal overflow, and capped canvas pixel dimensions. This is a test scroll-state leak; I found no evidence in the run artifact that the narrow layout itself caused horizontal overflow or made the control unreachable. The test now returns to scroll position 0 before retaining the strict in-viewport checks for both the home link and inspect control. The overflow and DPR assertions remain unchanged. No CSS edit was needed.

The run 22 startup-failure error context shows the scene rendered and no alert appeared. The pinned engine source explains why: `thinEngine.pure.js` requests `webgl2` then `experimental-webgl2` at line 210, and `webgl` then `experimental-webgl` at line 230. The previous test hook blocked names beginning with `webgl`, but not names beginning with `experimental`, so Babylon could use its fallback. The hook now blocks all four documented context names, and only on the canvas carrying `data-testid="counterball-canvas"`. Other canvases are untouched, and a `2d` request on the preview canvas also falls through to the original method.

## Changes

- `tests/e2e/counterball-preview.spec.ts`: reset scroll after the viewport returns to 390×844, then assert the home link and inspect control are both in view. Existing no-overflow and device-pixel-cap checks remain intact.
- `tests/e2e/counterball-preview.spec.ts`: cover both WebGL2/WebGL names and both `experimental-*` fallbacks, scoped to the preview canvas. The test still restores WebGL before retrying and retains its real context-loss/recovery path.
- `apps/web/src/CounterballPreview.tsx` and `apps/web/src/styles.css`: inspected; unchanged. In particular, the component retains `doNotHandleContextLost: true`.

## Verification

No local build, test, formatter, install, or server command was run, as required by the packet. Hosted verification is pending. The expected hosted evidence is all four E2E tests passing, including real WebGL rendering, mobile camera/overflow/reachability, startup failure and retry, and supported context-loss recovery.
