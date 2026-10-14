# T02-L01-SUPPORT-DATUM-CONFIG-1 run 38635348850 independent review

**Evidence review: PASS. Run result: FAIL; the config producer and native-radius helper are not accepted by this run.** Run 38635348850 is a completed failed push workflow, attempt 1, for exact commit `31f61953b86a31ec0410b093f1d13743961abd68` ([GitHub run](https://github.com/folaoluwafemi/korre/actions/runs/38635348850)). The full saved workflow log SHA-256 is `d12b9fcf41ce7f1578e7ecda8cc3f9e33ea19665decacdc7536a43053dedcf87`.

The saved job snapshot records **40 steps: 26 success, 1 failure, 13 skipped**. Step 13, `Verify`, is the only failure. Steps 17–21 (production/Worker/browser packaging) and 25–31 (integration, built preview and diagnostic-browser gates) were skipped, as was cleanup post-step 67. The diagnostic TypeScript-resolution steps 14–16 succeeded; they are not builds or application runtime checks.

The complete uploaded `verify.log` is the source of the Vitest totals because the retained GitHub full-log display omits its final test summary. It records typecheck, ESLint and Prettier passing, then **31 test files: 30 passed, 1 failed; 191 tests: 179 passed, 12 failed; 2 unhandled errors**. The separate `nativeCylinderRadius.test.ts` passed all **4/4** tests. The protocol contract step passed **14/14**, the Workers smoke test passed **1/1**, and the disposable migration check verified one forward-only migration. These focused checks do not replace the failed full Verify run.

The failure is localized to the hosted writer unit suite. Repeated errors show `loftCoarseProbe.ts` rejecting `Matrix guardSchemaVersion must be an integer from 1 through 1` during `validateMatrixMetadata`, before the writer tests reach their intended input/sink assertions. The full Vitest summary shows 12 failures in that test file. The two unhandled rejection traces come from the backpressure and cancellation tests and show the same early guard-version exception. This supports the specific stale guard-range diagnosis; it does not show that the matrix writer or physics ran successfully. `pnpm verify` therefore did not reach `pnpm build`; integration and browser steps were skipped.

The artifact API snapshot lists six uploads. Their `digest` values are the API-reported archive digests; I did not treat those as hashes of the extracted content:

| Artifact | ID | API size (bytes) | API archive digest |
|---|---:|---:|---|
| `counterball-hosted-checks-31f61953b86a31ec0410b093f1d13743961abd68-run-38635348850-attempt-1` | 11927918718 | 1427088 | `sha256:4f533a25ecea8a393e048d8e57addc02b962ba618c8f665df7d4dffccfcf56f6` |
| `counterball-browser-evidence` | 11927538900 | 437511 | `sha256:69f8c3df7018ece2d7d6fdb482ffe63b55eb84b76324c7648a4613b1dad493e7` |
| `counterball-calibration-observations` | 11927464002 | 104314 | `sha256:4e6ad4685c3c6f2c25ba5a39004a02e3c9e98a12e094aee12f1cff64fd8fda7a` |
| `counterball-verification-log` | 11927443937 | 102331 | `sha256:f7aff473cacba78aba70dfc52f56651bdf97a37f21ffacf3ece271f6f5dfaa71` |
| `counterball-intended-shot-observations` | 11927389039 | 1406942 | `sha256:9b30a2a7eb70bf2d73ba86c449c47efafb92696cb2fd6d645cc9b715066c931d` |
| `formatting-repair` | 11926929318 | 162 | `sha256:84eed26328ad541c1886abb3fe73d19972a13c49565e469fd52a8d4f801bf9c2` |

I recomputed SHA-256 and byte size for all **24 expanded files**: all match the saved inventory, with **76,149,349 bytes**, zero missing paths, zero extra paths, and zero hash/size mismatches. The expanded verification artifact is 878,418 bytes with SHA-256 `b55f599b2263bcd505c88b12867fc7e60947950400e8d07cdcad3e1fdada01c3`; its duplicate in the verification-log artifact has the same size and digest. The formatting-repair patch is an empty file (0 bytes; SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`), consistent with the formatter passing. Browser evidence consists of three carried T03 screenshots only. Calibration/intended-shot outputs are not the required 24-case L01 matrix artifact.

This run establishes source/config typecheck and formatting success, the focused protocol and Workers results, and the exact writer-test failure. It does not provide accepted producer/helper verification, a production build, integration/browser proof, or any matrix/physics acceptance.

Evidence inspected: [run metadata](/C:/Users/USER/StudioProjects/korre/execution_state/reports/T02-L01-SUPPORT-DATUM-CONFIG-1-run-38635348850-run.json), [job snapshot](/C:/Users/USER/StudioProjects/korre/execution_state/reports/T02-L01-SUPPORT-DATUM-CONFIG-1-run-38635348850-jobs.json), [full workflow log](/C:/Users/USER/StudioProjects/korre/execution_state/reports/T02-L01-SUPPORT-DATUM-CONFIG-1-run-38635348850-github.log), [artifact API snapshot](/C:/Users/USER/StudioProjects/korre/execution_state/reports/T02-L01-SUPPORT-DATUM-CONFIG-1-run-38635348850-artifacts-api.json), [artifact inventory](/C:/Users/USER/StudioProjects/korre/execution_state/reports/T02-L01-SUPPORT-DATUM-CONFIG-1-run-38635348850-artifact-inventory.json), and the downloaded artifacts under `execution_state/reports/T02-L01-SUPPORT-DATUM-CONFIG-1-run-38635348850-artifacts/`.
