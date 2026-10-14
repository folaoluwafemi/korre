# T02-L01-DIAGNOSTIC-APRON-F32-1 implementation report

Date: 2026-10-14  
Packet: `T02-L01-DIAGNOSTIC-APRON-F32-1`  
Dispatch: the saved pre-dispatch extraction recorded `ready:true` while the task was READY. This report relies on that retained extraction.

## Implementation

Changed only the temporary diagnostic `support-apron` Y-dimension predicate in `games/counterball/src/simulation/loftCoarseRunner.ts`: the existing `dimensions.y !== 0.2` check is now `!matchesExactFloat32Projection(0.2, dimensions.y)`. The helper accepts only finite values whose observed Y equals the exact Float32 projection; it rejects the unprojected decimal and adjacent Float32 values.

The exact `BOX` shape-type condition and exact x=662/z=670 comparisons remain unchanged. Existing `shapeDimensions` continues to reject non-finite or non-positive dimensions. The raw `dimensions` object remains the value retained in static facts and serialized metadata. The canonical surface checks, temporary-apron geometry construction, all other static/dynamic guards, configuration/hash, and physics behavior were not changed.

Added one focused assertion in `games/counterball/src/simulation/loftCoarseProbe.test.ts`. It checks the apron footprint constants stay exactly 662 and 670, Y accepts only `Math.fround(0.2)`, and rejects both unprojected `0.2` and the adjacent Float32 value. The test is local to the existing runner test suite and adds no public API. Existing helper tests for other projections and negative cases remain unchanged.

## Bounded diff and source hashes

Task diff: one comparison expression in the assigned runner file and one focused unit assertion in the assigned test file.

- `games/counterball/src/simulation/loftCoarseRunner.ts`: `43E1459AC6C912B1820E6774C15EC237DD2C3ED31659F6D9F9E05037C443F423`
- `games/counterball/src/simulation/loftCoarseProbe.test.ts`: `FF1D6C8B1B89345C8B3FDEF5A46FE00508FC5879B9D5395ACF787D371A7D9F92`

The packet-authorized local check was run:

```text
git diff --check -- games/counterball/src/simulation/loftCoarseRunner.ts games/counterball/src/simulation/loftCoarseProbe.test.ts
exit code: 0
```

No local application install, build, typecheck, lint, test, integration, browser, or physics command was run. The new test was not executed. Exact-SHA GitHub verification and full pinned-WASM 24-case matrix/artifact validation remain pending; this report claims no runtime, matrix, T02, deployed-physics, or playability acceptance.