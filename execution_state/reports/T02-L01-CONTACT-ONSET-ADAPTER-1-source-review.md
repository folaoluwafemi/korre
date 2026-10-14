# T02-L01-CONTACT-ONSET-ADAPTER-1 independent source review

**SOURCE: PASS. RUNTIME: NOT RUN.**

I reviewed the exact adapter packet, accepted contact-onset contract, implementation report, and both assigned source files. The implementation stays within the packet’s two source paths and uses the frozen helper boundary: `configureNativeCollisionOnsets(startedFlag: unknown, orderedBodies: readonly { bodyId; body: Pick<PhysicsBody, "setEventMask" | "getEventMask"> }[])`, returning the exact readonly `COLLISION_STARTED` subscription facts. It adds no package-barrel export.

`nativeCollisionSubscription.ts:22-35` builds the ordered 22-ID list from the canonical 15 `ENTITY_IDS` followed by goal-frame-0 through goal-frame-5 and support-apron. Lines 37-58 reject malformed flag containers and values that are not positive safe single uint32 bits, including zero, multi-bit, fractional, non-finite, and out-of-range values. Lines 67-84 validate the full count, canonical identity/order, and both public methods before any mutation. Lines 86-104 then set all masks before reading any, require exact readback for every body, propagate setter/getter failures, and return facts only after all 22 match. Thus no failure path returns a subscription that a caller could use to begin physics.

The focused tests at `nativeCollisionSubscription.test.ts:59-190` cover all-22 canonical set-then-read order and returned metadata; invalid flag values without touching bodies; missing, duplicate, and out-of-order IDs; an absent getter before mutation; a throwing setter before readback; a throwing getter after all setters; and `NaN`/missing readbacks after all reads. The two test-only casts are deliberate malformed-runtime fixtures: one gives the helper a body with an absent getter, and one returns `undefined` through an API statically typed to return a number. Neither is a redundant production assertion. Structural stubs establish adapter validation only; they do not claim actual Havok mask behavior or contact delivery.

I flagged the three-line `slice`/`map` chain at test lines 153-156 as an obvious formatter risk. The coordinator then changed only that expression to one indented line, as recorded in `T02-L01-CONTACT-ONSET-ADAPTER-1-pre-ci-reflow.md`; I confirmed the current line and found no semantic change. No local formatter or application check was run. The hosted Verify/formatter gate remains required.

The implementation report says its scoped `git diff --check` returned 0, while accurately noting Git does not include these new untracked source files in ordinary tracked diff hunks. The coordinator's subsequent staged hygiene check returned 0. No install, typecheck, lint, formatter, test, build, browser, or physics command was run for this review. Hosted verification and native proof remain pending.

SHA-256 of the reviewed source files:

- `games/counterball/src/simulation/nativeCollisionSubscription.ts`: `8d7cb802ca5996bcb07462c13c3fc46199d70ca960f5cfd8d44935489b0b4c9c`
- `games/counterball/src/simulation/nativeCollisionSubscription.test.ts`: `2c1cbd034e50e109551b74d15eec6fef0f6097db088c9c65a953f007706c3531`
