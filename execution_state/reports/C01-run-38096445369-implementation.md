# C01 implementation and exact-run evidence — 38096445369

**Status: ACCEPTED after independent source, hosted-run and artifact review.** No application source/config changes were made during this resume. This report re-verifies the already implemented C01 card on the exact current commit and records the completion of its previously missing diagnostic artifact gate.

## Worker test compatibility

The workspace pins `@cloudflare/vitest-plugin` 1.4.0 with Vitest 4.1.2, and the lockfile peer range accepts Vitest 4.1.0 or later. Cloudflare’s current [first Workers test guide](https://developers.cloudflare.com/workers/testing/vitest-integration/write-your-first-test/) requires Vitest 4.1+, the [configuration guide](https://developers.cloudflare.com/workers/testing/vitest-integration/configuration/) documents `cloudflareTest`, Wrangler config and Miniflare bindings, and [test APIs](https://developers.cloudflare.com/workers/testing/vitest-integration/test-apis/) documents runtime-only imports from `cloudflare:workers`. The current pins are compatible; no package or lockfile change was needed.

The ordinary Vitest suite includes only the app/game/package/unit TypeScript patterns and excludes `apps/realtime/tests/**/*.worker.test.mjs`. `pnpm test:workers` uses the separate `vitest.workers.config.ts`, which includes that concrete Worker test pattern and loads `apps/realtime/wrangler.toml` through the documented plugin. CI creates one named smoke test, imports `env` from `cloudflare:workers`, checks a configured Miniflare binding, and removes the temporary test with a shell trap. Hosted output reports 1/1 collected and passed, so this is a real Workerd integration smoke rather than a Node mock or empty suite.

## Exact hosted run

- Source SHA: `6af18f5c733d96be484700ba7c330f9bf0669f64`.
- GitHub Actions: [run 38096445369](https://github.com/folaoluwafemi/korre/actions/runs/38096445369), attempt 1, successful `verify` job.
- Worker smoke 1/1; focused protocol tests 11/11; disposable PostgreSQL migrations passed twice; `pnpm verify` passed 26 files and 140 tests with zero skips; integration passed 1/1; production Chromium passed 4/4 with zero skipped/flaky; production exclusion scan and production/diagnostic builds passed. Workflow totals: 34 successful, 2 conditional formatting steps skipped, 0 failed.
- The same run passed C01-DIAG-BUILD, which is accepted in `execution_state/reports/C01-DIAG-BUILD-acceptance.md`. Diagnostic-browser interaction is still owned by a later card.

## Realtime artifact audit

The exact-run Worker artifact is `counterball-realtime-prebuilt-6af18f5c733d96be484700ba7c330f9bf0669f64` (GitHub artifact ID 11685614952). Its inventory records SHA `6af18f5c733d96be484700ba7c330f9bf0669f64`, run 38096445369, attempt 1, `wrangler-dry-run`, entry source `src/index.ts`, and entry `dist/index.js`. I recomputed the byte size and SHA-256 of all 3 listed emitted files, checked the exact emitted path set, and verified the packaged `wrangler.toml` hash against the inventory. All checks passed. Inventory records Node v24.21.0, pnpm 10.33.0, Wrangler 4.149.0, Babylon 9.30.0 and Havok 1.3.14. The artifact contains no emitted WASM file; the inventory accurately lists the current dry-run output.

Other exact-run production and diagnostic browser artifacts have separate names and inventories. Their independent review at `execution_state/reports/C01-DIAG-BUILD-run-38096445369-review.md` verified all 452 production and 454 diagnostic emitted-file hashes/sizes and exact file sets, with the renderer marker absent from production and present in diagnostic output.

## Scope boundary

No local application install, build, test or browser automation ran. Local work was limited to document/state updates and read-only artifact hashing. No Wrangler command or deployment ran. The Worker output is a dry-run package, not a deployed Worker and not proof of deployed Havok. This C01 evidence covers test separation, current CI checks and retained build artifacts; it does not prove a browser flick or playable match. The independent review passed at execution_state/reports/C01-run-38096445369-review.md, and C01 is accepted. T02 remains open.
