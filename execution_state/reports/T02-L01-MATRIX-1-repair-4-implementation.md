# T02-L01-MATRIX-1 repair 4 implementation

**Source status: repaired, pending independent review. Runtime: NOT RUN.**

Changed only `tests/e2e/counterball-direct-probe.spec.ts` and this report.

Both `readPinnedFixture` and `validateMatrixFile` now represent captured failures as nullable `{ value: unknown }` records. The record is present whenever a catch runs, including when the caught value is `undefined`; no-error state is represented by `null`, not by an undefined caught-value sentinel. File-close failures use the same representation. Thus single failures still preserve `Error` identity or wrap non-Error values with the original value as `cause`, while dual failures still produce an `AggregateError` containing both original values and the primary cause. The existing cleanup, canonical placement mapping, native mask validation, and matrix assertions remain in place.

The only local validation run was `git diff --check -- tests/e2e/counterball-direct-probe.spec.ts`; it exited 0. Git emitted only its LF-to-CRLF working-copy warning. Lint, typecheck, tests, build, browser automation, CI, and physics were NOT RUN. Hosted verification remains pending.
