# T02-L01-GUARD-SCHEMA-1 exact-run review

**Verdict: CHANGES_REQUIRED.** Run 38155542248 is on the requested exact SHA and its focused protocol test passed, but `pnpm verify` failed in formatting. Required full verification and every downstream build/integration/browser gate are therefore unproven.

## Run and artifact provenance

- GitHub run 38155542248, attempt 1, is a completed `push` run on exact head `db8436e02f98a7007a9be0f4708dc552f651ef4d`. Run conclusion: failure. The sole `verify` job is ID 114517651170 and also concluded failure.
- The run's complete GitHub log, API run/job metadata, artifact API metadata, extracted artifacts, and a per-file SHA-256 inventory are preserved under `execution_state/reports/T02-L01-guard-schema-run-38155542248-independent-artifacts/`.
- The run-scoped artifact API lists four artifacts: hosted checks (ID 11708167956; the name includes the exact SHA, run, and attempt), verification log (11708098052), browser evidence (11707963644), and formatting repair (11708247924). The hosted-check archive contains `protocol.log`, `verify.log`, `migrations.log`, `workers.log`, and `tooling-format.log`; its `verify.log` matches the separately uploaded verification log byte-for-byte. The formatting patch is included. Browser evidence consists of three T03 PNGs; it is not evidence that this run's browser tests ran. No L01 matrix artifact was produced.

## Checks that ran

- Steps 1–12 succeeded, including frozen install, Worker smoke, CI config formatting, Chromium installation, migration apply/recheck, and the standalone focused protocol test. The focused `packages/game-protocol/src/protocol.test.ts` suite reports **13 passed of 13**, with no skipped tests reported. The Worker smoke suite reports **1 passed of 1**, with no skips reported. Migrations verified one forward-only migration twice; those are migration checks, not test counts.
- Typechecking inside `pnpm verify` completed for eight of nine workspace projects and the additional tests/server TypeScript configurations. ESLint produced no reported findings. The lint script then failed its Prettier check on `packages/game-protocol/src/schemas.ts`. Thus `pnpm verify` failed; it did not reach the `pnpm test` or `pnpm build` stages. The uploaded formatting suggestion targets that schema file.
- The workflow preserved its logs and uploaded run artifacts after the failure. The attempt does not show a successful production or Worker package build.

## Checks skipped or not reached

GitHub marks these steps skipped after the failed Verify step: production diagnostic-renderer exclusion; Worker package and upload; production browser package and upload; integration tests; built-browser preview tests and upload; separate diagnostic browser bundle/package/upload; and diagnostic browser suites. Therefore no counts, skip totals, retry results, or browser proof exist for integration or E2E in this run. The `pnpm test` workspace suite and build within `pnpm verify` were not reached either.

The card's exact-head acceptance requires both focused protocol coverage and a successful `pnpm verify` with the required no-skip evidence. The focused suite passes, but the formatting failure leaves the card unverified. A bounded formatting repair and a fresh exact-head hosted run are required. This run proves no L01 matrix, real-Havok trial, deployed runtime, or playable behavior.

## Checks performed for this review

- `node scripts/check-completion-plan.mjs --packet T02-L01-GUARD-SCHEMA-1` — exit 0, plan-consistency PASS; the extracted card remains not ready until its dependencies are accepted. This is not implementation evidence.
- Queried the run, job steps, and run-scoped GitHub artifact metadata; downloaded and inspected the complete hosted-check artifacts, complete run log, formatting suggestion, and browser-evidence artifact. No local app install, build, test, browser, physics, or deployment command was run.
