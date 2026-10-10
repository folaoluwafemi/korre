# C01 independent source/config review

**Source/config verdict: PASS for the implemented wiring. C01 is not accepted.** The dedicated Worker smoke is configured to run in Workerd, and the CI source handles the required log and build-inventory paths. Hosted execution and artifact inspection are still pending, and the diagnostic-browser acceptance item remains open as the packet requires.

## Worker Vitest boundary

The exact C01 coordinator record is ready and depends on C00; the materialized packet additionally preserves the original T01 prerequisite. `package.json` pins `@cloudflare/vitest-plugin` 1.0.0, exposes `test:workers` with `vitest.workers.config.ts`, and pins Vitest 4.1.2 in `pnpm-lock.yaml`. The plugin peer range is `^4.1.0`, matching Cloudflare's current documented minimum. The Worker config uses the documented `cloudflareTest()` plugin, reads `apps/realtime/wrangler.toml`, and supplies a test-only Miniflare binding. Its explicit include pattern matches the named CI-generated `ci-smoke.worker.test.mjs`; the ordinary Node config has a separate TypeScript-only include and explicitly excludes that Worker path.

The generated suite is non-empty by construction: it defines one named `it`, imports `env` from `cloudflare:workers`, and asserts the configured binding's exact value. Cloudflare documents that the `cloudflare:workers` module is only available to test files executing in the Workers runtime, and documents both the `cloudflareTest()` configuration and Miniflare bindings. This supports the source claim that the smoke is a Workerd test, not a Node mock. It verifies the runtime and binding boundary; it does not call or validate the realtime Worker handler. The CI command has no pass-on-empty option and tees output with `pipefail`; however, only a hosted run can prove the test was actually collected and passed.

Official guidance reviewed: [Workers Vitest integration](https://developers.cloudflare.com/workers/testing/vitest-integration/), [configuration](https://developers.cloudflare.com/workers/testing/vitest-integration/configuration/), [first Workers test](https://developers.cloudflare.com/workers/testing/vitest-integration/write-your-first-test/), and [test APIs](https://developers.cloudflare.com/workers/testing/vitest-integration/test-apis/). These docs identify `@cloudflare/vitest-plugin`, require Vitest 4.1 or later, describe the Wrangler/Miniflare configuration, and explain the runtime-only `cloudflare:workers` imports.

## CI secrets, logs, and artifacts

The workflow creates three separate 32-byte random values using `openssl rand -hex 32`, retries a collision, masks each value before writing it to `GITHUB_ENV`, and uses only disposable test names. `set +x` prevents shell tracing. The database credentials remain explicitly disposable service values; no user or staging secret is read. The materialized packet and implementation report accurately describe this behavior.

Each named check writes a `.artifacts/*.log` file through `tee`; the test/migration/format steps enable `pipefail`. The final run-qualified hosted-log upload uses `if: always()` and includes the logs plus structured browser results, so test failures do not discard the captured command output. The separate Verify-log upload also runs with `if: always()` and tolerates an absent file. A hosted run remains necessary to confirm actual log contents and counts.

The Worker packaging script copies the complete dry-run `dist` tree and the source Wrangler config, recursively inventories emitted files with size/SHA-256, checks that an expected entry exists, and records the copied config hash, tool/game versions, source SHA, run ID, and attempt. The production browser packaging checks for `index.html`, hashes the copied build files, and records source SHA, run ID/attempt, `buildMode: production`, and `devHarnessFlag: unset`. Both artifacts are attached by their upload steps to the run; the workflow also retains the browser preview and a separate run-qualified log/evidence artifact. These are sound source-level provenance and hashing mechanisms. No current hosted artifact exists in the implementation report for this review to download, recompute, or compare against the inventory, so those runtime checks remain pending.

The added hosted Prettier step covers `.github/workflows/ci.yml`, both root Vitest configs, and `package.json`, paths the ordinary workspace lint/format command does not cover. It records its output in the same always-uploaded log collection.

## C01 boundary and remaining evidence

The implementation report correctly says the diagnostic browser/game-harness producer does not exist, creates no diagnostic artifact, and keeps C01 unaccepted. The production browser artifact is not presented as a diagnostic build. Its metadata alone is not proof that a future development harness is excluded from production; that proof and the diagnostic artifact remain explicit follow-up acceptance gates. The Worker dry-run likewise proves neither deployment nor deployed Havok behavior.

The implementation report says no hosted Worker test, full Verify, integration, E2E, or artifact inspection has run for this source state. Thus this is a source/config PASS only: it does not attest to a Workerd test count, uploaded hashes, production-bundle contents, or any runtime/deployment behavior. Do not mark complete C01 acceptance until the exact-head hosted commands run, all required artifacts are downloaded and inspected, and the diagnostic-browser evidence is supplied by its real producer.

## Checks performed

- `node scripts/check-completion-plan.mjs --packet C01` — PASS; plan consistency only, with no implementation/runtime check.
- Read the C01 packet and implementation report, exact coordinator record, workflow, both root Vitest configs, root manifest, lockfile plugin peer/version entries, and current official Cloudflare Worker Vitest guidance.
- No local application install, build, test, typecheck, lint, formatter, browser, or Wrangler command was run. No source or shared status was changed.
