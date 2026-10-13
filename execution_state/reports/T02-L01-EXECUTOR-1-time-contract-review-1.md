# T02-L01-EXECUTOR-1 timing contract review

**Scope:** Read-only interpretation of the accepted work contract, its acceptance checks, and the L01 probe/runner timing path. No app checks were run.

## Finding

The hard wall-time ceilings are enforced across serialization. The current encoded case/envelope timing does not include sink serialization. The documents require exact envelope time totals but do not explicitly define the measurement interval for a case's `wallTimeMs`; therefore this is an artifact-semantics ambiguity, not evidence that either hard stop can be bypassed.

## Contract reading

- `knowledge_base/execution/completion/CONTRACT_WORK.md:178` sets a 30,000 ms per-case limit and a 720,000 ms complete-matrix limit, explicitly saying the complete-matrix time includes world setup/disposal, hashing, and serialization. Any overrun fails the whole matrix.
- `CONTRACT_WORK.md:182` requires the matrix envelope to record exact row/call/batch/time totals. It does not define whether a case's serialized `wallTimeMs` stops before or after streaming that case.
- `CONTRACT_WORK.md:192` requires host validation of each case's time bound and aggregate totals. It likewise does not define the case-time measurement interval.
- `knowledge_base/execution/completion/ACCEPTANCE.md` requires genuine loft and failure/workload-time-limit evidence, but adds no definition for artifact timing fields.

Thus the 12-minute stop ceiling clearly covers serialization. The exact-total clauses make it unsafe to present the current envelope sum as end-to-end matrix elapsed time. They do not, by themselves, settle whether the sum is meant to be the sum of trial execution durations or a total including sink writes.

## Source behavior

- In `games/counterball/src/simulation/loftCoarseRunner.ts:954,1433-1434,1483-1485`, `runCase` starts a timer and sets `metadata.wallTimeMs` after world cleanup, before the case is serialized by the probe.
- `loftCoarseProbe.ts:1677-1684,1725-1751` serializes that metadata and streams the rows and closing brace through the sink. `writeCase` returns the unchanged metadata value at lines 1753-1760.
- The writer adds those pre-write values into `aggregate.wallTimeMs` at `loftCoarseProbe.ts:1838-1851`, then serializes that aggregate into the envelope at lines 1872-1880. The encoded envelope therefore sums case execution/cleanup measurements and excludes case sink-write time.
- The stop checks are broader. `loftCoarseRunner.ts:1500-1514` starts an outer case timer before `runCase`, suspends at `yield` while the writer serializes the case, then checks the 30-second case limit after serialization. The matrix deadline starts at run entry (lines 1540-1559), and the runner measures `measuredMatrixWallTimeMs` only after `writeLoftCoarseMatrix` has completed its `flush` (`loftCoarseProbe.ts:1882-1888`; `loftCoarseRunner.ts:1596-1607`). These enforce and report an end-to-end matrix duration outside the encoded envelope.

## Recommendation

Do not treat this as a hard-limit enforcement failure: both stop ceilings include the relevant serialization work. Do not describe the envelope's `wallTimeMs` as the full matrix elapsed time.

Before accepting the artifact semantics, the coordinator should resolve the undefined interval. The smallest safe resolution is to specify that case `wallTimeMs` measures trial execution through cleanup, and envelope `wallTimeMs` is the exact sum of those case durations; retain the outer 30-second and end-to-end 720-second timers as the serialization-inclusive ceilings. The runner already returns a separate end-to-end `measuredMatrixWallTimeMs` after flush. If the intended requirement is instead for the encoded envelope itself to contain end-of-write elapsed time, the current write-only, single-pass sink cannot truthfully embed that final duration after the envelope bytes have been emitted; that needs an explicit artifact/schema amendment or a separately persisted post-write measurement. No source change is recommended from this read-only review alone.

**Runtime verdict:** NOT RUN. No statement is made about physics, browser execution, artifact validity, or gameplay.
