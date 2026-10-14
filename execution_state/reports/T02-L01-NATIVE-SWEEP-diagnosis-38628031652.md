# T02-L01 native sweep diagnosis — run 38628031652

## Conclusion

**Confirmed conservative-radius overbound; exact runtime cause is not proven.** The matrix computes the rotational point radius from all eight corners of a native AABB. For the accepted Y-axis cylinders, those corners include the impossible `(±r, ±r)` corners of a square around a circular cross-section. That makes the sweep planner's input strictly larger than the cylinder's true farthest-point radius. The error can therefore push the required subdivision above the frozen cap of 48. The saved run does not expose the native inputs or the hidden `deriveDiagnosticSweepPlan` cause, so I cannot say this was the sole cause or that correcting it will make every body fit.

## Exact run and available evidence

The hosted run is 38628031652 on commit `290b2a5591a55b6593a62fe9875ba670e1d89d9e` (the current HEAD during this review), and the `verify` job failed. Its full log reports the full real-Havok matrix browser test failed before download with `Native sweep subdivision cannot satisfy the hashed resource guard` (`...run-38628031652-github.log`, lines 2030–2038). The saved Playwright `error-context.md` repeats that generic alert and says the export failed with no successful download. There is no matrix artifact or per-body budget report in the downloaded run artifacts. This is evidence of a real-browser preflight failure, not a measured value for `Nrequired`, any mass/inertia, or any collider radius.

## Source path and geometric check

At `loftCoarseRunner.ts:941–960`, `readNativeBodies` rejects non-cylinder and trigger shapes and rejects parented or non-unit-scaled transforms. It then reads native dimensions and requires each axis to match the canonical `(diameter, height, diameter)` using the accepted exact Float32 projection (`:975–1003`). It obtains native COM offset, mass and principal inertias, validates them, and calls `radiiFromBounds` at `:1057`. `worldFactory.ts:303–307` constructs every dynamic collider as a `PhysicsShapeCylinder` with endpoints `(0, -height/2, 0)` and `(0, height/2, 0)`, so the dynamic cylinder axis is Y; the static goal-frame bodies are separate and are not in this 15-body sweep plan.

`radiiFromBounds` at `loftCoarseRunner.ts:465–495` enumerates the AABB's eight min/max combinations and takes the greatest distance to COM. For centered AABB bounds with half-width `r` in X/Z and half-height `q` in Y, this uses an impossible radial corner. The planner receives that `farthestPointRadius` at `:1566–1580`. The exception is caught at `:1582–1588` and replaced by the generic message. The shared planner in `browserDirectProbe.ts:354–418` calculates `vBound = sqrt(2E/m)`, `omegaBound = sqrt(2E/(m Imin))`, `pointSpeedBound = vBound + omegaBound × farthestPointRadius`, and the ceil-based translation/rotation call counts. It rejects a required count over the guard; its wrapped error does not disclose which body or count failed.

For native bounds with midpoint `b = (min + max)/2`, half-height `q = (maxY−minY)/2`, radial half-width `r = max((maxX−minX)/2, (maxZ−minZ)/2)`, and finite COM offset `c`, set `d = c−b`. For a Y-aligned cylinder the exact greatest distance from COM to any point in the solid cylinder is:

`R = hypot(r + hypot(d.x, d.z), q + abs(d.y))`.

This is exact for arbitrary finite COM offset: the farthest point uses the circle edge opposite the horizontal COM projection and the farther cylinder end along Y. The current AABB-corner bound in the centered, equal-width case is `sqrt((r+|d.x|)^2 + (r+|d.z|)^2 + (q+|d.y|)^2)`. Its squared radial term exceeds the exact radial term by `r² + 2r(|d.x|+|d.z|−hypot(d.x,d.z))`, which is positive for every nonzero cylinder radius. At centered COM the comparison is `sqrt(2r²+q²)` versus `sqrt(r²+q²)`.

The direct-flick probe is a separate caller of `deriveDiagnosticSweepPlan` (`browserDirectProbe.ts:1345`); it supplies its own conservative triangle-inequality radius at `:841–847` and does not call `radiiFromBounds`. The confirmed AABB-corner issue is localized to the loft matrix's single `radiiFromBounds` call. `farthestOriginRadius` from the same helper also remains an AABB-corner sphere and is used by apron/obstacle checks, not by the subdivision calculation.

## Contract and bounded correction

The accepted contract requires actual native mass, principal inertia, COM offset and full collider extent in a conservative sweep calculation; it freezes energy 34, per-call point sweep 0.01125, rotation π/8 and at most 48 calls per nominal tick. It requires `resourceLimit` before proceeding if the derived count exceeds 48. See `CONTRACT_WORK.md:184` and `CONTRACTS.md:328–332`. The error must not be “fixed” by raising 48, increasing a sweep threshold, changing energy, loosening the collision bound or altering any workload/artifact cap.

The smallest justified source repair is to replace only the COM-centered `farthestPointRadius` calculation for already-validated dynamic Y cylinders with the formula above, using their validated native AABB midpoint and extents. Keep the type, trigger, parent/scale, exact dimensions, finite native-property and error-order guards. Initially retain the current AABB-corner `farthestOriginRadius`; it remains conservative and does not affect `Nrequired`, while it feeds separate apron and obstacle checks. If later evidence shows those bounds alone block safe cases, review that separately with the same geometry proof.

For auditable failure disclosure, preserve the typed `resourceLimit` outcome but surface its cause and a bounded 15-body preflight summary before impulse or any `executeStep`: guard constants, fixed tick duration, per-body ID, raw finite native mass/minimum inertia/COM/AABB, derived radius, linear/angular/point-speed bounds, translation and rotation call requirements, overall required count, and the failing condition. If any input is non-finite or unsupported, report the offending field and a safe finite/string representation rather than JSON `null`. Do not emit a partial or successful matrix artifact. This is warranted because the current catch discards the underlying reason from the UI and artifacts.

## Concrete checks for the repair packet

- Pure geometry tests: centered cylinder gives `hypot(r,q)`; translated AABB center and an arbitrary diagonal COM offset match the formula; an offset along Y uses `q+|dy|`.
- Fail-closed tests: reject unsupported shape type before the cylinder-only calculation; verify the existing factory/type/dimension preconditions reject a non-Y-axis or mismatched native cylinder; reject NaN/Infinity bounds or COM, inverted/zero extents, and arithmetic overflow as `resourceLimit`.
- Planner tests: preserve the 48-call fixture and its full-precision point/rotation assertions; preserve a deliberately greater-than-48 input that still fails. Add a failure-detail assertion for the limiting body/count and prove the impulse/first physics call and matrix download remain absent on preflight failure.
- Hosted real-Havok rerun is required to learn the actual 15-body required count and whether the exact bound fits. If any body still needs more than 48, stop and recompute the complete envelope through the accepted contract process. No runtime pass or matrix acceptance is claimed here.

This report is a static diagnosis only. No source changes or application checks were made.
