# T03 implementation report

## Result

The local `/preview` route renders the canonical initial Counterball formation in a real Babylon.js scene. It shows the open green concrete pitch, both goals, fourteen caps, and the four-hole clothing button. The home page links to the preview; the preview is labelled as static and not playable. No flick controls or match behavior were added.

The browser package exports the scene factory and presentation types. The scene factory accepts canonical fixture body states, so the preview does not define a second formation. The preview component owns its Engine, Scene, render loop, `ResizeObserver`, and window resize listener. Its cleanup stops the loop, disconnects/removes listeners, and disposes the Scene and Engine.

The canvas has an accessible image role and a label with the 15-piece count (7 home caps, 7 away caps, 1 four-hole button), plus a description that identifies the static preview. The E2E test visits the real route, verifies a WebGL 2 context and visible canvas, saves a browser screenshot, navigates away to prove the canvas/render loop/listener are removed, and remounts the preview to prove it starts again.

The screenshot was captured from headless Chromium using the fresh local Vite server and is available at [T03-preview.png](T03-preview.png). It is 163,732 bytes. Chromium logged Babylon.js 9.30.0 with WebGL2; the passing E2E also reads the canvas context version directly. This is local browser evidence only, not deployed Havok or mobile-device proof.

## Packet work

- **T03-A:** Added the scene factory, canonical open pitch, markings, two open goals, and warm procedural materials in `games/counterball/src/scene/`. The ground and field dimensions come from the shared configuration. The green grain texture, warm lighting, pale markings, and goal-frame finish are presentation choices and remain tunable; they are not new gameplay or cultural rules.
- **T03-B:** Added presentation meshes from supplied body states for all 15 stable IDs. The button has four actual openings in its mesh. Home and away caps use different colors and different geometric cues. Physical dimensions remain sourced from the shared config.
- **T03-C:** Exposed the browser scene API, added the lazy-loaded `/preview` route and accessible static preview, and added the real-browser lifecycle/screenshot test. `scaffoldPackage` remains exported from the browser entry so the existing public-entrypoint test continues to pass.

## Checks actually run

| Command | Result |
| --- | --- |
| `pnpm.cmd --filter @korre/counterball typecheck` | PASS, exit 0 after restoring the browser entry’s `scaffoldPackage` sentinel. |
| `pnpm.cmd --filter @korre/counterball test` | PASS, exit 0; 6 files and 15 tests. |
| `pnpm.cmd --filter @korre/web typecheck` | PASS, exit 0. |
| `pnpm.cmd --filter @korre/web test` | PASS, exit 0; 1 file and 1 test. |
| `pnpm.cmd test:e2e --workers=1 --reporter=line` | PASS, exit 0; 2 Chromium tests. The scene test verified WebGL 2, the accessible fixture count, screenshot capture, unmount cleanup, and remount. It ran against a newly started local Vite process after the stale preview server was stopped. |
| `pnpm.cmd exec eslint apps/web/src/CounterballPreview.tsx tests/e2e/counterball-preview.spec.ts --max-warnings=0` | PASS, exit 0. |
| `pnpm.cmd lint` | **FAIL, exit 1.** ESLint reports 19 existing/out-of-packet findings: missing `URL`/`process` globals in `apps/api/scripts/migrate.mjs`; missing `NodeJS` globals in `apps/api/src/config.ts` and `config.test.ts`; unused `Vector3` in T03-B’s `games/counterball/src/scene/pieces.ts`; and four `require-await` findings in `tests/integration/health.test.ts`. The lint script stops before its Prettier check. T03-C paths have no findings in the full lint output. |

The first cold E2E run exceeded Playwright’s default five-second expectation while the lazy Babylon chunk initialized. A fresh server/one-worker run confirmed the chunk resolves and WebGL2 is available. The test now gives the initial route a bounded 30-second wait and a 60-second test budget. That run exposed and fixed numeric lifecycle snapshots being called as functions; the final E2E run passed.

## Limits and handoff

This is a static browser scene preview. It does not implement flicking, physics, match rules, AI, online play, user accounts, deployed Cloudflare Havok, or real-phone compatibility. The full root lint gate remains open because of the findings listed above; do not mark T03 accepted until the owning paths are repaired and the independent T03 review is complete.
