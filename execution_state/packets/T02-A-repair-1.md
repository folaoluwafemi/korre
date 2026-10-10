# T02-A repair 1 — protect scene lifetime across plugin construction

Coordinator: `/root`. Repair author: `/root/swarm_review`. Independent repair reviewer: `/root/toolchain_audit`.

## Finding

The independent T02-A review at `execution_state/reports/T02-A-review.md` returned `CHANGES_REQUIRED`: `worldFactory.ts` allocates a Babylon `Scene` before calling `new HavokPlugin(...)`, but that constructor is outside the cleanup `try`. A constructor exception leaves the newly allocated scene registered on the caller-owned Engine.

## Inputs and scope

- Accepted shared input: T01 protocol/config and `tests/fixtures/counterball-v1.json`.
- Existing T02-A world factory and tests.
- Repair only the constructor/Scene allocation ordering and cleanup proof. Do not change physics parameters, shared config, exports, fixture, contracts, task status, or unrelated workspace tests.

## Exact write paths

- `games/counterball/src/simulation/worldFactory.ts`
- `games/counterball/src/simulation/worldFactory.test.ts`

No report path is assigned to this subpacket; coordinator will record the repair check results in runtime status and the eventual T02 parent report. The worker must send changed paths, commands, exit codes, and findings before stopping.

## Required behavior

Arrange allocation and cleanup so that a Havok plugin-construction failure cannot strand a Scene on the caller-owned Engine. Preserve the original constructor error if cleanup itself fails. Keep normal successful world creation, explicit plugin disposal when attachment fails, and body/shape/scene cleanup on later partial construction errors.

Add one focused regression that forces plugin construction to throw before a world is returned, proves no new Scene remains on the Engine, proves the original error is observed, and proves that the same Engine can successfully create a later real-Havok world. The failure injection is only a cleanup test; it must not replace the existing tests that initialize real pinned Havok WASM and construct actual Physics V2 worlds.

## Required checks

From the workspace root, run each command separately:

1. `pnpm.cmd --filter @korre/counterball typecheck`
2. `pnpm.cmd --filter @korre/counterball exec vitest run --root ../.. --config vitest.config.ts games/counterball/src/simulation/worldFactory.test.ts`
3. `pnpm.cmd exec eslint games/counterball/src/simulation/worldFactory.ts games/counterball/src/simulation/worldFactory.test.ts --max-warnings=0`
4. `pnpm.cmd exec prettier --check games/counterball/src/simulation/worldFactory.ts games/counterball/src/simulation/worldFactory.test.ts`

The separate independent reviewer will rerun the focused test and review cleanup/error behavior. The earlier full package test conflict with T03-C's concurrently edited home-page scaffold assertion is a coordinator-owned integration issue; do not modify or weaken that test here.

## Stop and escalation

One focused repair attempt is authorized. If the cleanup proof fails, stop and send the exact failure and smallest proposed repair. Do not claim T02 accepted, calibrated, or deployed.
