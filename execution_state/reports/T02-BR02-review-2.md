# T02-BR02 bounded repair review — attempt 1

Date: 2026-10-11

## Verdict

**SOURCE: PASS. RUNTIME: NOT RUN.** The bounded repair fixes the hosted type-boundary error by changing only `apps/web/src/CounterballDirectProbe.tsx`. No source or acceptance assertion needs a further change from this review.

The required command `node scripts/check-completion-plan.mjs --packet T02-BR02` now passes and re-extracts the same packet acceptance and negative cases. Its output confirms plan consistency only; it is not implementation or runtime evidence. The earlier extraction attempt failed while the coordinator was correcting `execution_state/tasks.json`; that transient coordinator state issue is not a source finding.

## Repair review

- The direct `@babylonjs/core` import is gone. The web component imports Babylon-facing operations only through `@korre/counterball/browser` (`apps/web/src/CounterballDirectProbe.tsx:1-12`). `apps/web/package.json` has no direct Babylon dependency, while `games/counterball/package.json` owns that dependency and exposes the browser entry. The accepted `games/counterball/src/browser.ts` exports the scene and presentation APIs used by the component.
- The concrete check remains fail-closed. The helper at `apps/web/src/CounterballDirectProbe.tsx:133-152` accepts an unknown material, safely returns `null` for missing or malformed texture data, and returns a name only when `diffuseTexture` is an object with a string `name`. `createSceneFacts` at `:161-179` also requires the exact material name `counterball-concrete` before reading that texture, then throws unless its name is exactly `counterball-green-concrete-grain`. Those names match the accepted scene builder at `games/counterball/src/scene/materials.ts:42,49-50`. A null material, wrong material, absent texture, malformed texture, or wrong texture name still fails the scene assertion.
- The repair does not add a dependency, widen the public package exports, or weaken a fixture assertion. The implementation report states no browser-spec path changed, and the repair diff is confined to the component. The extracted packet still has the same acceptance and negative cases; no acceptance assertion was changed.

## Limits

This is source review only. No local app typecheck, lint, tests, build, browser automation, or physics run was performed. The prior hosted run failed at typecheck and is not a pass for this repair. A new exact-head GitHub run must verify the compiler boundary and then execute the focused diagnostic browser spec before runtime evidence can be reported.
