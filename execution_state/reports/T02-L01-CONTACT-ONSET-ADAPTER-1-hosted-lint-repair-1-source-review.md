# T02-L01-CONTACT-ONSET-ADAPTER-1 hosted lint repair 1 source review

**SOURCE: PASS. RUNTIME: NOT RUN.**

Against exact base `37daf6b`, the only helper change is the boolean wrapper at `nativeCollisionSubscription.ts:62-74`: `isArrayValue(value: unknown): boolean` delegates to `Array.isArray`, while returning plain `boolean` so TypeScript does not narrow the typed readonly parameter to `any[]`. The runtime guard still rejects non-arrays; its left side short-circuits before the `.length` read for `undefined`, `null`, and object-shaped values. The helper's exact 22-ID/order validation and set-all-then-read-all/readback logic remain unchanged at lines 76-106.

The test adds only a focused non-array rejection case at `nativeCollisionSubscription.test.ts:104-110`. It passes `undefined`, `null`, and `{ length: 22 }` across the typed boundary and confirms each is rejected. The `as never` assertion is confined to that malformed-input test, matching the existing test's deliberate `undefined as never` readback fixture; it does not bypass validation or affect production types.

I compared the downloaded formatter patch from run 38647338857 with the current test diff. Every patch hunk is present exactly in the test file and changes only line wrapping. The only additional test-source change is the new non-array negative case. No assertion, expected operation order, mask value, or behavior was weakened. The helper diff consists solely of the boolean wrapper and replacing the direct `Array.isArray` call with it. No other source/config path changed in this repair.

No local application command, formatter, typecheck, lint, test, build, browser, or physics check was run. The prior hosted run's typecheck and 15 protocol tests passed, but ESLint failed on the earlier type-predicate narrowing; this source review does not establish that the repaired hosted Verify now passes. Native mask behavior and actual Havok event delivery remain unverified.

SHA-256 of the current reviewed files:

- `games/counterball/src/simulation/nativeCollisionSubscription.ts`: `b1e2633e4011ace3507276a32876f82dcb82fe36cfd53a03e03f2996e7805e16`
- `games/counterball/src/simulation/nativeCollisionSubscription.test.ts`: `90d35129b2676f1859437f6995c2c37c367cc372baea95d78d400ae84f041624`
