# T02-L01 native-dimensions Float32 contract proposal

Date: 2026-10-14  
Author: coordinator  
Status: revised proposal; not accepted or implemented. Revision clarifies the existing diagnostic and artifact fields and explicitly excludes schema changes, following independent review `T02-L01-NATIVE-DIMENSIONS-F32-contract-proposal-1-review.md`.

## Evidence and scope

Hosted run `38599929537` at `929067cc4e277b0ae0ec2d747ba0dd42841c414e` captured the button's configured dimensions `(0.26, 0.045, 0.26)` and native dimensions `(0.25999999046325684, 0.04500000178813934, 0.25999999046325684)`. Each native value is exactly the finite `Math.fround` projection of its configured expected dimension. The failure occurred before any matrix impulse or physics step.

The pinned world factory selects button or cap radius/height, then creates every dynamic body through the same `PhysicsShapeCylinder` constructor. There are fifteen such bodies: one button and fourteen caps. This supports one representation rule at that shared native boundary. It does **not** mean this run captured any cap's native AABB; cap values must still be checked in the full hosted matrix, which fails closed on the first mismatch.

## Proposed amendment text for `CONTRACT_WORK.md`

**Proposed geometry-dimension representation amendment for `T02-L01-GEOMETRY-F32-1`:** At the existing pre-impulse preflight for all fifteen canonical dynamic cylinders (button and fourteen caps), compare each finite native local-AABB dimension to the exact `Math.fround` projection of its canonical expected dimension: `x` and `z` to `2 * configuredRadius`, and `y` to configured height. Require exact equality to that projection; use no epsilon or adjacent-value allowance. Keep native shape type, positive/finite bounds, transforms, filters, and all other preflight checks unchanged. Preserve the exact raw native AABB extrema in the existing preflight failure diagnostics; preserve the exact raw native dimensions in existing serialized facts; and continue to use those unmodified dimensions for radius, height, sweep, energy, and other calculations. Do not add bounds fields to the artifact schema, substitute projected values, rewrite shape geometry or configuration, change hashes, or alter physics behavior. This rule covers dynamic cylinders only; static colliders remain subject to their existing checks. It defines representation at the shared pinned native cylinder boundary, not a tolerance and not evidence that the loft matrix, calibration, or playable runner has passed. Every cap must pass the same guard in the full real-browser matrix before a matrix successor can be accepted.

The canonical input pairs are button radius/height `0.13/0.045` and cap radius/height `0.32/0.12`. The expected dimension projections are `Math.fround(0.26)`, `Math.fround(0.045)`, `Math.fround(0.64)`, and `Math.fround(0.12)`. These are arithmetic projections, not native cap readbacks.

## Bounded implementation proposal

After independent approval of the clause and exact packet, change only the existing dynamic-dimension predicate to call the already-tested `matchesExactFloat32Projection(expected, observed)` for x, y, and z on every dynamic body. Keep raw `dimensions` for every current and later calculation. Add a focused unit assertion for the canonical button and cap expected dimension projections and retain the current helper tests that reject configured decimals, adjacent Float32 values, non-finite inputs, and projection overflow.

Implementation write paths:

- `games/counterball/src/simulation/loftCoarseRunner.ts`
- `games/counterball/src/simulation/loftCoarseProbe.test.ts`

No application/runtime command may run locally. A fresh exact-SHA GitHub run must pass Verify, integration, production exclusion/build and preview checks, then the real pinned-WASM Chromium suite must pass the entire 24-case matrix with every dynamic body checked, complete artifact validation, and zero skips/retries. A preflight-only pass or partial matrix is not acceptance. Independent exact-source and exact-run/artifact review remain mandatory.

## Scope limits

This amendment changes only comparison semantics at native Float32 geometry readback. It does not select physical tuning, change the canonical dimensions or native values, relax the matrix, prove cap readbacks before the matrix runs, accept MATRIX-1, accept T02, or establish playability.
