# T02-L01-MATERIAL-DIAGNOSTIC-1 hosted run

**Run:** [38473828114](https://github.com/folaoluwafemi/korre/actions/runs/38473828114)
**Source commit:** `a20c96a4c7a097b19b867e164cac89141b84036d` on `codex/remote-ci-bootstrap`
**Conclusion:** GitHub Actions failed the required real-Havok matrix guard before its first case. The preceding checks and browser preview passed.

The run started at `2026-10-13T21:52:40Z` and completed at `2026-10-13T21:57:59Z` (5 minutes 19 seconds between recorded timestamps). The exact friction failure from the diagnostic browser result is:

```text
field: friction
setter: 0.15
native readback: 0.15000000596046448
```

`Math.fround(0.15)` evaluates to `0.15000000596046448` in JavaScript. This equality is evidence consistent with float32 storage and is an inference about the native representation; it does not authorize changing the material comparison contract. The reported error preserved the existing strict-equality failure path.

The runner source calls the support-AABB-Y preflight before the material readback check. The independently accepted F32 support run and its source-order review establish that this support check passed before execution reached this friction failure. The current run itself reaches the friction error, so it does not produce any completed matrix case.

## Checks recorded from this run

- Verify: 30/30 test files and 181/181 tests passed.
- Workers: 1/1; protocol: 13/13; integration: 1/1.
- Ordinary Chromium preview: 4/4 passed; zero skipped, retried, or flaky tests.
- Diagnostic Chromium preview: 3 passed, 1 failed; zero skipped, retried, or flaky tests. The three successes cover an actual Havok flick that changed WebGL pixels, WASM failure and retry, and maximum synthetic transport.
- Failure: the real-Havok matrix guard reported the friction setter/readback pair above before download or case execution.
- Matrix: zero completed cases, no matrix result, and no matrix artifact. The calibration and intended-shot observation artifacts are separate and do not satisfy this gate.
- No Wrangler or Cloudflare deployment command was run.

## Evidence capture

The captured API snapshots are `run.json`, `jobs.json`, and `artifacts.json`; `github.log` contains the Actions log. The artifact API lists ten artifacts. The local capture includes the extracted test results and relevant verification / E2E logs. `extracted-file-hashes.json` records SHA-256 and byte length for all 1,155 files currently present beneath `artifacts/`.

The GitHub CLI reported a duplicate-output-path collision for `execution_state/reports/T03-inspection.png` while extracting artifacts with overlapping paths. The collision is recorded as a capture limitation; the extracted diagnostic test result, hosted check logs, and browser evidence used above are present. This report does not claim that each downloaded archive was independently reconstituted byte-for-byte from its API digest.

Independent exact-run evidence review passed at `execution_state/reports/T02-L01-MATERIAL-DIAGNOSTIC-run-38473828114-independent-review.md`. The reviewer independently confirmed the exact SHA and mismatch, support-preflight ordering, zero matrix cases/downloads, and zero skips/retries/flakes in the diagnostic suite. The material diagnostic card is accepted only for exact-value disclosure. `MATRIX-1` remains `CHANGES_REQUIRED`, and T02 remains `RUNNING`.
