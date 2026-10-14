# Independent exact-run review: SUPPORT-DATUM-MATRIX-1

## Verdict

**Run evidence: PASS. Matrix runtime gate: CHANGES_REQUIRED.** The saved GitHub evidence is complete and matches the requested run and commit. The real-browser matrix did not complete: its first case failed the configured contact-row ceiling before any download or completed case. This run does not accept the matrix packet, T02, playable physics, or deployed Havok.

## Provenance and archive integrity

GitHub run `38643635405` is completed with conclusion `failure`, attempt 1, on exact head SHA `6c88ecc0cbc43c57b887a5f929cc9e0a46cad8ab` (`codex/remote-ci-bootstrap`). The saved run URL is https://github.com/folaoluwafemi/korre/actions/runs/38643635405. The run metadata, jobs, artifact API inventory, and full job log agree on that identity.

I independently rehashed the extracted artifact tree against `T02-L01-SUPPORT-DATUM-MATRIX-1-run-38643635405-artifact-inventory.json`: all 1,155 listed files match by relative path, byte count, and SHA-256; there are no missing, changed, or extra files. Both totals match exactly: 60,304,205 bytes. Relevant evidence hashes:

- Full job log: `fdb421d72ba32229299f2855e3026fea0a3f125f6cdaec5524b815ba40e89c89`.
- Hosted `verify.log`: `c05ff44618b69d20d4bf109caf620787a7ba37c6eaa26e26d4f4de57cdf63cd6`.
- Diagnostic E2E log: `59d3a3a94f6cc2cad1e411f9c819b17184d19024ce8ad3a2fe8a2288f010c8de`.
- Diagnostic Playwright results: `a5ebed4f827125ae9ce76349fab590db13a58f9ccf628480c561cb141a69311d`.
- Matrix test error context: `fc249048192ab8603437383359fbe16e097aefc1a065d0d40118f7164249e9f2`.
- Artifact inventory: `2af73da91c5d9a29fecc8bc58e92ed61bb319594b25b151cd897f7575021b998`.

## Checks reached

The hosted `pnpm verify` step passed typecheck, ESLint, Prettier, all 31 Vitest files / 196 tests, workspace builds, production diagnostic-exclusion scan, Worker packaging/smoke, and the production browser build. The Vitest summary reports 196 passed and no skipped tests. Disposable migrations completed; integration reported 1/1 passed. The production Chromium preview suite reported 4/4 passed.

The separate real-browser diagnostic suite ran four Chromium tests with zero retries, zero skipped, and zero flaky: the real pointer flick, blocked-WASM/retry flow, and full-size transport passed; the 24-case matrix test failed. Playwright’s exact counts are 3 expected, 1 unexpected, 0 skipped, and 0 flaky.

## Matrix result and limit

The matrix test reached the real browser/Havok path, but the first tuple failed with `Contact rows exceed the hashed case/matrix ceiling.` Its captured page state reports `completedCases: 0`, `currentMatrixIndex: 0`, `nominalTick: 4`, `executeStepCalls: 240`, and `batches: 2`. The page displayed that the export failed and no successful download was available. The test consequently stopped before host-side file validation, acknowledgement, or attachment. The extracted inventory has no `counterball-l01` matrix payload or host-validation attachment. Other uploaded probe observations, including the intended-shot artifact, are separate evidence and do not satisfy this matrix gate.

The result establishes that the matrix producer’s existing contact-row ceiling is reached on the first tuple under this hosted browser run. It does not establish a completed tuple, any of the remaining 23 cases, or successful full-matrix serialization and validation. Preserve the configured cap and typed resource failure; resolving the observed contact-volume/cap contract needs a separately reviewed decision before another run.

No local application checks were run for this review. No deployed Cloudflare Havok, production deployment, or playable match was tested or established.
