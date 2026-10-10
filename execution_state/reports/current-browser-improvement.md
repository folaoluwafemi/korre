# Current browser preview improvements

## Changes

- `apps/web/src/CounterballPreview.tsx` keeps the fixture-driven Babylon scene and adds browser-consumer pointer drag orbit, two-finger pinch zoom, wheel zoom, and keyboard-accessible camera buttons. The factory remains free of DOM input wiring. The visible copy still states that this is a static preview and that the game is not playable.
- The camera controls do not change fixture bodies. Camera updates request an on-demand draw, capped at 30 frames per second during repeated input. The engine caps device pixel ratio at 1.5, stops queued drawing while the page is hidden, and requests another frame when the scene becomes ready or its size changes.
- Startup and render failures disable camera controls, clear scene references, dispose engine/listeners, and offer retry. WebGL context loss reports a waiting state; a restored context enables a clean rebuild. Normal unmount and retry use the same cleanup path.
- The preview includes a skip link, a text description of the scene, camera instructions, and a live camera status. `apps/web/src/styles.css` limits `touch-action: none` to the canvas, so browser navigation and scrolling remain available outside the scene.
- `tests/e2e/counterball-preview.spec.ts` checks real WebGL 2 rendering, pixel changes after inspect/orbit/keyboard/pinch camera input, mobile dimensions and DPR cap, no horizontal overflow after resize, an idle frame queue, unmount/remount cleanup, and a forced WebGL startup failure followed by retry. Context-loss/recovery is exercised when Chromium exposes `WEBGL_lose_context`; the test result is annotated with the actual capability.

## Verification

No local build, test, lint, typecheck, formatter, or server command was run, as required by the packet. The following hosted checks are pending coordinator execution:

- `pnpm verify`
- `pnpm test:integration`
- `pnpm test:e2e --workers=1`

The E2E suite will save actual browser screenshots to `execution_state/reports/T03-preview.png`, `execution_state/reports/T03-inspection.png`, and `execution_state/reports/T03-narrow-viewport.png` when it runs. These screenshots have not been generated in this implementation turn. Mobile coverage is Chromium device emulation, not a real-phone check.

No implementation claim is made for checks that have not run. Hosted review may still reveal compatibility or timing issues, especially for WebGL context-loss support and scene-readiness timing.
