# T02-L01-EXECUTOR-1 implementation report

**Status: STOPPED before source implementation.** I did not create or modify the assigned runner file. The accepted matrix artifact contract cannot represent every real physics contact callback required by this executor packet.

## Blocking contract mismatch

The executor requires recording every raw contact callback, without deduplication or truncation. The pinned Babylon 9.30.0 Havok plugin dispatches each collision event to the observable registered for either participating body. In the checked-in pinned source, `_notifyCollisions` builds an event from both body handles and calls `observableA.notifyObservers(...)` / `observableB.notifyObservers(...)` (`node_modules/.pnpm/@babylonjs+core@9.30.0/node_modules/@babylonjs/core/Physics/v2/Plugins/havokPlugin.js:2529-2576`). A dynamic cap contacting the support slab or a goal collider therefore produces a dynamic-to-static pair for the dynamic body's observer.

The accepted serializer's contact type only admits two dynamic `LoftCoarseEntityId`s (`games/counterball/src/simulation/loftCoarseProbe.ts:175-179`). Its canonical ID set lists only the 15 dynamic entities (`:259-276`), and `validateContactRow` applies `assertCanonicalEntityId` to both members before accepting a row (`:1116-1145`). The seven static body IDs required in the same artifact are instead `goal-frame-0` through `goal-frame-5` and `support-apron` (`:269-277`). Actual event names from the factory, such as `counterball-surface` and `counterball-goal-post-*`, are neither valid pair IDs nor representable in the contact tuple.

I cannot satisfy both requirements by dropping static contacts, rewriting their IDs as dynamic IDs, or filtering callbacks. Any of those would make the artifact claim incomplete or false. I therefore stopped before creating a world or applying an impulse.

## Smallest coordinator follow-up

Materialize and independently review a bounded amendment to the accepted artifact contract/serializer before reassigning the runner. It must either:

1. Extend the contact-pair schema and validator to represent all seven static IDs, define the canonical order for mixed dynamic/static pairs, and add tests for both pair directions and exact raw-callback preservation; or
2. Explicitly narrow the accepted contact requirement to a defined subset of callback classes and amend the L01 acceptance language, so the executor can state exactly which events it records and which it excludes.

The first option preserves the current “every callback” requirement. Because the serializer contract and its tests are already accepted, this change needs its own coordinator-authorized packet and independent review; it is outside this executor's sole source path.

## Checks and limits

- `node scripts/check-completion-plan.mjs --packet T02-L01-EXECUTOR-1` — plan-consistency verdict **PASS**; the extracted record reported `ready: false`. `execution_state/tasks.json` shows parent T01 as **ACCEPTED**, while T02 remains **RUNNING**. No task/status files were changed.
- Inspected the accepted L01 contact-row type and validator, `worldFactory.ts` static-body construction, the accepted L01 contract, pinned Babylon package source at 9.30.0, and the accepted T02-GR01 API audit.
- No runner source was written; no physics world was constructed; no impulse was applied.
- `git diff --check -- games/counterball/src/simulation/loftCoarseRunner.ts` — **NOT RUN** because the runner file was not created and no source change was made.
- Typecheck, lint, unit tests, build, Chromium, Havok physics, artifact production, and deployment — **NOT RUN**.

No L01 case, real-Havok matrix, calibration, playable physics, or deployed Havok result is claimed. Resume after the contact schema/acceptance mismatch is resolved and accepted.
