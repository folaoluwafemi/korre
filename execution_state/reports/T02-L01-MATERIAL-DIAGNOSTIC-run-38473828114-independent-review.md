# Independent evidence review: run 38473828114

**Verdict: PASS for evidence accuracy.** This is an evidence review of a failed hosted run, not an acceptance of the loft matrix.

## Provenance

`run.json` records completed failure, attempt 1, run `38473828114`, exact SHA `a20c96a4c7a097b19b867e164cac89141b84036d`, and URL `https://github.com/folaoluwafemi/korre/actions/runs/38473828114`. `jobs.json` independently matches that run and SHA; its single `verify` job failed. The GitHub artifact API snapshot associates the retained `counterball-hosted-checks-...run-38473828114-attempt-1` archive (ID `11853417064`) and `counterball-browser-evidence` archive (ID `11853731202`) with the same run and SHA. The API-reported archive digests are `b52d8c2b4ad9cca9c9628dd24d6d32d5034f66db9e20527b44308f487ebb6cbf` and `c4ce9737cfbffcfd47c671cba757602ddcd55983cc8388298dda069b5ec6842b`, respectively. The extracted files referenced below exist under those artifact-specific directories.

## Check outcomes

The hosted Verify log reports **30 test files and 181 tests passed**. It has no Vitest skipped, retry, or flaky summary. The worker smoke is **1/1**, protocol tests **13/13**, and integration **1/1**. The ordinary built-preview browser suite is **4/4 passed**, with JSON stats `expected=4`, `skipped=0`, `unexpected=0`, `flaky=0`; each result has `retry=0`.

The diagnostic Chromium suite ran four tests: the real pointer flick, blocked-WASM retry/cleanup, and synthetic full-size transport passed; the full loft-matrix test failed. `browser-test-results-diagnostic.json` reports `expected=3`, `skipped=0`, `unexpected=1`, `flaky=0`. The failed test has `retry=0`; all three passing results also have `retry=0`.

The exact failure from `e2e-diagnostic.log`, the diagnostic JSON, and `error-context.md` is:

```text
Native friction material readback differs from its setter. {"field":"friction","setter":0.15,"readback":0.15000000596046448}
```

**Inference:** `Math.fround(0.15)` is `0.15000000596046448` and equals the reported readback. The value is consistent with the native material coefficient being rounded to Float32 while the setter/readback guard compares the unrounded JavaScript number strictly. The equality is a numeric inference; the browser evidence does not label the conversion itself.

## Support preflight and matrix result

At this exact SHA, the canonical support transform and Float32-projected thickness preflight in `games/counterball/src/simulation/loftCoarseRunner.ts` (the condition beginning at line 1299, including `matchesExactFloat32Projection` at lines 1309–1312) precedes `setAndReadMaterial(activeWorld, originalShape)` at line 1426. The browser error is the later material-readback failure. Therefore the source control flow supports that the support preflight passed before this failure. No numeric support readback was attached to this run, so this is a control-flow conclusion, not a separately recorded measurement.

The material error occurred before `readNativeBodies` at line 1455 returned and before matrix stepping. The failed browser result contains only `error-context` and `trace` attachments. There are **zero matrix cases/results, no successful matrix JSON, no matrix download, and no host-validation artifact** in the retained browser tree or artifact inventory. The API artifacts named calibration and intended-shot are separate: their extracted observation files contain 480 and 40 observations, respectively; they are not the 24-case loft matrix.

## Extraction note

No archive-extraction collision warning appears in the retained run log or API snapshot. The hosted-check and browser-evidence archives are retained in separate directories, including their duplicate-named browser result JSON files, so neither copy overwrote the other in the evidence examined here.

The job API snapshot has an empty `steps` array; gate and test counts above come from the actual extracted per-gate logs and Playwright result JSON, not inferred step totals.
