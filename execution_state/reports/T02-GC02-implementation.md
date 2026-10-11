# T02-GC02 protocol config guard implementation

Date: 2026-10-11
Author: coordinator

## Result

Implemented only the five exact T02-GC02 paths:

- `packages/game-protocol/src/types.ts`
- `packages/game-protocol/src/schemas.ts`
- `packages/game-protocol/src/config.ts`
- `packages/game-protocol/src/protocol.test.ts`
- `tests/fixtures/counterball-v1.json`

`DiagnosticPhysicsGuard` is a fixed literal type and strict nested Zod schema. The outer config is version 2, while protocol wire version remains 1, the guard schema version remains 1, and `PhysicsCalibration` schema version remains 1. The frozen shared config contains the exact GC01 guard and still has `physicsCalibration: null`. The existing `COUNTERBALL_CONFIG_V1` export remains for source compatibility; no guard consumer or runtime fallback was added. Protocol tests cover exact acceptance, mutations/unknown fields, the version split, null calibration, and that changing the hashed guard changes the canonical hash. All eight fixture config hashes were updated; fixture states and other fields are unchanged.

## Checks actually run

- `node scripts/check-completion-plan.mjs --packet T02-GC02` — PASS; dependency and catalogue consistency only.
- `git diff --check` — PASS.
- Confirmed exactly eight old fixture hash occurrences were replaced and JSON remains parseable.
- Computed the canonical config hash by directly importing the config module with Node's native TypeScript stripping and calling the existing `hashCounterballConfig()` helper: `e40b5583fa7952e61838cf23bcbbdcbb517ac9a1ab4fc439576813c9e7218948`. This was a hash calculation only, not a package test or build.

No package install, typecheck, lint, test, build, browser, physics, deploy, or Wrangler command ran locally. Exact-head GitHub verification is pending independent source review.

## Evidence boundary

This card accepts only the protocol type/schema/config/hash fixture work after independent source review and exact-head hosted checks. It does not implement or prove support-apron geometry, Havok substep sweeps, material/mass inspection, guard consumption, a browser flick, calibration, a playable match, or deployed physics. T02, BR01 and L01 remain unaccepted.
