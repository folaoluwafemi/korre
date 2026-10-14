# T02-L01-GOALFRAME-READBACK-1 — independent review of run 38624231947

**Evidence verdict: PASS.** The saved run evidence is internally consistent and supports the reported early goal-frame preflight failure. **Matrix/runtime acceptance: NOT PASSED.** No matrix tuple completed and no matrix-result artifact was emitted.

## Run and source identity

GitHub run [38624231947](https://github.com/folaoluwafemi/korre/actions/runs/38624231947), attempt 1, is `ci` on SHA `d41c04a068543df8e1cc1b0e92dc0330e09a6e9c`, branch `codex/remote-ci-bootstrap`, workflow `.github/workflows/ci.yml`; metadata conclusion is `failure`. The captured full log, run metadata, jobs snapshot and artifact API response agree on that identity. The local checkout HEAD is the same SHA. The only application source path in that commit is `games/counterball/src/simulation/loftCoarseRunner.ts`; its current SHA-256 is `5EF42B9F2441B8DD2CAE967DEC028BC2862D02D61C25625D8983AE1202040BB6`. `games/counterball/src/simulation/loftCoarseProbe.test.ts` has no commit diff and hashes to `6F7B83E427D1EE4C259EB1D896193C586B9A3CCA5D61CD84ADF4E439135A4DE4`. The runner diff against the parent adds one `shapeBoundsAndDimensions` read and reports those same bounds with the existing strict goal-frame dimension error. It does not relax the guard.

## Hosted check outcomes

The saved jobs snapshot contains 40 steps: 35 successful, 1 failed and 4 skipped. `Verify` passed: its retained Vitest summary reports 30/30 files and 185/185 tests passed, with no skipped-test count. The focused protocol step passed 13/13; integration passed 1/1. Production-exclusion/package steps and both production and diagnostic browser build/package steps completed. The preview browser result JSON reports 4 expected, 0 skipped, 0 unexpected and 0 flaky tests. The diagnostic browser JSON reports 4 tests total: 3 passed, 1 unexpected, 0 skipped, 0 flaky; all four results have retry 0. The sole failed workflow step is step 31, “Run every produced local diagnostic browser suite.” Steps 14–16 are conditional TypeScript diagnostics skipped because `Verify` succeeded; the fourth skip is the setup-node post step.

The diagnostic failure is the bounded-host-validation test reporting “failed before download.” For `goal-frame-0`, it records shape type 2; configured goal width `2.4`, goal height `0.8`, frame radius `0.06`; expected dimensions `{x: 0.12, y: 0.8, z: 0.12}`; native local AABB minimum `{x: -0.05999999865889549, y: -0.4000000059604645, z: -0.05999999865889549}` and maximum `{x: 0.05999999865889549, y: 0.4000000059604645, z: 0.05999999865889549}`; observed dimensions `{x: 0.11999999731779099, y: 0.800000011920929, z: 0.11999999731779099}`. These are the expected values and raw bounds from the same native bounds read. As document arithmetic, `Math.fround(0.12)` is `0.11999999731779099` and `Math.fround(0.8)` is `0.800000011920929`, exactly matching the observed dimensions. That supports a Float32-representation hypothesis for this shape; it does not itself authorize a contract change or prove the other goal-frame shapes.

At this SHA, `readNativeBodies` is called at runner line 1518 before the first `applyImpulse` at line 1727, `executeStep` at line 1985, and matrix write at line 2563. The guard aborts during that read. The browser result and full log confirm failure before download. The artifact list contains no matrix-result artifact. Therefore this run proves neither an impulse, a physics step, a completed tuple, nor the 24-case matrix.

## Artifact provenance and integrity

GitHub’s artifact API reports these 10 archive records. The `sha256:` values below are the API-reported archive digests; they were not presented as recomputed hashes of the extracted directories.

| Artifact ID | Name | API size (bytes) | API digest |
|---:|---|---:|---|
| 11924126396 | `counterball-realtime-prebuilt-d41c04a068543df8e1cc1b0e92dc0330e09a6e9c` | 1,953 | `053871802e8cd6804c659722c6b42965d26dc26ce8114352d2dc34bc47e5f532` |
| 11923546537 | `counterball-web-production-d41c04a068543df8e1cc1b0e92dc0330e09a6e9c` | 2,517,148 | `362c0ef2ff8973b7b5efe011c8d59fe99f71b196265901c4b9d7e31644c92c4a` |
| 11923481664 | `counterball-calibration-observations` | 104,314 | `d0d3664c39050bf5cec4c7d53d0d977d5613403b681f4d55ea363e6a593c9cab` |
| 11923456695 | `counterball-intended-shot-observations` | 1,406,942 | `dff8347873450b6db54eaf17ee33fb9856c00e3e8d4bd2c4f41fc043622763f1` |
| 11923406664 | `counterball-verification-log` | 108,464 | `e00e0ec462ad110d2ad98baaf32b4855c13d274866a1fabe9977566e49988551` |
| 11923187503 | `formatting-repair` | 162 | `57bec73ffc0b4ee62167bee3ae0a704143147d058069fd2ce6179b2ace9697c1` |
| 11922688841 | `counterball-browser-evidence` | 3,079,354 | `11c55fd529669d2b6c64585b493bad14b99a24fd473cc00dd285df8ca02f0d10` |
| 11922653970 | `counterball-web-diagnostic-d41c04a068543df8e1cc1b0e92dc0330e09a6e9c` | 2,490,338 | `c2a17a490d24b4d3e262e7d26cf97d9abcf912a666f51c9b523d1d2d3d1a31fd` |
| 11922624585 | `counterball-browser-preview` | 2,491,118 | `e1a0a03648039d371765d15337917555646a0dd3ccf9fc8f834d3fc1cdf6655a` |
| 11922614778 | `counterball-hosted-checks-d41c04a068543df8e1cc1b0e92dc0330e09a6e9c-run-38624231947-attempt-1` | 121,201 | `9c9a41e28162655df3d4f74b8ab90878375e0279a92fa01970726c086d1a460a` |

The saved extracted-file inventory is bound to run 38624231947 and the same source SHA. I independently checked every listed member’s existence, byte length and SHA-256 against the extracted tree: 1,155 files, 60,265,107 bytes; zero missing files, mismatches or extra files. The inventory JSON SHA-256 is `258638BB4F0A833DEB6E8EB4993A00B977205D1E174F3763E129A8CB9C1F1D2A`.

Key captured evidence hashes: full GitHub log `B5C9CB361B625E7CCE4CC8FC8C431BF84616D992142EB01FF28E44EAEAF3301B`; `verify.log` `9D4C79F149B2C8F8A2D1154A5DD3146FD5B5509F9C127D6EDA414F707AE21FBD`; integration log `0EA3FCA9E761D81AAAD69186488475FD4C89AB972ABD70A375B0486151C93C83`; diagnostic browser results `9373971844A754BED372CE65F3A0ABBFF7F6D51E3EBBC2D1DA2A7CCCD4AB06CA`; diagnostic E2E log `1D478CFAA05819C68062D43261C276CF07588AB874EC6DFFC247C346706CB496`.

This is evidence review only. The local production and diagnostic builds, browser preview and dry-run Worker package are not a deployed Cloudflare Havok run. The run proves a real browser diagnostic reached native goal-frame readback and stopped at the intended strict guard. It does not prove the complete matrix, traversal, playability or deployment.
