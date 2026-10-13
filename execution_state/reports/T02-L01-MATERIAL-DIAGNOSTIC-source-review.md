# T02-L01-MATERIAL-DIAGNOSTIC-1 source review

**Verdict: PASS for source scope and semantics.** Hosted/runtime verification is not done; this review does not accept the card or prove any matrix case.

The exact packet restricts the worker to `games/counterball/src/simulation/loftCoarseRunner.ts` and authorizes only exact mismatch disclosure on the existing native material comparison failure. The current diff is one hunk in that one file (7 insertions, 1 deletion), at lines 405–414. The source SHA-256 independently recomputes to `672b85bd411ca48142917e53c45fdc7e72608699723c652799d33b72f2532f87`, matching the implementation report.

At lines 405–406 the failure condition remains the exact `readback[key] !== setter[key]` check and still throws through `resourceFailure`. The original error prefix is unchanged. The added JSON object records only the failing `field`, `setter[key]`, and `readback[key]`; it applies no numeric conversion, rounding, or tolerance. Before this comparison, `materialValues` validates numeric coefficients as finite and in range and maps supported combine modes to strings (lines 325–369), so the serialized values are validated scalars and JSON does not conceal non-finite or undefined values here.

The setter construction, native `shape.material` assignment, `world.plugin.getMaterial(shape)` read, five-key comparison list, and return path at lines 389–404 and 414 onward are unchanged from the accepted source. The sole diff hunk does not touch material configuration, geometry, filters, solver/physics steps, matrix contents, or cleanup. Scoped `git diff --check` was recorded as passing in the implementation report; I ran no application or runtime commands.

The document checker currently reports overall plan consistency `PASS` but this card `ready:false` because its runtime state is already RUNNING. The implementation report's `ready:true` describes its earlier pre-dispatch snapshot. This source review makes no readiness or acceptance claim. Hosted Verify and the real-browser evidence required by the packet remain outstanding.
