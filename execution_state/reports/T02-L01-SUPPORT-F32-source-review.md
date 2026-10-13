# T02-L01-SUPPORT-F32-1 independent source review

**SOURCE: PASS. RUNTIME: NOT RUN / NOT VERIFIED.**

I reviewed the extracted `T02-L01-SUPPORT-F32-1` packet, its accepted proposal, the implementation report, and the three assigned source paths. The implementation report’s file hashes match independent SHA-256 recomputation:

- `games/counterball/src/simulation/loftCoarseProbe.ts` — `507ad7f4805e160c798605593933444e6e7718568d4765967f2dc611d89411b4`
- `games/counterball/src/simulation/loftCoarseProbe.test.ts` — `5f3c4e3e0493d03041a8b051db83fd9c6948c7e4dc7eb4d6a342a6793dd05610`
- `games/counterball/src/simulation/loftCoarseRunner.ts` — `54ba412baf5910027d64cd18e6b628df40887f7860b66f696dbaf676a10ca5e2`

`matchesExactFloat32Projection` at `loftCoarseProbe.ts:564-571` rejects non-finite configured or observed values, computes `Math.fround(configured)`, rejects a non-finite projection, and accepts only `observed === projected`. It uses no tolerance or string rounding.

The runner diff applies this helper only to the existing native support AABB Y check at `loftCoarseRunner.ts:1299-1307` and the matching `nativeShapeDimensionY` diagnostic at `1386-1394`. X and Z remain strict equality against `pitchWidth` and `pitchLength`. Position, rotation, parent, scale, material/filter, and physics guards are not changed in the three-file diff. The slab’s expected/configured dimensions remain sourced from `pitchWidth`, `surfaceThickness`, and `pitchLength`; no geometry construction, matrix, impulse, step, or downstream calculation was changed. The comparison does not substitute projected dimensions into native-shape data. On a mismatch, `loftCoarseRunner.ts:1335-1341` reports configured Y, projected expected readback, and observed native Y.

The focused tests at `loftCoarseProbe.test.ts:421-455` cover exact projected acceptance; rejection of raw decimal `0.2`; construction and rejection of the immediately adjacent float32 value; rejection of NaN and both infinities as configured and observed values; and rejection of finite `Number.MAX_VALUE` when its float32 projection is positive infinity. The DataView bit increment is applied to the positive float32 representation of `0.2`, and the test also confirms the neighbor remains an exactly representable float32 number.

Reviewing `git diff HEAD` for only the three packet paths showed the helper, its focused tests, and the support-Y comparison/diagnostic changes described above. The canonical configured geometry and X/Z comparisons remain intact in the reviewed runner source. No build, typecheck, lint, test, browser, physics, deployment, or Cloudflare check was run for this review. The focused tests are authored but not independently executed, and this source review does not prove that a hosted browser run passes the support check or completes the 24-case matrix.
