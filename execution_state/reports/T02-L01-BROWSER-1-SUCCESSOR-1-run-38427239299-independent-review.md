# Independent exact-run review — T02-L01-BROWSER-1-SUCCESSOR-1, run 38427239299

**Evidence verdict: PASS. Run outcome: FAIL at Verify.** The saved run identity and gate outcomes below match the retained GitHub snapshot and artifacts. This review does not accept the successor packet and establishes no browser flick, OPFS flow, or playable match.

## Provenance and step outcomes

The completed run is [GitHub Actions 38427239299](https://github.com/folaoluwafemi/korre/actions/runs/38427239299), attempt 1, commit `829e160e1cd8264bd406959301b8ffe63c68dc1e`, job `verify` (`115399712209`). The job snapshot contains 40 step records: 26 success, 1 failure, 13 skipped. The single failure is Verify (step 13). All three failure-only TypeScript diagnostic steps (14–16) then succeeded.

The Verify log runs `pnpm verify` as `pnpm typecheck && pnpm lint && pnpm test && pnpm build`. Workspace typechecks completed and the run reached ESLint. ESLint reported one error at `apps/web/src/CounterballDirectProbe.tsx:320`: `@typescript-eslint/preserve-caught-error` says the symptom error is thrown with an incorrect `cause`. This matches the workflow annotation and is the sole diagnostic in the saved Verify log.

The four retained TSC status files all say `tsc_exit_code=0`: Counterball package, `apps/web/tsconfig.json`, root `tests/tsconfig.json`, and `apps/web/tsconfig.server.json`. The tests trace includes `games/counterball/src/viteAssetModules.d.ts`; its status is 0, and its trace/summary contain no previous TS2307 error. The type fixes therefore passed on this exact head. Because lint failed, `pnpm test` and `pnpm build` in the Verify chain did not run. Before Verify, the separate Worker smoke log records 1/1 test passed and the focused protocol log records 13/13 passed; these are limited pre-gates, not the full suite.

The skipped steps are accounted for in the snapshot and exact workflow at this commit:

- Steps 17–21 skipped after Verify failure: production diagnostic-exclusion check, exact dry-run Worker package/upload, and production browser package/upload.
- Steps 25–31 skipped: integration tests, built-preview browser test, preview upload, diagnostic-renderer browser build/package/upload, and the produced diagnostic-browser suites.
- Step 67, the setup-node post-action, was also skipped; remaining cleanup and evidence-upload steps completed.

Thus the run proves neither production exclusion nor production packaging, integration, preview, or diagnostic-browser gates. The failure-only diagnostic steps ran because the exact workflow conditions them on Verify failure; the later gates use normal success-dependent sequencing.

## Browser and OPFS evidence

There is no `browser-test-results.json`, Playwright `test-results` output, `e2e.log`, or diagnostic browser bundle in the downloaded artifacts. The run snapshot explicitly marks both the built-preview test (step 26) and the diagnostic-browser test suite (step 31) skipped. The always-run browser-evidence uploader is configured to collect `execution_state/reports/T03-*.png`, `test-results/`, and `.artifacts/browser-test-results*.json`; its downloaded artifact contains only the three T03 PNGs. Those are carried screenshots, not browser results created by this run. No browser interaction, direct flick, or OPFS flow ran or is evidenced.

## Artifact capture and integrity

I saved the full GitHub log, job snapshot, GitHub artifact API response, and extracted artifacts under `execution_state/reports/T02-L01-BROWSER-1-SUCCESSOR-1-run-38427239299-*`. The artifact inventory at `execution_state/reports/T02-L01-BROWSER-1-SUCCESSOR-1-run-38427239299-artifact-inventory.json` records all 22 downloaded files with byte size and independently computed SHA-256, plus the four GitHub artifact IDs, names, compressed sizes, and API-reported archive digests. All 22 extracted files match the local inventory calculation; total extracted size is 48,595,685 bytes. GitHub-reported archive digests are retained as API values, distinct from the independently calculated member-file hashes.

The four API artifacts are: `counterball-verification-log` (ID `11829156894`), `formatting-repair` (`11828857807`), exact-head hosted checks (`11828852674`), and `counterball-browser-evidence` (`11828767853`). All API records identify run 38427239299 and the requested commit. The saved full log and supporting files are available alongside the extracted artifact directory; no local application command was run for this review.
