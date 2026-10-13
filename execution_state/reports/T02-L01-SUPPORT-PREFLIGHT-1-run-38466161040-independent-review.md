# T02-L01-SUPPORT-PREFLIGHT-1 — run 38466161040 independent evidence review

**EVIDENCE REVIEW: PASS. RUN: FAILED AT MATRIX SUPPORT PREFLIGHT. MATRIX ACCEPTANCE: NOT MET.**

The retained snapshot identifies [GitHub Actions run 38466161040](https://github.com/folaoluwafemi/korre/actions/runs/38466161040), head SHA `1dedcf96e92a0eefcdc4938f45ad50c1d863209a`, status `completed`, conclusion `failure`. Each artifact entry in `artifacts-api.json` names the same run ID and head SHA. The key retained evidence and locally recomputed SHA-256 values are:

- `run-snapshot.json`: 536 bytes, `7fd87d9e50fdb38e38f7daa75bf260710270df02248c25acfe6dc54dc917c6a9`.
- `artifacts-api.json`: 7,384 bytes, `4306c4d343fbc05f6748978a6a4e77e4f0ee9c18873e3a568daf4a5f7fb8f142`.
- `github.log`: 137,600 bytes, `e95537fe01c8f9ebf23f963270fa8d135b50ddf6f56b38820d46e661e73385fd`.
- Hosted `verify.log`: 899,406 bytes, `1156c2b9a21430a413589cbf532102b5d11e3f32cc00a14083e4ef51f8d5d5cf`; hosted typecheck, ESLint/Prettier, production build, all 30/30 unit-test files, and all 179/179 unit tests completed successfully. The final Vitest summary reports no skipped tests.
- Hosted `integration.log`: 574 bytes, `dd5116eb4d4d6cc80053cf70e732aab50970f141f70ff6927b4fadda1c1a6469`; 1/1 test passed.
- Hosted `e2e.log`: 208 bytes, `f90b940ad9efacf527301437ea1fc6175eda34b3f5fd64426d6263a9761dab81`; Playwright JSON reports 4 expected, 4 passed, 0 skipped, 0 flaky, all retries 0.
- Hosted `e2e-diagnostic.log`: 4,856 bytes, `0644ac5dea33e3d13144ccc65baa717169867627dfe7504889582f18f1cb1ceb`; diagnostic JSON reports 4 tests: 3 passed, 1 failed, 0 skipped, 0 flaky, and retry 0 for each. The passing cases include the real pointer flick, blocked-WASM retry, and maximum synthetic transport stream. The focused protocol test was 13/13 and the Worker smoke was 1/1 in their hosted logs.
- `browser-test-results-diagnostic.json`: 142,105 bytes, `1619d8aad29144c40a717193b841964489483cc5be70bfd8110574cbcf7dde4c`.
- Failed test `error-context.md`: 12,992 bytes, `1aacd416532541a3df540610b53bd587604af9a527d3083826c11dff0eda4819`; its `trace.zip` is 1,020,508 bytes, `eb3152cdbe53eff6384337611997ec8e02bb7864d2fe2fd48fbfda3d38c836ee`.

The matrix failed on a specific support-shape AABB check. Expected native dimensions are `(12, 0.2, 20)`. The browser readback from `PhysicsShape.getBoundingBox()` is `(12, 0.20000000298023224, 20)`. Only Y fails: the observed difference is `0.00000000298023224`, greater than the stated `1e-12` component tolerance; position, quaternion rotation, parent, scale, and X/Z dimensions all match. The diagnostic JSON and failed test context record the same values and failure.

The failure is explicitly reported as occurring **before download**; the page says export failed and no successful download is available. The failed Playwright case lasted 2,445 ms and its only attachments are `error-context.md` and `trace.zip`. There are zero matrix/loft/counterball-l01-named files in the retained run artifacts, and the artifact API inventory has no matrix-result artifact. The support preflight therefore stopped the matrix before its ready/download phase; no matrix impulse or Havok step is recorded or evidenced, and no completed matrix artifact was emitted. The calibration and intended-shot observation artifacts belong to separate diagnostic probes and do not establish matrix execution.

Relevant GitHub API artifact records (their digests are API-reported archive digests, not hashes recomputed from the extracted files): hosted checks ID `11848098767`, digest `sha256:3634efef429db65c1f6c3e03191869230fe7c9f1bb413ebcb9614fec855c802d`; browser evidence ID `11848358722`, digest `sha256:debd7a0931dd35a4c1704fc1d0c54784fa56c4091ea205140bee37e2d3e4a3fa` as recorded by the API; browser preview ID `11848618684`, digest `sha256:66d1e770d41e5e527a791a7c7bf53d97660113c17f29f179834c7eb689b869c5`; production bundle ID `11848208528`, digest `sha256:f06b11df50b3b491c79553b0b920ad9f27b7ae0bbe6aa351e11c6d7938216622`; diagnostic bundle ID `11848368730`, digest `sha256:e9ad011975a15c9e71aaa00aca1db437dd1575d847a64a4dbbd33bddb221e36b`; verification log artifact ID `11848883126`, digest `sha256:9f36e0be5e59751d1710cca3ac6eaf628e5a7ae74b4943dd043e0f616cf3eb36`.

This review confirms the hosted evidence and the exact support-preflight failure only. The separate real-flick test passed, but that does not prove the loft matrix, deployed Cloudflare Havok, or a playable match. MATRIX acceptance remains blocked until the support AABB guard is resolved and a complete matrix artifact passes host validation.
