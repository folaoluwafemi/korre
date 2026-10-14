# Independent exact-run review: SUPPORT-DATUM-CONFIG-1

**Verdict: PASS for evidence accuracy. The GitHub run itself failed; this report does not accept the matrix or claim gameplay completion.**

## Run identity and workflow result

Run [38638496304](https://github.com/folaoluwafemi/korre/actions/runs/38638496304), attempt 1, is a completed `push` run for commit `e7f5e4dd5c11182206a716a3ec58412b343a9e57` (`fix(counterball): validate exact canonical matrix guard version`). The saved `run.json` records that SHA, run ID, attempt, and `conclusion: failure`; browser-result metadata independently names the same commit and run URL.

The `verify` job snapshot has 40 steps: **35 success, 1 failure, 4 skipped**. Step 31, “Run every produced local diagnostic browser suite,” failed. Three failure-only TypeScript-diagnostic steps were skipped because `Verify` passed; the fourth skipped step is the post-`setup-node` cleanup. The skip count is a workflow-step count, not a test skip count.

## Checks and exact failure boundary

The retained `verify.log` records `pnpm verify` completing typecheck, ESLint, Prettier, the full Vitest suite, and build. Vitest reports **31 test files and 192 tests passed**; the separate focused protocol step reports **14/14**, and `nativeCylinderRadius.test.ts` reports **4/4** within Verify. The integration log is **1/1**. The ordinary production-preview browser result is **4 expected, 4 passed, 0 skipped, 0 flaky**, with retry count 0.

The diagnostic browser result is **3 expected, 3 passed, 1 unexpected failure, 0 skipped, 0 flaky**, with retry count 0. The three passes are the real pointer-flick test, blocked-WASM retry/cleanup test, and maximum synthetic transport test. The sole failure is the full 24-case real-Havok matrix test. Its retained Playwright error context says: `The browser matrix failed before download: Fixture bytes or configHash-independent payload differ from the pinned L01 identity.` The UI snapshot reports the export failed and no successful download is available.

The exact source at the run SHA confirms the boundary: `games/counterball/src/simulation/loftCoarseRunner.ts` computes and compares the raw fixture-file and payload hashes at lines 2514–2518, then throws on mismatch. The runner's pinned raw-file SHA is `e4ede68e3ab82e801fbcd42b03196ded4f0ad81683290e40af7634d914364c35`; the fixture file at this exact commit hashes to `beaa25d969b7e0c5e863538af13d54ba9b2f8b9547c4827ef220ea863aa1b092`, confirming that the raw-file pin itself is stale. The first `fetch(havokWasmUrl)` is at line 2533; per-case `executeStep` is later at line 1990 in the case runner. Therefore this run's failing matrix action stopped before the WASM fetch and before any case impulse or physics step. It produced no complete matrix file/download or matrix-success artifact. This is a preflight identity failure, not a physics result, and does not show that any tuple ran.

## Artifact provenance and integrity

The saved artifact API snapshot associates these ten uploaded artifacts with this run. Sizes and `sha256:` values below are GitHub API archive metadata; the archive digests are reported as provided by GitHub. Separately, I recomputed SHA-256 and byte size for **all 1,155 extracted files** and compared them with the saved member inventory: **59,532,996 bytes, zero missing/extra files, and zero size or hash mismatches**.

| Artifact ID | Name | API size | API archive digest |
|---:|---|---:|---|
| 11929930330 | `counterball-browser-evidence` | 2,350,168 | `f2eea1005803fefdd383a28a3957e139eb490f6e0401a721dcd0b6aa867d5755` |
| 11929900279 | `counterball-verification-log` | 108,565 | `d42c98bf683496b2f4f0da493cac13af1d9eb3b383e19c09479cb5093a09ec63` |
| 11929840657 | `counterball-hosted-checks-e7f5e4dd5c11182206a716a3ec58412b343a9e57-run-38638496304-attempt-1` | 120,896 | `7443b0d516be0e151a60dfa669eb6391381aba595cf609f9a0209d8543ec3f1a` |
| 11929652626 | `formatting-repair` | 162 | `7fdc42b1961622057f381df728d0328eba8e268a04ccda7dff9c3fda538b4f5f` |
| 11928529279 | `counterball-browser-preview` | 2,491,084 | `495dcebf4cb48c09bd4c2a68328d19a68e9df6f2da5ec8277a7dd2a92735c03a` |
| 11928509248 | `counterball-realtime-prebuilt-e7f5e4dd5c11182206a716a3ec58412b343a9e57` | 1,953 | `5e7f24418866a7becf1a9e343b13a0e31596781ede02de2f354a6a667fef3ff2` |
| 11928459456 | `counterball-web-production-e7f5e4dd5c11182206a716a3ec58412b343a9e57` | 2,517,172 | `6f0ea0b2edde4e81851273ba070f4e18e0e0ab7323d08bdcc5c18ff1698c6a3c` |
| 11928414831 | `counterball-calibration-observations` | 104,314 | `78e424661eda3c4b1aea06df536545545a3b3a5837d49b89c7c4ecf83c4468d7` |
| 11928374554 | `counterball-intended-shot-observations` | 1,406,942 | `c1960b4194968000dab9980be774e80e571ee6823f87c92f429ae46baf060d43` |
| 11928074951 | `counterball-web-diagnostic-e7f5e4dd5c11182206a716a3ec58412b343a9e57` | 2,490,725 | `bf9b376ad23d7cdc7b504cb1ca50f2310b4f3e123fc119e62a03021b01b6d959` |

Key extracted member hashes, independently checked against the complete inventory:

| Member | Bytes | SHA-256 |
|---|---:|---|
| `counterball-hosted-checks-e7f5e4dd5c11182206a716a3ec58412b343a9e57-run-38638496304-attempt-1/verify.log` | 899,904 | `eb7024f361474b6ba4635e54adc4c47d5f3ab18bbf35cbc74f8ba66841438d13` |
| `counterball-hosted-checks-e7f5e4dd5c11182206a716a3ec58412b343a9e57-run-38638496304-attempt-1/protocol.log` | 479 | `2fdc2781b65b1b161cdb92ed0642a4b2ceee39fc5a0848fd98ddd15521b04630` |
| `counterball-hosted-checks-e7f5e4dd5c11182206a716a3ec58412b343a9e57-run-38638496304-attempt-1/integration.log` | 574 | `f1a0b6f88d38fb261bf8b6930a05077e084c0bc42046467301982b84a67c1265` |
| `counterball-browser-evidence/.artifacts/browser-test-results-diagnostic.json` | 139,771 | `406c3b6f7d4e4731781fb4be0aa0fda4ca44ac055f69e7b719f979a8d5d51087` |
| `counterball-browser-evidence/test-results/counterball-direct-probe-t-80c91-ses-bounded-host-validation-chromium/error-context.md` | 10,713 | `8b5b763b09ad3f301546d03c02e95c679135947e6f301d68fe73f864d901fe19` |
| `counterball-browser-evidence/test-results/counterball-direct-probe-t-80c91-ses-bounded-host-validation-chromium/trace.zip` | 286,440 | `14b88bb0c4a7bec7816a415519213257b7cb7418e3817f83c7bd132a9bb57fb0` |

The full retained run files also have these local SHA-256 values: `github.log` `2168fcf81420857e1eab99a854dcbac2d088371bce92133567eadb96a269c526`, `run.json` `d9fe09d93594de656fb83520519714ab4c337819bdce6fbc06ac5bb1b49d1858`, `jobs.json` `fee9372fa65171c10adbf0a3688ed3ea97208a221b63fd29f990d727f734e254`, and `artifacts-api.json` `2d71e6aacffbb935eb6bed59fcfee6b9e0353e823f368cdc83f6ead13e315d50`.

## Acceptance boundary

This exact run supplies passing hosted evidence for canonical config/protocol checks and the native-cylinder radius helper, alongside the required independent source reviews. Those records may support only their bounded producer/helper/identity scopes when evaluated against their own acceptance conditions. The run remains failed because the matrix consumer still rejects the old fixture identity; **T02-L01 matrix acceptance, successful tuple execution, a complete downloadable matrix, deployed Cloudflare Havok, and playable-match acceptance remain unproven**. No local application checks or deployment were run for this review.

Evidence files reviewed: `execution_state/reports/T02-L01-SUPPORT-DATUM-CONFIG-1-run-38638496304-run.json`, `-jobs.json`, `-github.log`, `-artifacts-api.json`, `-artifact-inventory.json`, and the corresponding `-artifacts/` tree. Hash comparison was performed against every extracted file in that tree.
