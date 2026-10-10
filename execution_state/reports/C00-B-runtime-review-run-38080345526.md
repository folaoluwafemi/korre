# C00-B hosted runtime evidence review — run 38080345526

**Verdict: CHANGES_REQUIRED for hosted verification.** The focused protocol suite passed, but the full `pnpm verify` step failed its formatting check. This verdict does not identify a schema/runtime behavior defect; the recorded formatter findings must be fixed and the full hosted pipeline rerun before C00-B can be accepted.

Run: https://github.com/folaoluwafemi/korre/actions/runs/38080345526  
Head SHA: `ba59e5a40a6b2877b8be452936db73f9a64a3168`  
Local `HEAD` matched this SHA, and the reviewed C00-B implementation paths were unchanged after the run. The overall run and `verify` job concluded `failure`.

## Results

- Dependency installation and Playwright browser installation passed.
- `Apply and recheck migrations on disposable PostgreSQL` passed twice. Each `pnpm --filter @korre/api db:migrate` invocation reported `Verified 1 forward-only migration(s)`.
- The focused command `pnpm exec vitest run packages/game-protocol/src/protocol.test.ts` ran. It collected one file and passed 11/11 tests with no skips reported.
- The `Verify` step began `pnpm typecheck && pnpm lint && pnpm test && pnpm build`. Workspace/package typechecks completed. ESLint proceeded to Prettier, which failed on exactly `packages/game-protocol/src/protocol.test.ts` and `packages/game-protocol/src/schemas.ts`. The uploaded `formatting-repair.patch` contains formatting-only line-wrap changes for those paths. Since `pnpm lint` failed, the chained workspace `pnpm test` and `pnpm build` did not run.
- `pnpm test:integration` and `pnpm test:e2e --workers=1` were skipped because Verify failed. Browser preview build/upload was also skipped. There is no browser run result for this SHA.
- The calibration and intended-shot observation upload steps completed with `if-no-files-found: ignore`; logs confirm that neither observation JSON existed, so neither artifact was uploaded. The `counterball-browser-evidence` artifact contains only three T03 PNG screenshots; it has no browser-test-results JSON and is not evidence of a browser run in this workflow.

## Artifact provenance

GitHub listed three non-expired artifacts for this run:

| Artifact | ID | Size | SHA-256 |
|---|---:|---:|---|
| `counterball-verification-log` | 11680435951 | 591 bytes | `05215341592814cc694aa11e7ffe2691f262bbc6edc0e0e075480a1efb489cea` |
| `counterball-browser-evidence` | 11680416006 | 437,511 bytes | `2a7f3794e2e1421cc10726ff4e15810a5c0b01168a9052a05e01eb3021336dfd` |
| `formatting-repair` | 11680830292 | 875 bytes | `46907218a3f4d928a9b84299b15a880f4d276f650a60c8e4db742457f41f5f45` |

The verification artifact contains the full 1,452-byte `verify.log`, ending at the Prettier failure. The formatting artifact contains the suggested patch; it was not applied as part of this review. No `counterball-browser-preview` artifact exists for this run.

## Scope limits

The focused run verifies protocol parsing for the new nullable calibration contract. It does not implement or exercise runner null rejection, actual Havok substeps, support-apron bounds, settling, shot behavior, or deployed Cloudflare execution. No full workspace test/build, integration test, browser E2E, new browser build, or physics-observation probe passed in this run. C00-B does not accept parent T02 or establish playable physics.
