# T03 repair 1 — make button details inspectable and close T03 lint

Coordinator: `/root`. Repair author: `/root/foundation_review`. Independent reviewer: `/root/swarm_review` after implementation. The findings are from `execution_state/reports/T03-review.md`.

## Exact write paths

- `games/counterball/src/scene/createScene.ts`
- `games/counterball/src/scene/pieces.ts`
- `apps/web/src/CounterballPreview.tsx`
- `apps/web/src/styles.css`
- `tests/e2e/counterball-preview.spec.ts`
- `execution_state/reports/T03-inspection.png` (actual Chromium inspection-scale screenshot)
- `execution_state/reports/T03-narrow-viewport.png` (actual Chromium narrow viewport screenshot)
- `execution_state/reports/T03-repair-1-implementation.md`

Do not edit contracts, fixture, workspace manifests, physics/rules, shared status/ledger, or unlisted files. Keep the preview static and explicitly non-playable; no flick or gameplay controls.

## Required result

1. Add an accessible, presentation-only way to inspect the actual fixture-backed four-hole button at a useful scale, with a clear return to whole-pitch view. It must use the existing Babylon scene/camera and real geometry; do not create a CSS/image substitute or alter fixture scale. Normal preview continues to show open green concrete, open goals and all 7+7 caps.
2. Prove in Chromium that the inspection affordance is usable, the button detail fills enough of the canvas that all four through-holes are plainly visible, and returning restores the complete pitch. Save the actual screenshot as `T03-inspection.png`.
3. Add a narrow viewport E2E at 390×844 (or narrower if stable) with resize after mount. Assert the preview, 15-piece/7+7/one-button status and inspection/return controls remain visible and do not introduce horizontal page overflow. Save an actual screenshot as `T03-narrow-viewport.png`. This is browser emulation evidence, not physical phone proof.
4. Remove T03-B's unused `Vector3` import from `pieces.ts`.
5. Preserve unmount/dispose/remount checks and no gameplay behavior.

## Required checks, each separately from workspace root

1. `pnpm.cmd --filter @korre/counterball typecheck`
2. `pnpm.cmd --filter @korre/counterball test`
3. `pnpm.cmd --filter @korre/web typecheck`
4. `pnpm.cmd --filter @korre/web test`
5. `pnpm.cmd test:e2e`
6. `pnpm.cmd exec eslint games/counterball/src/scene/createScene.ts games/counterball/src/scene/pieces.ts apps/web/src/CounterballPreview.tsx apps/web/src/styles.css tests/e2e/counterball-preview.spec.ts --max-warnings=0` (if ESLint does not accept CSS, run supported files and record the exact limitation)
7. `pnpm.cmd exec prettier --check` for all changed source/test files

Save exact outcomes, screenshot paths, viewport dimensions, and remaining limits in the implementation report. Do not change parent status. Stop for independent review.