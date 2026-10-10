# T03 repair 1 implementation report

## Result

The preview now has accessible **Inspect four-hole button** and **Return to full pitch** controls. Inspection moves the existing Babylon ArcRotateCamera toward the fixture-backed button and aims at that button's fixture position. Returning restores the saved full-pitch camera state. This changes only the view: fixture transforms, geometry scale, and gameplay state stay unchanged. The preview remains static and labelled not playable.

The desktop Chromium inspection screenshot plainly shows all four open holes in the existing button mesh. The same browser flow returns to the complete pitch. A second browser pass resizes the mounted scene to 390×844, confirms the piece count and both controls remain visible, measures document and body widths at no more than 390 pixels, and saves the narrow screenshot. The previous disposal/remount E2E remains in place and passed.

The unused `Vector3` import was removed from `pieces.ts`.

## Browser evidence

- [T03-inspection.png](T03-inspection.png) — actual headless Chromium WebGL2 screenshot, captured with browser viewport 1280×900 and the button inspection view active. All four through-holes are plainly visible at close scale.
- [T03-narrow-viewport.png](T03-narrow-viewport.png) — actual headless Chromium screenshot captured at browser viewport 390×844 after resizing the mounted preview. The full-page image shows the piece summary, inspection and return controls, full pitch, and footer. E2E measured both document and body width at or below the 390-pixel viewport width.

These are browser-emulation results; they do not establish physical phone compatibility.

## Checks actually run

Commands ran separately from `C:\Users\USER\StudioProjects\korre`.

| Command | Result |
| --- | --- |
| `pnpm.cmd --filter @korre/counterball typecheck` | PASS, exit 0. |
| `pnpm.cmd --filter @korre/counterball test` | PASS, exit 0; 6 files and 17 tests. |
| `pnpm.cmd --filter @korre/web typecheck` | PASS, exit 0. |
| `pnpm.cmd --filter @korre/web test` | PASS, exit 0; 1 file and 1 test. |
| `pnpm.cmd test:e2e --workers=1 --reporter=line` | PASS, exit 0; 3 Chromium tests. This was run with one worker against a freshly launched local Vite server. It verified WebGL2, the close inspection view, the return view, the 390×844 resize/no-overflow checks, screenshots, and the existing disposal/remount behavior. |
| Exact packet ESLint command including `apps/web/src/styles.css` | ESLint returned exit 1 with zero code errors and one warning: `styles.css` was ignored because no matching ESLint configuration was supplied; `--max-warnings=0` makes that command fail. |
| Supported-file ESLint command, omitting only CSS | PASS, exit 0: `pnpm.cmd exec eslint games/counterball/src/scene/createScene.ts games/counterball/src/scene/pieces.ts apps/web/src/CounterballPreview.tsx tests/e2e/counterball-preview.spec.ts --max-warnings=0`. |
| `pnpm.cmd exec prettier --check games/counterball/src/scene/pieces.ts apps/web/src/CounterballPreview.tsx apps/web/src/styles.css tests/e2e/counterball-preview.spec.ts` | PASS, exit 0; all changed source/test files are formatted. |

The full root lint remains outside this repair packet. The scoped supported-file ESLint check passes; CSS linting needs a repository ESLint configuration if CSS lint is desired.

## Limits

The inspection action only changes the camera view. It adds no flick, shot, physics, or match control. The hole appearance is verified in the actual browser screenshot and the underlying geometry tests; this repair does not claim deployed Havok or real-device verification. Stop here for independent review.
