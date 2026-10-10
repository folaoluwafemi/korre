# Independent review: C01-DIAG-BUILD run 38094866745

**Verdict: PASS** for the corrected run-evidence report. The run itself remains failed and does not support accepting C01-DIAG-BUILD.

## Verified evidence

The saved metadata identifies failed CI run `38094866745`, attempt 1, on commit `1453b12b525d553b07f4add02e21f61ee401282c`; checkout lines in the full job log show the same SHA. The hosted `verify.log` locates TS4111 at `apps/web/src/App.tsx:5` and reports that `import.meta.env.VITE_COUNTERBALL_DEV_HARNESS` must use bracket access. Seven workspace typechecks completed before the `apps/web` typecheck failed. The focused Workers smoke test passed 1/1, the protocol test passed 11/11, both migration passes verified one forward-only migration, and the workflow formatting check passed. Lint, the general unit suite, build, integration, browser preview tests, and diagnostic build did not run after the verification failure.

Metadata step totals are 23 successes, 1 failure, and 12 skipped. The artifact API has four records tied to the same run and SHA: browser evidence `11685841821` (437511 bytes; `sha256:e2b58edd14ca83845c7a961ae350c1ad9e2b592567129cd336024d4b672d9417`); formatting repair `11685482220` (611 bytes; `sha256:5ed5b9811c087c18973e05402a7f960c238d6570bc28a10de92b6acb199b072b`); hosted checks `11685312934` (1895 bytes; `sha256:feb73dc58e779d09f2dd07df085e028614a8e8c091acdebab969aabb62e634e1`); and verification log `11685288035` (627 bytes; `sha256:7cf1c2710a7c4bc29dbaac921f66933c82465ebb83d7897cccb17e1323785849`). Extracted hosted files match the hosted artifact inventory: `migrations.log`, `protocol.log`, `tooling-format.log`, `verify.log`, and `workers.log`. The separate formatting patch only reformats the production-absence test; it does not address TS4111. No diagnostic build artifact or browser test-results file is present.

## Initial finding (resolved by addendum)

At the time of the initial review, the implementation report said the 12 skips included “9 required production, integration, browser and diagnostic-artifact checks plus 3 post-action cleanup steps.” Metadata showed **11 skipped task gates** (steps 14–18 and 22–27) and **one skipped post-action** (step 59, `Post Run actions/setup-node@v4`). The original count was correct but its breakdown was not; the correction is verified in the addendum below.

The API digests above are GitHub-reported archive digests; no ZIP archive bytes or per-file hash manifest were included in the reviewed materials, so I did not independently recompute archive digests. The available evidence proves neither a diagnostic browser build nor playability, a real flick, deployment, or an overall no-skip test pass.

## Addendum — 2026-10-11

I rechecked the corrected breakdown against the saved metadata: it records 23 successful steps, one failure, and 12 skips—task-gate skips at steps 14–18 and 22–27 (11 total), plus the single skipped post-action at step 59. The corrected report now states that breakdown accurately. Its artifact note also correctly identifies the listed archive digests as GitHub API metadata; the retained local directory contains extracted files, not original ZIP archives for independent digest recomputation. The evidence-report audit therefore passes. The run still failed at TS4111 and supports no successful build or playability acceptance.
