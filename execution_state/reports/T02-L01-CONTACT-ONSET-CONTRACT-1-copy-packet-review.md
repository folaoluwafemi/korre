# Contact-onset contract copy and packet review

## Verdict

**PASS for the prose and internal-interface contract packet only.** Both canonical contract copies contain the same six policy clauses as the independently reviewed proposal, and the packet graph preserves the parent matrix gate. This freezes a proposed L01 evidence policy and adapter boundary; it is not acceptance of implemented native subscriptions, contact budgets, a completed matrix, T02, or playable physics.

## Exact record and dependency boundary

Ran the full completion checker and exact extraction for `T02-L01-CONTACT-ONSET-CONTRACT-1`, `T02-L01-CONTACT-ONSET-CONFIG-1`, and `T02-L01-CONTACT-ONSET-ADAPTER-1`. All returned plan-consistency `PASS`; global graph result was 127 packets and 21 remaining parents, with `initialReady: []`. Each exact extraction currently reports `ready: false`, so the checks do not authorize dispatch by themselves. The config and adapter records each explicitly depend on the contract packet and inherit `required_parent_acceptance: ["T01"]`; they remain gated until the contract record is accepted.

The original coordinator-owned `T02-L01` direct dependencies remain in place, including its accepted prerequisites and `T02-L01-SUPPORT-DATUM-MATRIX-1`; it still cannot be accepted without its full matrix successor. The three new records do not supersede, remove, or accept that parent gate. The contract card itself depends on the accepted support-datum contract/config and canonical guard identity; it writes only the two canonical prose copies.

## Copy and interface checks

I compared all six numbered policy clauses in the proposal with `knowledge_base/execution/CONTRACTS.md` and `knowledge_base/execution/completion/CONTRACT_WORK.md`. Each copy has six clauses and matches the proposal text exactly. Both copies also state the same internal boundary: `configureNativeCollisionOnsets(startedFlag: unknown, orderedBodies: readonly { bodyId: LoftCoarseContactBodyId; body: Pick<PhysicsBody, "setEventMask" | "getEventMask"> }[]): LoftContactSubscription`.

The frozen return record is readonly and contains `eventType: "COLLISION_STARTED"`, the numeric `nativeMask`, and ordered `{ bodyId, requestedMask, observedMask }` records. It requires the 15 canonical dynamic entity IDs followed by `goal-frame-0` through `goal-frame-5` and `support-apron`; malformed, missing, duplicate, or out-of-order bodies fail closed. The flag must be the pinned runtime enum object's `.value`, a positive safe single unsigned-32-bit flag. The adapter must call public `setEventMask` on all 22 bodies before reading any of them back with public `getEventMask`, and returns the subscription only after every readback matches.

The installed pinned Babylon declaration confirms public `PhysicsBody.setEventMask(eventMask: number, instanceIndex?: number): void` and `getEventMask(instanceIndex?: number): number`. That supports the written type boundary; it is not evidence that the runtime flag is read correctly or that native event delivery follows the intended behavior.

## Producer and adapter packet scopes

The config producer owns exactly five disjoint paths: `packages/game-protocol/src/types.ts`, `packages/game-protocol/src/schemas.ts`, `packages/game-protocol/src/config.ts`, `packages/game-protocol/src/protocol.test.ts`, and `tests/fixtures/counterball-v1.json`. It adds config 5 / `counterball-config-5`, L01 guard schema 3 / configSchemaVersion 5 / algorithm v3, and a strict four-literal hashed `contactPolicy`; it preserves protocol 1, D01, null calibration, numeric guard values, the 24 tuples, and the omitted-configHash payload digest while updating all eight fixture hash leaves. Its checks distinguish the canonical producer from any matrix claim.

The adapter owns exactly two disjoint paths: `games/counterball/src/simulation/nativeCollisionSubscription.ts` and `.test.ts`. Its public-method unit tests cover the mask shape, canonical body ordering, set-all-then-read-all behavior, and fail-closed mismatch/error cases; those tests prove adapter logic only, not native callbacks. The config and adapter path sets do not overlap, and both packet records specify the existing hosted verification flow. They can be checked together on one reviewed integrated SHA after the contract is accepted, with the per-packet source reviews and evidence recorded separately.

## Acceptance limits and checks

The accepted proposal review is explicitly **PASS for the contact-exclusion invariant proposal; runtime and budget NOT VERIFIED; matrix NOT ACCEPTED**. Freezing this prose/interface permits producer and adapter implementation. Native acceptance still requires actual 22-body mask readbacks and real-browser positive, negative, sustained, and re-contact event evidence; full matrix acceptance still requires the unchanged 24-case validation/download with zero skips/retries and independent exact-run review. Keep every event delivered under the started-only subscription, including symmetric callbacks; preserve both contact ceilings and all motion, sweep, support, settlement, byte, time, and workload guards. Do not treat the prose card's PASS as any of those runtime results.

Checks run: global and three exact packet document extractions (`node scripts/check-completion-plan.mjs` and `--packet …`) returned `PASS` with no plan errors; exact clause text comparison and scope/dependency inspection were read-only. No application tests, builds, browser automation, physics, deployment, or Cloudflare command was run.
