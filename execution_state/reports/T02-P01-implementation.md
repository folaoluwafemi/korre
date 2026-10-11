# T02-P01 implementation report

## Result

Implemented the frozen scene presentation API in `games/counterball/src/scene/presentation.ts` and exported it from `games/counterball/src/browser.ts`. The registry uses the stable IDs and assemblies returned by the existing `createPieces` implementation. Presentation creation sets only its own body meshes pickable and its own detail meshes non-pickable; unrelated scene meshes retain their owner's settings, including the pitch's existing non-pickable state.

Pose updates validate the complete 15-ID snapshot, all finite position and quaternion components, and every registry target before changing any root. They copy values into registered Babylon roots only. Picking resolves exact registered body-mesh identity to the canonical ID; detail meshes, pitch, actual button-hole rays, misses, and non-body hits do not resolve. The scene remains caller-owned and caller-disposed.

Added `games/counterball/src/scene/presentation.test.ts` for all stable IDs and body meshes, ownership-safe pickability, exact pose copying and protocol-state immutability, atomic rejection of missing/duplicate/extra/unknown/non-finite snapshots, detail/pitch/miss picking, a real NullEngine ray through a button hole, and scene-owned disposal.

`games/counterball/src/scene/pieces.ts` was an authorized path but did not need modification: its existing `createPieces` already creates the canonical 15 pieces, assigns stable IDs and roots, makes only piece bodies pickable among its own meshes, and builds the button with four real holes.

## Verification

The plan extraction `node scripts/check-completion-plan.mjs --packet T02-P01` returned PASS for plan consistency before implementation; that result is not an implementation or runtime check. No local application tests, typecheck, build, formatter, browser, install, or server command was run, in line with the laptop restriction.

Required exact-head GitHub checks are pending:

```text
pnpm --filter @korre/counterball test && pnpm --filter @korre/counterball typecheck && pnpm verify
```

This card provides a presentation update/picking API only. It does not prove browser flick behavior, physics, deployed Havok, or a playable match.
