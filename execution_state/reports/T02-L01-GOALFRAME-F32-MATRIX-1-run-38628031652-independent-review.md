# T02-L01-GOALFRAME-F32-MATRIX-1 exact-run independent review

**Evidence verdict: PASS. Run result: FAILED. The full 24-case matrix is not accepted.** This review verifies the retained hosted evidence for run 38628031652 only; it does not approve the failure, infer missing physics values, or claim T02/playability/deployed physics.

## Run and source identity

The run record identifies workflow run [38628031652](https://github.com/folaoluwafemi/korre/actions/runs/38628031652), attempt 1, commit `290b2a5591a55b6593a62fe9875ba670e1d89d9e`, branch `codex/remote-ci-bootstrap`, completed with conclusion `failure`. The job snapshot agrees on the SHA and conclusion. Local HEAD is that exact SHA; its parent is `d41c04a068543df8e1cc1b0e92dc0330e09a6e9c`.

Relative to that parent, the only application source/test paths changed are the two packet-owned files. The runner changes only goal-frame X/Y/Z dimension checks to exact finite Float32 projection comparisons. The test adds canonical upright/crossbar positive, unprojected and adjacent-value assertions. The implementation report and independent source report agree on the resulting hashes: runner `30CBB8D4C29A61063685198EAC8E6FC1F82D0E1A91A0D524F436D1A7BD89FDC6`; test `EE98880940FF9340F3873F6A8B0FB6481751F29113C7515319A9E08DD2538ABA`. The separate pre-CI format review accepted only one assertion line-wrap change. In this run, the formatting-repair artifact contains a zero-byte patch (SHA-256 `E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855`), so CI proposed no further source formatting change.

## Gates and test results

The saved job snapshot has 40 step records: 35 successes, one failure and four skips. The sole failure is step 31, “Run every produced local diagnostic browser suite.” Steps 14–16 (failure-only TypeScript resolution traces) were skipped because Verify passed; step 67 is the skipped post-action for setup-node.

The retained hosted `verify.log` shows 30 test files and 186 tests passed, with no skipped tests. Verify succeeded, including typecheck, lint, tests and build. Integration passed 1/1. The built preview passed 4/4 with no skip, retry or flaky result. The diagnostic Playwright JSON records four tests: three passed, one failed, zero skipped, zero retries and zero flaky tests. The three passes were the real-browser direct flick/WebGL-pixel diagnostic, blocked-WASM retry/cleanup, and synthetic transport check. These do not make the restart-loft matrix pass.

The sole diagnostic failure is the matrix test, which reports: **“The browser matrix failed before download: Native sweep subdivision cannot satisfy the hashed resource guard.”** The browser error-context and trace preserve that same wrapper message, but do not expose its nested cause, selected tuple index, required substep count, or native inertia/radius values. The runner catches an exception from `deriveDiagnosticSweepPlan` and replaces it with this generic resource-guard message. The planner source has more than one possible rejection after calculating bounds, so the retained runtime message does not establish which specific bound failed. Do not infer the missing values or a more specific numerical cause.

Control-flow evidence places this error after native body facts and initial-state checks: `readNativeBodies` performs the apron and goal-frame type/dimension guards ([loftCoarseRunner.ts:1121](/C:/Users/USER/StudioProjects/korre/games/counterball/src/simulation/loftCoarseRunner.ts:1121), [loftCoarseRunner.ts:1134](/C:/Users/USER/StudioProjects/korre/games/counterball/src/simulation/loftCoarseRunner.ts:1134), [loftCoarseRunner.ts:1151](/C:/Users/USER/StudioProjects/korre/games/counterball/src/simulation/loftCoarseRunner.ts:1151)); then the case checks exact zero velocities and initial transforms before plan creation ([loftCoarseRunner.ts:1518](/C:/Users/USER/StudioProjects/korre/games/counterball/src/simulation/loftCoarseRunner.ts:1518), [loftCoarseRunner.ts:1520](/C:/Users/USER/StudioProjects/korre/games/counterball/src/simulation/loftCoarseRunner.ts:1520), [loftCoarseRunner.ts:1539](/C:/Users/USER/StudioProjects/korre/games/counterball/src/simulation/loftCoarseRunner.ts:1539)). The planner call and wrapper are at [loftCoarseRunner.ts:1564](/C:/Users/USER/StudioProjects/korre/games/counterball/src/simulation/loftCoarseRunner.ts:1564)–[loftCoarseRunner.ts:1588](/C:/Users/USER/StudioProjects/korre/games/counterball/src/simulation/loftCoarseRunner.ts:1588). In that case, the selected impulse follows at line 1612 and the first explicit `executeStep` is at line 1985. Thus the failing case passed the preceding geometry/initial-state guards and stopped before its impulse and physics step. The UI/trace does not persist numerical readback values or a call counter; no native geometry values should be reported as measured from this run.

The Playwright test fails while waiting for matrix readiness and explicitly reports failure before download. There is no `counterball-l01-matrix.json`, host-validation JSON, completed case result, or successful matrix artifact in the retained artifact tree. The run proves neither a completed tuple matrix nor a 24-case result. This conclusion is consistent with the source: `makeCases` is sequential and aborts on the planner exception before yielding that case.

## Artifact provenance and integrity

The GitHub API snapshot lists 10 artifacts, each tied to run 38628031652 and the exact SHA above. API-reported archive sizes are shown; API digest strings remain available in the saved API snapshot.

| Artifact ID | Artifact | API size (bytes) |
|---:|---|---:|
| 11924587768 | counterball-browser-evidence | 3,059,289 |
| 11925215987 | counterball-browser-preview | 2,491,118 |
| 11925066209 | counterball-calibration-observations | 104,314 |
| 11924817386 | counterball-hosted-checks (run 38628031652, attempt 1) | 120,697 |
| 11925480752 | counterball-intended-shot-observations | 1,406,942 |
| 11925201030 | counterball-realtime-prebuilt | 1,953 |
| 11925635735 | counterball-verification-log | 108,401 |
| 11925955745 | counterball-web-diagnostic | 2,490,364 |
| 11925925648 | counterball-web-production | 2,517,149 |
| 11924523004 | formatting-repair | 162 |

Download completed with exit code 0. I independently recomputed size and SHA-256 for every extracted member against `artifact-inventory.json`: 1,155 files, 60,239,859 bytes, zero missing, extra or mismatched entries. The API digest values describe GitHub archives; the retained extracted members were checked against the per-file inventory, not against unavailable archive ZIP bytes. Key evidence hashes: full GitHub log `0F2C130EF4D1DA9C8C081ABFA565255BD443745DD78620106D81E11741E1FA99`; verify log `965D2E6A742988E9B1D3CA7DB549418182CADC2DCE9BCCA1D4EC62BC88E394F0`; diagnostic results `B6A2D7AC80A6ABE71E379ADA091D3E987962A12FAF40A66B3A80F5F66C7828B4`; error context `3B27E82629215A3A6B29338CF170955020971D2C2ADEF494A0D2AB16D081AC42`; trace ZIP `DC1F2EB1DBBE61F295D984022889BE389CB10DC5D6C32D92DDA78792573A15FB`.

**Scope limit:** this run confirms hosted code checks and several browser diagnostics, including one separate direct flick. It failed before the loft matrix download and supports no matrix acceptance, calibration, deployed Cloudflare Havok, or playable-match claim. No local application checks or source/status edits were made for this review.
