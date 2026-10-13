# T02-L01-SUPPORT-F32-1 implementation

Implemented the exact binary32 representation check for the diagnostic support slab's native AABB Y dimension.

`matchesExactFloat32Projection(configured, observed)` in `loftCoarseProbe.ts` returns true only when the configured value, observed value, and `Math.fround(configured)` are finite and `observed === Math.fround(configured)`. It adds no tolerance or rounding-to-string behavior.

The runner uses this helper only for `originalSurfaceDimensions.y` in the existing pre-impulse support check and its matching `nativeShapeDimensionY` diagnostic boolean. A mismatch diagnostic now reports configured, projected, and observed Y values. X/Z checks remain exact; canonical slab construction remains `12 × 0.2 × 20`; transform, material, filters, guard, physics, and downstream use of raw native dimensions are unchanged.

Focused unit cases were added for accepting the exact projection, rejecting raw `0.2`, rejecting the immediately adjacent float32 value, rejecting NaN and both infinities as configured or observed values, and rejecting finite `Number.MAX_VALUE` because its float32 projection is infinite.

Changed source paths and SHA-256:

- `games/counterball/src/simulation/loftCoarseProbe.ts` — `507ad7f4805e160c798605593933444e6e7718568d4765967f2dc611d89411b4`
- `games/counterball/src/simulation/loftCoarseProbe.test.ts` — `5f3c4e3e0493d03041a8b051db83fd9c6948c7e4dc7eb4d6a342a6793dd05610`
- `games/counterball/src/simulation/loftCoarseRunner.ts` — `54ba412baf5910027d64cd18e6b628df40887f7860b66f696dbaf676a10ca5e2`

Checks actually run:

- `node scripts/check-completion-plan.mjs --packet T02-L01-SUPPORT-F32-1` — exit 0; plan verdict `PASS`, extraction reports `ready:false` at the time of implementation. This is a plan consistency check, not implementation evidence.
- `git diff --check -- games/counterball/src/simulation/loftCoarseProbe.ts games/counterball/src/simulation/loftCoarseProbe.test.ts games/counterball/src/simulation/loftCoarseRunner.ts` — exit 0, no output.
- Read-only diff review confirmed changes are confined to the three assigned paths and the runner edits only the support-Y predicate and diagnostic.

Typecheck, lint, unit tests, build, browser automation, physics, and deployment were NOT RUN. The focused tests are authored but unverified. No new browser result is claimed; the accepted prior run exposed the float32 Y readback before impulse or `executeStep`, and the restart-loft matrix remains unaccepted pending exact-source review and the required hosted checks.
