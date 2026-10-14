# T02-L01-GEOMETRY-READBACK-1 coordinator setup

**Decision: Dispatch authorized after clarified re-review and READY extraction.** The revised packet passed independent re-review at `execution_state/reports/T02-L01-GEOMETRY-READBACK-1-packet-review.md`. All fourteen explicit prerequisites and inherited T01 are ACCEPTED. The exact pre-dispatch extraction is retained at `execution_state/reports/T02-L01-GEOMETRY-READBACK-1-pre-dispatch-extraction.txt`; it reports `ready:true` while task status was READY. A later extraction after the coordinator changes status to RUNNING will correctly return `ready:false`; the worker must rely on the retained pre-dispatch result and not rerun that gate.

## Ownership

- Implementation worker: `/root/run_evidence_review`.
- Sole source write path: `games/counterball/src/simulation/loftCoarseRunner.ts`.
- Unique implementation report: `execution_state/reports/T02-L01-GEOMETRY-READBACK-1-implementation.md`.
- Independent exact-source and exact-run reviewer after implementation: `/root/executor_type_review`, writing only `execution_state/reports/T02-L01-GEOMETRY-READBACK-1-review.md`.
- Coordinator retains all catalogue, task-state, ledger and ownership writes.

## Exact implementation and acceptance

Use one native `getBoundingBox()` result for the dimensions and the existing preflight error details. Disclose body ID, shape type, configured radius/thickness, expected dimensions, local minimum/maximum and observed dimensions. Keep the exact dimension predicate and fail-before-impulse ordering unchanged. No test/schema/geometry/material/physics/config/workflow or UI path is assigned.

Local work is limited to scoped `git diff --check` and source hashes. The exact source SHA must receive hosted `pnpm verify` and `COUNTERBALL_DEV_E2E=1 COUNTERBALL_PREBUILT_PREVIEW=1 pnpm test:e2e tests/e2e/counterball-direct-probe.spec.ts --workers=1`. The expected real-Havok browser result is still a strict preflight failure before case one, with the exact bounds visible in saved error evidence and no matrix download/artifact. This does not accept the predecessor material card, MATRIX-1, T02, deployed physics or playability.

## Path transfer

`T02-L01-MATERIAL-F32-1` is superseded solely to order the overlapping runner path; its hosted result remains CHANGES_REQUIRED, and its material semantics are not separately accepted. The new card preserves the current source as its baseline and has no acceptance dependency on the unaccepted predecessor. No other source worker owns the runner path.
