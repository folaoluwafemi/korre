# T03 repair 1 independent review

Recommendation: **CHANGES_REQUIRED — hold acceptance for unresolved browser verification.** The original inspection and unused-import findings are addressed by the inspected source and prior actual screenshots. No additional source defect is confirmed. The independent browser rerun failed before the preview mounted, so it cannot be reported as passed or ignored without diagnosis.

## Original findings

- **Inspection: addressed.** `CounterballPreview.tsx` adds native, named inspect/return buttons, readiness/disabled states, pressed state and a polite view-status announcement. It moves the existing Babylon camera toward the fixture button, preserves piece transforms/scale, and restores the saved target, radius, angles and limits on return. No gameplay behavior was introduced. The actual `T03-inspection.png` shows four plainly visible through-holes over the green surface. The geometry tests still verify real openings; this is not a CSS or image substitute.
- **Narrow viewport: prior evidence supports the repair.** The actual `T03-narrow-viewport.png` shows the count, buttons, recognizable 7+7 formation, open goals and green pitch at narrow width. Source E2E mounts at 1280×900, inspects and returns, then resizes the mounted scene to 390×844. It asserts both controls are in viewport and document/body widths do not exceed 390. Its implementation report records a passing fresh-server, one-worker Chromium run. These are browser-emulation results, not physical phone proof.
- **Unused import: addressed.** `pieces.ts` no longer imports Vector3. The scoped independent ESLint run produced zero code errors.
- **Lifecycle/scope: preserved in source and prior evidence.** Whole-pitch camera values are retained/restored; source remains explicitly static/non-playable. Cleanup still disconnects ResizeObserver, removes window resize listener, stops rendering and disposes Scene/Engine. The existing real-browser unmount/remount test remains. The prior implementation report records its pass; this review's browser run did not reach the lifecycle assertions.

## Independent checks before laptop restriction

Commands were started before the renewed restriction. No build/test/lint/typecheck or server was started after resuming under that restriction. At coordinator request, Ctrl+C was sent only to existing sessions 45521 and 71708; both returned completed exit 1.

| Command | Exit | Observed result |
| --- | --- | --- |
| `pnpm.cmd --filter @korre/counterball test` | 0 | 6 files, 17 tests passed. |
| `pnpm.cmd --filter @korre/web test` | 0 | 1 file, 1 test passed. |
| `pnpm.cmd test:e2e` | 1 | 1 home test passed; both preview tests failed waiting 30 seconds for `The open pitch` heading at `tests/e2e/counterball-preview.spec.ts:91` and `:162`; context teardown exceeded 60 seconds. Total run reported 3.4 minutes. It did not independently regenerate successful inspection/narrow evidence. |
| `pnpm.cmd exec eslint games/counterball/src/scene/createScene.ts games/counterball/src/scene/pieces.ts apps/web/src/CounterballPreview.tsx apps/web/src/styles.css tests/e2e/counterball-preview.spec.ts --max-warnings=0` | 1 | Zero code errors, one warning: CSS ignored because no matching configuration was supplied. `--max-warnings=0` makes the warning fatal. |

Inspected `eslint.config.js`: JavaScript/TypeScript rules and TS file patterns are configured; no CSS language/plugin/parser is configured. CSS semantic lint is therefore **not applicable under the current repository configuration**, rather than passed. Prior implementation evidence records supported-file ESLint exit 0 and explicit CSS/source Prettier exit 0. Supported-file lint, formatting, typecheck, and broad root gates were not rerun after the laptop restriction; no new passing claim is made for them.

## Handoff

Preserve the existing screenshots as prior successful Chromium evidence: `execution_state/reports/T03-inspection.png` and `T03-narrow-viewport.png` were inspected directly and exist (139,998 and 141,477 bytes respectively). The repaired source plausibly addresses the original requirements, but the independent default browser command's two preview-loading failures remain unexplained. Do not attribute them to code, laptop pressure, stale server, or worker count without evidence. When execution is authorized again, diagnose the failed route load and obtain a passing browser run; retain the existing bounded timeout and actual-render requirements. Coordinator owns any acceptance/status change and remaining root lint gate. No physical-phone, physics or deployment proof is claimed.
