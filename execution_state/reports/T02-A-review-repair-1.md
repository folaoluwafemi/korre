# T02-A repair 1 independent re-review

**Verdict: CHANGES_REQUIRED**

The repair fixes the reported Scene leak for a Havok constructor failure before a native handle is created. `new HavokPlugin(false, havok)` is now inside the cleanup `try`; if the constructor throws at `HP_World_Create`, the catch disposes the Scene, attempts all owned cleanup, and rethrows the original error ([worldFactory.ts](../../games/counterball/src/simulation/worldFactory.ts:101)). The new regression injects that failure, verifies the same error object and original Engine scene list, and then creates/disposes a real-WASM world on the same Engine ([worldFactory.test.ts](../../games/counterball/src/simulation/worldFactory.test.ts:64)). The focused test passes.

## Remaining finding

- **P2 — A constructor failure after native world allocation still leaks the native world.** The pinned Babylon constructor first assigns the result of `HP_World_Create()` to `this.world`, then calls `HP_QueryCollector_Create(1)` and configures the collector (installed source: `@babylonjs/core/Physics/v2/Plugins/havokPlugin.js`, lines 466–475). If one of those later calls throws, JavaScript never assigns the partially constructed object to the factory's `plugin` variable. The catch therefore sees `plugin === undefined`; `Scene.dispose()` cannot release this unattached plugin or its native world. The new regression throws inside `HP_World_Create` before a handle exists, so it does not cover this partial-constructor case. Add an explicit cleanup strategy for native handles allocated before a throwing constructor returns, with a focused failure injected after world creation, before accepting the broader construction-failure cleanup requirement.

The original failure path is repaired, and the catch preserves the original error even when `disposeCounterballWorld` reports a cleanup error. The remaining finding is about native allocation made internally after the injected failure point; it does not diminish the regression's proof that the Scene is removed.

## Checks

- `pnpm.cmd --filter @korre/counterball exec vitest run --root ../.. --config vitest.config.ts games/counterball/src/simulation/worldFactory.test.ts` — exit 0; 1 file, 4 tests passed. These construct actual pinned Havok WASM/Physics V2 worlds, but do not step a shot.
- `pnpm.cmd exec eslint games/counterball/src/simulation/worldFactory.ts games/counterball/src/simulation/worldFactory.test.ts --max-warnings=0` — exit 0.
- `pnpm.cmd exec prettier --check games/counterball/src/simulation/worldFactory.ts games/counterball/src/simulation/worldFactory.test.ts` — exit 0.
- `pnpm.cmd --filter @korre/counterball typecheck` — first run exit 1 at `games/counterball/src/workspace.test.ts:7`, where the package smoke test expected `browserEntry.scaffoldPackage`. This is outside the T02-A write paths. After a concurrent edit added that export to `games/counterball/src/browser.ts`, rerunning the same typecheck against the current worktree returned exit 0. The reported failure was unrelated to T02-A; the actual failing path from this command was the package's `src/workspace.test.ts`, not the root `tests/unit/workspace.test.ts`.
- The package-wide test/integration check was not run in this repair review. Run the package and integrated checks after the coordinator's concurrent scaffold changes settle. This review does not accept parent T02.

No shot, calibration, deployed Cloudflare, or real-phone proof is claimed.
