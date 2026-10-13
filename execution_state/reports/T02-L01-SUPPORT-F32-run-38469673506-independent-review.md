# T02-L01-SUPPORT-F32-1 — run 38469673506 independent evidence review

**EVIDENCE REVIEW: PASS. RUN: FAILED AT PRETTIER. BROWSER / PHYSICS ACCEPTANCE: NOT MET.**

## Run identity and Verify outcome

The saved Jobs API snapshot identifies run `38469673506`, attempt 1, head SHA `d7477075de44ade129067e177acc07f8f5cb0655`, job `verify`, completed with conclusion `failure`. The artifacts API records the same run ID and SHA for each of its four artifacts. The Jobs API’s `steps` array is empty, so the saved complete `github.log` and extracted step logs are the evidence for actual step outcomes.

The focused checks before `Verify` passed: the dedicated Worker smoke test was 1/1; the root/workflow formatting check passed; the disposable PostgreSQL migration check ran twice and each verified the migration; and the game-protocol test passed 13/13. Playwright Chromium installation completed before Verify, but no Playwright test was run.

In `verify.log`, all workspace typechecks completed, including Counterball’s public headless bundle boundary check; ESLint proceeded into Prettier; Prettier failed only on `games/counterball/src/simulation/loftCoarseRunner.ts`, then `pnpm verify` exited 1. Since Verify is `pnpm typecheck && pnpm lint && pnpm test && pnpm build`, the full Vitest suite and `pnpm build` were not reached. The failure-only TypeScript-resolution diagnostics then ran for Counterball, apps/web, root tests, and apps/web’s server config; all four retained status files report exit code 0.

The workflow puts production-exclusion/package checks, integration, built-preview E2E, diagnostic-renderer build, and diagnostic browser E2E after Verify as ordinary success-gated steps. They did not run after Verify failed. No browser test totals or browser no-skip/retry result exists for this run. In particular, this run provides no real flick, support-preflight execution, Havok matrix impulse/step, or physics artifact.

## Artifact and file verification

I independently recomputed SHA-256 and byte size for every entry in `extracted-file-hashes.json`: all **22/22 files** match the manifest, totaling **48,595,800 bytes**. The manifest binds to run `38469673506` and source SHA `d7477075de44ade129067e177acc07f8f5cb0655`.

The artifacts API reports these run-bound archive records and digests (these are API-reported archive digests; the manifest’s separate values are extracted-file hashes): hosted checks ID `11851541953`, `sha256:011c8206ead75f805ac840751f601f8a8c53163a9798c3fc618150649dc8ebb8`; verification log ID `11851037960`, `sha256:621ae81dd95eea6709d1fa3ab017a5d74e5f610c6ed5680b9cd98ac46dc3d230`; browser evidence ID `11850658475`, `sha256:587032d16d691aa204512302b0398e58427e4091d1893ed304a119b39be5d577`; formatting repair ID `11850588750`, `sha256:eeec7cefcb1cde7dd333b083d63ea357db8d8c11a88ee3c7e4e96a491a46b9c8`. The hosted-checks archive includes the worker, migration, protocol, Verify, and four TypeScript-resolution logs. The formatting patch is 931 bytes with SHA-256 `6eb84e0321521a963dbcee86424202cc98e0f335671f2884f92d61410d423e0a`; inspection confirms it only wraps the existing `nativeShapeDimensionY` call.

The browser-evidence artifact contains exactly three files: `T03-inspection.png`, `T03-narrow-viewport.png`, and `T03-preview.png`. They are prior T03 screenshots, not evidence from this run. No current-run browser trace, browser result JSON, or physics output was uploaded.

Key retained-file hashes match the coordinator report: `github.log` (125,786 bytes) `f3865986ad0d69e0ac6e020c090c8ce98b3440024ea8e68a046a09909cca1204`; `jobs.json` `96f999073a0c0de6711feaab796dd48e94a0ec21300fda7ffc9589f138cad847`; `artifacts.json` `bf4f1a8dd5260fc334a071267854e8ba14f1266f9df2a2e5f2856be63d7443f1`; `extracted-file-hashes.json` `4112284707800f32f94c1cba34d476c86bd0b98427c8284973972f453a0e6a7c`; hosted `verify.log` `4618fbcff542159043b245e550c9161fe0ae4240bad1bde5ba10cb6a353cdbd9`.

## Locator note and limits

The coordinator report’s finding that only the runner file failed Prettier is accurate. Its phrase “Verify log line 722” mislabels the locator: line 722 is in the full `github.log`; the extracted hosted `verify.log` is 37 lines, with the runner warning at line 34. This is a non-material citation correction and does not change the run result.

This is evidence review only. It confirms a formatting failure and the checks that preceded or followed it; the prior T03 images do not prove browser execution here. No test/build/browser/physics acceptance is supported by this run.
