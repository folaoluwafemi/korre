# T02-L01-EXECUTOR-1 coordinator repair 1 review

**Verdict: PASS for the scoped source repair. Runtime: NOT RUN.**

I compared `games/counterball/src/simulation/loftCoarseRunner.ts` with `execution_state/reports/T02-L01-EXECUTOR-1-review-4.md` and `execution_state/reports/T02-L01-EXECUTOR-1-coordinator-repair-1.md`.

At `loftCoarseRunner.ts:1636-1644`, a rejected `sink.abort(error)` now throws `errorWithCleanup(error, [abortError])`. The imported helper in `browserDirectProbe.ts:633-646` first normalizes the primary error while preserving any recognized simulation code. It creates an `AggregateError` containing the normalized primary and cleanup failures, and assigns the aggregate the primary error's code. Thus `cancelled` and `resourceLimit` survive a sink-abort failure, and the abort error remains retained in the aggregate. Successful sink behavior is unchanged.

The previously reviewed fixes remain in the current source:

- `resourceGuard` normalizes native/resource exceptions to `resourceLimit` (`loftCoarseRunner.ts:164-169`).
- A present non-finite native contact point fails as `resourceLimit` (`:734-738`).
- Cancellation reasons that are ordinary `Error` values are normalized with fallback `cancelled`; non-Error reasons produce an `AbortError` with code `cancelled`. Both `checkCancelled` and the abort race use this helper (`:172-183,458-469`).
- Case timing still includes run setup/cleanup and checks the case wall limit after cleanup; the separate case timer spans serialized output and matrix timing (`:964-975,1510-1553`).

No source change was made in this review. No local tests, typecheck, lint, build, browser, physics, or Cloudflare checks were run. Fresh exact-head hosted verification remains pending; this review does not accept the executor or claim runtime behavior.
