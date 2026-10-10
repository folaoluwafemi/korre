# Independent review — GitHub run 38091279565

Verdict: **PASS for the exact-head hosted evidence; supports acceptance of F01 and FORMAT-REPAIR-2 when combined with their separate source reviews.** This run does not accept T02 or C01, and it does not prove deployed Havok, continuous obstacle traversal, or playable gameplay.

## Provenance and workflow result

I compared the saved run metadata, raw GitHub log, extracted hosted-check logs, browser result JSON, artifact API response, and extracted-file manifest. The run is `38091279565`, branch `codex/remote-ci-bootstrap`, exact commit `ec6c35cb3b8e62c70c94d4fd6b26ed577f0088cf`; the workflow and its single `verify` job both concluded `success`. The metadata records 32 steps: 30 succeeded, 2 skipped, 0 failed. The only skipped steps are “Prepare formatting suggestion after a failed check” and its upload step. They are optional failure-reporting steps; required workflow checks ran successfully.

The full saved log and its plain copy both hash to `1400558d85c45f4bf5f85dc8fcbb6caf4e606992bb15614ad73dbc3ce1f86ec5` (212,803 bytes). The hosted verification artifact contains the 892,491-byte `verify.log`.

## Checks and their limits

- Worker runtime smoke: 1 test passed.
- Focused protocol run: 11 tests passed. The same protocol tests are also part of the full workspace suite, so these counts are not additive.
- `pnpm verify`: typecheck, lint, formatting, builds, and 25 test files / 139 tests passed; 0 failed and 0 skipped. The full suite includes the protocol test file.
- Disposable PostgreSQL migration step completed successfully. The verification log also reports the two PostgreSQL identity HTTP tests passing.
- Integration suite: 1 test passed.
- Chromium browser suite: 4 expected, 0 skipped, 0 unexpected, 0 flaky. The structured JSON ties the run and tested commit to this exact SHA.

The browser tests exercise the WebGL preview, camera controls, context-loss recovery, and the home page. The home test is named “home identifies the first build without suggesting a playable game.” No test performs a flick or completes a match. This run therefore verifies the browser preview only, not playable Counterball.

## Artifact audit

The GitHub artifact API response lists eight unexpired archives for this run and SHA. Every API `id`, name, byte size, digest, run ID, and head SHA matches the saved extracted-file manifest. I recomputed SHA-256 and byte size for every extracted file: all 926 files (31,919,225 bytes) matched; no file was missing or mismatched. The per-file values are retained in `T02-F01-ROTATION-1-format-repair-2-run-38091279565-artifact-manifest.json`. Archive digests below are the values returned by GitHub and cross-checked against the saved API response and manifest; the source archives themselves were not retained for a second local ZIP hash.

| GitHub artifact | ID | Archive bytes | GitHub SHA-256 |
|---|---:|---:|---|
| `counterball-browser-evidence` | 11684685739 | 1,532,129 | `d6e267dd84cb51a80df7bedb50321f057808fb99a255b35e0e1d5f94d3bbb431` |
| `counterball-browser-preview` | 11684251345 | 1,813,273 | `709820d47f95f2bb4206e021b2d9f08d588f541ac5009a804c4bc61203d4915f` |
| `counterball-calibration-observations` | 11683044378 | 104,314 | `196383deb70e341cbdd4b487734ccc25cea00660d9bb29e8db17aeebb51b721b` |
| `counterball-hosted-checks-ec6c35cb3b8e62c70c94d4fd6b26ed577f0088cf-run-38091279565-attempt-1` | 11684316268 | 110,394 | `2d4ed30eaa6682ed7013a3fdbc2d17bfbdef7321621cc433fb038ab5fe237c4e` |
| `counterball-intended-shot-observations` | 11683489120 | 815,530 | `ecc5df36830046b0e99f83de83f3682759cd186ab1c6b91891ffde56434adcaa` |
| `counterball-realtime-prebuilt-ec6c35cb3b8e62c70c94d4fd6b26ed577f0088cf` | 11683633971 | 1,954 | `67ae02645639e499d65c2a4b111fe2328a0b7f098a98e91e9f847efad3aed25f` |
| `counterball-verification-log` | 11683633978 | 106,079 | `b79baaaf7208c6da41a3f9f81eeee10a96433748805b1357050f50e4308c481f` |
| `counterball-web-production-ec6c35cb3b8e62c70c94d4fd6b26ed577f0088cf` | 11683998663 | 1,839,212 | `e2d017f4b3621b9931c07cf0ae6f7a3897f9802ead0376e9c40000f2a366da5f` |

## Acceptance findings

**F01 / FORMAT-REPAIR-2 — hosted gate passes.** The exact reviewed commit passed the full required hosted checks with no failed steps and no skipped tests. The existing independent semantic source review and exact formatting-patch review both report PASS; this run closes their hosted-verification requirement on the final SHA. I recommend accepting these bounded cards, subject to the coordinator confirming their accepted dependency records in `execution_state/tasks.json`. This does not accept the T02 parent.

**C01 — do not accept from this run.** The artifact inventory contains a production browser build and the tested browser preview, but no `counterball-web-diagnostic` artifact. C01’s packet explicitly requires the diagnostic browser artifact/build evidence, so its artifact-acceptance condition is still unmet even though the configured suites and other build artifacts succeeded.

**T02 / deployed Havok / continuous traversal — unproven.** Calibration observations record 480 observations with Babylon 9.30.0 and Havok 1.3.14. The intended-shot observations record 40 cases but explicitly set `diagnosticOnly: true` and `continuousTraversalProven: false`; sampled clearance is stated to be diagnostic only. The realtime inventory says `buildMode: "wrangler-dry-run"`; its `dist/index.js` is 367 bytes and only implements `/health` plus a 404 response. There is no evidence here of a staging deployment or a running Cloudflare Havok runtime. Do not use these artifacts to accept the deployed-physics, continuous-motion, or playable-game gates.

The completion-plan extractor returned the exact F01 and format-repair records as `ready: true`; its note explicitly limits that result to plan consistency and says no implementation/runtime check ran. The C01 record was also extracted and reviewed. No build, test, browser, physics, Wrangler, or deployment command was run as part of this independent review; I only read and hashed retained evidence.
