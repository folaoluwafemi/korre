# T02-L01-MATERIAL-DIAGNOSTIC-1 acceptance

**Status: ACCEPTED for exact native material mismatch disclosure only.**

The exact source reviewed on commit `a20c96a4c7a097b19b867e164cac89141b84036d` adds the failing field and exact setter/readback values to the existing strict material failure. Independent source review passed in `execution_state/reports/T02-L01-MATERIAL-DIAGNOSTIC-source-review.md`.

GitHub run [38473828114](https://github.com/folaoluwafemi/korre/actions/runs/38473828114) completed. Hosted Verify passed 30 test files and 181 tests; integration passed 1/1; ordinary Chromium preview passed 4/4. The diagnostic browser suite passed three checks and stopped its matrix check before case one, reporting friction setter `0.15` and native readback `0.15000000596046448`. Each suite recorded zero skipped, retried, and flaky tests. The diagnostic suite exercised a real Havok flick that changed WebGL pixels, WASM failure/retry, and maximum synthetic transport before its fourth check exposed the material mismatch.

Independent exact-run evidence review passed at `execution_state/reports/T02-L01-MATERIAL-DIAGNOSTIC-run-38473828114-independent-review.md`. It confirmed the exact commit, counts, values, support preflight's earlier position in the runner, and absence of a completed matrix case, result, or download artifact. `Math.fround(0.15)` equals the observed value; this is a measured representation inference, not approval to change material validation.

The exact run therefore accepts the diagnostic disclosure only. It does **not** accept a material comparison change, any matrix case, the 24-case matrix, tuned physics, deployed Cloudflare Havok, online play, or the parent T02. `MATRIX-1` remains `CHANGES_REQUIRED`; T02 remains `RUNNING`.

Evidence is retained in `execution_state/reports/T02-L01-MATERIAL-DIAGNOSTIC-run-38473828114.md`, with API snapshots, GitHub log, extracted artifacts and 1,155-file SHA-256 inventory under `execution_state/reports/T02-L01-MATERIAL-DIAGNOSTIC-run-38473828114/`. No local application install/build/test/browser/physics command or Cloudflare/Wrangler operation was run for this card.
