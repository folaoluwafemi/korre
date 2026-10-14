# T02-L01-MATERIAL-F32-1 exact hosted evidence review

**Verdict: PASS for evidence integrity and bounded runtime findings.** The hosted run failed overall. This review does not accept MATRIX-1, T02, the full material gate, or a playable match.

## Run identity and artifact provenance

run.json records GitHub Actions run **38595010780**, attempt 1, conclusion **failure**, on exact commit **417a2e95b5b59aebd984be903e0b406caae2bc15**. The sole job verify has the same completed failure. The browser result JSON metadata also names that exact commit. artifacts-api.json lists 10 artifacts; every record has workflow run ID 38595010780 and the same head SHA. All 10 API-reported ZIP digests appear in github-full.log. These digests are GitHub archive digests; I did not reconstruct ZIPs from the extracted files.

I recomputed SHA-256 across all **1,155 extracted artifact files** (60,239,033 bytes); all were readable. The manifest-bearing build contents independently match their declared per-file sizes and SHA-256 values: production web **454/454**, diagnostic web **213/213**, and Wrangler dry-run Worker **3/3**. The separate browser-preview artifact matches the production inventory **454/454**. The hosted and browser-evidence copies of both Playwright JSON reports are byte-identical, as are the two verify.log copies.

Selected retained-file digests:

| Evidence file | Bytes | SHA-256 |
| --- | ---: | --- |
| run.json | 7,763 | 5c16a56e8252b592cfe5640828b0f91fef19eaa0338b72a91f3c687fb726ec80 |
| artifacts-api.json | 7,384 | bb53bc2d8c78c69695544e04b6d6d6c616f0f3f6be8d3b23d39d10f300df5bdb |
| github-full.log | 342,739 | 343bfd391177b886de25fed2bb9b5c729d2f05c9bdcde072f5224fb87e7625ee |
| hosted verify.log | 899,389 | 51b411e6d873529191816bfc3344ec83b564f3f995b396aecbd87a16bc6dfb92 |
| preview browser-test-results.json | 11,318 | 4c7924677d5eff81787578ecb92a3cdbb5160bc180473ce10fe235827188dfa3 |
| diagnostic browser-test-results-diagnostic.json | 139,582 | 7358dbb2daeff57eac546bf10df735ad3f47a2654d74b2e869b9263d8d56d2fc |
| matrix error-context.md | 10,695 | 8e57978fec782419511cefe1d94c7ce45be32e8ac439ba923bfbdb7d0f281f2f |
| matrix trace.zip | 996,045 | 8fc9f30ca7b17abfbf89cb00585d4cf8334f5a5b54325f7fd169bb317d6e2d99 |
| calibration observations JSON | 1,345,869 | b81e5d190e7d81e540e6657f1d39ba805f177545c93075b604b7dd6818d59013 |
| intended-shot observations JSON | 24,455,019 | 7cdf727cfc238672d92dcf2d6c9ab437a56a64c8f7fae2979af08d5980bc2443 |

## Checks and exact counts

The hosted Verify step succeeded. Its log records typecheck, lint/format, **30/30 test files and 183/183 unit tests**, and builds. The focused protocol suite passed **13/13**, Worker smoke passed **1/1**, the migration check verified **1 forward-only migration** on each of its two invocations, and integration passed **1/1**. The ordinary built-preview Playwright report is **4 passed, 0 skipped, 0 unexpected, 0 flaky**, with retry 0 on each test.

The workflow itself has **35 successful, 1 failed, and 4 skipped step entries**. The failure is step 31, Run every produced local diagnostic browser suite. Steps 14–16 are optional TypeScript diagnostic steps skipped because Verify succeeded; step 67 is a post-job setup cleanup. They are workflow-step skips, not skipped browser tests.

The direct diagnostic Playwright JSON reports **3 passed, 1 failed, 0 skipped, 0 flaky**; all four results have retry 0. The passed tests include **"a real pointer flick runs browser Havok and changes rendered WebGL pixels."** Its attached JSON trace records a settled browser Havok shot (fixed impulse (0,0,8)), 15 pieces, seven caps per side, four visible button holes, zero enclosing walls, cap movement about 5.83, button movement about 2.39, and 328 changed WebGL pixels. This proves the real browser flick diagnostic ran successfully. It does not prove a complete playable match. The other passing checks cover the blocked-WASM retry/cleanup path and synthetic transport download.

## Matrix result and limitation

The matrix test failed when the browser displayed: **"Dynamic body button native dimensions differ from canonical cylinder geometry."** The page snapshot says the export failed and no successful download is available. The Playwright trace records the same error after the test clicked **Run 24-case Havok matrix**; the test raised from its failure-status poll before reaching the ready state. Its only attachments are error-context and trace.

As a result, this run produced **no matrix-ready state, no matrix download, no host validation/acknowledgment, and no accepted 24-case artifact**. The API lists no matrix artifact, and the browser evidence contains no counterball-l01-matrix-host-validation.json or matrix download. The calibration artifact contains 480 observations; the separate intended-shot artifact contains 40 observations and marks itself diagnostic-only with continuousTraversalProven false. Neither is the fixed 24-case matrix result. This run therefore does not prove all 22 native material readbacks or matrix acceptance, even though the failure had advanced beyond the earlier friction mismatch.

The browser-evidence archive also carries three execution_state/reports/T03-*.png report images. They are not attachments from this direct-probe run and are not counted as its runtime results.

This review inspected saved evidence and recomputed hashes only. No build, test, browser, or physics command ran. The real pointer flick is diagnostic-only evidence; playability, the 24-case matrix, MATRIX-1, and T02 remain unproved.
