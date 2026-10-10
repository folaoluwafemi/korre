# Completion packet graph repair 2

## Outcome

The accepted fact producer and its later source repairs now have consistent ordering and status. `T02-F01-ROTATION-1` remains accepted. The historical format-repair-1 attempt remains recorded with its run-38088587482 failure, but its task status is now `SUPERSEDED`; semantic-repair-2 retains the failure-card edge and is itself superseded by the accepted formatting successor. Both later repair records depend on F01 instead of superseding it.

This closes the stale-ready finding in the first independent review. No source, tests, app configuration, physics, or runtime behavior changed.

## Checks

- `node scripts/check-completion-plan.mjs --packet COMPLETION-GRAPH-REPAIR-2`: PASS; record extracted and ready from 79 packets/21 remaining parents.
- `node scripts/check-completion-plan.mjs --write-index`: PASS; regenerated the 79-packet index.
- `node scripts/check-completion-plan.mjs`: PASS; the only dependency-eligible records are C01 and this in-progress coordinator repair. The stale failed format-repair-1 card is not ready.
- Exact extraction for `T02-F01-ROTATION-1-FORMAT-REPAIR-1`: PASS; `ready:false`.
- Exact extraction for `T02-F01-ROTATION-1-SEMANTIC-REPAIR-2`: PASS; `ready:false` because it is superseded, with its F01 dependency and failed-card ordering preserved.
- `git diff --check`: PASS.
- Application install/build/test/browser/physics/deployment: NOT RUN; this card changes coordinator metadata only.

## Review

The first independent graph review found the stale-ready status and is preserved as CHANGES_REQUIRED at `execution_state/reports/COMPLETION-GRAPH-REPAIR-1-review.md`. A second independent review is pending at `execution_state/reports/COMPLETION-GRAPH-REPAIR-2-review.md`.
