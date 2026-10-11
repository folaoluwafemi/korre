# T02-BR02 implementation attempt 1 — 2026-10-11

**IMPLEMENTED; source review and hosted runtime checks are pending.** The only source writes are the three catalogue paths:

- `apps/web/src/App.tsx`
- `apps/web/src/CounterballDirectProbe.tsx`
- `tests/e2e/counterball-direct-probe.spec.ts`

The coordinator added a dev-harness-only `/diagnostic/direct-shot` route, a visible development link, and a scene that reuses the accepted browser entry, `runBrowserDirectProbe`, canonical fixture, and T02-P01 presentation API. The focused test opens `/` and clicks that link because the accepted static preview server does not provide a general route fallback. A bounded 24–240 CSS-pixel pointer drag only triggers the fixed D01 impulse; its direction and distance do not choose aim or power. The diagnostic checks and displays the actual seven-plus-seven cap/four-hole button/open green-concrete fixture, awaits the returned 15 settled bodies and actual cap/button contact, applies those transforms to the scene, and compares WebGL2 `readPixels` before and after. It fails visibly if transforms, contact, or rendered pixels do not show movement.

The focused Chromium spec covers a real pointer drag and captures before/after canvas images plus structured trace/lifecycle attachments. A second case aborts the actual `.wasm` request to verify a visible failure and cleanup, removes that failure, retries, performs a real shot, and checks renderer/listener/observer baselines after unmount. It does not substitute physics output or canvas pixels. Production inclusion is controlled by the existing `VITE_COUNTERBALL_DEV_HARNESS` compile-time gate; the independent source reviewer must verify the ordinary production bundle excludes the route and component.

## Checks performed

- `node scripts/check-completion-plan.mjs --packet T02-BR02`: PASS for packet/dependency consistency only; the checker reports BR02 ready after accepted BR01/T03/T01 and accepted explicit packet dependencies.
- Scoped source whitespace scan for the three owned paths: PASS.
- `git diff --check -- apps/web/src/App.tsx`: PASS. The two new-file whitespace checks were performed by the same source-only scan because they are not tracked yet.
- Local typecheck, lint, formatting, unit tests, build, browser automation, physics, and deployment: **NOT RUN**. These application checks belong on GitHub.

The code is now released for independent review. No real flick or runtime success is claimed until the exact diagnostic spec runs on GitHub and its Chromium artifact and trace are reviewed. T02/T05 remain unaccepted.
