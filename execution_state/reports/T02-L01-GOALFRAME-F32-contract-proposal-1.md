# Exact native goal-frame representation proposal

Author: coordinator. Proposal only; not accepted until independent review.

## Measured basis

Accepted readback T02-L01-GOALFRAME-READBACK-1, exact hosted run 38624231947 on d41c04a068543df8e1cc1b0e92dc0330e09a6e9c, and its independent run/artifact review establish these native local values for goal-frame-0:

| Axis | Configured span | Native minimum | Native maximum | Observed span | Exact Float32 span |
|---|---|---|---|---|---|
| X | 0.12 | -0.05999999865889549 | 0.05999999865889549 | 0.11999999731779099 | 0.11999999731779099 |
| Y | 0.8 | -0.4000000059604645 | 0.4000000059604645 | 0.800000011920929 | 0.800000011920929 |
| Z | 0.12 | -0.05999999865889549 | 0.05999999865889549 | 0.11999999731779099 | 0.11999999731779099 |

The observed spans equal Math.fround(configured span) exactly. No tolerance or numerical search is needed. Independent review verified the complete same-read bounds and the stop before any impulse/executeStep; the matrix remains unaccepted.

worldFactory.ts constructs all six goal frames as centered PhysicsShapeCylinder primitives: uprights have endpoints +/-goalHeight/2 on Y; crossbars have endpoints +/-goalWidth/2 on X; radius is goalFrameRadius. The installed pinned Babylon 9.30.0 Havok plugin getBoundingBox implementation returns native LOCAL AABB bounds from HP_Shape_GetBoundingBox using identity transform. The six frames use the same primitive and readback path.

**Inference, not measured crossbar evidence:** the corresponding centered-cylinder representation for other frames, including crossbar X span 2.4, should be the exact Float32 projection of each canonical span. That projection for 2.4 is 2.4000000953674316. Every remaining frame/axis must pass its actual native read in the next full matrix run. A discrepancy fails closed with the existing detailed readback; this proposal does not certify unobserved values.

## Narrow contract amendment

Only in the temporary L01 diagnostic runner's goal-frame native-dimension preflight, retain the CYLINDER type check and compare each finite positive observed X/Y/Z span by exact equality to Math.fround(the existing configured expected span). Upright expected spans remain (2*goalFrameRadius, goalHeight, 2*goalFrameRadius). Crossbar expected spans remain (goalWidth, 2*goalFrameRadius, 2*goalFrameRadius). Compute projections from configuration; never round observed values. Reject original unprojected doubles, adjacent Float32 values, wrong types and nonfinite spans.

Preserve raw native staticBodies[].colliderDimensions in existing metadata and same-read native local AABB minimum/maximum bounds in existing failure details. Preserve configured/constructed frame geometry, support-apron checks, dynamic guards, material/mass/filter checks, hashes, fixture/schema/protocol, simulation/solver behavior, impulses, workload limits and artifact validation. No public gameplay API or calibrated defaults change. physicsCalibration remains null.

## Exact implementation and proof

A two-file packet owns only loftCoarseRunner.ts and loftCoarseProbe.test.ts. It replaces only the goal-frame axis comparisons using the existing matchesExactFloat32Projection helper and adds focused assertions for upright/crossbar expected spans and adjacent/unprojected rejection. Keep complete failure readback. Independent source review precedes an exact-SHA GitHub run of pnpm verify, integration, production preview and the unchanged workflow-produced diagnostic browser suite.

Acceptance requires the entire real pinned-Havok 24-case matrix, its full download/schema/order/count/hash/workload/byte validation, zero skips/retries/flakes, and independent exact-run/artifact review. Full matrix successor retains all original MATRIX-1 dependencies, accepted geometry readback, accepted goal-frame readback and required_parent_acceptance:["T01"]. Superseding failed attempts orders ownership only. If another preflight/runtime gate fails, preserve exact evidence and use bounded diagnosis; never expand this clause or relax tests automatically.

This contract accepts only exact diagnostic representation matching. It accepts no matrix result, physical loft, calibration, production runner, T02, deployed Cloudflare Havok or playable match.
