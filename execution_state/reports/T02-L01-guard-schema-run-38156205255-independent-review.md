# T02-L01-GUARD-SCHEMA-1 hosted-run evidence review

**Verdict: PASS — the hosted evidence for the required exact-head focused protocol tests and `pnpm verify` is complete and satisfies the packet's run-evidence criteria.** This is a run-evidence review only; it does not accept the card or review source correctness.

## Provenance and workflow outcome

Inspected GitHub Actions run [38156205255](https://github.com/folaoluwafemi/korre/actions/runs/38156205255), CI run number 71, attempt 1, branch `codex/remote-ci-bootstrap`, expected head `970ea3d430fa751aa19ad8a037a359d7b23417c4`. GitHub reports the run completed successfully. Its sole job, `verify` (job ID `114519596202`), succeeded from `2026-10-11T16:37:05Z` through `16:39:33Z`.

The focused protocol-test step, `Verify`, production diagnostic-exclusion check, Worker packaging, production browser build, integration tests, built-preview tests, diagnostic-renderer build/package, diagnostic browser suite, and evidence/log uploads all concluded success. Cleanup steps also succeeded. Only the two conditional formatting-suggestion steps were skipped; they are failure follow-ups and the run has no failed step. No workflow rerun occurred (attempt 1).

## Hosted check results

The retained hosted-check log artifact is `counterball-hosted-checks-970ea3d430fa751aa19ad8a037a359d7b23417c4-run-38156205255-attempt-1` (artifact ID `11708014887`). Its logs show:

- Focused `packages/game-protocol/src/protocol.test.ts`: **1 file, 13 tests passed**.
- `pnpm verify` executed `pnpm typecheck && pnpm lint && pnpm test && pnpm build`; the complete verification log reports **29 test files and 164 tests passed**. Typecheck, ESLint/Prettier, and build completed inside the successful Verify step. The log contains no skipped, failed, or retry test entries.
- Integration suite: **1 file, 1 test passed**.
- Standard Playwright suite: **4 passed**. Its structured result JSON records `expected: 4`, `skipped: 0`, `unexpected: 0`, `flaky: 0`; all four results have retry index 0.
- Diagnostic Chromium suite: **2 passed**. Its result JSON records `expected: 2`, `skipped: 0`, `unexpected: 0`, `flaky: 0`; both results have retry index 0. The collected file is `tests/e2e/counterball-direct-probe.spec.ts`. Its result attachments include direct-probe trace/teardown evidence and a blocked-WASM/retry cleanup case. These adjacent renderer diagnostics are not L01 calibration or physics acceptance.
- Dedicated Workers smoke/package and disposable PostgreSQL migration steps: successful job steps; their logs are retained in the same hosted-check artifact.

`verify.log` contains existing tests whose output mentions Babylon's Null engine. I do not treat those tests as actual Havok/physics evidence. This card is schema-only and this review claims no physics trial.

## Production exclusion and build identity

The successful `Check production build excludes the diagnostic renderer` step is corroborated by the retained production `build-inventory.json`: `sourceSha` is the expected SHA, `runId` is `38156205255`, `runAttempt` is `1`, `buildMode` is `production`, `devHarnessFlag` is `unset`, and its 454 emitted-file inventory has no diagnostic renderer marker/path. The separate diagnostic build inventory has the same SHA/run/attempt and identifies `buildMode: renderer-diagnostic`, `devHarnessFlag: set`, and the development-only diagnostic marker. The inventories are retained in the production and diagnostic artifact folders.

## Artifact integrity and retained evidence

All nine run artifacts were downloaded and retained under `execution_state/reports/T02-L01-guard-schema-run-38156205255-independent-artifacts/`. I fetched each GitHub ZIP and independently matched its byte length and SHA-256 to the GitHub Actions artifact API metadata. Full run metadata, artifact metadata, and per-archive comparison results are retained there as `github-run-38156205255.json`, `github-artifact-metadata.json`, and `github-artifact-archive-integrity.json`; verified ZIPs are in `.github-archives/` and the extracted artifacts are in sibling folders.

| GitHub artifact | ID | Bytes | SHA-256 |
|---|---:|---:|---|
| `counterball-browser-preview` | 11708518525 | 2,490,791 | `0c768c25c93f79bc8eda67d1db701bfce3901b89214dc22e3fd7c0879f178bb0` |
| `counterball-browser-evidence` | 11708488591 | 2,060,614 | `b7b9bca44cc274c162fb9236b62a06d0810ad2991c7234477a98a3f4fdc09b31` |
| `counterball-intended-shot-observations` | 11708443557 | 1,406,942 | `293ce79b03071b8b9b5959b91f40a8491aadf28770f02b48a943107b706e2d9b` |
| `counterball-realtime-prebuilt-970ea3d430fa751aa19ad8a037a359d7b23417c4` | 11708378765 | 1,954 | `184fb8fb3dffc086719c7540b7f7a0b43fc88ea66037be32ab8b7ba906b47f74` |
| `counterball-verification-log` | 11708298852 | 108,108 | `fb76917820cbb090fe5c2a93a4e296abae1bbf14dadc4c6e984cec46a193514b` |
| `counterball-web-diagnostic-970ea3d430fa751aa19ad8a037a359d7b23417c4` | 11708269081 | 2,467,646 | `6492066ddd2d0b8636ec222ec16a5d568df20f3ac34f634160223066a80e0ab8` |
| `counterball-calibration-observations` | 11708104184 | 104,314 | `86296584f85860595e20e5de1a013a54367ae58af9e14e2f4c8c6b4108cfd2e3` |
| `counterball-hosted-checks-970ea3d430fa751aa19ad8a037a359d7b23417c4-run-38156205255-attempt-1` | 11708014887 | 118,802 | `cffcc71bbcbf882031bc9ad6a05e3209f797b26229f04c4d76adc525d510e9eb` |
| `counterball-web-production-970ea3d430fa751aa19ad8a037a359d7b23417c4` | 11707964839 | 2,516,856 | `7659c529a9036c4e219315227886bf5c456b7a8051e1e77dc54b9049100e280c` |

## Scope and limits

I re-extracted `T02-L01-GUARD-SCHEMA-1` with `node scripts/check-completion-plan.mjs --packet T02-L01-GUARD-SCHEMA-1`; its PASS is explicitly plan consistency only and the packet remains `ready: false`. No local app checks, install, build, tests, browser run, physics/Havok trial, deployment, or source/status changes were performed for this review. Hosted run evidence is PASS; source review, parent acceptance, and task acceptance remain separate gates. No local runtime or physics claim is made.
