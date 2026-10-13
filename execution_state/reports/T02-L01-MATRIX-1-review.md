# T02-L01-MATRIX-1 independent source review

**SOURCE: CHANGES_REQUIRED. RUNTIME: NOT RUN.**

I reviewed the exact packet, its accepted producer and guard contracts, the implementation report, and the current owned E2E source. The packet is limited to `tests/e2e/counterball-direct-probe.spec.ts`. No app tests, lint, typecheck, build, browser run, or physics run was performed. The implementation report accurately leaves exact-head hosted verification and the 20-minute fit pending.

## Findings

1. **The complete matrix test is duplicated verbatim.** The first copy spans lines 2059–2205, from `test("the full real-Havok loft matrix downloads and passes bounded host validation"` through its closing `});`. The second copy spans lines 2207–2353 and is identical across all 147 lines. Playwright will collect and execute the 24-case Havok matrix twice, with a second complete download, validation, and attachment. This conflicts with the packet's single distinct matrix test and creates a material 20-minute job-fit risk. Delete one complete duplicate block and retain one test with all its assertions intact.

2. **The settling checks stop at the first unsettled sample.** At lines 1004–1022 and again at 1374–1394, `.every(...)` returns `mask === 0x7fff` from its callback. `every` stops visiting elements when that value is false. Therefore, if any early sample is unsettled, later samples in the required 60-row settling window are not checked for exact tick, all-15 speed arrays, finite/nonnegative values, mask consistency, or equality with the corresponding endpoint body velocities. The later result at line 1424 also uses this short-circuited value to form eligibility. Replace both traversals with a full 60-row loop that validates every sample and separately accumulates whether all samples are settled.

3. **One settling result is unused and will fail the configured unused-variable lint.** The `allSettled` binding at line 1004 is never read; unlike the separate binding at line 1374, it contributes no eligibility result. Remove that unused binding while retaining a full traversal for its validation assertions. Do not merely suppress the lint diagnostic.

The bounded file reader, raw-byte digest, one-case parsing, provenance checks, tuple and row accounting, sweep/contact validation, host acknowledgement ordering, post-validation rename/attachment, and failure cleanup are present in the reviewed source. Those static observations do not offset the findings above or establish any runtime result.

## Evidence limits

No claim is made that Chromium ran, that pinned Havok produced the matrix, that the file or host acknowledgement passed, or that the test fits the existing CI job. After the source corrections, exact-SHA hosted verification and independent artifact review remain required by the packet.
