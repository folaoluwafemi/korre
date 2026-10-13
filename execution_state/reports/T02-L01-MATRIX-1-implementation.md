# T02-L01-MATRIX-1 implementation

Status: **IMPLEMENTED; independent review and exact-head hosted verification pending.**

## Changes

Extended `tests/e2e/counterball-direct-probe.spec.ts` with one Chromium test for the existing **Run 24-case Havok matrix** action. It waits for the browser runner’s ready state, registers the download event before clicking Download matrix, saves the file under the Playwright test output directory, and validates it from a 64-KiB file reader. The host hashes the exact downloaded bytes while incrementally scanning the top-level JSON. It retains at most one case at a time, rejects case objects above 20 MiB, and checks compact JSON, canonical tuple order, matrix/case identity, canonical fixture and config hashes, exact body/contact/sweep fields and row byte caps, all 15 start/final body states, contact order and bounds, per-call sweep guard extrema, settlement masks against body endpoint velocities, eligibility reasons, exact envelope totals, aggregate workload ceilings, file size, and the compact browser summary.

The test sends the browser acknowledgement only after the downloaded artifact passes host validation. It then waits for browser temporary-file cleanup, atomically renames the host temporary file to `counterball-l01-matrix.json` under the test output directory, and attaches it with `application/json`. Failure paths cancel/discard browser storage where available and remove host temporary/final files; the existing direct-shot, retry, and synthetic transport tests remain in the same spec.

The test allows 1,100,000 ms, with a 780,000 ms browser-ready wait. These are test deadlines, not evidence that the matrix fits the existing 20-minute CI job. The exact-head hosted run must measure that fit before this packet can be accepted.

## Inputs and checks

Read the exact T02-L01-MATRIX-1 packet, accepted matrix guard/schema/producer contracts, existing browser export and acknowledgement flow, canonical fixture/config, runner, and restart-pose helper. The coordinator’s materialization record reports the packet was ready with its accepted dependencies. The later packet extraction while the task was RUNNING reported no plan errors and `ready: false`, which reflects the in-progress status.

- `git diff --check -- tests/e2e/counterball-direct-probe.spec.ts` — **exit 0**.
- App tests, typecheck, lint, formatter, build, browser automation, Havok execution, and CI timing — **NOT RUN**. The coordinator owns exact-head hosted verification.

No runtime, physics calibration, eligible-loft, deployed-Havok, or playable-match result is claimed. The first hosted matrix run must verify the current producer output shape and establish whether the matrix completes within the existing job deadline.

## Changed paths

- `tests/e2e/counterball-direct-probe.spec.ts`
- `execution_state/reports/T02-L01-MATRIX-1-implementation.md`

Source ownership is released for independent review.
