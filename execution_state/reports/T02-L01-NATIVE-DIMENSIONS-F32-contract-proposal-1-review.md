# T02-L01 native-dimensions F32 contract proposal review

**Verdict: CHANGES_REQUIRED**  
**Reviewed proposal SHA-256:** `B75AD44DD9F102DF1698CD6726E0228DCB9D897C03CAD00FA5C6B794542765DD`  
**Source/runtime:** NOT CHANGED / NOT RUN

The proposed all-15-cylinder rule is mathematically consistent with an exact Float32 representation policy. The cited run `38599929537` at `929067cc4e277b0ae0ec2d747ba0dd42841c414e` reports the button’s native dimensions as the exact projections of `(0.26, 0.045, 0.26)`. The cap AABB was not observed in that run, and the proposal correctly says that full hosted matrix execution must check every cap before acceptance.

The proposed arithmetic also matches the shared constructor inputs for both canonical geometry pairs. For the button, `Math.fround(0.26)` equals `2 * Math.fround(0.13)` and `Math.fround(0.045)` equals `2 * Math.fround(0.045 / 2)`. For caps, `Math.fround(0.64)` equals `2 * Math.fround(0.32)` and `Math.fround(0.12)` equals `2 * Math.fround(0.12 / 2)`. `worldFactory.ts` selects those two radius/height pairs and constructs every dynamic body with the same `PhysicsShapeCylinder` API. The all-dynamic-cylinder boundary is supported; static colliders remain excluded. These cap equalities are arithmetic projections, not observations of native cap AABBs.

Using exact `Math.fround` equality without epsilon is compatible with the accepted support/material representation principles, but geometry needs its own accepted clause. The proposed clause preserves strict adjacent-value rejection, existing finite/positive dimension checks, transform/filter/type guards, and raw dimensions for calculation. The existing helper rejects non-finite values and projection overflow; its tests reject the configured decimal and adjacent Float32 values. The proposed two-file runner/unit-test scope is bounded. A fresh hosted Verify and the real pinned-WASM 24-case route remain required.

## Required wording correction

The sentence “Preserve the original native AABB extrema and dimensions in diagnostics and serialized facts” is ambiguous and could require new serialized AABB-minimum/maximum fields. The current L01 metadata contract serializes each dynamic body’s raw `colliderDimensions`; the current runner keeps native AABB minimum/maximum in failure diagnostics, not in successful case metadata. Adding extrema to serialized facts would change the metadata/schema contract, beyond this proposal’s stated comparison-only scope.

Before accepting the amendment, clarify it to require raw native AABB minimum/maximum in the existing failure diagnostic and unmodified native dimensions in the existing serialized `colliderDimensions` field. Explicitly state that it adds no extrema fields, metadata keys, schema version, or artifact-validator change. If serialized extrema are actually required, propose and review that as a separate schema amendment.

The proposal otherwise keeps the dimension comparison limited to the fifteen dynamic cylinders, retains static-collider checks, and correctly disclaims cap runtime proof, matrix acceptance, T02 acceptance, and playability. No source, contract, or catalogue was edited, and no application or runtime command was run.