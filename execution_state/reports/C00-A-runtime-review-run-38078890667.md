# C00-A hosted runtime evidence review — run 38078890667

**Verdict: PASS for the hosted checks and artifacts recorded below.** The workflow ran on the exact reviewed head `4bfecb4e6d700f85f89b7d521e168cab9489c6ec`; local `HEAD` matched, and the five C00-A implementation paths had no post-run changes. Run URL: https://github.com/folaoluwafemi/korre/actions/runs/38078890667. The run and its `verify` job completed successfully.

## Check results

- The new focused command actually ran: `pnpm exec vitest run packages/game-protocol/src/protocol.test.ts`. Vitest collected 1 file and passed 10/10 tests. No skips were reported.
- The `Verify` step passed. The preserved `verify.log` records `pnpm typecheck && pnpm lint && pnpm test && pnpm build`; workspace typechecks, ESLint, Prettier, and builds completed successfully. Vitest reported 24 files and 99/99 tests passed; no skipped count or skipped tests appeared in the complete log. The web production bundle built. The realtime step was a Wrangler `deploy --dry-run` with no bindings; it is not deployment evidence.
- The disposable PostgreSQL 17 migration step passed twice. Each run of `pnpm --filter @korre/api db:migrate` reported `Verified 1 forward-only migration(s)`.
- `pnpm test:integration` passed its single health integration test.
- `pnpm test:e2e --workers=1` passed all four Chromium preview tests. The uploaded browser results JSON is stamped with this run and commit and reports `expected: 4`, `skipped: 0`, `unexpected: 0`, and `flaky: 0`.

## Artifacts inspected

GitHub listed these five non-expired artifacts for the exact run. Their IDs, sizes, and API SHA-256 digests are:

| Artifact | ID | Size | SHA-256 |
|---|---:|---:|---|
| `counterball-verification-log` | 11679725803 | 106,131 bytes | `8a029699ca6b6e907ab0dfdc07c56fc23668d2da839a96c6849e66fd63b84ff0` |
| `counterball-intended-shot-observations` | 11679740708 | 815,530 bytes | `1d440e3351b4143e400ae9cbddd6bc50437d1c20ba9273ef4be9558ff7450077` |
| `counterball-calibration-observations` | 11680165030 | 104,314 bytes | `afbdb6302859463adf4da3460b34c5d105cc5296bcb017d93c7c1ebbb3610e4b` |
| `counterball-browser-preview` | 11680185006 | 1,813,083 bytes | `5ecacb0f5bfeb11b53a71f2b39fcbed56f965fa8dab580f4a491d25e4c75ae92` |
| `counterball-browser-evidence` | 11680160097 | 1,532,136 bytes | `2b618a3903afae2429bc53681f179007bef339b4b69765b57b2bdc9a7debe477` |

I read `verify.log` from the verification artifact and confirmed the 24-file/99-test result. I checked the browser preview archive in memory: its digest matches GitHub metadata, and it contains `index.html`, 450 JavaScript files, and one CSS file. It contains no WASM, consistent with the static preview's scope. The browser-evidence artifact contains the test-results JSON and three screenshots; its JSON confirms the four-test run and exact SHA above.

## Limits

This run verifies the protocol contract and workspace; it does not exercise a simulation runner's cancellation timing, batching, resource cleanup, or checkpoint restoration. Those behaviors remain for T02. The uploaded browser artifact is a static preview, not a playable game or physics/deployment proof. GitHub emitted non-failing Node 20 action and future `ubuntu-latest` image migration notices; no workflow check failed. No local application tests or builds were run for this review.
