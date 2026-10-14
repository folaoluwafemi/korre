# T02-L01-GEOMETRY-F32-1 implementation report

Date: 2026-10-14  
Packet: `T02-L01-GEOMETRY-F32-1`  
Dispatch gate: the saved pre-dispatch extraction at `execution_state/reports/T02-L01-GEOMETRY-F32-1-pre-dispatch-extraction.txt` recorded `ready:true` while the card was READY. The card is now RUNNING; no new readiness extraction was used to authorize this work.

## Changes

Only the two assigned source paths changed.

- `games/counterball/src/simulation/loftCoarseRunner.ts`: at the existing pre-impulse dimension guard, all three raw dimensions (`x`, `y`, and `z`) are checked with the existing `matchesExactFloat32Projection(expected, observed)` helper. The code applies this to the canonical button and fourteen caps. It adds no epsilon, neighboring-value allowance, static-shape expansion, geometry construction change, or other guard change. The `dimensions` object remains raw; radius and height calculations continue to use it, and the existing metadata continues to serialize those raw values. The existing error report still captures raw AABB extrema and observed dimensions.
- `games/counterball/src/simulation/loftCoarseProbe.test.ts`: added a focused assertion that canonical button dimensions are `(0.26, 0.045, 0.26)` and cap dimensions are `(0.64, 0.12, 0.64)`, then checks the exact finite projection helper accepts the exact `Math.fround` result for each axis. The existing tests for rejecting unprojected values, adjacent Float32 values, non-finite values, and projection overflow remain unchanged.

The exact runner comparison change is:

```diff
- dimensions.x !== expectedDimensions.x ||
- dimensions.z !== expectedDimensions.z ||
- height !== expectedDimensions.y
+ !matchesExactFloat32Projection(expectedDimensions.x, dimensions.x) ||
+ !matchesExactFloat32Projection(expectedDimensions.y, dimensions.y) ||
+ !matchesExactFloat32Projection(expectedDimensions.z, dimensions.z)
```

This follows the accepted geometry amendment in `knowledge_base/execution/completion/CONTRACT_WORK.md`: dynamic cylinders only, exact Float32 projection equality, raw readbacks preserved, no configuration/hash/physics change, and static checks unchanged.

## Local checks and source hashes

Ran only the packet-authorized scoped whitespace check:

```text
git diff --check -- games/counterball/src/simulation/loftCoarseRunner.ts games/counterball/src/simulation/loftCoarseProbe.test.ts
exit code: 0
```

SHA-256 of the exact edited files:

| File | SHA-256 |
| --- | --- |
| `games/counterball/src/simulation/loftCoarseRunner.ts` | `CF04607EE95C50F71EEA8D47156C8C2B63DBBD6253D8A8C55982C778CC33781B` |
| `games/counterball/src/simulation/loftCoarseProbe.test.ts` | `50368C416CA0A613239436129DF65B13FFA8B51C2CD9956696AC7F63365797E2` |

No application install, build, typecheck, lint, unit test, integration test, browser automation, or physics command was run locally. The authored unit assertion has not been executed. The exact-hosted-SHA gates, all-15-body readback and real 24-case pinned-Havok matrix, artifact validation, and independent source/run reviews remain pending. This report does not claim a completed matrix, runtime pass, T02 acceptance, deployed Havok, or playability.
