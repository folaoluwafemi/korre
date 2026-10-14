# T02-L01 support-datum successor dependency audit

**Verdict: one stale coordinator gate must be reconciled; do not accept or unblock L01 before the new full matrix is ACCEPTED.** This is a read-only dependency audit. No source, config, contract, task state, or catalogue was changed.

## Current graph and state

I extracted both exact records with the document checker:

- `node scripts/check-completion-plan.mjs --packet T02-L01` — graph PASS; packet is not ready.
- `node scripts/check-completion-plan.mjs --packet T02-L02` — graph PASS; packet is not ready.

The active coordinator record `COORDINATOR_PACKETS.json#T02-L01` and its mirrored `execution_state/tasks.json` packet-progress row still list `T02-L01-MATRIX-1` as the final dependency. Runtime status for that failed card is `CHANGES_REQUIRED`. The new `T02-L01-SUPPORT-DATUM-MATRIX-1` is `RUNNING`; it is not accepted. The coordinator L01 card is still `PLANNED`.

The exact old `T02-L01-MATRIX-1` gate is stale for integration: its acceptance schema is guard-v1, while the accepted support-datum contract has versioned the diagnostic to guard-v2/config-v4. The new consumer is a strict successor, not an extra optional result. Its original matrix dependencies are retained and it adds the accepted geometry, goal-frame, support-datum, config, native-radius-helper, and canonical-identity prerequisites. Its requirements retain the exact 24 tuples, pinned browser Havok, actual native/resource checks, every-call hashed guard, unchanged energy/drop/sweep and workload/artifact caps, complete host validation and download, zero skips/retries, and independent exact-run/artifact review. The datum and raw `supportPlane`/AABB evidence strengthen the new artifact; they do not loosen or omit the original matrix gate. Guard-v2 identity and its config/fixture hashes must be validated as the current canonical identity.

The new card also follows an existing exclusive-write ordering chain: `SUPPORT-DATUM-MATRIX-1` depends on `GOALFRAME-READBACK-1`, which supersedes `DIAGNOSTIC-APRON-F32-1`, which supersedes `GEOMETRY-F32-1`, which supersedes `MATRIX-1`. The checker passes the graph and writer-order validation. No extra source-path ownership edge is required to serialize this matrix writer, though the old card should never be treated as accepted evidence.

The latest recorded run, 38638496304, is not matrix evidence: its diagnostic matrix failed the old raw fixture identity before WASM fetch, impulse, or `executeStep`, with zero completed cases and no matrix download. Component checks in that run do not satisfy either matrix card. The new consumer needs its own full exact-SHA run and independent complete-artifact review.

## Minimal coordinator reconciliation

Replace only the failed matrix dependency in both active coordinator references:

1. In `knowledge_base/execution/completion/COORDINATOR_PACKETS.json#T02-L01`, replace `T02-L01-MATRIX-1` in `depends_on` with `T02-L01-SUPPORT-DATUM-MATRIX-1`.
2. Mirror that one-for-one replacement in `execution_state/tasks.json`, `T02.packet_progress[id="T02-L01"].depends_on`.

Keep every other existing direct dependency, the inherited `required_parent_acceptance: ["T01"]`, and the coordinator L01 status/gate. Do not add an ACCEPTED result for the new card while it is RUNNING. After the catalogue edit, regenerate the derived `completion/PACKETS.md` index and rerun the document checker. The old matrix's failure/run evidence remains historical; it must not stand in for the new consumer. Its current `CHANGES_REQUIRED` status may be closed as `SUPERSEDED` by the coordinator with a clear successor note, but this is not acceptance and is not a substitute for the dependency swap.

No other stale producer is a direct L01 gate. `T02-L02` depends only on coordinator `T02-L01` and inherits T01, so leave it unchanged. Its next work remains blocked until the coordinator accepts L01 after the new matrix reaches ACCEPTED. Do not dispatch L02 from child completion alone.

The accepted `T02-L01-SUPPORT-DATUM-MATRIX-1` record is sufficient as the replacement matrix child: its source/host artifact criteria dominate the earlier full-24 schema/native/resource gate under the updated versioned identity. The coordinator integration still must independently verify every original dependency, all child reports, exact-run logs and the complete artifact before accepting L01. Neither packet authorizes T02 parent acceptance, calibrated production physics, deployed Havok, or playability.

## Evidence and commands

Read the exact T02-L01 and T02-L02 checker extracts, their packet records, `execution_state/tasks.json`, the coordinator/local catalogues, accepted support-datum contract and matrix packet review, and the current CI/run status report. I also used read-only status/dependency queries and inspected the checker’s supersession/readiness behavior. The two commands above were document checks only. No builds, tests, browser actions, physics trials, or deployments ran.
