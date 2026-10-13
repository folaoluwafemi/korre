# T02-L01-BROWSER-1 run 38415702575 independent evidence review

## Verdict

**PASS — evidence report accuracy only.** This review confirms the saved run evidence; the GitHub run itself failed. This is not source approval, browser/runtime acceptance, or acceptance of T02-L01.

## Run and failure

The saved job snapshot identifies workflow run `38415702575`, head SHA `275cd4b74782cb050dd6454aa3ed30b1f5836900`, branch `codex/remote-ci-bootstrap`, and conclusion `failure`. The run URL in the report is consistent with that identity. The full log’s checkout fetch and checkout lines use the same SHA. The snapshot contains 37 steps: 23 success, 1 failure, 13 skipped, matching the coordinator report.

`Verify` is the only failed step. Its retained `verify.log` shows workspace typecheck reached `games/counterball`, then stopped on these two TS2307 diagnostics in `games/counterball/src/simulation/loftCoarseRunner.ts`:

- line 26: unresolved `@babylonjs/havok/lib/esm/HavokPhysics.wasm?url` and corresponding declarations;
- line 28: unresolved `../../../../tests/fixtures/counterball-v1.json?raw` and corresponding declarations.

The command exited with code 2. The full `pnpm verify` chain is `typecheck && lint && test && build`; therefore lint, the full test suite, and build did not start. The snapshot marks production packaging, integration, browser preview, diagnostic browser packaging/tests, and related downstream output/upload steps skipped. The 13 skips are 12 downstream task-gate steps (14–18 and 22–28) plus the skipped `setup-node` post-action.

Some bounded checks did run before `Verify`: the dedicated Workers smoke test passed 1/1, and the focused game-protocol suite passed 13/13. The coordinator report correctly identifies those pre-gate checks. It does not claim the full test suite, build, browser/E2E, production output, OPFS, or physics matrix passed. The three PNGs in the uploaded browser-evidence artifact are earlier T03 preview evidence, not browser results from this run.

## Artifact integrity

I recomputed SHA-256 and byte length for every downloaded file. All 10 files match the inventory exactly; total downloaded size is 465,618 bytes. The two retained `verify.log` copies are byte-identical at 4,851 bytes with SHA-256 `a8284eed4ff7c443f392faed22941757b63528f6da422c8a8b6b7f43f033b529`. The full saved GitHub log SHA-256 is `2fc33064dc2d5aa8075606da3e3bc1c55aeb6f44f5ad0acaf5177f13286027d3`.

| Downloaded path | Bytes | SHA-256 |
|---|---:|---|
| `counterball-browser-evidence/execution_state/reports/T03-inspection.png` | 139,998 | `13a8d0257dd07dfb6650954f07255e53d7c2acf37293059f541fc44bd4b8d34e` |
| `counterball-browser-evidence/execution_state/reports/T03-narrow-viewport.png` | 141,477 | `88b461d66f721b9b5a01096d5422f0f3a99df970aba95cf5b8d584a946ed3cee` |
| `counterball-browser-evidence/execution_state/reports/T03-preview.png` | 167,624 | `d06272c44382f35d1e91e7264bbd8cf6c570b77d12ab0960284767c7ac05cd4f` |
| `counterball-hosted-checks-275cd4b74782cb050dd6454aa3ed30b1f5836900-run-38415702575-attempt-1/migrations.log` | 416 | `f40a42ad994e1e2145b4a29f0184d5c91570f55d08cbfc8292968de7cb0f9f67` |
| `counterball-hosted-checks-275cd4b74782cb050dd6454aa3ed30b1f5836900-run-38415702575-attempt-1/protocol.log` | 479 | `5cd581ddbebb64a85b7c6e06c660be301791ed6c181bf62955c0b85f6d1df434` |
| `counterball-hosted-checks-275cd4b74782cb050dd6454aa3ed30b1f5836900-run-38415702575-attempt-1/tooling-format.log` | 66 | `17aa973d3f004560237d9a95171210b0671deff23d61628eecf7322ff5938f20` |
| `counterball-hosted-checks-275cd4b74782cb050dd6454aa3ed30b1f5836900-run-38415702575-attempt-1/verify.log` | 4,851 | `a8284eed4ff7c443f392faed22941757b63528f6da422c8a8b6b7f43f033b529` |
| `counterball-hosted-checks-275cd4b74782cb050dd6454aa3ed30b1f5836900-run-38415702575-attempt-1/workers.log` | 576 | `f114f0b24e692b46902259b0f7b6349938152dd2976199d82380de3ea39f4bb3` |
| `counterball-verification-log/verify.log` | 4,851 | `a8284eed4ff7c443f392faed22941757b63528f6da422c8a8b6b7f43f033b529` |
| `formatting-repair/formatting-repair.patch` | 5,280 | `abe615f5df8537b2e6fe926985bfddfa939ff1d401df19fae81feb778cb13317` |

No further check was run for this review. The run remains failed at typecheck and provides no browser, production-build, OPFS, physics, or playability evidence.

