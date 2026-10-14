# T02-L01-GOALFRAME-F32-contract-proposal-1 review

**Verdict: CHANGES_REQUIRED — one wording clarification only.** The exact Float32 rule is narrowly scoped and fail-closed. The accepted goal-frame readback supports the frame-0 rule; the crossbar extension is clearly identified as inference and remains subject to the next full hosted matrix. No runtime checks were run for this proposal review.

## Evidence reviewed

The accepted readback run 38624231947 reports only `goal-frame-0`: configured spans `(0.12, 0.8, 0.12)`, with same-read native AABB min/max and spans recorded in the independent run report. The projection arithmetic matches exactly: `Math.fround(0.12) = 0.11999999731779099` and `Math.fround(0.8) = 0.800000011920929`. The proposed crossbar projection `Math.fround(2.4) = 2.4000000953674316` is arithmetic, not observed runtime evidence; the proposal labels it as inference and requires every unobserved shape/axis to pass the real 24-case run or fail closed.

`worldFactory.ts` lines 230–265 constructs the two sets of uprights with local Y endpoints `±goalHeight/2`, and crossbars with local X endpoints `±goalWidth/2`; all six use `PhysicsShapeCylinder` and `goalFrameRadius`. In the locked workspace, Babylon core is 9.30.0 and `@babylonjs/havok` is 1.3.14. The installed core 9.30.0 `havokPlugin.js` lines 1764–1773 labels `getBoundingBox` as local AABB, calls `HP_Shape_GetBoundingBox` with zero translation and identity quaternion, then returns those min/max vectors with identity matrix. The local `shapeBoundsAndDimensions` helper reads `shape.getBoundingBox()` once, derives dimensions from that same minimum/maximum, and the current static mismatch detail serializes those same bounds and observed dimensions.

The exact original `T02-L01-MATRIX-1` extraction retains its 12 existing `depends_on` entries and `required_parent_acceptance: ["T01"]`. The proposal explicitly requires the successor to retain those, plus accepted geometry and goal-frame readbacks. Verify those exact dependencies again on the materialized successor before dispatch; this proposal itself does not alter the packet record.

The rule preserves shape type, geometry, strict projected equality, the existing expected upright/crossbar axes, finite-value rejection, and raw observed values; it neither rounds observations nor allows epsilon or neighboring Float32 values. It retains support-apron, dynamic-body, material, mass/filter, config/hash, fixture/schema/protocol, solver, workload and artifact gates. It does not claim unobserved crossbar measurements, a matrix result, calibration, production physics, deployed Havok or playability.

Source hashes inspected: `worldFactory.ts` `3065B0511C916B033B4BB0865DC057A30EF999E77E78FE00C65F62D639C405BE`; `loftCoarseProbe.ts` `D9C903E1640F94F7894F8543E5697950BDA124AD8CB58A1BAEBE0FA94FB68913`; `loftCoarseRunner.ts` `5EF42B9F2441B8DD2CAE967DEC028BC2862D02D61C25625D8983AE1202040BB6`; pinned core `havokPlugin.js` `82F15B673B5221BD0E3AC7ED8EF7094D4E35FDAA12490D07A6F69EED653F1E31`.

## Required wording correction

Proposal line 25 says “all native raw dimensions/bounds in diagnostic failure and metadata.” The current case metadata records raw static `colliderDimensions` (runner lines 1186–1191); it does not contain AABB minimum/maximum fields. The detailed failure contains both raw dimensions and same-read AABB bounds. Because the proposal also forbids a schema change, that phrase should distinguish the existing metadata from the failure detail.

Smallest correction: replace the phrase with “keep the raw same-read AABB minimum/maximum and observed dimensions in the diagnostic failure; keep the existing unprojected `staticBodies[].colliderDimensions` values in case metadata, without adding AABB fields or changing the artifact schema.” No source, config or schema change is needed for this clarification.

**Runtime: NOT RUN.** This review accepts neither implementation nor matrix execution.
