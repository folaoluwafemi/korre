# C01-P and T02-D01 exact-head hosted runtime review — run 38100635457

Date: 2026-10-11

## Verdict

**HOSTED CHECKS: PASS. T02-D01 REAL-WASM OBSERVATIONS: PASS.** GitHub Actions run [38100635457](https://github.com/folaoluwafemi/korre/actions/runs/38100635457) completed successfully on the requested exact SHA `8f0e840d340a480f51d4d76c4f33c791aad05f56`. The public Counterball headless Worker-target bundle check executed and passed. The `pnpm verify` Vitest suite ran 27 files and passed all 141 tests with no skipped tests. The real pinned-Havok direct impulse test passed and merged six independently validated rows into the existing 40-row intended-shot artifact.

This accepts only the evidence reviewed here: C01-P's public headless package-boundary check and T02-D01's diagnostic direct-impulse probe. It does not establish a deployed Cloudflare Havok runtime, a playable match, or production gameplay coefficients.

## Exact run and check results

Run metadata reports `completed / success`, with head SHA `8f0e840d340a480f51d4d76c4f33c791aad05f56`. The frozen pnpm install, dedicated Workers smoke test, disposable PostgreSQL migrations, focused game-protocol tests, full `pnpm verify`, production exclusion scan, Worker dry-run packaging, production browser build, integration test, browser preview, and separate diagnostic browser build all completed successfully. The migration command ran twice and each pass verified the single forward-only migration. The two post-check formatting-suggestion steps were conditionally skipped because no preceding check failed; these are not skipped tests.

The test outputs report:

- `pnpm verify`: **27 test files passed; 141 tests passed; zero skipped**. Typecheck, lint, test, and build stages completed. Within the Counterball package typecheck, the run resolved the public `@korre/counterball/headless` entry, produced an in-memory Worker-target esbuild bundle with a metafile, checked its reachable modules and output for the configured browser/React/DOM exclusions, and printed `Public Counterball headless Worker-target bundle boundary passed.`
- Separate focused game-protocol tests: **1 file, 11 tests passed**.
- Dedicated Workers smoke test: **1 file, 1 test passed**.
- Integration tests: **1 file, 1 test passed**.
- Built-browser Playwright preview: **4 tests passed**.

The production diagnostic-renderer exclusion scan passed. CI also packaged and uploaded the exact dry-run Worker artifact and inventory, production browser output, diagnostic browser output, preview evidence, and hosted logs. These are hosted build and packaging results; this run did not deploy the Worker or serve production traffic.

## Direct-impulse observation artifact

The unexpired GitHub artifact `counterball-intended-shot-observations` (artifact ID `11687581226`) is attached to this exact run and its metadata records the same head SHA. GitHub reports archive digest `sha256:1a0f4b7631d239133b35df7e4626b280a0cbc8c4ee4d15e0e28b7719f235290d`. After download, I independently parsed the JSON and recomputed the raw JSON file SHA-256 as `7cdf727cfc238672d92dcf2d6c9ab437a56a64c8f7fae2979af08d5980bc2443` (24,455,019 bytes). These are different digests because the former identifies the GitHub artifact archive and the latter identifies its extracted JSON.

The artifact retains `observedTrials: 40` and all 40 intended-shot rows in the expected ordered candidate matrix. Its root still labels the measurements diagnostic-only and `continuousTraversalProven: false`. The additional `directImpulseProbe` object identifies pinned Babylon `9.30.0`, Havok `1.3.14`, the pinned WASM path, the canonical fixture and match, direct `PhysicsBody.applyImpulse` input units, and the six-trial matrix `[2,4,8]` × the two aims. It reports six rows, in order, with keys unique and exactly matching that matrix.

I independently checked every row's fixture identity and exact shared starting state; selected cap; input vector magnitude and direction; center application point; the 15 canonical body IDs; every per-step sample's dimensions, finiteness, step number, and fixed-step timestamp; selected-cap movement; settle window; final transforms; path and speed summaries; contact data; and runtime-error field. All six rows passed these checks. All fifteen bodies are present in each trial, and each trial observed the configured 60-step quiet window with both linear (`0.03`) and angular (`0.1`) speed limits. No runtime or cleanup error is recorded.

| Raw impulse | Aim | Selected cap | Physics steps | Largest selected-cap single-step displacement | Settled at |
|---:|---|---|---:|---:|---:|
| 2 | Straight at button | `home-6` | 111 | 0.016667 | 0.925 s |
| 2 | Open longitudinal lane | `home-3` | 111 | 0.016667 | 0.925 s |
| 4 | Straight at button | `home-6` | 160 | 0.033333 | 1.333333 s |
| 4 | Open longitudinal lane | `home-3` | 254 | 0.033333 | 2.116667 s |
| 8 | Straight at button | `home-6` | 291 | 0.066667 | 2.425 s |
| 8 | Open longitudinal lane | `home-3` | 450 | 0.066667 | 3.75 s |

Every measured selected-cap single-step displacement exceeded the test's `1e-4` world-unit movement floor. The source applies each raw impulse at the selected cap's canonical center, and the recorded immediate velocity is finite and points along the requested aim. The artifact merge occurs only after all six assertions pass. It adds the separate `directImpulseProbe` field and preserves the original 40-row array and existing top-level diagnostic metadata.

## Limits

The headless check validates a bundle rooted at the package's public headless entry; it does not mean the realtime Worker already imports that entry, nor does it prove deployed Worker behavior. The six direct impulses are diagnostic raw physics inputs, not normalized game power or selected production coefficients. The 40 intended-shot artifact continues to say that collision-free traversal is not proven by sampled pose data. The test exercises the pinned Havok WASM in the hosted CI runtime with Babylon `NullEngine`; it is not an online/deployed physics test. No real-phone test, live deployment, or playable Counterball match is established by this run.
