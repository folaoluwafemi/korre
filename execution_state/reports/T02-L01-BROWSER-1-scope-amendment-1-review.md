# T02-L01-BROWSER-1 scope amendment 1 review

## Verdict: PASS

Adding the existing `games/counterball/src/viteAssetModules.d.ts` to the repair-2 write paths is justified and bounded. The failed GitHub run 38415702575 at `275cd4b74782cb050dd6454aa3ed30b1f5836900` reports exactly two TS2307 errors in `loftCoarseRunner.ts`: its `HavokPhysics.wasm?url` and fixture `?raw` imports. The declaration file exists at that exact commit; it has only the two package-owned ambient asset declarations, and `games/counterball/tsconfig.json` includes `src`. The run log records the errors at lines 719–720.

The original card says a newly required source path needs a coordinator packet amendment (LOCAL_PACKETS.json, lines 3486–3487). This proposal makes that amendment before the file is edited. It adds only this existing package-owned declaration path; it changes no route, workflow, configuration, dependency, or runtime Vite usage. The existing Browser1 dependencies and acceptance gates remain unchanged.

The proposal constrains any edit to the two asset-query declarations with concrete `string` default exports for the Wasm URL and raw fixture text. It forbids `any`, suppressions, fallbacks, and fixture or matrix changes. Its stated preservation of the byte cap, 256-KiB awaited OPFS writes, finalization, ACK validation, cleanup, development-only gate, and direct-shot/retry behavior is appropriate for this declaration-only scope.

The bounded repair policy is preserved: this remains repair attempt 2; one reviewed exact-head hosted run follows, and another implementation failure stops for escalation. No repair attempt 3 is authorized.

## Limits

This PASS approves only the proposed write-path addition. It does not establish that the existing declaration file was included in TypeScript's program, that changing its patterns will resolve TS2307, or that any browser/runtime invariant passes. The worker must diagnose before changing the declarations, and the reviewed exact SHA must still pass hosted verification and production-exclusion checks. No source, catalogue, or application check was performed for this review.
