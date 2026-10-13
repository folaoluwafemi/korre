# T02-L01-EXECUTOR-1 independent cancellation review 4

**Verdict: CHANGES_REQUIRED**
**Runtime: NOT RUN**

## Scope

Compared the final cancellation change in `games/counterball/src/simulation/loftCoarseRunner.ts` with review 3, implementation report 4, and the accepted cancellation/error mapping in `knowledge_base/execution/CONTRACTS.md:125-133` and `knowledge_base/execution/completion/CONTRACT_WORK.md:11,30`. No app checks were run.

## Verified repair

- `cancellationError` at `loftCoarseRunner.ts:172-177` sends Error reasons through `normalizeDiagnosticError(reason, "cancelled")`. That normalizer preserves recognized diagnostic codes, including `resourceLimit` and `cancelled` (`browserDirectProbe.ts:188-194,609-623); an ordinary Error therefore gets code `cancelled`.
- Non-Error reasons, including strings or missing reasons, produce an `AbortError` with code `cancelled`.
- `checkCancelled` uses the helper at `loftCoarseRunner.ts:180-183`. `withAbort` uses it in its abort listener and invokes that listener immediately when the supplied signal was already aborted (`:458-469`). Both synchronous checks and abort during runtime initialization therefore use the same classification.
- The internal matrix deadline supplies an Error with code `resourceLimit` (`:1580-1583`); the helper preserves it. A recognized `cancelled` reason is also preserved.
- Prior reviewed fixes remain present: `resourceGuard` normalizes native/resource failures to `resourceLimit` (`:164-169`); a present non-finite contact point throws `resourceLimit` (`:734-738`); and the case metadata timer is checked after cleanup while the independent case timer checks setup through serialized case output (`:1510-1513,1529-1538`).

## Remaining finding

At `loftCoarseRunner.ts:1636-1644`, if `sink.abort(error)` rejects, the catch throws a bare `AggregateError([error, abortError], ...)` before it reaches `normalizeDiagnosticError(error, "initialization")`. For a caller cancellation this loses the primary `cancelled` code; for the internal deadline it can lose `resourceLimit`. The sink contract permits an asynchronous abort operation, and this branch explicitly handles its rejection, so the primary classification must survive that cleanup failure too.

The smallest correction is to preserve the primary diagnostic code while carrying the abort failure, using the existing `errorWithCleanup(error, [abortError])` helper (already imported by this runner) or an equivalent typed aggregate. No source change was made in this review.

No claim is made about hosted checks, browser execution, Havok/physics, artifact acceptance, or playability.
