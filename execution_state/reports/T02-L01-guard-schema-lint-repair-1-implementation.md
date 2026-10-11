# T02-L01-GUARD-SCHEMA-1 lint repair 1 implementation

Date: 2026-10-11
Owner: coordinator
Status: IMPLEMENTED; independent source review pending
Failure: `@typescript-eslint/no-unsafe-return` on exact-head run 38154941084
Bounded attempt for this lint failure: 1 of 2

## Trigger and repair

The focused protocol suite passed 13/13 on SHA `a4dab1bb51fa426e7bbe3433eaf815d679422a58`, but hosted `pnpm verify` stopped during ESLint before unit tests/build. The run report and complete logs are at `execution_state/reports/T02-L01-guard-schema-run-38154941084.md` and its adjacent artifact directory.

The finding came from TypeScript's `Array.isArray(unknown)` narrowing to `any[]`: a value from the recursive map callback reached the return expression as `any`. Only `packages/game-protocol/src/protocol.test.ts` changed. The helper now aliases the narrowed value as `readonly unknown[]` before mapping, so each recursive entry is unknown and must pass through the existing primitive/path checks. No assertion, schema literal, guard value or fixture changed.

## Check actually run

- `git diff --check -- packages/game-protocol/src/protocol.test.ts` — PASS.

No application test, typecheck, lint, build, browser automation, physics/Havok, deployment or external service command ran locally for this repair. The exact source is released for independent review; after PASS it must be published and retested on GitHub.

## Review handoff

`/root/br02_review` owns only `execution_state/reports/T02-L01-guard-schema-lint-repair-1-review.md` for independent read-only review. The five original schema source paths remain the full implementation write set.
