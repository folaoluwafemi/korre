# T02-L01-EXECUTOR-1 hosted evidence review

**Verdict: PASS for the hosted evidence audit only.** This review confirms the reported GitHub run and its uploaded evidence. It does not accept the task card or establish a playable match; the coordinator still owns card acceptance, and the L01 matrix remains outstanding.

## Run identity and workflow result

- GitHub Actions run: [38408175100](https://github.com/folaoluwafemi/korre/actions/runs/38408175100)
- Head SHA: `aa001fd4297e06a828444394a56685519dc61edf`
- Job snapshot reports the run and `verify` job as successful, with 35 successful regular steps, 0 failed steps, and 2 skipped conditional steps. The only skips are “Prepare formatting suggestion after a failed check” and “Upload formatting suggestion”; they are failure-only formatting suggestions, not skipped checks or tests.
- The full GitHub log contains no workflow error or failed-process markers. The hosted verification log reports typecheck, lint, formatting, and builds passed; 30 test files and 179 tests passed, with 0 test skips.

## Test evidence

- Unit/workspace suite: 30/30 files and 179/179 tests passed; 0 skipped.
- Integration: 1/1 test passed.
- Production browser preview: 4 passed, 0 skipped, 0 flaky.
- Diagnostic browser suite: 2 passed, 0 skipped, 0 flaky.

The four preview tests cover scene rendering and idle/remount cleanup, WebGL failure/context-loss recovery, mobile-size camera interaction, and accurate non-playable home-screen messaging. The two diagnostic tests cover a direct browser impulse and blocked-WASM retry cleanup.

## Flick and playability scope

The flick result is **diagnostic-probe evidence only**. The trace identifies scope `browser-direct-impulse-v1`, fixture `counterball-protocol-fixtures-v1`, a fixed impulse `{x: 0, y: 0, z: 8}`, settled termination, and measured cap/button movement plus changed WebGL pixels. It demonstrates that a real pointer action can apply an impulse in the browser Havok scene. It does not demonstrate the canonical L01 executor, full turn/rules resolution, or a playable match.

The 24-case L01 matrix did not run in this workflow. The evidence also does not prove deployed Cloudflare Havok. Therefore this run does not establish L01 completion or overall playability.

## Artifact integrity

I independently recomputed SHA-256 and byte size for every entry in the run's artifact inventory. All 1,152 files were present under the artifact root; all 1,152 hashes and sizes matched. Total inventoried and hashed size was 59,121,928 bytes. There were 0 missing files, size mismatches, hash mismatches, or unsafe paths.

## Evidence inspected

- `execution_state/reports/T02-L01-EXECUTOR-1-run-38408175100.md`
- `execution_state/reports/T02-L01-EXECUTOR-1-run-38408175100-github.log`
- `execution_state/reports/T02-L01-EXECUTOR-1-run-38408175100-job-snapshot.json`
- `execution_state/reports/T02-L01-EXECUTOR-1-run-38408175100-artifact-inventory.json`
- Run artifact `verify.log`, `integration.log`, `e2e.log`, `browser-test-results.json`, and `browser-test-results-diagnostic.json`
- Diagnostic probe and retry-teardown attachments in the same run artifact directory

No local build, test, browser, or physics command was run for this review.
