# C00-A CI workflow review

**Verdict: PASS for the workflow change.** The focused protocol command is wired once on both push and pull-request runs, before the full `Verify` step. This is a source/config review only; the edited workflow has not yet been verified by a hosted run.

## Evidence

The complete `.github/workflows/ci.yml` diff contains two insertions and no deletions. It adds exactly one step after the disposable PostgreSQL migration check and immediately before `Verify`:

`pnpm exec vitest run packages/game-protocol/src/protocol.test.ts`

A search of the workflow finds exactly one occurrence of that command. The workflow triggers on both `push` and `pull_request`, with no job or step condition that excludes either event. Existing permissions remain `contents: read`. No existing workflow steps, environment settings, or artifact behavior were removed or weakened by this diff.

The root manifest defines `verify` as `pnpm typecheck && pnpm lint && pnpm test && pnpm build`, with `test` mapped to `vitest run`. Thus the focused command itself appears exactly once as requested; if full Verify reaches its test phase, the same file will also be collected by the broader suite.

The earlier hosted run 38078311528 did not include this new step in its recorded job-step list and failed Prettier before tests. It is not evidence that this workflow change has executed. A new hosted run after the change is committed is still required.

No local tests or builds were run. Only this review report was written.
