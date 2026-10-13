# T02-L01-SUPPORT-F32 exact-run evidence review

**Verdict: PASS for evidence accuracy.** GitHub run `38470988448`, attempt 1, is a failed run on exact SHA `9977d984ee91dae726baff56d49e23cfe1d5f53d` (`codex/remote-ci-bootstrap`). This report verifies the captured checks and their limits; it does not accept the 24-case matrix or claim a playable match.

## Run identity and check outcomes

`jobs.json` identifies run `38470988448`, job `115549705958` (`verify`), the exact SHA above, and conclusion `failure` (completed `2026-10-13T21:33:28Z`). The API snapshot has `steps: []`, so it supplies no per-step totals.

The run-scoped hosted logs show the pre-matrix gates completed: Worker smoke **1/1**, protocol tests **13/13**, `pnpm verify` with **30 test files and 181 tests passed**, and integration **1/1**. The Verify log contains no test skip, retry, or flaky marker. The normal built-preview Playwright suite passed **4/4**: ordinary scene/remount, WebGL recovery, mobile camera controls, and the home page. Its JSON records `expected=4`, `skipped=0`, `unexpected=0`, `flaky=0`; every result has `retry=0`.

The diagnostic Chromium suite ran four tests. The real pointer flick, blocked-WASM retry/cleanup, and maximum synthetic transport test passed; the full real-Havok matrix test failed. The diagnostic JSON records `expected=3`, `skipped=0`, `unexpected=1`, `flaky=0`, and `retry=0` for all four results. The real-flick test title and passing result establish that this diagnostic browser action ran; they do not make the matrix or match playable.

## Matrix failure and support-Y finding

The failed test is `the full real-Havok loft matrix downloads and passes bounded host validation`. Its hosted error is `The browser matrix failed before download: Native friction material readback differs from its setter.` The failure appears in `e2e-diagnostic.log`, the JSON result, and the attached Playwright context and trace. The browser reached the matrix panel and clicked **Run 24-case Havok matrix**, then reported the error; it did not reach a successful ready/download/host-validation state.

The support AABB/Y preflight **did pass before this friction-readback failure**. At this exact SHA, `loftCoarseRunner.ts` checks the canonical surface transform and exact Float32-projected thickness at lines 1293–1403, including `matchesExactFloat32Projection(...)` at lines 1303–1306. Execution next calls `setAndReadMaterial(activeWorld, originalShape)` at line 1420; `readNativeBodies(activeWorld)` occurs later at line 1449. The reported material-readback error is from this later operation. Thus the run supplies runtime evidence that the F32 support predicate did not reject the surface. It does not include the compared Y values in the browser result, so it proves the predicate passed, not a separately captured numeric readback.

The material failure happened during setup, before `readNativeBodies` returned and before the trial stepping loop. The failed test has only `error-context` and `trace` attachments. There is no successful 24-case matrix JSON, matrix download, host attestation, or completed matrix artifact in the browser evidence/API inventory. Calibration and intended-shot files are distinct outputs: the API lists `counterball-calibration-observations` and `counterball-intended-shot-observations`; their JSON records **480 calibration observations** and **40 intended-shot observations**, respectively. Neither is the fixed 24-case loft matrix.

## Artifact provenance and hashes

The artifact API snapshot associates every listed archive below with this run and exact SHA. Digests below are GitHub API-reported archive digests, not locally recomputed ZIP hashes.

| Artifact | API ID | API size | API-reported SHA-256 |
|---|---:|---:|---|
| `counterball-hosted-checks-9977d984ee91dae726baff56d49e23cfe1d5f53d-run-38470988448-attempt-1` | 11852045865 | 120,686 | `20bee90e6fa6e6a5e8029b278b3436352bcffbab7986884be4f2fc4d34553bf9` |
| `counterball-browser-evidence` | 11852870690 | 3,058,506 | `68015cee35133cd58f37e72e2acb6437bd6bbcb646443bcc4810f04cc8fe38e6` |
| `counterball-browser-preview` | 11852625543 | 2,491,118 | `ea2ce4ceb789aba958986324b649c1239e13aebd444c9ed5c805acee395f28c2` |
| `counterball-web-production-9977d984ee91dae726baff56d49e23cfe1d5f53d` | 11850804710 | 2,517,147 | `eace7f7e1ea4cb7e7927d4416c0dbb7895bd7829b214528f2b4f64aed0be9280` |
| `counterball-web-diagnostic-9977d984ee91dae726baff56d49e23cfe1d5f53d` | 11851119368 | 2,490,057 | `f684ca2db90a97e0c1e309c32cf8503fe49de9eb7f46ea698e5579bacef5937e` |
| `counterball-calibration-observations` | 11850784651 | 104,314 | `86aa36cefb9199e67502b9d63746f8fc2b1d03759f0d0020a338b137b5845e37` |
| `counterball-intended-shot-observations` | 11851912468 | 1,406,942 | `4f730c60f504d618fa1535718371173b4c65083bf3ed5b26838859e7c570fb78` |

Recomputed SHA-256 values for the retained evidence files:

| File | Bytes | SHA-256 |
|---|---:|---|
| `github.log` | 137,688 | `93719ad54fe1e6840b5ff4f7dab383be21081665f783b929f2337c897040c813` |
| `jobs.json` | 922 | `f7e8dc1a5735dc1cb49d63a34d4b10a499638938b1ef0957ccf65976157152e6` |
| `artifacts.json` | 7,382 | `4652c5af23a44a0d7a886c0065b47f4948f387de8d9e69f688aa01402991eb9c` |
| hosted `verify.log` | 899,520 | `45dff199ead3086a651026739ef40ea0fae4ea7d7f185c420c2de7558abe1cc2` |
| hosted `e2e-diagnostic.log` | 3,362 | `8a3b7eb32bca19b93dcaeebfbb026788910de1afaad45b852e4d73a1e57a2d4d` |
| browser `browser-test-results.json` | 11,369 | `956bee6d695ea520e4dd714b7588a711d9826c5a69532c73ffedadb39c351145` |
| browser `browser-test-results-diagnostic.json` | 139,591 | `920fc41640e78d159854499eff6be5148cc253c058e3e21d9b43d464ad36df57` |
| matrix `error-context.md` | 10,635 | `8b7e9bcff1b5f9d6b71c028b82fe7c22087159b74eb7b2d0212a10fc5d7d3f5d` |
| matrix `trace.zip` | 994,809 | `13408b8dc05d46525f0acf17d6a18777910caa726fce821f917a7b423fabc5f2` |

**Capture limitation:** the saved aggregate `github.log` ends at `2026-10-13T21:30:57Z`, before the job completion time, and the API job snapshot contains no step records. The check outcomes above are therefore verified from the retained per-gate logs, Playwright JSON and failure attachments; this review does not infer unrecorded workflow step totals.
