# T02-L01-EXECUTOR-1 independent lint repair review 8

**Verdict: PASS for the scoped lint repair**  
**Runtime and hosted checks: NOT RUN**

## Scope

Compared the eight findings in `execution_state/reports/T02-L01-EXECUTOR-1-run-38404197531-artifacts/counterball-hosted-checks-139e82ec5c20caf93466adf5fef132e59a02aaba-run-38404197531-attempt-1/verify.log` with `execution_state/reports/T02-L01-EXECUTOR-1-implementation-6.md` and the current staged/working diff for `games/counterball/src/simulation/loftCoarseRunner.ts`. Checked the exact `T02-L01-EXECUTOR-1` packet and L01 guard/error contracts. No source, configuration, status, catalogue, ledger, or ownership files were changed. No app check, test, build, lint, browser, or physics command was run.

## Eight lint findings

All eight findings have direct repairs in the diff, with no lint or type suppressions added:

1. Removed the unused `DiagnosticSweepPlan` import (the import list near line 40).
2. Removed the unused `subtract` helper (near the former line 293).
3. `withAbort` now rejects with `normalizeDiagnosticError(error, "initialization")` (line 488), so rejection values meet the `Error` contract. Existing recognized `SimulationError` codes are preserved; untyped initialization failures receive the established initialization fallback.
4. Replaced the overwritten initial `position` value with a definitely assigned `Vec3` local (line 557). The same branches still select the button, selected-cap, obstacle, or canonical filler position before use.
5. Removed the unnecessary `LoftCoarseEntityId` cast from `entityId` (line 818); `ENTITY_IDS` already supplies the canonical union type.
6–7. Both `callbackFailure` throws now normalize unknown values with fallback `resourceLimit` (lines 1337 and 1352). Already typed failures, including `cancelled` or `resourceLimit`, retain their codes. The callback failure still aborts immediately after the public step and before post-step processing or another physics call.
8. Replaced non-null assertions with local `buttonStart` and `obstacleStart` reads and explicit guards (lines 1462–1468). Those samples come from the same complete metrics array: native-body collection requires every canonical `ENTITY_IDS` body, `getWorldSamples` maps each metric, and `energyBodies` requires exactly 15 metrics and samples before this eligibility calculation. Thus the local checks do not omit evidence in a valid case; they remove only assertions and preserve the same start-position comparison.

The exact hosted verify remains necessary to confirm ESLint and typecheck outcomes on the repaired SHA.

## Contract and runtime-semantic audit

- **Error types and codes:** The L01 contract requires typed failures (`initialization`, `timeout`, `cancelled`, `invalidBody`, or `resourceLimit`) and no partial successful result. The new normalization is at rejection/callback boundaries only, preserves recognized codes through `normalizeDiagnosticError`, and assigns the existing boundary fallback to untyped failures. The signal listener still creates `cancelled`; the lint repair does not map cancellation to timeout or resource exhaustion.
- **Guard behavior:** The diff changes no energy, drop, full-collider sweep, apron, call, tick, batch, wall-time, byte, or row thresholds. Callback failures still leave the trial through the existing error/cleanup path.
- **Cleanup:** No world, observer, replacement-shape, sink, or cleanup ordering code changes are present in this repair diff.
- **Serialized output:** The removed declarations and helper were unused. The narrowed `position` and `entityId` values are unchanged at runtime. The initial-sample locals read the same array entries; no case metadata, body/contact/sweep row, envelope, or summary field changes.
- **Suppressions:** No `eslint-disable`, `@ts-ignore`, or `@ts-expect-error` was introduced in the inspected diff.

This PASS is limited to source review of lint repair attempt 1. It does not accept the executor, certify a typecheck or lint run, prove physics behavior, or satisfy the later Chromium matrix gate.
