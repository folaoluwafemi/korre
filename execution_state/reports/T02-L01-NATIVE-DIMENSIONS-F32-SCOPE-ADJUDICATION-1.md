# T02-L01 native-dimensions Float32 scope adjudication

**Verdict: PASS for a shared all-dynamic-cylinder comparison policy, subject to an explicit geometry contract clause.**  
**Runtime status: NOT RUN for caps; no new physics or browser command was run.**

## Adjudication

The shared `PhysicsShapeCylinder` construction path is sufficient to justify applying one exact Float32-projection comparison rule to all 15 canonical dynamic cylinders: the button and 14 caps. It is not evidence that all cap readbacks have already passed. The observed button mismatch establishes the projection behavior for one cylinder only; the caps still need to be checked by the real hosted matrix, which must fail closed if any individual native readback differs.

The rule should require each finite native dimension to equal the exact Float32 projection of its configured expected dimension (`observed === Math.fround(expected)`), with no epsilon. It should preserve the raw native bounds and dimensions for later calculations and output. It must not substitute projected values, change geometry or configuration, or include static colliders.

## Evidence and arithmetic

`worldFactory.ts:279–309` selects the button or cap radius and height, then constructs every dynamic body with the same `PhysicsShapeCylinder` call. The only per-body geometry difference at this call site is the configured radius and height. The canonical values in `packages/game-protocol/src/config.ts:16–19` are cap radius `0.32`, cap height `0.12`, button radius `0.13`, and button thickness `0.045`.

The captured button values in `T02-L01-NATIVE-DIMENSIONS-F32-PROPOSAL-1.md` are direct evidence: native dimensions `(0.25999999046325684, 0.04500000178813934, 0.25999999046325684)` match `Math.fround(0.26)`, `Math.fround(0.045)`, and `Math.fround(0.26)` exactly. No cap dimensions were captured in that run.

For the cap constructor inputs, the corresponding projection arithmetic is also exact:

- `Math.fround(2 * 0.32) = Math.fround(0.64) = 0.6399999856948853`, and `2 * Math.fround(0.32)` is the same value.
- `Math.fround(0.12) = 0.11999999731779099`, and `2 * Math.fround(0.06)` is the same value for the constructor's half-height endpoints.

This arithmetic plus the shared constructor supports applying the same representation policy across the dynamic cylinders. It does not replace runtime observation: the actual 14 cap AABBs remain unmeasured until the matrix reaches them.

`loftCoarseProbe.ts:564–571` already provides `matchesExactFloat32Projection`, which rejects non-finite values, projection overflow, raw unprojected values, and adjacent Float32 values. Its tests at `loftCoarseProbe.test.ts:431–465` cover those cases. `loftCoarseRunner.ts:975–1000` currently performs strict equality against decimal expected dimensions, then uses the raw `dimensions` for its later radius, height, and serialized facts. The bounded implementation should change only this comparison to the existing helper for each expected/observed axis, while leaving raw values in use downstream.

## Contract and packet boundary

The proposal report correctly notes that the accepted Float32 clauses cover support and materials, not geometry. Before implementation, add and independently review a geometry-specific clause in `CONTRACT_WORK.md`. It should state:

1. The rule applies to all canonical dynamic cylinders only: the button and 14 caps.
2. Expected X/Z dimensions are twice the configured radius; expected Y is the configured height.
3. Every expected, projected, and observed value must be finite, and the observed value must equal `Math.fround(expected)` exactly. No epsilon is allowed.
4. The raw native AABB and dimensions remain authoritative for downstream radius/height, sweep, energy, and artifact facts. Projection is only a comparison representation.
5. Static colliders, geometry/config/hash, materials, filters, solver behavior, and all other guard conditions are unchanged.
6. Any body mismatch fails the matrix before that case can be reported as successful.

The implementation packet may then be bounded to `loftCoarseRunner.ts`, with a focused test addition only if needed to assert the canonical cap and button expected-dimension projections. Preserve the original T02-L01 dependencies and require exact-head hosted verification plus the real full matrix artifact. The runtime gate must inspect all 15 dynamic bodies and the existing matrix validator must still verify every case and artifact fact. A passing preflight alone does not accept the matrix or T02.

## Limits

The pinned package versions are recorded in `games/counterball/package.json` (`@babylonjs/core` 9.30.0 and `@babylonjs/havok` 1.3.14), but package implementation sources are not present in the local workspace, and this review did not install or fetch them. The adjudication rests on the checked-in constructor call, canonical config, exact button observation, and projection arithmetic. It does not claim that Babylon or Havok guarantees a particular native representation for every cap, or that any cap has passed runtime validation.

No source, test, contract, configuration, catalogue, or status file was changed. No application checks, tests, build, browser run, or physics trial were run.
