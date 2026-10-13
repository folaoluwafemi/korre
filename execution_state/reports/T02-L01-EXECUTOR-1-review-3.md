# T02-L01-EXECUTOR-1 independent source review 3

**Verdict: CHANGES_REQUIRED**

## Scope and result

Reviewed the extracted `T02-L01-EXECUTOR-1` packet, review 2, implementation report 3, timing clarification in `knowledge_base/execution/completion/CONTRACT_WORK.md`, and the complete 1,646-line `loftCoarseRunner.ts`. I also checked the directly used error-normalization and matrix-writer boundaries needed to verify cancellation, envelope timing, and sink abort behavior. The packet extractor reports structural PASS; its `ready:false` is plan output and was not treated as an implementation or runtime result.

The three review-2 findings are fixed in source. Native/preflight/resource/sweep guard failures now use `resourceFailure`/`resourceGuard` and are preserved as `resourceLimit`; a present non-finite contact point now throws `resourceLimit` rather than becoming null; and the timing fields and independent clocks match the clarified contract. One residual cancellation-classification issue remains below.

## Finding

### Caller cancellation with an ordinary Error reason is reported as initialization

At `loftCoarseRunner.ts:1567-1575`, caller abort forwards `signal.reason` to the internal controller unchanged. `checkCancelled` at `:172-179` rethrows any `Error` reason unchanged. If the caller used `controller.abort(new Error("cancel"))`, that error has no recognized diagnostic code; the public catch at `:1633-1641` calls `normalizeDiagnosticError(error, "initialization")` and therefore labels cancellation as initialization. The shared normalizer preserves only recognized coded errors (`browserDirectProbe.ts:609-622`). The same raw-reason propagation appears in `withAbort` at `loftCoarseRunner.ts:454-460`.

Convert an untyped caller-abort reason into a coded `cancelled` error, while preserving already-recognized diagnostic codes. This is a source-contract issue; cancellation still aborts and cannot return successful output, but its public classification does not preserve cancellation as required by the executor packet and the prior review’s instruction.

## Verified fixes and contract checks

- `resourceFailure` assigns `resourceLimit`, and `resourceGuard` normalizes untyped failures at resource boundaries while preserving already typed codes (`loftCoarseRunner.ts:154-170`). Native facts are read inside that boundary (`:1055-1056`); sweep-plan failures are converted to resource-limit failures (`:1084-1098`); static identity and present malformed contact-point paths are typed (`:725-737`). Strict support, energy, sweep, and workload failures are likewise typed at their checks. `errorWithCleanup` preserves the primary typed code (`browserDirectProbe.ts:633-646`).
- `eventPoint` returns null only for absent `null`/`undefined`, and rejects a present non-finite vector (`loftCoarseRunner.ts:731-736`). The callback captures that error and aborts before case completion (`:1139-1164`).
- Case metadata timing starts at per-case runner setup (`loftCoarseRunner.ts:948-973`) and is overwritten after cleanup at `:1491-1510`, before the case is yielded for serialization. The independent case timer starts before setup at `:1523-1530`; after the writer consumes the yielded case, the generator enforces the setup-through-serialization case limit at `:1532-1538`. The encoder sums each case value in canonical case iteration order (`loftCoarseProbe.ts:1825-1851`), requires exactly 24 cases (`:1868-1869`), and writes that sum in the envelope (`:1872-1884`). These values are workload totals, consistent with `CONTRACT_WORK.md:180`.
- The matrix clock is captured at runner entry (`loftCoarseRunner.ts:1561-1562`); the runner measures and checks it only after `writeLoftCoarseMatrix` returns (`:1613-1632`). The writer returns after its final sink flush (`loftCoarseProbe.ts:1882-1889`), so `measuredMatrixWallTimeMs` includes output completion. The separate timer and in-loop checks abort/cap the matrix path (`loftCoarseRunner.ts:1577-1582`, `:1608`, `:1213-1233`).
- There is one public `executeStep` call site (`loftCoarseRunner.ts:1226-1235`, `:1306-1336`). Before each call, the loop checks all 15 body samples, energy, conservative sweep/support bounds, and call/time limits; after each call it checks callback failures, all-body samples, energy and support. Evidence includes tick-zero and endpoint body rows, every callback row, per-interval sweep extrema, native/material/static facts, and the settling window (`:1135-1164`, `:1173-1195`, `:1363-1400`, `:1450-1486`). The writer validates encoded bounds and exact case count rather than truncating (`loftCoarseProbe.ts:1632-1759`, `:1825-1884`).
- The runner requires a real Babylon `Engine` (`loftCoarseRunner.ts:1555-1574`), checks canonical tuples and config/fixture/WASM hashes before creating the pinned Havok runtime (`:766-780`, `:1583-1608`), records browser/engine/physics identity (`:1609-1611`), verifies native facts before the single COM impulse (`:1055-1130`, `:1180-1195`), and restores/disposes observers, replacement shape, and world on every case path (`:1491-1511`). The writer aborts the sink on writer failure (`loftCoarseProbe.ts:1890-1906`); runner preflight failures and post-writer failures also call `sink.abort` (`loftCoarseRunner.ts:1633-1641`).
- The bounded-output design remains compatible with the packet: progress and compact summary contain counts/identity/timing fields, not case rows (`loftCoarseRunner.ts:100-120`, `:1539-1548`, `:1623-1632`); the runner delegates streamed bytes to the bounded async sink rather than returning a matrix object.

No builds, tests, browser checks, physics/Havok runs, or Cloudflare checks were performed. **Runtime/physics: NOT RUN.** This review makes no claim that Chromium or real Havok execution passed.
