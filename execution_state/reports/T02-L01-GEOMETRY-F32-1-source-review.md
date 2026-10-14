# T02-L01-GEOMETRY-F32-1 independent source review

**SOURCE: PASS**  
**HOSTED/RUNTIME: NOT RUN**

I reviewed the implementation report, saved pre-dispatch extraction, accepted geometry clause in `CONTRACT_WORK.md`, and only the assigned runner/test diffs. Recomputed file SHA-256 values match the requested exact hashes:

- `games/counterball/src/simulation/loftCoarseRunner.ts`: `CF04607EE95C50F71EEA8D47156C8C2B63DBBD6253D8A8C55982C778CC33781B`
- `games/counterball/src/simulation/loftCoarseProbe.test.ts`: `50368C416CA0A613239436129DF65B13FFA8B51C2CD9956696AC7F63365797E2`

The runner change is limited to the existing dynamic-cylinder dimension predicate at lines 982–985. `readNativeBodies` iterates canonical `ENTITY_IDS` (button plus fourteen caps), derives expected dimensions from the existing configured radius/height, and now requires exact finite `matchesExactFloat32Projection` equality for x, y, and z on each body. There is no epsilon or adjacent-value allowance. The pre-existing positive/finite bounds validation, shape-type and trigger checks, transform/scale checks, material readback, collision filters, and later mass/inertia preflight remain unchanged. No shape construction or static-collider predicate changed.

Raw `nativeBounds` still supplies the failure diagnostic’s AABB extrema and observed dimensions (lines 966–1000). The `dimensions` object remains the value used to derive radius and height and is retained in `NativeBodyMetrics` and serialized `colliderDimensions` facts (lines 980–981 and 1057–1082). The comparison still occurs before mass processing and before the existing case impulse.

The test diff adds one focused test for the canonical button and cap dimensions, confirms their configured values, and checks exact finite projections on every axis. The adjacent-Float32, unprojected-decimal, non-finite, and projection-overflow negative helper tests are unchanged. This source review did not run the authored tests.

The accepted clause is explicit that the rule applies to all fifteen dynamic cylinders, excludes static colliders, preserves raw facts/calculations, adds no artifact-schema fields, and does not change geometry, configuration, hashes, or physics. The extracted packet retains the original MATRIX-1 dependencies plus the accepted geometry-readback prerequisite and keeps the inherited T01 parent gate. The exact-hosted Verify, real pinned-WASM Chromium run, all-15 native checks, complete 24-case matrix/artifact validation, and independent run review remain required; this source PASS accepts none of those runtime outcomes, MATRIX-1, T02, or playability.