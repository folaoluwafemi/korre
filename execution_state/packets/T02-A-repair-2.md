# T02-A repair 2 — release a Havok world after partial plugin construction

Coordinator: `/root`. Repair author: `/root/swarm_review`. Independent reviewer: `/root/toolchain_audit`, after this repair completes. This is the final focused repair attempt for the T02-A constructor cleanup finding; stop after this attempt and report exact evidence if any acceptance check fails.

## Finding and input

The review at `execution_state/reports/T02-A-review-repair-1.md` found Babylon's pinned `HavokPlugin` constructor calls `HP_World_Create()` before `HP_QueryCollector_Create()`. If the latter throws, the plugin assignment never completes and `plugin.dispose()` cannot be called, leaving a real native world allocated. The pinned API provides `HP_World_Release` and `HP_QueryCollector_Release`.

## Exact write paths

- `games/counterball/src/simulation/worldFactory.ts`
- `games/counterball/src/simulation/worldFactory.test.ts`
- `execution_state/reports/T02-A-repair-2-implementation.md`

Do not edit any other source, package, shared config, fixture, status, ledger, or contract.

## Required behavior

Track only native worlds/collectors created during the synchronous `HavokPlugin` constructor. If the constructor throws before returning, release every successfully allocated tracked native handle, dispose the owned Scene, attempt all cleanup even if one release throws, and rethrow the original construction error. On successful construction, normal Babylon plugin ownership/disposal must remain authoritative; never double-release handles from the tracking buffer. Keep caller-owned Engine intact and preserve successful Physics V2 worlds.

Add a real-WASM regression using initialized pinned Havok. Let `HP_World_Create` allocate its genuine world; inject a throw from `HP_QueryCollector_Create`; assert the original error is observed, the real world handle was passed to `HP_World_Release`, no new Scene remains on the Engine, and the same runtime/Engine can construct and dispose a later real world with all 15 match bodies. Do not replace prior tests.

## Required checks, each separately from workspace root

1. `pnpm.cmd --filter @korre/counterball typecheck`
2. `pnpm.cmd --filter @korre/counterball exec vitest run --root ../.. --config vitest.config.ts games/counterball/src/simulation/worldFactory.test.ts`
3. `pnpm.cmd exec eslint games/counterball/src/simulation/worldFactory.ts games/counterball/src/simulation/worldFactory.test.ts --max-warnings=0`
4. `pnpm.cmd exec prettier --check games/counterball/src/simulation/worldFactory.ts games/counterball/src/simulation/worldFactory.test.ts`
5. `git diff --check` (record its limits for untracked files if applicable)

The implementation report must list changed files, exact commands and exit codes, assertions proving native release/recovery, and any checks not run. Stop after writing the report; no status changes.