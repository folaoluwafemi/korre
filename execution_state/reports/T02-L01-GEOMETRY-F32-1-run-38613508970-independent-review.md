# T02-L01-GEOMETRY-F32-1 exact-run independent review

**Run evidence: internally consistent; matrix acceptance: CHANGES_REQUIRED.**  
The hosted run reached the first tuple's preflight and passed the dynamic-cylinder geometry checks for all 15 bodies, then failed the static support-apron check before impulse or simulation. It did not complete a tuple or the 24-case matrix. This does not accept GEOMETRY-F32-1, MATRIX-1, T02, calibration, or playability.

## Provenance and step results

`execution_state/reports/T02-L01-GEOMETRY-F32-1-run-38613508970-run.json` records GitHub Actions run [38613508970](https://github.com/folaoluwafemi/korre/actions/runs/38613508970), completed with overall conclusion `failure`, exact head SHA `533df8426d8187875565a74b2997987886a1ca71`, and one `verify` job. The job's final failure is step 31, `Run every produced local diagnostic browser suite`; the run metadata records that test step as failed. Steps for frozen install, Worker smoke, formatting, Chromium setup, disposable migrations, focused protocol tests, Verify, production diagnostic exclusion, browser/Worker packaging, integration, built-preview browser tests, and uploads completed successfully.

The preserved Verify log reports **30 test files and 184 tests passed**, with no skipped tests in the Vitest summary. The focused protocol suite reports **13/13 passed**. Disposable migrations report one forward-only migration verified on each of two invocations. Integration reports **1/1 passed**. The normal built-preview Playwright log reports **4/4 passed**; its JSON records 0 skipped, 0 unexpected, 0 flaky, and retries configured as 0.

The produced diagnostic Chromium suite ran **4 tests** with 1 worker and 0 configured retries: **3 passed, 1 failed, 0 skipped, 0 flaky**. Every recorded test result has retry `0`. The passing tests were the real pointer flick, the blocked-WASM/retry cleanup flow, and the maximum synthetic transport. The only failed test was `the full real-Havok loft matrix downloads and passes bounded host validation`.

`run.json` also marks three conditional TypeScript troubleshooting steps skipped because Verify succeeded, plus the standard skipped `setup-node` post step. These are workflow-control steps, not skipped unit or browser tests.

## Matrix reach and stop point

The Playwright failure context and structured JSON report the browser error:

> The browser matrix failed before download: The diagnostic support apron does not match the exact hashed slab geometry.

The page snapshot says the export failed and no successful download is available. The failed test result contains only `error-context` and `trace` attachments. There is no matrix JSON, matrix host-validation attachment, or L01 matrix artifact in the downloaded tree.

The run's exact-commit source confirms the scope of the partial runtime evidence. The tuple order starts with `[0.75, 45, 6, -15]`. `runCase` reaches the first tuple, creates the real browser world, and attaches the diagnostic apron. `readNativeBodies` validates all 15 dynamic bodies before it processes the seven static bodies: its dynamic loop's X/Y/Z comparisons use `matchesExactFloat32Projection` at lines 983–985; the support-apron mismatch is thrown later at lines 1125–1131. In `runCase`, `readNativeBodies(activeWorld)` is called at line 1501, while the first impulse is not applied until line 1710 and the first `executeStep` until line 1968.

Therefore the first tuple's **15 dynamic native-dimension guards were reached and passed** in the real browser/Havok run. The tuple did not proceed past static preflight: it produced no impulse, no physics step, no completed case rows, and no downloadable matrix. This is useful evidence for the geometry comparison on the first setup, but cannot substitute for the packet's complete 24-case acceptance gate.

## Downloaded artifact inventory and integrity

I independently walked and hashed the saved artifact tree at `execution_state/reports/T02-L01-GEOMETRY-F32-1-run-38613508970-artifacts/`. It contains **1,155 files totaling 60,240,492 bytes** across the ten downloaded artifact roots. For a reproducible aggregate inventory digest, sort all files by normalized relative path in UTF-8 bytewise ascending order and hash the UTF-8 rows `relative-path<TAB>byte-length<TAB>lowercase-file-SHA256<LF>` with SHA-256. The resulting inventory digest is:

`9013d60f17ea89c76e76effff4e05eb69a724930041ffd71cbe1c9f6837ac9a1`

The important production, diagnostic, and Worker inventories identify this exact source SHA and run ID. Their emitted-file manifests match the downloaded files byte-for-byte: production browser **454/454**, diagnostic browser **213/213**, and Worker dry-run **3/3** entries verified for recorded size and SHA-256. Browser-result JSON copies and Verify-log copies under the evidence and hosted-check directories also have identical hashes.

The following artifact paths are relative to the downloaded artifact root named above.

| Evidence file | Bytes | SHA-256 |
|---|---:|---|
| `execution_state/reports/T02-L01-GEOMETRY-F32-1-run-38613508970-run.json` | 7,655 | `a80f9ec652ed84b2dc84050073ed8cf6c7aba08ede3f9120933d698dfa0a3658` |
| `execution_state/reports/T02-L01-GEOMETRY-F32-1-run-38613508970-github.log` | 344,304 | `e87a05ebf7929b091e5469c78b36bc0be150104149888461601a45d90d385807` |
| `counterball-verification-log/verify.log` | 899,652 | `3afb8098f645de3f5e877f5c18db909072c5266b4f86262a736568d00f8cbd6d` |
| `counterball-browser-evidence/.artifacts/browser-test-results-diagnostic.json` | 139,621 | `3af7b434938c900e9cd7711bb35ec61a43b17c46071c1b20ca4cb0ad7f1179e1` |
| `counterball-browser-evidence/.artifacts/browser-test-results.json` | 11,367 | `8e7bfd580aa79ab5cde9ebc327d604dbe164516b993530c216206f0a7b052ebe` |
| `counterball-browser-evidence/test-results/counterball-direct-probe-t-80c91-ses-bounded-host-validation-chromium/error-context.md` | 10,686 | `4f3ef8259db3c9784d90d37491242d24bbb3678b4e36c57c530a6897f1cd1f30` |
| `counterball-browser-evidence/test-results/counterball-direct-probe-t-80c91-ses-bounded-host-validation-chromium/trace.zip` | 996,459 | `4b201fb477e4f616cdbb7fcc7396a183b8a962d1515acc7f2db5ab072d1231fc` |
| `counterball-web-diagnostic-533df8426d8187875565a74b2997987886a1ca71/build-inventory.json` | 37,123 | `cfee47f71b1a3f0a63d0a58ecb1b154b861cfd58c8e8e659d49106906e216333` |
| `counterball-web-production-533df8426d8187875565a74b2997987886a1ca71/build-inventory.json` | 78,616 | `5b43276390bea516575d5ab5dac5085ebda9e6b5f8e487c93b26b1d07ccc7215` |
| `counterball-realtime-prebuilt-533df8426d8187875565a74b2997987886a1ca71/inventory.json` | 965 | `251e0e695bdd9cee98b91e83d035e8c77c0b7d0f5e7794a6d9318179e52f4da4` |

The inventory also contains the separate calibration and intended-shot observations, preview/build bundles, browser screenshots, and the failure trace. Those are not L01 matrix output. No relative artifact path names a loft/L01 matrix output; the diagnostic result lists only the failure context and trace for the matrix test.

## Verdict and limits

The run proves a real hosted browser reached first-tuple setup, and its exact source order establishes that all 15 dynamic-cylinder native dimension comparisons passed before the later support-apron mismatch. It does **not** prove one complete matrix tuple, a successful download, artifact validation, or any of the 24-case workload. The same run ends in failure at the diagnostic suite. Record the partial dimension observation as supporting evidence only; keep GEOMETRY-F32-1/MATRIX-1/T02 unaccepted until a fresh exact-SHA run completes all 24 cases and validates the complete artifact with the required no-skip/no-retry evidence.

No source, contract, task, or status file was changed. No local application tests, builds, browser automation, physics, or Cloudflare commands were run. Local work was limited to reading captured evidence, inspecting exact-commit source, and hashing/inventorying the downloaded files.
