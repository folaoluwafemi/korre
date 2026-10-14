# T02-L01 native-dimensions F32 proposal review

**Verdict: CHANGES_REQUIRED**  
**Proposal SHA-256:** `a5537ea7ed3010c7783b38ac898128d6b3a1df03291136a09b70e58442188e9c`  
**Implementation/runtime:** NOT REVIEWED / NOT RUN

## Evidence and contract

The cited evidence is tied to run `38599929537`, commit `929067cc4e277b0ae0ec2d747ba0dd42841c414e`. The saved run metadata and independent run review agree. `github-full.log` lines 2055 and 2070 show the strict button preflight failure with configured dimensions `(0.26, 0.045, 0.26)`, native min/max, and observed `(0.25999999046325684, 0.04500000178813934, 0.25999999046325684)`. Those observed dimensions equal exact `Math.fround` projections. The evidence shows no completed matrix case or success artifact; it directly establishes the button readback only.

Exact finite `Math.fround` equality, with no epsilon, is compatible with the representation principles in the accepted support and material amendments. It is not yet an accepted geometry rule: `CONTRACT_WORK.md` §§162–166 limit those amendments to support thickness and materials. The proposal correctly requires an explicit geometry amendment before code changes and should retain that gate. Raw native dimensions must remain the values used in metrics, serialized facts, and later calculations; the current runner does so.

## Required scope correction

The button-only conclusion is too narrow for this repair. `worldFactory.ts` lines 279–309 selects only configured radius and height, then constructs every dynamic entity through the same `PhysicsShapeCylinder` API. The canonical cap values are also non-exact Float32 inputs (`radius 0.32`, `height 0.12`). Direct arithmetic confirms their expected dimensions project consistently with those native cylinder inputs: `Math.fround(0.64) === 2 * Math.fround(0.32)` and `Math.fround(0.12) === 2 * Math.fround(0.06)`. The button is checked first, so its failure does not show that caps avoid the same conversion boundary. Cap AABBs were not captured by this run, so their runtime values remain unproved, but the shared constructor and configured values justify one representation policy for all 15 dynamic cylinders, subject to the full hosted run.

Revise the proposed geometry clause and repair packet to apply exact finite projection matching to the three expected dimensions for every canonical dynamic cylinder (all 15 bodies), while leaving static colliders outside this rule. Keep exact rejection of adjacent Float32 values and all non-finite/projection-overflow cases. Do not substitute projected values: retain raw dimensions for serialization, radius/height, sweep, and energy calculations. The current helper `matchesExactFloat32Projection` already enforces finite configured/observed/projected values and exact equality, and its tests reject unprojected and adjacent values. A focused assertion can include both canonical radius/height pairs; hosted Chromium must still prove every body readback and complete matrix validation.

## Bounded execution and acceptance

The proposed one-file runner scope remains bounded if it changes only the comparison in the existing dynamic-dimension preflight and does not alter geometry, configuration, shape construction, schema, or downstream raw values. Require the geometry-specific contract amendment before dispatch. Preserve the original MATRIX-1 dependencies exactly: `C00-B`, `C01`, `T02-B0`, `T02-C0`, `T02-C2`, `C00`, `T02-L01-GUARD-CONTRACT-1`, `T02-L01-GUARD-SCHEMA-1`, `T02-L01-PACKET-SPLIT-1`, `T02-L01-TRANSPORT-1`, `T02-L01-SUPPORT-PREFLIGHT-1`, and `T02-L01-SUPPORT-F32-1`, with its inherited T01 parent gate. The hosted acceptance must remain a fresh exact-SHA Verify and real pinned-WASM Chromium run that validates the complete 24-case matrix artifact; a dimension preflight or partial run accepts neither MATRIX-1 nor T02.

This review is of the source-free proposal only. No source or contract was changed, and no application or runtime command was run.