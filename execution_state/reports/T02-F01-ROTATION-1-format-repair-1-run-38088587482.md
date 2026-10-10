# T02-F01-ROTATION-1-FORMAT-REPAIR-1 hosted run 38088587482

Result: CHANGES_REQUIRED. This exact-SHA run proves the patch fixed the prior formatting gate, but it does not pass F01; seven fact-derivation tests fail. It does not accept T02 or establish a playable flow.

## Provenance

- Branch: `codex/remote-ci-bootstrap`
- Exact source SHA: `efd6f567a35b29313ceda1c82dcc7b3b73b1298d`
- Run: https://github.com/folaoluwafemi/korre/actions/runs/38088587482
- Job: `verify`, job ID `114320171669`, attempt 1, completed 2026-10-10 21:43:16 UTC, conclusion failure.
- Full workflow log: `execution_state/reports/T02-F01-ROTATION-1-run-38088587482-github.log`, 203,071 bytes, SHA-256 `6958af389db152853118fe6f3e2ba94935ab1a27b7fe1cc8357f6697a49029d6`.
- Extracted full `verify.log`: 853,036 bytes, SHA-256 `8857206d2dbc08b10b934d7a8efada39c4ccfbf2b5f88598056ccf746ad2db99`.

## Checks and exact counts

Frozen installation, masked disposable test secret setup, the real Workerd smoke (1/1 pass, 0 skipped), workflow/root formatting, Playwright setup, both PostgreSQL migration applications/rechecks, and the focused game-protocol suite (11/11 pass, 0 skipped) all passed. All eight workspace package typechecks and the root test-project typecheck passed; ESLint and Prettier passed.

Vitest reached all 25 test files: 24 passed, 1 failed; 138 tests total, 131 passed, 7 failed, 0 skipped. All seven failures are in `games/counterball/src/simulation/facts.test.ts`:

1. `normalizes contacts for every canonical ID and returns plain finite facts` — JSON round-trip differs because one coordinate is `-0` before serialization and `0` after.
2. `sorts exact contact ties independently of callback insertion order` — the button/home and button/away ties appear in the reverse order from the required canonical order.
3. `finds the earliest pi/4 small-circle hidden exit` — reported fraction is `0.00040204822288629315` versus expected `0.00040205686125840837`, outside the existing 5e-9 tolerance.
4. `uses the selected SLERP branch below the threshold and bounds dense support samples` — the bounded search throws `Could not establish a bounded whole-body crossing in this interval`.
5. `keeps end-line-normal perpendicular axis support cases finite` — expected `out`, received `goal`.
6. `keeps end-line-normal parallel axis support cases finite` — expected `out`, received `goal`.
7. `classifies exact post tangency using the entire oriented button` — expected `out`, received `goal`.

The test phase stopped `pnpm verify` before the package/application build. GitHub records 32 ordinary workflow steps: 23 success, 1 failure (Verify), and 8 skipped. Skips are the Worker and production-browser build/package steps, integration, Chromium preview, browser-preview upload, and one setup-node cleanup step. The earlier smoke, migrations and protocol suite did run. Do not call the skipped stages passes.

## Preserved uploaded artifacts

Artifacts were downloaded and the extracted payloads are under `execution_state/reports/T02-F01-ROTATION-1-run-38088587482-artifacts/`.

- Run-qualified complete check logs: artifact 11683181841, 101,463 bytes, digest `sha256:f936a63ae9d999674facb2a63793d26f803152163da722b15d6c04e6ced2e1ac`.
- Separate verification log: artifact 11683821126, 100,195 bytes, digest `sha256:358c26d549cdaae161455d7eaa917ce9906aa966bb94cb9faedc4ecb2bbcd056`.
- Calibration observations: artifact 11683716245, 104,314 bytes, digest `sha256:b9074787f9e09fbdcfee2918006191f97dd7b2f176ae3a1f30bb578abed7a15f`; extracted 480-trial JSON is 1,345,869 bytes, SHA-256 `b81e5d190e7d81e540e6657f1d39ba805f177545c93075b604b7dd6818d59013`, matching the previously reviewed matrix.
- Intended-shot observations: artifact 11682917302, 815,530 bytes, digest `sha256:7e8c0ebbf99c1094370fd32edbf779039bdf5ba42f48a1e443ce3c840c47398e`; extracted 40-trial JSON is 12,101,058 bytes, SHA-256 `b91d103c7925ed92377f6662da33015b350490ebd222c7fe1fbd7c35f3c5efec`. This is probe evidence, not deployed-Havok acceptance.
- Browser evidence: artifact 11683706282, 437,511 bytes, digest `sha256:9354f11b9e571ecb5c7ae961a5f9cf53c0d485a6d3a840133e00bf241381cea2`. It contains the three existing T03 PNGs (individual hashes are in the artifact file inventory), not a new browser test or gameplay result.
- Formatting suggestion: artifact 11683596417, 162 bytes, digest `sha256:476d0b6b984b8718ae2c55e46331105befe994bbde7a9051ecc935e724650a70`; its extracted patch is empty (0 bytes, SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`). No repair is derived from it.

No Worker/production build artifact was created; integration and browser E2E did not run. This run does not prove the first browser flick, local match, deployed Havok, staging, AI, online play, or mobile support. No local application build/test/browser command or Wrangler deployment ran.

## Required next gate

The original F01 card explicitly stops after any source-review or hosted failure until a new independently reviewed escalation. Preserve the seven test failures and this run's complete evidence. A separate report-only escalation must classify the failure groups and authorize at most one narrowly scoped repair card, or stop; do not edit source, relax tolerances, change expectations, or proceed to consumers before that review.
