# Current browser/scene audit

**Result: actionable preview repairs recommended before user testing.** Review was read-only. No local build, test, lint, typecheck, formatter, or server command ran.

## Findings

1. **The static scene renders continuously and at uncapped device pixel ratio.** `apps/web/src/CounterballPreview.tsx:80-110` creates a high-DPI Babylon engine and starts `engine.runRenderLoop` for a scene with no simulation or animation. The only view changes are the two React camera presets; resize is the other redraw trigger. This spends GPU/CPU and battery while a visitor reads the page, with more pixels on high-DPI phones. Stop continuous rendering while idle; request frames for first paint, camera input/preset changes, resize, and recovery, and pause while the document is hidden. Keep the genuine WebGL preview.

2. **Camera inspection is restricted to two presets.** `games/counterball/src/scene/createScene.ts:23-34` creates an ArcRotateCamera but never attaches pointer/touch controls. `CounterballPreview` only offers a close-button view and return-to-pitch button. This is a usability limit for inspecting the pitch/caps from other angles, not a missing flick or match feature. Add orbit/pinch/zoom for the preview and equivalent labeled HTML camera buttons so the view remains usable without a pointer. Preserve the existing reset/inspect controls.

3. **WebGL startup/context failure has no recovery path and can retain stale camera state.** `CounterballPreview.tsx:72-76, 112-120` disposes the attempted engine/scene and shows an alert on constructor/setup failure, but it does not clear `sceneReady`, `cameraRef`, or `fullPitchViewRef`. Under React StrictMode's setup-cleanup-setup cycle, if an earlier setup succeeded and the next setup fails, those refs can still point to the disposed camera and the view buttons can remain enabled. There is no retry affordance, and the component does not report WebGL context loss after setup. Clear readiness/refs on each lifecycle boundary; expose an accessible retry/fallback state and handle context loss before returning to a real rendered scene.

4. **The preview route has weaker screen-reader navigation and image description than the home page.** `App.tsx:35-51` returns the preview route before rendering the home route's skip link. The preview then has a header followed by main content without a jump-to-main link. Its canvas accessible name (`CounterballPreview.tsx:245-251`) gives only the item count; its description says only that the page is static. Add a preview skip link and a concise visual description of the open green pitch, goals/markings, seven caps per side, and four-hole button. Do not add cultural or gameplay claims.

The viewport metadata is present, buttons have 44px minimum height, and the current E2E checks 390×844 overflow and the real WebGL2 context. The lifecycle test checks route unmount/remount and window resize-listener cleanup. Those are useful existing checks. The test does not cover direct-route skip navigation, camera orbit/touch/keyboard controls, idle rendering, or failed-WebGL recovery. I found no current preview defect in the SDK lifecycle wrapper; `packages/ui` and `packages/identity-client` are scaffold exports, and their unfinished planned features are outside this preview audit.

## Bounded repair packet proposal

Limit implementation to these three files:

- `apps/web/src/CounterballPreview.tsx` — add on-demand/visibility-aware rendering, pointer/touch camera inspection plus accessible view controls, lifecycle reset/retry/context-loss handling, preview skip link, and canvas description.
- `apps/web/src/styles.css` — style any added HTML controls/fallback and preserve visible focus and mobile target size.
- `tests/e2e/counterball-preview.spec.ts` — verify actual Chromium WebGL2 rendering; keyboard skip link and labeled controls; pointer and touch camera changes at 390×844 with no overflow; no idle render loop; redraw after resize/view changes; unmount/remount cleanup; forced WebGL initialization failure followed by retry; and graceful context-loss reporting/recovery where the browser extension is available.

Required CI checks after implementation: `pnpm.cmd verify` and `pnpm.cmd test:e2e --workers=1`. Keep the screenshot assertion on the actual Chromium canvas. This packet would improve the preview only; it must not add flick, scoring, match, or identity behavior. Real Android/iOS performance and compatibility still need later device testing.
