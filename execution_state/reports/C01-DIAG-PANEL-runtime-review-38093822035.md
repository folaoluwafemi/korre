# Independent runtime-evidence review — C01-DIAG-PANEL, run 38093822035

**RUNTIME verdict: PASS for this exact-head hosted panel-test and production-exclusion evidence only.** The diagnostic panel is not a playable game flow. This run proves no browser flick, deployment, or deployed Havok behavior.

## Provenance and workflow

The saved run metadata records run `38093822035`, attempt `1`, source SHA `6ca75219e68fefc9a7ed73aaeffb25954598b27b`, completed with conclusion `success`. Its only job (`verify`) also succeeded. The full GitHub log independently shows checkout of that exact SHA; the artifact API ties every archive to that run ID and SHA. The production and Worker inventories record the same SHA, run ID, and attempt `1`; the hosted-checks artifact name includes `run-38093822035-attempt-1`.

The job has 32 steps: 30 succeeded, 2 skipped, and 0 failed. The skipped steps are the conditional formatting-suggestion preparation and upload steps, both skipped after successful verification. They are not test skips.

## Checks and actual test results

- Worker smoke: 1 test passed; focused protocol suite: 11 passed.
- `pnpm verify`: 26 test files and 140 tests passed, with no failed or skipped tests. The log explicitly includes `apps/web/src/CounterballRendererDiagnostic.test.tsx (1 test)` as passed. The protocol cases are also part of this full suite, so do not add the 11 focused cases to the 140.
- Integration: 1 test passed.
- Chromium E2E: the log says 4 passed. Structured browser results report 4 expected, 0 skipped, 0 unexpected, and 0 flaky; each of the four recorded results has retry count 0. The tests cover the static scene preview, WebGL recovery, preview camera controls, and the home page assertion that the build is not playable. There is no panel interaction, flick, or match test.
- Disposable migration apply/recheck succeeded.

The panel test is a unit test. The successful browser run is still the preview suite, not browser execution of a playable panel/game.

## Artifacts and inventory integrity

The GitHub API response and saved manifest agree on all eight artifact IDs, names, archive sizes, digests, expiry state, run ID, and source SHA. I recomputed size and SHA-256 for all 926 extracted files (31,919,513 bytes): zero missing files, zero hash/size mismatches, and exact file-set matches for all eight artifact directories. The full per-file values remain in the manifest. Archive digests below are GitHub-reported and cross-checked between the API response and manifest; the ZIP archives were not retained for a second local archive-byte digest.

| Artifact | ID | Archive bytes | GitHub SHA-256 |
|---|---:|---:|---|
| `counterball-verification-log` | 11685855068 | 106,099 | `bd05c0e2ca604df156119388a794113eb7c1e075cd9e4b024d3396ad00b79f74` |
| `counterball-realtime-prebuilt-6ca75219e68fefc9a7ed73aaeffb25954598b27b` | 11685665306 | 1,952 | `a521663b9886f866fde39a0a2cf589cb49f900ee68f4a7cb14d282a1ffa58047` |
| `counterball-intended-shot-observations` | 11685635362 | 815,530 | `12a43a7238d730385b713c9853ae31667a7b0a7b46bef5199dfce16eadced904` |
| `counterball-calibration-observations` | 11685435741 | 104,314 | `475e8b34aebcfd48bfdf9630df1cf55f38ba785a5f465ac0b139afebf24139d9` |
| `counterball-browser-evidence` | 11685081983 | 1,532,134 | `190eac8fd05218069ce61a5f701ea7391273981fbe05eb83d6e457c647740e2d` |
| `counterball-hosted-checks-6ca75219e68fefc9a7ed73aaeffb25954598b27b-run-38093822035-attempt-1` | 11685056985 | 110,422 | `3141bd33d9967ca7de079b59847943d9f9814c6bfe7b6ae1cb6d4059ac3ea187` |
| `counterball-browser-preview` | 11684962220 | 1,813,273 | `f0ab70e03fcc69167ad2ebe44d1bd329c1896b3f3f731ad17568840666cabfee` |
| `counterball-web-production-6ca75219e68fefc9a7ed73aaeffb25954598b27b` | 11684629984 | 1,839,211 | `9c4d9d82be8b217f252c15e2dabaf9c0ede0074a9e8f667f8402bfa6c75f1805` |

The production inventory says `buildMode: production` and `devHarnessFlag: unset`, with 452 emitted files. I independently recomputed each emitted file’s size/hash and compared the inventory against the full production artifact directory: all 452 entries match, and the exact directory contains those entries plus `build-inventory.json`. Component-specific searches (`CounterballRendererDiagnostic`, `RendererDiagnostic`, `DiagnosticPanel`, `diagnostic-panel`, `diagnosticPanel`, `counterballDiagnostic`, and `devHarnessFlag`) found no matches in emitted production files. A broad search for the word `diagnostic` does find generic Babylon shader directives in the preview bundle; these are not panel identifiers.

The Worker inventory says `buildMode: wrangler-dry-run`, and lists 3 emitted files. Their sizes and SHA-256 values all match; the artifact contains exactly those files, `inventory.json`, and the separately hashed `wrangler.toml`. `dist/index.js` is 367 bytes and only answers `/health` or returns 404. It is a placeholder dry-run package, not a deployed runtime.

## Limits

This run accepts the bounded panel component/static-markup test after the separate source review and confirms that production mode excludes the panel identifiers. It does not show the panel running in a browser. The only browser tests are for the preview and explicitly verify that the page does not suggest a playable game. No deployment step ran, the Worker is only a dry-run placeholder, and no flick, match, deployed Havok, online flow, or real-device behavior is established. No application checks were run on the laptop as part of this review; I only inspected and hashed retained CI evidence.
