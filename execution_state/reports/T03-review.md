# T03 independent review

Verdict: **CHANGES_REQUIRED**. Parent T03 is not accepted. This review concerns static browser presentation only; it does not establish flicking, rules, physics, online play, deployment, or real-phone compatibility.

## Evidence inspected

Read TASKS.md T03; the T03-A, T03-B, and T03-C packets; `T03-implementation.md`; all scene implementation/test files; the browser export, preview component, app routing/styles, and real-browser E2E. Inspected the actual `execution_state/reports/T03-preview.png` at its ordinary desktop scale. Reran the package tests and real Chromium E2E below. No source was changed and no mock/Node rendering was used as screenshot evidence.

The screenshot shows bright green procedural concrete, open perimeter, both open goal frames, both penalty boxes, seven home caps and seven away caps. Home stripes and away medallion/rosette geometry distinguish the teams beyond colour. Geometry tests verify canonical pitch dimensions, goal clear openings, boxes, fifteen stable IDs, exact fixture positions/quaternions, and four actual button through-holes using rays that miss both the body and its detail meshes. The scene reads shared geometry and the preview imports the fixture instead of defining another formation. Materials and motifs are original procedural work, with no downloaded trademark artwork. No gameplay controls, adjudication, physics, or extra cultural rules were added.

The accessible canvas name and visible count correctly state 15 pieces, 7+7 caps and 1 four-hole button. The static/not-playable note is clear. Browser source owns its Engine/Scene, render loop, ResizeObserver and window listener. Its normal cleanup disconnects/removes observers/listeners, stops the render loop, and disposes scene/engine. The Chromium test verifies WebGL2, accessible label, removal of canvas, return of tracked pending animation frames and resize listeners to baseline, and a working remount. Geometry-only NullEngine tests are used appropriately as geometry evidence, not physics proof.

## Required changes

1. **Provide and prove ordinary browser inspection of the perforated button.** TASKS.md T03 requires “hole detail visible at normal inspection zoom”; T03-B requires “four obvious visible clothing-button holes at ordinary inspection zoom.” The desktop screenshot shows the button as a tiny centre dot, so four holes cannot be distinguished. `games/counterball/src/scene/createScene.ts:28-40` fixes the camera at radius 28 with a minimum radius of 18. Neither that factory nor `apps/web/src/CounterballPreview.tsx` attaches camera controls or exposes an inspection view. Thus the user has no implemented way to inspect the real button at the required scale. The passing hole-ray geometry test proves openings exist, but does not satisfy this visual acceptance. Supply a bounded presentation-only inspection view or camera facility and capture actual Chromium evidence where all four holes are plainly visible, preserving fixture scale and the non-playable scope. Include usable narrow-viewport/resize evidence: the existing E2E uses only Desktop Chrome, so mobile recognizability and resize/HUD fit remain unverified rather than passed. No physical phone proof is claimed or demanded here.

2. **Repair the T03-owned lint finding before the parent gate closes.** `games/counterball/src/scene/pieces.ts:8` imports unused `Vector3`. A direct independent ESLint rerun confirms this exact error. It belongs to T03-B's assigned write scope, so it should not be described solely as an out-of-packet issue for parent T03. Remove the unused import and verify the appropriate lint/format checks. The coordinator also needs the separate root-owned/API/integration lint repairs before root lint can pass.

## Commands actually run

Workspace: `C:\Users\USER\StudioProjects\korre`.

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm.cmd --filter @korre/counterball test` | 0 | 6 files, 15 tests passed. |
| `pnpm.cmd --filter @korre/web test` | 0 | 1 file, 1 test passed. |
| `pnpm.cmd test:e2e` | 0 | 2 Chromium tests passed with 2 workers, including real WebGL2 scene, screenshot, cleanup and remount. |
| `pnpm.cmd exec eslint games/counterball/src/scene/pieces.ts --max-warnings=0` | 1 | One error: unused Vector3 at line 8. |

The implementation report separately records `pnpm.cmd lint` exit 1 with 19 findings in API migration/config, T03 pieces, and integration health tests. I did not rerun full root lint; its reported failure remains open, and the T03-owned subset is independently confirmed above. Typecheck passes in the implementation report were not independently rerun in this review. Mobile viewport/low-quality visual and inspection-scale screenshot checks were not run because the current preview lacks the inspection facility. Do not convert these missing checks into PASS or accept parent T03 on the strength of the existing desktop E2E alone.
