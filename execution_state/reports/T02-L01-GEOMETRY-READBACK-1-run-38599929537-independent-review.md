# T02-L01-GEOMETRY-READBACK-1 exact-run review

**Run-evidence verdict: PASS.** The captured evidence is internally consistent and tied to the requested commit. This is an evidence-integrity verdict only; it does not accept MATRIX-1, T02, material semantics, or playability.

## Provenance and workflow outcome

The saved GitHub run metadata identifies run `38599929537`, completed on `2026-10-14`, branch `codex/remote-ci-bootstrap`, exact head SHA `929067cc4e277b0ae0ec2d747ba0dd42841c414e`, URL [GitHub Actions run 38599929537](https://github.com/folaoluwafemi/korre/actions/runs/38599929537). `run.json` and `jobs-api.json` agree on the run ID, head SHA, completed status and overall `failure` conclusion. The single `verify` job is also completed with `failure`.

`pnpm verify` itself succeeded. Its preserved log shows workspace typechecks, lint/format, Vitest (`30` files and `183` tests passed), and workspace builds completing. The focused protocol suite passed `13/13`; disposable migrations were verified twice; integration passed `1/1`; production-boundary/Worker/browser packaging steps succeeded; and the normal built-browser suite passed `4/4` with `0` skipped and `0` flaky. No skipped tests are shown in the verify summary. The three conditional TypeScript diagnostics were skipped because Verify did not fail; a post-setup cleanup step was also skipped and is unrelated to test results.

The overall workflow failed only at `Run every produced local diagnostic browser suite`. The diagnostic Playwright result is `3` expected passes, `1` unexpected failure, `0` skipped and `0` flaky; its log reports four tests, one worker, `3 passed` and `1 failed`, with no retry recorded. The failed test is the full real-Havok loft matrix download/host-validation test. Thus this is not an all-green workflow, despite the successful Verify and production-preview checks.

## Native readback and matrix boundary

The saved matrix failure context reports:

- body `button`, native shape type `2`;
- configured radius `0.13` and height/thickness `0.045`;
- expected dimensions `{x: 0.26, y: 0.045, z: 0.26}`;
- native local-AABB minimum `{-0.12999999523162842, -0.02250000089406967, -0.12999999523162842}` and maximum `{0.12999999523162842, 0.02250000089406967, 0.12999999523162842}`;
- observed dimensions `{x: 0.25999999046325684, y: 0.04500000178813934, z: 0.25999999046325684}`.

The error is surfaced in the browser alert and Playwright’s saved `error-context.md`. The matrix status says the export failed with no successful download; the test failed while waiting for the matrix-ready status and before its download path. This matches the packet’s strict preflight diagnostic outcome. The recorded task row/source-review details place this check before impulse/step; the run artifacts contain no completed matrix case, shot result, successful matrix download, host acknowledgement, or matrix artifact. The trace, error context, E2E log and artifact inventory agree on this boundary. The raw readback makes the discrepancy diagnosable, but does not establish why the native and expected dimensions differ.

## Artifact integrity

`artifacts-api.json` lists ten non-expired artifacts: the browser evidence and preview, hosted checks and verification log, diagnostic and production web bundles, prebuilt Worker, calibration observations, intended-shot observations, and a formatting suggestion. There is no matrix-named artifact. The calibration and intended-shot files are separate existing CI outputs, not L01 matrix results.

The inventory contains `1,155` file entries totaling `60,263,409` uncompressed bytes. I checked each entry against the extracted artifact tree: all `1,155` paths exist and every recorded byte length and SHA-256 matches. Inventory roots correspond to all ten API-listed artifact names. The browser evidence includes both browser result JSON files and the matrix failure context/trace; the absence of a matrix download is consistent with the test and UI error.

Key saved evidence hashes:

- `run.json`: `442e00f78be6bf723d2e0ccc05d617d5709c5eaed2b90f852c9cf1b21ee3fc03`
- `jobs-api.json`: `faed37cedffb642edb08c0a83b9f0ab62cb96c04da4bdc89c2b43dc80a65b029`
- `artifacts-api.json`: `dfdc5c30067c821c06ffac3da3658e3f2d01b0729a1c510cc9b25f4ff8d7596d`
- `github-full.log`: `ce809e236af7101ebbf071e8c33b7bc1b9760152e69807e4bdc16a17c76b11df`
- `artifact-inventory.json`: `99154d388b0a132944f24a32076ac356260cf053a8565e6fd463936d31949879`
- preserved `verify.log`: `cf7f259af6dccfaf463226c6e50e544c5a324e5a9ac40490537993437d30cdbf`
- `e2e-diagnostic.log`: `8151825a69505c1c43309f2914b81f1a16bd3556349a3f198ca9832157aeadb7`
- matrix `error-context.md`: `a2c2e7a91ef2165345555c6a95081ea12058881d7b8aab5e2cf1133f0989e54f`

## Task-state boundary

The current T02 packet row still records this card as `REVIEWING`, `ready:false`, with `hosted_run:null` and no run-review report. I did not change task state. The coordinator must record this exact run and review, then decide the packet’s narrow status. Even with this evidence review PASS, no matrix, material-semantics, parent-T02, or gameplay acceptance follows from the failed diagnostic route.

No source edits or local application checks were performed. The only local operations were reading the captured run files and verifying the downloaded artifact inventory’s paths, byte lengths and SHA-256 digests.
