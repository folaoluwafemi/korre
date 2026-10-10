# T02-A independent review

Verdict: **CHANGES_REQUIRED**. This reviews only runtime initialization and world construction. It does not accept parent T02 or prove shots, contact classification, loft, settlement, rendering, Worker deployment, or real-phone behavior.

## Evidence and scope

Read `execution_state/packets/T02-A.md`, the five assigned simulation files, the pinned package manifests/source, and relevant T02/D35/simulation contract clauses. There is no interim implementation report: the packet reserves `T02-implementation.md` for the completed parent task. The coordinator retained the worker's completion message (reported typecheck/test/root-lint exit 0); the commands below are this review's independent evidence.

The implementation calls the actual `@babylonjs/havok@1.3.14` package entry point and initializes its actual WASM bytes. The standalone runtime test creates/releases a native world without NullEngine. The world tests use NullEngine as a Babylon scene host while constructing the actual `@babylonjs/core@9.30.0` Physics V2 HavokPlugin; native world/body handles, rather than the rendering host, provide the physics construction evidence.

Source inspection and passing focused tests establish fifteen canonical dynamic entities (button and seven caps per side), seven static colliders (slab plus two open three-part goal frames), explicit gravity, frozen geometry and timestep, restored finite fixture transforms/velocities, and separate native worlds/body handles for two calls. Successful disposal releases the attached physics world and leaves the caller-owned engine available. The helper attempts body, shape, and scene cleanup even if a release throws. No simulation stepping or new tuning coefficients were introduced. Calibration remains outside this packet.

## Required repair

**R1 — plugin construction bypasses cleanup of the already allocated scene.** In `games/counterball/src/simulation/worldFactory.ts:101`, `new Scene(engine)` allocates/registers the scene. At line 109, `new HavokPlugin(false, havok)` runs before the `try` at line 113. Any plugin-constructor exception therefore bypasses the catch and `disposeCounterballWorld(resources)` entirely. The pinned constructor calls injected `HP_World_Create` at `node_modules/.pnpm/@babylonjs+core@9.30.0/node_modules/@babylonjs/core/Physics/v2/Plugins/havokPlugin.js:466`, followed by query-collector allocation. These calls can throw; there is no guard surrounding them in the factory. This is a direct control-flow proof, not a claim that ordinary pinned initialization failed in the passing tests.

This violates the packet Result clause: “Dispose bodies, plugin/engine and owned resources reliably, including construction failures,” and its focused-test requirement to prove disposal after partial construction failure. Place plugin initialization within the cleanup-protected allocation lifecycle, handle an absent/unattached plugin safely, and add a regression that injects a constructor failure before native world creation and verifies the original error survives, engine scene count returns to its baseline, and another valid world can be created. Any native allocations made by a throwing constructor also need an explicit cleanup policy; avoid implying the existing duplicate-ID test covers constructor failure. That test currently checks that rebuilding works, which does not itself assert the failed scene/native resources were released.

## Commands actually run

All commands ran from `C:\Users\USER\StudioProjects\korre`.

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm.cmd --filter @korre/counterball typecheck` | 1 | TypeScript reports `src/workspace.test.ts:7` references removed `browserEntry.scaffoldPackage`; underlying tsc exit status 2. |
| `pnpm.cmd --filter @korre/counterball test` | 1 | 5 test files/13 tests passed; 1 file/1 test failed at the same obsolete browser scaffold assertion. |
| `pnpm.cmd exec eslint games/counterball/src/simulation/havokRuntime.ts games/counterball/src/simulation/worldFactory.ts games/counterball/src/simulation/dispose.ts games/counterball/src/simulation/runtime.test.ts games/counterball/src/simulation/worldFactory.test.ts` | 0 | All five assigned files pass. |
| `pnpm.cmd exec prettier --check games/counterball/src/simulation/havokRuntime.ts games/counterball/src/simulation/worldFactory.ts games/counterball/src/simulation/dispose.ts games/counterball/src/simulation/runtime.test.ts games/counterball/src/simulation/worldFactory.test.ts` | 0 | All five assigned files pass. |
| `pnpm.cmd exec vitest run --config vitest.config.ts games/counterball/src/simulation/runtime.test.ts games/counterball/src/simulation/worldFactory.test.ts` | 0 | 2 files/4 tests passed using real pinned Havok WASM. |

The scaffold assertion failures are a coordinator-owned integration conflict caused by the authorized concurrent T03-C browser entrypoint change, not a T02-A source defect. Root lint was deliberately not run while the scene worker edited disjoint files. Focused checks passed, but R1 still prevents this subpacket from passing independent review. No deployed physics checks were run or claimed.
