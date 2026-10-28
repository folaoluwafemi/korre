# T02-BR02-OBSERVED-MASS-PROJECTION-1 hosted evidence review

**Verdict: PASS for the exact hosted run evidence.** The run demonstrates a real browser diagnostic flick using the projected mass expectation. It does not accept a playable match, online play, deployed Cloudflare Havok, or parent T02 by itself.

## Provenance and uploaded inventories

`gh run view 38145098173` reports success for job `114486675740` on the exact requested SHA `88c8302c8ce4b0d0217de33419efcb8145c11188`; the run is [38145098173](https://github.com/folaoluwafemi/korre/actions/runs/38145098173). Its diagnostic Playwright metadata independently carries the same SHA, run ID, attempt 1, and one Chromium worker. GitHub's artifact API lists nine unexpired run artifacts, including the run-specific hosted logs, browser evidence, production and diagnostic browser builds, browser preview, and dry-run Worker.

I checked every emitted-file size and SHA-256 against the downloaded manifests and extracted files:

| Artifact | Manifest entries | Result |
|---|---:|---|
| Production web build | 454 | All entries matched; no missing or extra files |
| Diagnostic web build | 213 | All entries matched; no missing or extra files |
| Dry-run Worker | 3 | All entries matched |
| Browser preview | 454 | Exact path set and content hashes match the production manifest |

Each manifest records the requested source SHA and run ID. Both web builds contain the same `HavokPhysics-BqNY-4N9.wasm`, size `2,094,563` bytes, SHA-256 `026917766f534c156286f07975850978dabf17c42e742bbfaaebbcb2215e4e11`. This confirms the pinned asset was packaged into the exact run artifacts.

The hosted Verify log reports 29/29 test files and 163/163 tests passed. Integration reports 1/1 passed; the built-browser preview reports 4/4 passed. The diagnostic Playwright JSON reports 2 expected passes, 0 skips, 0 unexpected failures, 0 flaky cases, and 0 retries; the invocation used one worker with configured retries 0. The workflow's production-diagnostic-exclusion step succeeded. I also searched the extracted production build: it contains neither a `CounterballDirectProbe`/`renderer-diagnostic` filename nor the diagnostic marker text. The separate diagnostic build contains the diagnostic entry and marker.

## Real Chromium diagnostic observations

The attached `counterball-direct-probe-trace.json` for each test contains an observed run with:

- Scope `browser-direct-impulse-v1` and canonical fixture `counterball-protocol-fixtures-v1`.
- Selected cap `home-6`, raw impulse `{x: 0, y: 0, z: 8}`, and application point `{x: 0, y: 0.06, z: -4}`.
- Termination `settled` with all 15 bodies settled.
- 696 recorded contact-pair samples, including `button`/`home-6` contacts.
- Nonzero transform-derived movement: cap `5.82654709607427`, button `2.38753676203795`.
- 328 changed WebGL pixels over a `1102 × 490` canvas.

Both tests also uploaded before/after canvas screenshots. Their hashes differ: before `223994F54259139FA7BD97B70706D0692DBAA63DC362EB4C15238A9F2DD5E37D`; after `DEED78B60C01BB600617B6A1AAD5B85EC6E60F93A0C6446EDB1C6CDDF4D18B59`. The attached trace stores movement deltas rather than the full per-body position/quaternion arrays, so the transform evidence here is the measured displacement values plus rendered before/after pixels, not a raw transform dump.

For the retry case, `counterball-wasm-failure-teardown.json` records one actual intercepted `*.wasm` request, the expected initial `Failed to fetch` error, and cleanup back at baseline (0 engines, listeners, and resize observers). The test then removes that route, retries, and records the same successful real 15-body diagnostic result. The extracted build contains the exact pinned WASM file above. This proves the browser diagnostic recovered into an actual physics run with the packaged Havok module; the uploaded files do not retain a separate successful retry response status/HAR, so I do not claim a separately observed HTTP 200. The successful direct diagnostic and post-retry diagnostic are real Chromium results, not mocked or Node simulation.

Lifecycle attachments show the engine/listeners/observer present while each canvas is mounted, followed by teardown at baseline. Both `counterball-direct-probe-teardown.json` and `counterball-retry-teardown.json` report 0 engines, 0 listeners, 0 resize observers, and phase `complete` after unmount. The blocked-load attachment separately proves cleanup for the initial failure.

## Evidence boundary

The output proves the fixed diagnostic pointer flick and retry in Chromium against the browser Havok/WASM path. It does not prove a deployed Worker or remote Havok environment, a playable match loop, rules authority, identity/AI/online behavior, or full per-body raw transform serialization. No local application command was run for this review; the checks and observations above are from the exact hosted run and its uploaded artifacts.
