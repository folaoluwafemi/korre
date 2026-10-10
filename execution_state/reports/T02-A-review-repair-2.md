# T02-A repair 2 independent re-review

**Verdict: PASS for the bounded constructor-resource cleanup repair.** This does not accept T02-A or parent T02.

`createOwnedPlugin` wraps the initialized runtime per factory call and intercepts only `HP_World_Create` and `HP_QueryCollector_Create`. Its `constructing` flag is true only around the synchronous `new HavokPlugin(...)` call; successful results are recorded only when the pinned API returns `Result.RESULT_OK`. On successful construction it clears both tracking arrays before returning, so subsequent plugin calls and disposal remain under Babylon's normal ownership. The wrapper does not patch or mutate the shared Havok runtime ([worldFactory.ts](../../games/counterball/src/simulation/worldFactory.ts:84)).

If the constructor throws, tracked collectors are released in reverse order, followed by tracked worlds in reverse order. Each release is isolated in its own `try`, so one thrown cleanup does not stop later releases. The original constructor error is rethrown, then the outer factory catch attempts Scene/resource cleanup while preserving that error ([worldFactory.ts](../../games/counterball/src/simulation/worldFactory.ts:118), [worldFactory.ts](../../games/counterball/src/simulation/worldFactory.ts:351)). When construction succeeds, the cleared tracking buffers cannot double-release plugin handles; the returned world's idempotent disposer delegates to Babylon's plugin disposal. The regression's release-count assertions verify one release for the failed constructor's genuine native world plus one for the later recovered world.

The real-WASM regression lets the pinned API allocate a world, injects the collector-creation throw, verifies the exact original error and allocated world handle release, checks the Engine's Scene list, then builds and disposes a 15-body real Physics V2 world on the same Engine/runtime. A second parameter makes world release throw after performing the genuine release and verifies the constructor error is preserved and Scene cleanup still occurs. Existing construction, isolation, duplicate-ID cleanup, and idempotent-disposal tests remain in the focused file. One scope limit: this regression throws during collector creation, before a collector handle is successfully returned. The source handles tracked collectors with the same loop, but this run did not separately inject a later constructor failure after successful collector creation.

## Checks

- `pnpm.cmd --filter @korre/counterball typecheck` — exit 0.
- `pnpm.cmd --filter @korre/counterball exec vitest run --root ../.. --config vitest.config.ts games/counterball/src/simulation/worldFactory.test.ts` — exit 0; 1 file, 6 tests passed using the pinned real Havok WASM. No shot was stepped.
- `pnpm.cmd exec eslint games/counterball/src/simulation/worldFactory.ts games/counterball/src/simulation/worldFactory.test.ts --max-warnings=0` — exit 0.
- `pnpm.cmd exec prettier --check games/counterball/src/simulation/worldFactory.ts games/counterball/src/simulation/worldFactory.test.ts` — exit 0.
- `git diff --check` — exit 0. The two simulation source files are untracked in this workspace, so Git's diff check does not inspect their contents; the explicit Prettier check covers formatting for those paths.

No shot/calibration, Cloudflare-deployed physics, or real-phone proof is claimed. PostgreSQL is unrelated to this packet and was not accessed.
