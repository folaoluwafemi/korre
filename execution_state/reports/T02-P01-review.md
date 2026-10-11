# T02-P01 independent source review

Date: 2026-10-11

## Verdict

**SOURCE: PASS. RUNTIME: NOT RUN.** The implementation matches the frozen C00 presentation and picking signatures. The review found no contract, ID mapping, mutation, pick-identity, or scene-ownership defect in the assigned source. This is source review only; it does not accept T02 or prove browser gameplay, physics, deployed Havok, or a playable match.

## Findings

- The exact `T02-P01` record extracts with plan verdict `PASS` and `ready: true`. The frozen contract in `knowledge_base/execution/CONTRACTS.md:189-205` defines a `ReadonlyMap<EntityId, PieceAssembly>` registry; create with `Scene`, readonly `BodyState[]`, and optional readonly config; update from readonly `PlaybackTransform[]`; and pick to `EntityId | null`. The implementations in `games/counterball/src/scene/presentation.ts:11,72-76,92-95,144-148` match those signatures. `games/counterball/src/browser.ts:5-22` exports the three exact functions and registry type, with the associated piece types available to consumers.

- Canonical IDs come from the game-protocol `ENTITY_IDS`. `createCounterballPresentation` delegates piece construction to `createPieces`, then registers each assembly by its existing `piece.id`. The existing `assertCanonicalBodies` in `games/counterball/src/scene/pieces.ts:455-467` checks exactly 15 unique IDs and membership in the canonical set before allocating piece materials. The tests assert registry size 15, exact ID set, per-piece ID, and successful exact-body picking for every registered piece (`presentation.test.ts:77-114,116-167`).

- Update validation is completed before the first scene write. `validateSnapshots` rejects a non-array/wrong-size snapshot, unknown or duplicate IDs, non-finite position/quaternion components, and any missing canonical ID (`presentation.ts:22-68`). The updater then checks registry size and every required assembly/root/position/quaternion target, builds a complete target list, and only then copies all position and quaternion components (`:92-141`). The regression test tries missing, duplicate, extra, unknown, and non-finite transforms and verifies every root remains unchanged after each rejection (`presentation.test.ts:202-240`). The successful update test checks exact positions and quaternion components for all transforms and verifies the protocol snapshot is unchanged (`:169-200`).

- Picking uses the exact registered `bodyMesh` object and verifies the map key, assembly ID, and current pickability (`presentation.ts:144-161`). It does not use mesh names, indices, parent metadata, or mutate protocol state. Tests cover body hits for all 15 IDs; button and cap detail meshes; a ray passing through an actual button hole; the open-concrete pitch; and hit/miss cases (`presentation.test.ts:116-167`).

- Scene ownership is preserved. Creation changes pickability only on the assemblies returned by `createPieces`: their body meshes become pickable and their own detail meshes remain non-pickable. A test snapshots pre-existing scene mesh pickability, adds an unrelated pickable mesh, and verifies those values remain unchanged, while the concrete pitch stays non-pickable (`presentation.test.ts:78-113`). The disposal test leaves cleanup with the caller-owned scene/engine and confirms disposal removes meshes and transform nodes (`:242-257`). The button test also checks the four-hole assembly and confirms the ray through the first real hole does not hit a mesh.

## Checks and limits

- `node scripts/check-completion-plan.mjs --packet T02-P01`: **PASS**, plan consistency only.
- Source, signatures, exports, and tests were inspected read-only. No local application test, typecheck, lint, formatter, build, browser, physics, or server command was run.
- The assigned tests substantiate the API's presentation-level validation and picking claims, but they use Babylon `NullEngine`. They are not evidence of WebGL rendering, flick behavior, actual physics, deployed Havok, or an online/playable match. The exact-hosted checks from the packet remain necessary for implementation verification.
