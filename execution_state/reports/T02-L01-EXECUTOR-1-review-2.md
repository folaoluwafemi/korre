# T02-L01-EXECUTOR-1 independent source review 2

**Verdict: CHANGES_REQUIRED**

## Scope and checks

Reviewed the extracted `T02-L01-EXECUTOR-1` packet, its accepted guard/schema/contact encoder dependencies, `loftCoarseRunner.ts`, `loftCoarseProbe.ts`, the diagnostic error helpers, and the applicable `CONTRACT_WORK.md` / `ACCEPTANCE.md` requirements. The packet extractor reports structural `PASS` across 99 packets. Its `ready:false` and `initialReady:[]` are expected for an already materialized RUNNING card: `execution_state/tasks.json` records this packet as `RUNNING`, `ready:true`; all eleven listed dependencies are `ACCEPTED`, and required parent T01 is `ACCEPTED`. This is not a dependency blocker.

No runtime, test, build, browser, physics, or Cloudflare check was run. This is a source-only review.

## Findings

### 1. The artifact matrix time total omits serialization and is not the exact full-matrix elapsed time

`CONTRACT_WORK.md:178` makes the per-case and matrix time ceilings include serialization; `:182` requires the matrix envelope to contain exact time totals. Runtime enforcement does cover the serialized work: `loftCoarseRunner.ts:1502-1514` starts each case clock before setup and checks it after the yielded case has been consumed by the writer; `:1553-1558` starts the matrix deadline before preflight; `loftCoarseProbe.ts:1581-1600` races sink writes against cancellation. The runner also measures actual end-to-end matrix elapsed time after the writer completes at `loftCoarseRunner.ts:1597-1607`. Thus I found no path by which slow serialization can silently exceed the case or matrix hard deadline and still return success.

The persisted timing evidence is different. `loftCoarseRunner.ts:1433-1458` records a case duration before the case is serialized; cleanup is included by the later restamp at `:1483-1485`, but serialization is not. The writer returns that value unchanged (`loftCoarseProbe.ts:1753-1760`), sums those case values (`:1845-1864`), and writes that sum into the matrix envelope (`:1524-1536`). The measured actual whole-matrix duration is only returned in the runner's compact in-memory summary after the envelope has been written (`loftCoarseRunner.ts:1597-1607`). Therefore the current envelope's `wallTimeMs` is the sum of pre-serialization case durations, not the exact elapsed matrix total including preflight and serialized sink writes. Although the contract does not separately define the per-case `metadata.wallTimeMs` field as sink-inclusive, the required exact matrix time total and the explicit serialization-inclusive ceiling are not represented in the artifact. Clarify/adjust the accepted timing schema and producer so the artifact records an exact total with defined scope; until then the artifact requirement is unmet.

### 2. Several required resource-limit failures are returned as `initialization`

The accepted contract requires failed or missing native preflight to exit with typed `resourceLimit` (`CONTRACT_WORK.md:172`), and unknown/unsupported native properties, material, geometry, bounds, or sweeps to return typed `resourceLimit` (`:174`). But `loftCoarseRunner.ts:154-158` defines `failure()` as an untagged `Error`, and the public catch at `:1617` normalizes every untagged error with fallback `initialization`. The shared helper confirms that untagged errors receive the fallback code (`browserDirectProbe.ts:615-622`). Concrete guard paths use the untagged helper: the initial shifted-energy preflight at `loftCoarseRunner.ts:1092-1094`, pre-call point/rotation cap checks at `:1256-1259`, and unknown static collider mapping at `:713-716`. The shared sweep planner also throws untagged `RangeError`s for invalid limits or an excessive required subdivision (`browserDirectProbe.ts:363-401`), which the public boundary likewise maps to `initialization`.

These paths abort and do not return successful evidence, but their public error codes violate the accepted contract and prevent callers from distinguishing workload/resource exhaustion from initialization failure. Tag these resource-guard/preflight failures as `resourceLimit` (or normalize them at a narrowly scoped resource boundary) while preserving true initialization and cancellation classifications.

### 3. A present non-finite contact point is silently recorded as absent

`CONTRACT_WORK.md:180` requires each actual contact callback's point to be finite or null. In `loftCoarseRunner.ts:719-729`, `eventPoint()` returns null both when the engine supplied no point and when it supplied a point with a non-finite coordinate. That result is appended as a normal callback row at `:1138-1145`, and the encoder accepts null (`loftCoarseProbe.ts:1195-1204`). A malformed present native point is therefore indistinguishable from an unavailable point and survives in the evidence artifact. Preserve null only for genuinely absent points; fail the case/matrix with a typed error when a present point is non-finite.

## Positive evidence

- There is one public `world.plugin.executeStep(...)` call site in the runner, inside the bounded loop. It checks all 15 bodies, energy, support/drop and conservative swept bounds before and after each call; call/tick/batch limits are checked before advancing, and host yielding is bounded. The runner records endpoint body rows, raw observer contacts, interval sweep summaries, native facts, setup/provenance, and all-body settling evidence before serialization.
- The per-case and whole-matrix watchdogs do include serialization and abort the sink path on failure. This satisfies runtime deadline enforcement, despite the artifact timing-evidence gap above.
- Setup/provenance checks use canonical tuples and fixture state, verify fixture/config/WASM hashes before initializing the pinned browser Havok runtime, validate native body/material/static facts before applying the one planar COM impulse, and clean up observers, replacement support shape, and world on error paths.

No acceptance is recommended until findings 1–3 are addressed and independently reviewed. No runtime result or deployed Havok claim is made by this report.
