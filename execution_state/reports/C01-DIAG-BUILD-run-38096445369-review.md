# C01-DIAG-BUILD run 38096445369 independent run and artifact audit

**PASS — exact hosted run and emitted browser artifacts verified.**

## Run identity and workflow result

GitHub's current run record and the saved metadata agree: run `38096445369`, attempt `1`, head SHA `6af18f5c733d96be484700ba7c330f9bf0669f64`, completed with conclusion `success`. The successful `verify` job has 34 successful steps, two skipped conditional formatting-repair steps, and zero failed steps.

The full saved GitHub log recomputes to SHA-256 `7a418a7924aa9c5f25cbe30c9f68db006bfce43e848a77f520f65de07ecd0c64`, matching the run report. Logs show `pnpm verify` passed with 26 test files and 140 tests, all passed and no skipped-test output. Integration passed 1/1 file and 1/1 test. Structured Playwright results identify commit `6af18f5c733d96be484700ba7c330f9bf0669f64` and run `38096445369`; four tests passed, with 0 skipped, 0 unexpected, 0 flaky, and 0 retries.

## GitHub artifact provenance

The artifact API record contains nine artifacts. Each has `workflow_run.id = 38096445369` and `workflow_run.head_sha = 6af18f5c733d96be484700ba7c330f9bf0669f64`; all nine have a matching extracted artifact directory and are not expired:

| Artifact | ID |
| --- | ---: |
| `counterball-intended-shot-observations` | 11686460306 |
| `counterball-web-diagnostic-6af18f5c733d96be484700ba7c330f9bf0669f64` | 11685909293 |
| `counterball-verification-log` | 11685779668 |
| `counterball-browser-preview` | 11685749667 |
| `counterball-web-production-6af18f5c733d96be484700ba7c330f9bf0669f64` | 11685664920 |
| `counterball-hosted-checks-6af18f5c733d96be484700ba7c330f9bf0669f64-run-38096445369-attempt-1` | 11685629834 |
| `counterball-realtime-prebuilt-6af18f5c733d96be484700ba7c330f9bf0669f64` | 11685614952 |
| `counterball-calibration-observations` | 11685604890 |
| `counterball-browser-evidence` | 11685554981 |

## Production and diagnostic file audit

I recomputed byte sizes and SHA-256 for every emitted file listed in each browser `build-inventory.json`, then compared the inventory paths with the complete extracted build file set. The separate `build-inventory.json` metadata file is not included in its own emitted-file list.

| Artifact | Provenance and mode | Emitted files | Inventory comparison | Marker scan |
| --- | --- | ---: | --- | --- |
| `counterball-web-production-6af18f5c733d96be484700ba7c330f9bf0669f64` | source SHA/run/attempt match; `production`; flag `unset` | 452 | 452/452 sizes and hashes match; exact path set, no missing or extra files | Both `Development-only renderer diagnostic` and `renderer-diagnostic__label` absent |
| `counterball-web-diagnostic-6af18f5c733d96be484700ba7c330f9bf0669f64` | source SHA/run/attempt match; `renderer-diagnostic`; flag `set` | 454 | 454/454 sizes and hashes match; exact path set, no missing or extra files | Visible marker in `assets/CounterballRendererDiagnostic-MiwXo1qQ.js`; class marker in that JS and `assets/CounterballRendererDiagnostic-DHfjSTAh.css` |

All diagnostic and production inventory fields match the exact run: source SHA `6af18f5c733d96be484700ba7c330f9bf0669f64`, run ID `38096445369`, and attempt `1`. There were zero size/hash mismatches in either bundle, and both inventory path sets exactly matched the extracted Vite outputs.

I also scanned all emitted production filenames and bytes for `CounterballRendererDiagnostic` and `renderer-diagnostic`. No production filename matched either term, and no production file contained `CounterballRendererDiagnostic` or `renderer-diagnostic__label`. The diagnostic artifact contains both expected emitted files: `assets/CounterballRendererDiagnostic-DHfjSTAh.css` and `assets/CounterballRendererDiagnostic-MiwXo1qQ.js`.

## Scope boundary

This verifies hosted build separation: the production output lacks the diagnostic marker and the separately flagged artifact contains it with matching file hashes and run provenance. It does not prove that the panel was opened or interacted with in a browser, that Havok or physics ran, that a flick or playable match works, or that anything was deployed. The 4/4 Chromium results are the existing production preview regressions, not diagnostic-panel interaction tests. No local application build, test, or browser command was run for this audit; the local checks were read-only inspection and hash recomputation.
