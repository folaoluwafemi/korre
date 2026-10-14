# T02-L01-DIAGNOSTIC-APRON-F32-1 — exact-run independent review

**Verdict: run evidence verified; workflow failed in the diagnostic browser suite; matrix acceptance NOT MET.** Run `38618192294` is complete on the requested SHA. The hashed support-apron Y check passed in the matrix's preflight. The first later preflight failure was `goal-frame-0` native dimensions. No matrix case completed, no matrix impulse or `executeStep` occurred, and no matrix result/download artifact was produced.

## Run identity and gates

- Repository: `folaoluwafemi/korre`
- Run: [38618192294](https://github.com/folaoluwafemi/korre/actions/runs/38618192294)
- Exact head: `4d8a4d8da2827074ddd2767c3978e62fb305f9fc`
- Run JSON: 7,756 bytes, SHA-256 `3472f0d494f2b9ee32c2f8b3ffbb8da4afddb0c265d19455ee98e567665f37db`
- Captured full GitHub log: 340,375 bytes, SHA-256 `69e9e6166270cab15f58ac7ea7612146d0e7fbd23afbb5f3d459ff74573dc8df`
- Overall conclusion: `failure`, one `verify` job. The `Verify` step itself passed; the only failed workflow test step was “Run every produced local diagnostic browser suite.”

The frozen install, Worker smoke test, Chromium setup, migration check, focused protocol tests, full `pnpm verify`, production-exclusion check, Worker/browser packaging and inventories, integration test, and standard browser-preview suite all passed. Concrete test counts in the preserved output:

| Gate | Result |
|---|---|
| Dedicated Worker smoke | 1 test passed |
| Focused protocol tests | 13 passed |
| `pnpm verify` unit suite | 30 files; 185 tests passed, including 21 `loftCoarseProbe` tests; no skipped/failing tests reported |
| Disposable migrations | One forward-only migration verified on both invocations |
| Integration | 1 passed |
| Standard browser preview | 4 passed; 0 skipped, 0 unexpected, 0 flaky; each result has retry 0 |
| Diagnostic browser suite | 3 passed, 1 failed; 0 skipped, 0 flaky; each of the 4 results has retry 0 |

The three passing diagnostic cases were the real pointer flick, blocked-WASM/retry flow, and maximum synthetic transport download. The sole failure was the 24-case matrix download/host-validation test. This was a single run attempt; it did not retry the failed test.

## First failure and apron result

The failure in `e2e-diagnostic.log`, the Playwright JSON, the test error context, and the trace is exactly:

```text
Goal frame collider goal-frame-0 dimensions differ from canonical geometry.
```

The support-apron F32 repair passed its own native-dimension preflight in this run. At the exact run SHA, `worldFactory.ts` adds `counterball-surface` to `world.staticBodies` first (lines 212, 228). The runner maps it to `support-apron` (line 72) and iterates the static bodies in that order (`loftCoarseRunner.ts`, line 1102). Its support branch first checks BOX type, exact X/Z, and `matchesExactFloat32Projection(0.2, dimensions.y)` (line 1122). The subsequent reported error is the later goal-frame branch (line 1156). Thus the support replacement and its projected-Y readback passed; the run does not publish the readback number.

The first goal frame was confirmed to be a cylinder, because the unsupported-collider-type branch did not fire. Its strict X/Y/Z dimension comparison failed. **The logs do not expose the actual `goal-frame-0` bounds or dimensions**: there are no observed values, expected values, axis names, or min/max coordinates in the error, saved page snapshot, hosted log, Playwright result JSON, or trace text. The error-context snapshot and trace both carry only the generic string above. The exact source at this SHA also throws that generic message after the comparison (`loftCoarseRunner.ts:1156`). The failure therefore identifies the failing preflight but does not diagnose which component differed or by how much.

The runner calls `readNativeBodies` at line 1501 and fails inside it. `applyImpulse` is later at line 1710 and `executeStep` at line 1968. This ordering, together with the visible preflight error, proves the failed matrix case stopped before impulse or physics stepping. The runner had begun the first tuple's case setup, but no case returned to the serializer: there are zero completed matrix tuple rows, no completed 24-case matrix, and no successful matrix download. The UI reports that export failed and no successful download is available. The diagnostic artifact manifest lists only `tests/e2e/counterball-direct-probe.spec.ts`; it contains no matrix-validation attachment or matrix JSON. The uploaded calibration and intended-shot observations are separate probes, not the L01 matrix.

## Artifact inventory and hashes

The downloaded tree at `execution_state/reports/T02-L01-DIAGNOSTIC-APRON-F32-1-run-38618192294-artifacts/` contains **1,155 files / 60,198,741 bytes**. Deterministic manifest SHA-256: `27fac79abeae60164b18c5a7684b4fb87c561f82c32ef68da7ebefac40ddaebf`. The manifest is the ordinally sorted list of normalized relative path, byte length, and lowercase per-file SHA-256, separated by tabs and LF-terminated; it is UTF-8 without BOM. Per-directory manifests use the same row format and retain the top-level directory name.

| Downloaded artifact directory | Files | Bytes | Manifest SHA-256 |
|---|---:|---:|---|
| `counterball-browser-evidence` | 12 | 3,227,541 | `46cc7e4a01bc4dd0aca561372852abb19ffb09bc438bffb7af4c6b80dcdf9b40` |
| `counterball-browser-preview` | 454 | 9,641,244 | `b1ee68e554dbbf4b934749be1412998025fe0f7bed26f272cfb69896b962e958` |
| `counterball-calibration-observations` | 1 | 1,345,869 | `436b63fd25f2ee3f0ec18b3e881c8ed373820cd73a707547185082e7093747e7` |
| `counterball-hosted-checks-4d8a4d8da2827074ddd2767c3978e62fb305f9fc-run-38618192294-attempt-1` | 11 | 1,056,430 | `7f6e5816935906223ecafdba0bcfc703f7a4343f5db4f354c6fbad0db0b3edef` |
| `counterball-intended-shot-observations` | 1 | 24,455,019 | `a5c09b913a7b466ff81003b46cff87e084b3629b0ea09dcf658e30b0016f160a` |
| `counterball-realtime-prebuilt-4d8a4d8da2827074ddd2767c3978e62fb305f9fc` | 5 | 2,257 | `92696ef66a2aa53085f8e620e8eb1c9c9ee56095e39f12889844e917088dfa9f` |
| `counterball-verification-log` | 1 | 899,776 | `88581e36d3bff2ed2886f5fb99bbfbe76b05f800e37b52cdeb4ab85903f8a8f8` |
| `counterball-web-diagnostic-4d8a4d8da2827074ddd2767c3978e62fb305f9fc` | 214 | 9,850,745 | `d22f94b1b66a5042a523006906d75d20b22ea5627cedf10326ee047d9122e41b` |
| `counterball-web-production-4d8a4d8da2827074ddd2767c3978e62fb305f9fc` | 455 | 9,719,860 | `48d60bde1fa606befd8da56fd38c632f49d3b02125cda2aaeb23febe8967f32a` |
| `formatting-repair` | 1 | 0 | `38ffd39649511c6dd88e65146d8f1cb3204e841faec311e3acfc064ba30df77f` |

The most relevant downloaded files are:

| File (relative to artifact tree) | Bytes | SHA-256 |
|---|---:|---|
| hosted-checks `verify.log` | 899,776 | `df96054da71950fd33692bf4e8e90ccf69ad0e4a70b632d77aabd50e4fe0fde4` |
| uploaded `counterball-verification-log/verify.log` (identical copy) | 899,776 | `df96054da71950fd33692bf4e8e90ccf69ad0e4a70b632d77aabd50e4fe0fde4` |
| hosted-checks `e2e-diagnostic.log` | 3,396 | `ad9ad70456a0aae00ca44939dc6ca85b9ed282080221badd90c5a089f6e7df32` |
| diagnostic Playwright JSON | 139,567 | `08769b5da951b0974f0ba3d37d9a8eeb740a72d931c97b343f86f805da1f1209` |
| failed test `error-context.md` | 10,686 | `31aa9095694381401b8dd5db23055dac97807a9fd6cbc974c82c103abdafa614` |
| failed test `trace.zip` | 954,696 | `52384d09cc409827776ad8cfd90750c9571af4168e45422982145b570411357d` |
| formatting suggestion `formatting-repair.patch` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

GitHub's artifact API listed 10 artifacts, each associated with run `38618192294` and the exact head SHA above. The uploaded archive sizes/digests are: `formatting-repair` ID `11921370115`, 162 bytes, `c3578b43969a31115e618b23b0d943209da1259f755e21b66cc4b5854837f4b1`; intended-shot observations ID `11921320074`, 1,406,942 bytes, `90e9403efbf1bfbef994f280db90047a01dfd2f3d9e4b3cc0a3d8b798f2e639b`; calibration observations ID `11921290040`, 104,314 bytes, `658724f019864d5db8dfd28a08868dbd4b7968641ea02af740f0c71e5a405ecb`; diagnostic web bundle ID `11921250213`, 2,490,299 bytes, `4ab8ec026507cd579b1f9557dd232261e12633d5154941c35277883ce9a6be70`; browser preview ID `11921235206`, 2,491,118 bytes, `fe4a123478ebb5ee31aec45a89994cd93e7ff6921c09f115948743ac9b01f794`; production web bundle ID `11921215145`, 2,517,148 bytes, `39aae38370bff9481ec58a97e361b285c5a833727717a368784a4a0d1116b225`; verification log ID `11921086678`, 108,504 bytes, `9c6bfd47c7827970270327c4eea6101ea52673b23679d0283b14aa8cb5c400b4`; prebuilt realtime bundle ID `11921011932`, 1,955 bytes, `e94bf147f00f888de3a8820681449ffc18306fb75db98ee830492e6fbdea30f8`; hosted checks ID `11920554597`, 120,777 bytes, `a4dd7767c78e393982141493351a3ef3a1ca8d38acc96dd3aca26ba72a32a2d4`; browser evidence ID `11920399521`, 3,018,420 bytes, `d0159b6c92a693497c757c2b12388ef057b2db423d68add59fe4e30e569b15f8`.

No local application checks were run for this review. The hosted run proves the apron-specific exact projection check passed before the first goal-frame dimension failure; it does not prove the matrix, diagnostic packet, deployed Havok, or playable gameplay acceptance. The next evidence needed is a bounded native goal-frame dimension disclosure (expected and observed X/Y/Z) from the same real browser-Havok preflight; the current generic message cannot locate the mismatch.
