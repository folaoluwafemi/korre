# T02-L01 executor timing contract clarification 1

## Change

Added explicit timing-field definitions to `knowledge_base/execution/completion/CONTRACT_WORK.md` under “Work and exact artifact envelope.” Case metadata `wallTimeMs` is the elapsed trial workload through setup and world/apron cleanup, sampled before case serialization. Matrix-envelope `wallTimeMs` is the exact sum of the 24 case values in canonical order; it is not end-to-end matrix elapsed time.

The independent 30,000 ms case deadline still runs through serialization of that case. The independent 720,000 ms matrix deadline still runs from runner entry through setup, hashing, all case and envelope serialization, and writer/sink flush. The compact runner result reports `measuredMatrixWallTimeMs` over the runner-entry to writer/sink-flush interval. The overall test/job deadline continues to include Playwright download validation, atomic rename and attachment.

## Review and validation

- Independent review: `execution_state/reports/T02-L01-EXECUTOR-1-time-contract-amendment-review-1.md` — PASS; reviewer found the clarification faithful to the existing caps, artifact schema and transport design.
- `node scripts/check-completion-plan.mjs` — PASS; 99 packets and 21 remaining parents. This is a document consistency check only.
- No application check, test, build, browser run, Havok trial or deployment check was performed for this document change.

This resolves the reporting interval only. It does not accept the runner, certify physics behavior, or change any limit or gameplay rule.
