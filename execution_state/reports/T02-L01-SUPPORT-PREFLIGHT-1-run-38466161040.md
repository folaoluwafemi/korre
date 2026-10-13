# T02-L01-SUPPORT-PREFLIGHT-1 — exact-head hosted run 38466161040

**Source SHA:** `1dedcf96e92a0eefcdc4938f45ad50c1d863209a`
**GitHub Actions:** [run 38466161040](https://github.com/folaoluwafemi/korre/actions/runs/38466161040)
**Conclusion:** workflow failed at the deliberately diagnostic real-Havok matrix preflight. Verify, builds, integration, the ordinary browser preview suite, and the three non-matrix diagnostic browser cases completed successfully. This is not matrix, physics-calibration, gameplay, or T02 acceptance.

## Hosted checks

- `pnpm verify`: passed. Vitest reported 30 files and 179 tests passed, with no skipped tests reported. Type checks, lint, format, production diagnostic-exclusion check, and workspace builds completed; production and diagnostic browser bundles were produced.
- Integration: 1/1 passed.
- Ordinary preview browser suite: 4/4 passed; zero skipped, retries, or flaky tests.
- Routed Chromium diagnostic suite: 4 collected, 3 passed, 1 failed; zero skipped, retries, or flaky tests. The real pointer flick changed WebGL pixels, failed-WASM-load cleanup/retry followed by a real shot passed, and maximum synthetic browser download passed.
- Full real-Havok loft-matrix case: failed at the canonical support preflight, before download, impulse, or public `executeStep`. No matrix case or success artifact was produced.

## Exact discrepancy

The error context and diagnostic Playwright JSON show every support transform and native-bound dimension matches except the support AABB's Y dimension:

| Field | Expected | Browser/Havok readback | Match |
|---|---:|---:|---|
| Position | `(0, -0.1, 0)` | `(0, -0.1, 0)` | yes |
| Rotation | identity quaternion | identity quaternion | yes |
| Parent | `null` | `null` | yes |
| Scale | `(1, 1, 1)` | `(1, 1, 1)` | yes |
| Native AABB X | `12` | `12` | yes |
| Native AABB Y | `0.2` | `0.20000000298023224` | **no, exact-equality clause** |
| Native AABB Z | `20` | `20` | yes |

The observed Y value exactly equals JavaScript `Math.fround(0.2)`. That identifies a binary32 round-trip representation candidate; it does not itself authorize changing the current exact-equality guard. The source-reviewed support-preflight packet explicitly forbids changing that guard. A separate bounded proposal and independent review are required before any source repair. Canonical configured geometry remains `0.2`.

The captured scene facts report 15 pieces, seven home caps, seven away caps, one button, four visible button holes, an open green-concrete surface, and no enclosing walls. These are scene facts only.

## Preserved evidence

Run snapshot and all downloaded artifacts are under `execution_state/reports/T02-L01-SUPPORT-PREFLIGHT-1-run-38466161040/`. The API snapshot lists ten run artifacts, including the complete hosted verification log, production/diagnostic bundles, browser evidence, and JSON test results. Full workflow log and artifact metadata are retained locally. Key local hashes:

| Evidence | Bytes | SHA-256 |
|---|---:|---|
| `github.log` (same bytes as `failed.log`) | 137600 | `e95537fe01c8f9ebf23f963270fa8d135b50ddf6f56b38820d46e661e73385fd` |
| `run-snapshot.json` | 536 | `7fd87d9e50fdb38e38f7daa75bf260710270df02248c25acfe6dc54dc917c6a9` |
| `artifacts-api.json` | 7384 | `4306c4d343fbc05f6748978a6a4e77e4f0ee9c18873e3a568daf4a5f7fb8f142` |
| Diagnostic browser results JSON | 142105 | `1619d8aad29144c40a717193b841964489483cc5be70bfd8110574cbcF7DDE4C` |
| Hosted `verify.log` | 899406 | `1156c2b9a21430a413589cbf532102b5d11e3f32cc00a14083e4ef51f8d5d5cf` |

No local install, application build, test, browser automation, deployment, or Wrangler command was run for this result. The run snapshot's empty step list was stale/incomplete relative to the retained full log and ten uploaded artifacts; the conclusion above is based on the actual logs and test-result artifacts, not that field.

## Acceptance state

The support-preflight diagnostic's output requirement is met by this exact hosted run, subject to independent exact-run review. The failure has isolated a single exact-value clause without relaxing it. `T02-L01-MATRIX-1` remains unaccepted. No physics or match milestone is accepted by this report.
