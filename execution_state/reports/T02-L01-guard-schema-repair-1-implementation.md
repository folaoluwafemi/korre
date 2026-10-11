# T02-L01-GUARD-SCHEMA-1 repair 1 implementation

Date: 2026-10-11
Owner: coordinator
Status: REPAIRED; rotated independent review pending
Bounded attempt: 1 of 2

## Trigger and contract check

Independent review 1 (`execution_state/reports/T02-L01-guard-schema-review-1.md`) returned CHANGES_REQUIRED. It found that `getPrimitivePaths()` collected only string and number leaves, omitting the accepted guard's `setup.capsIdentityRotation` and `setup.allDynamicVelocitiesZero` boolean fields. The accepted contract requires schema rejection and canonical config hash sensitivity for each guard field. This repair addresses that exact test-coverage defect without changing the guard contract or config values.

## Repair

Only `packages/game-protocol/src/protocol.test.ts` changed. Primitive path collection now includes booleans, mutation toggles boolean leaves, and the test explicitly asserts both boolean paths are included. The existing loop then verifies each mutated leaf is rejected by the strict config schema and produces a different canonical config hash. No other source or fixture path changed during repair 1.

## Check actually run

- `git diff --check -- packages/game-protocol/src/protocol.test.ts` — PASS.

No application test, build, typecheck, browser automation, physics/Havok, deployment, or external service command ran. This repair is not accepted until the rotated independent source reviewer passes it. Hosted focused tests and `pnpm verify` remain pending review and exact-head publication.

## Review handoff

The five source paths remain released. `/root/toolchain_audit` is assigned only the read-only review report `execution_state/reports/T02-L01-guard-schema-repair-1-review.md`; no source edits or app commands are authorized for that reviewer.
