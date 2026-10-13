# T02-L01-MATRIX-1 repair 3 implementation

**Source status: repaired, pending independent review. Runtime: NOT RUN.**

Changed only `tests/e2e/counterball-direct-probe.spec.ts` and this report.

The two file-reader cleanup paths now pass caught `unknown` values through `rethrowCaughtError`: existing `Error` instances retain identity, while non-Error values are wrapped in an `Error` whose `cause` is the original value. Existing `AggregateError` paths remain unchanged and still retain both failures and the primary cause. The fixture-derived placement variable is declared without an overwritten initializer; every branch still assigns the same canonical position. The two collision-mask array entries are explicitly typed as `unknown`, preserving the existing type and bounds validation without unsafe assignment.

The only local validation run was `git diff --check -- tests/e2e/counterball-direct-probe.spec.ts`; it exited 0. Git emitted only its LF-to-CRLF working-copy warning. Typecheck, lint, tests, build, browser automation, CI, and physics were NOT RUN. Hosted verification remains pending.
