# Independent run evidence review: CONTACT-ONSET foundation wave

**Evidence verdict: PASS for the accuracy and provenance of this run record.**  
**Run outcome: FAIL.** This is a narrow hosted-evidence review, not acceptance of native event delivery, the 24-case matrix, or T02.

## Run identity and workflow result

The saved GitHub metadata identifies run [38648859339](https://github.com/folaoluwafemi/korre/actions/runs/38648859339), attempt 1, workflow `ci`, exact head SHA `713853e4ffc910c0fb55f9cab5352d1f64910c81`, conclusion `failure`. The job snapshot has 40 recorded steps: 35 succeeded, one failed, and four skipped. Step 31, “Run every produced local diagnostic browser suite,” is the sole failed step. Skipped steps 14–16 are failure-only TypeScript diagnostics that did not run because Verify passed; step 67 is the setup-node post-action cleanup. The full log, job snapshot, and run metadata are retained under `execution_state/reports/T02-L01-CONTACT-ONSET-WAVE-run-38648859339-*`.

The hosted `verify.log` reports `Test Files 33 passed (33)` and `Tests 211 passed (211)`. It includes `nativeCollisionSubscription.test.ts` with 8 passing tests and the coarse-probe test file with 27 passing tests. The focused protocol step passed 15/15; the Worker smoke passed 1/1; migration apply/recheck completed; integration passed 1/1. Production preview results are 4/4 passed. These counts establish hosted checks for the bounded producer, adapter-unit, and pure-math source work only, subject to their own source and artifact reviews; this run alone does not mark any task accepted.

The diagnostic Playwright result is `expected=3`, `unexpected=1`, `skipped=0`, `flaky=0`, with retries configured to 0. Three cases passed: the real pointer flick using browser Havok and rendered WebGL pixel change, blocked real-WASM load and cleanup/retry, and maximum synthetic transport. The only failing case is “the full real-Havok loft matrix downloads and passes bounded host validation,” at `tests/e2e/counterball-direct-probe.spec.ts:2917`. Its exact surfaced error is: `Fixture bytes or configHash-independent payload differ from the pinned L01 identity.` The separate production-preview suite also has 4 passed, 0 skipped, 0 unexpected, 0 flaky. Thus the run contains a real browser-flick result, but no completed matrix result.

At the exact SHA, the matrix runner validates the pinned fixture/payload identity and throws before the matrix-specific `fetch(havokWasmUrl)`, Havok initialization, impulse application, or stepping. This order explains why this run executed zero matrix tuples and produced no successful matrix download/artifact. It does **not** mean the separate real-flick case avoided Havok; that case passed. The matrix gate remains failed and no native onset-mask delivery is evidenced.

## Artifact provenance and integrity

All ten GitHub artifact API entries identify run 38648859339 and the exact head SHA above. I independently recomputed size and SHA-256 for every extracted file listed in the retained streaming inventory: 1,155 files, 59,539,749 bytes, zero missing files, zero unexpected files, and zero size/hash mismatches. The API digest values below are GitHub’s reported uploaded-archive digests. The original ZIP archives are not retained, so those archive digests were not independently recomputed.

| Artifact | API ID | Bytes | GitHub archive digest |
|---|---:|---:|---|
| `counterball-realtime-prebuilt-713853e4ffc910c0fb55f9cab5352d1f64910c81` | 11934221005 | 1,952 | `sha256:14d0f4f12261f6dd1fd297b95dce33c67f5e19cd8038645b0b24050a0be011cc` |
| `counterball-verification-log` | 11934171068 | 108,481 | `sha256:a235269205d8161c73e64d22980ba2cb43e1e345be26ac4d4009aac49054fa3d` |
| `counterball-browser-preview` | 11933961395 | 2,491,272 | `sha256:8c3cb860cc354551b0fd738a4daeee61623b7f6d3ec26564c40a8a14f24812ca` |
| `counterball-calibration-observations` | 11933946385 | 104,314 | `sha256:21c206a3a25c1454e356f2fc7e4095676cc71f26609365e60d32b75ed0335885` |
| `counterball-intended-shot-observations` | 11933926440 | 1,406,942 | `sha256:26d5fd9768850355accacaed696f7ce743883804a98b2b73b60a7abd9d341986` |
| `counterball-web-production-713853e4ffc910c0fb55f9cab5352d1f64910c81` | 11933836524 | 2,517,308 | `sha256:a94c1f2bd8cd3eb9fb56b1467ec8bc7147da69f3984f4d51c94ea0bae4165c4a` |
| `counterball-web-diagnostic-713853e4ffc910c0fb55f9cab5352d1f64910c81` | 11933676783 | 2,492,105 | `sha256:aa6fd42429c9c3e428d3221b292697dbbfa8fc7915fcbe71de55427052247d3d` |
| `counterball-browser-evidence` | 11933542608 | 2,350,746 | `sha256:4d3be149344c15dfad4b7189f7a36afe1630b1d1621e62f0c6cb2b66da57eccb` |
| `formatting-repair` | 11933363214 | 162 | `sha256:2fde16f2073c11c7ce3a1176e80153b228296e533ac3e664cea600feb8fe3105` |
| `counterball-hosted-checks-713853e4ffc910c0fb55f9cab5352d1f64910c81-run-38648859339-attempt-1` | 11933298498 | 120,798 | `sha256:e21e663d79c07d1d4dfaa51c3227fe63fec8c030efdd8f517d6b3db9ee252e59` |

## Scope limit

This run supports the hosted check record for the bounded config producer, mask-adapter unit/source work, and pure-math seam only after the corresponding independent source/artifact reviews. It does not establish successful native event-mask delivery, any matrix tuple execution, the 24-case matrix artifact, T02 acceptance, deployed Cloudflare Havok, or playable-match acceptance. No application checks were run locally for this review.
