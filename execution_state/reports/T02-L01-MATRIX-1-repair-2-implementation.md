# T02-L01-MATRIX-1 repair 2 implementation

**Source status: repaired, pending independent review. Runtime: NOT RUN.**

Changed only `tests/e2e/counterball-direct-probe.spec.ts` and this report.

The material body-ID validator now checks membership with `MATRIX_KNOWN_BODY_IDS`, a `ReadonlySet<string>` initialized from the same canonical dynamic and static ID arrays. This fixes the hosted TypeScript error caused by passing a general string to an `includes` method whose array element type is a literal union. The runtime allowlist and rejection behavior are unchanged; no cast or wider source of IDs was introduced.

The only local validation run was `git diff --check -- tests/e2e/counterball-direct-probe.spec.ts`; it exited 0. Git emitted only its LF-to-CRLF working-copy warning. Typecheck, lint, tests, build, browser automation, CI, and physics were NOT RUN. Exact-head hosted verification remains pending.
