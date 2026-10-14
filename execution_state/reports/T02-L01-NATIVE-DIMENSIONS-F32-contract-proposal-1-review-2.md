# T02-L01 native-dimensions F32 contract proposal: re-review

**Verdict: PASS — contract wording is ready for coordinator acceptance**  
**Reviewed proposal SHA-256:** `0428E62E29171A205D9E595A73E5C1649BFA8F791F4144F8215691B4EBB356F9`  
**Implementation/runtime:** NOT REVIEWED / NOT RUN

The revised clause resolves the prior ambiguity. At proposal line 15 it keeps raw AABB extrema in the existing preflight failure diagnostics, keeps raw dimensions in existing serialized facts, and explicitly prohibits new artifact bounds fields. This matches the current L01 record shape: dynamic facts serialize `colliderDimensions`, while error diagnostics carry native extrema. It therefore does not imply a metadata/schema change.

The exact comparison boundary is clear: all fifteen dynamic cylinders, x/z against `2 * configuredRadius` and y against configured height, exact `Math.fround` equality, no epsilon or adjacent-value allowance. Current config pairs are button `0.13/0.045` and cap `0.32/0.12`; their projected dimensions agree with the corresponding projected cylinder radius/endpoints. This is arithmetic only. The proposal explicitly says no cap AABB was captured and requires the full hosted matrix to check every cap. Static colliders retain their existing checks and are outside the rule.

The clause preserves the existing native shape, finite/positive, transform, filter and other preflight checks. It requires unmodified native dimensions for downstream radius, height, sweep, energy and other calculations, and prohibits physical/config/hash changes. The two implementation paths are bounded to the runner comparison and focused unit assertions. The existing helper already rejects non-finite/projection-overflow inputs and adjacent Float32 values; fresh exact-SHA hosted verification and the real pinned-WASM 24-case matrix remain required, with no preflight-only acceptance.

This is a PASS for proposal wording and contract readiness only. It does not accept the amendment, implementation, any cap readback, MATRIX-1, T02, calibration, or playability. No contract, catalogue, status, or source file was changed, and no application/runtime command was run.