# T02-L01-GUARD-SCHEMA-1 repair 2 implementation

Date: 2026-10-11
Owner: coordinator
Status: REPAIRED; rotated independent review pending
Bounded attempt: 2 of 2

## Trigger and repair

Independent repair-1 review (`execution_state/reports/T02-L01-guard-schema-repair-1-review.md`) confirmed that boolean leaves are now collected and toggled, but found that the two explicit path assertions used `toContain` with arrays. That matcher compares object identity, so the inline arrays could never match the distinct path arrays collected by the helper.

Only `packages/game-protocol/src/protocol.test.ts` changed. The two assertions now use Vitest's deep-equality `toContainEqual` matcher for `setup.capsIdentityRotation` and `setup.allDynamicVelocitiesZero`. The boolean path collection, toggle, per-leaf strict-schema rejection and canonical hash-sensitivity checks are unchanged.

## Check actually run

- `git diff --check -- packages/game-protocol/src/protocol.test.ts` — PASS.

No application test, build, typecheck, browser automation, physics/Havok, deployment or external service command ran. This is the second and final bounded repair attempt for the original exhaustive-leaf coverage finding. If independent review still requires another repair for the same finding, stop implementation edits and escalate with the reports per SWARM.md.

## Review handoff

All five source paths are released. `/root/foundation_review` is assigned only the read-only report `execution_state/reports/T02-L01-guard-schema-repair-2-review.md` for the rotated final review of the repair.
