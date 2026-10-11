# T02-P01 exact-run runtime and artifact review

Date: 2026-10-11

## Verdict

**PASS — hosted evidence supports T02-P01 acceptance for its presentation API and tests.** GitHub Actions run [38105089422](https://github.com/folaoluwafemi/korre/actions/runs/38105089422) completed successfully on the requested exact SHA `98abd0caf819f0f08ba093fb51aa6556ba2aae88`. This is not evidence of a real flick, gameplay, a playable match, or deployed Havok.

## Checks on the exact SHA

- The single `verify` job completed successfully. Frozen pnpm install, the dedicated Workers smoke test, disposable PostgreSQL migration checks, `pnpm verify`, production renderer exclusion, browser preview tests, and artifact uploads all completed successfully.
- `pnpm verify` ran workspace typecheck, lint, Prettier, unit tests, and builds. The Counterball typecheck completed, including browser/headless export resolution, the public headless bundle-boundary probe, and `tsc --noEmit -p tsconfig.json`. Workspace ESLint ran with `--max-warnings=0`, and Prettier reported all matched files clean. Counterball's build check and the web build completed.
- The P01-specific `games/counterball/src/scene/presentation.test.ts` executed **5 tests and passed all 5**. The full Vitest run reported **28 files and 146 tests passed**; no skipped tests were reported. This includes the five migration tests. The focused filtered Counterball command recorded in the implementation report was not issued as a separate command, but the successful root verification included the same Counterball typecheck and test suite.
- Other relevant test counts: protocol **11/11 passed**, Worker smoke **1/1 passed**, integration **1/1 passed**, and Chromium E2E **4/4 passed**. Playwright's structured results report expected `4`, skipped `0`, unexpected `0`, flaky `0`, and project retries `0`. The disposable migration command verified one forward-only migration twice. The optional formatting-suggestion workflow steps were skipped because checks succeeded; these were not test skips.

## Browser build and artifact provenance

The successful E2E step ran with `COUNTERBALL_PREBUILT_PREVIEW=1`; the workflow then uploaded `apps/web/dist/` as `counterball-browser-preview`. The structured browser results carry the same commit SHA and run URL. I compared the extracted browser-preview tree with the exact-SHA production browser artifact: all **452 files** matched by path and SHA-256, with no missing, extra, or differing file.

The production artifact inventory records source SHA `98abd0caf819f0f08ba093fb51aa6556ba2aae88`, run `38105089422`, attempt `1`, mode `production`, and diagnostic flag `unset`. Its **452 emitted-file** size and SHA-256 entries all matched the uploaded production artifact. GitHub identifies the production artifact as `counterball-web-production-98abd0caf819f0f08ba093fb51aa6556ba2aae88` (ID `11688784904`, 1,839,235 bytes), the browser preview as `counterball-browser-preview` (ID `11689039465`, 1,813,297 bytes), and browser evidence as `counterball-browser-evidence` (ID `11689995014`, 1,532,088 bytes). The browser-results metadata identifies the same exact SHA and run.

The run also uploaded calibration and intended-shot probe data. Those are separate diagnostic artifacts and are not used here to infer gameplay or accept a physics gate. The general browser preview checks exercise the built workspace page; the P01 presentation tests themselves ran in the package test environment, not as WebGL picking tests.

## Limits

This provides exact-head hosted evidence for P01's frozen presentation signatures, validation, stable-ID picking, and unit tests, alongside a successful build and browser-preview smoke suite. It does not prove browser-side flick input, WebGL picking behavior, a real match, deployed Cloudflare Havok, or gameplay. Task-status acceptance remains with the coordinator.
