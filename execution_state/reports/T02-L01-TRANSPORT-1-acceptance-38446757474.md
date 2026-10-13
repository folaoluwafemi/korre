# T02-L01 transport acceptance — GitHub run 38446757474

**Decision: ACCEPTED for the maximum-size browser-to-host transport gate.** Parent T02 remains RUNNING. This does not claim a completed restart/loft matrix, deployed Cloudflare Havok, or a playable match.

The exact hosted source was commit `8e31b3320295d02d57dbf40a6acded3a9ea57485` on `codex/remote-ci-bootstrap`. [GitHub Actions run 38446757474](https://github.com/folaoluwafemi/korre/actions/runs/38446757474) completed successfully: 35 successful steps, 0 failed, 5 conditional failure-only steps skipped. Hosted Verify passed all 30 test files and 179 tests; production diagnostic-marker exclusion passed; integration passed 1/1; built production preview passed 4/4. The routed diagnostic Chromium suite passed 3/3 with zero skips, retries, or flaky tests.

The diagnostic suite recorded a real browser Havok/WASM pointer flick: all 15 bodies settled, the button contacted and moved `home-6`, the button also moved, and 328 WebGL pixels changed. The failed-WASM path returned to zero engines/listeners/observers and its retry teardown returned to baseline. These results are diagnostic browser evidence only.

The transport test streamed exactly 504,365,056 deterministic bytes via the bounded browser writer and file download, hashed the saved file incrementally on the host, verified the expected digest, received the matching host acknowledgement, and reported cleanup of browser and host temporary files. The synthetic data was not attached as an artifact. It is transport evidence, not matrix or physics evidence.

Independent evidence review passed at `T02-L01-TRANSPORT-HARNESS-1-run-38446757474-review.md`. It tied the run, logs, artifacts and five decoded browser attachments to the exact SHA and independently checked counts, byte/digest/acknowledgement/cleanup assertions, and teardown. Existing source reviews cover the transport implementation and the bounded viewport repair: `T02-L01-TRANSPORT-1-review.md`, `T02-L01-TRANSPORT-1-repair-2-review.md`, and `T02-L01-TRANSPORT-HARNESS-1-pointer-repair-source-review.md`.

The accepted next card is `T02-L01-MATRIX-1`, which must run the complete 24-case real-Havok browser matrix. No Cloudflare/Wrangler deployment was attempted. The first browser-flick milestone remains diagnostic, not a playable match.
