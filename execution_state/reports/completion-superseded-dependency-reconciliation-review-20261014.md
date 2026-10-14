# Superseded dependency reconciliation review — 2026-10-14

**Verdict: PASS for the proposed metadata-only dependency reconciliation.**

I reviewed `completion-superseded-dependency-audit-20261014.md`, the current packet/catalogue and runtime dependency rows, and the existing independent acceptance records for the replacement producers. No source, catalogue, task, status, or physics changes were made. No application or runtime commands were run.

## T02-R01 fact producer edge

The proposed change replaces only `LOCAL_PACKETS.json#T02-R01.depends_on[0]`, from superseded `T02-F01` to accepted `T02-F01-ROTATION-1`. All other R01 dependencies remain: `T02-W01`, `T02-C0`, `T02-C2`, `C00-A`, `C00-B`, `C03`, and `C00`.

The runtime ledger records `T02-F01` as SUPERSEDED and `T02-F01-ROTATION-1` as ACCEPTED. The independent F01 source review confirms that the accepted producer still exports the canonical `deriveSimulationFacts(observations, config): SimulationFact[]` from `games/counterball/src/simulation/facts.ts`, with the same protocol-shaped inputs/outputs and no competing interface. It also confirms the change is in the conservative rotation-support calculation and regressions, not a change to protocol types or caller contract. The exact-head hosted review for run 38091279565 on `ec6c35cb3b8e62c70c94d4fd6b26ed577f0088cf` passed 25 test files / 139 tests with zero skips, integration 1/1, and Chromium 4/4; its report supports F01 acceptance only, not T02 or deployed gameplay.

Replacing the blocked edge therefore uses the accepted producer for the same required export. It does not accept or reactivate the superseded F01 record. The inherited T01 gate remains: T02 itself still depends on T01, and the plan checker automatically applies original parent gates to child packets.

This substitution does **not** make T02-R01 ready by itself. Its current extraction is `ready:false`; other packet prerequisites remain unresolved, including C03/T02-W01. The reconciliation correctly removes a stale superseded edge without claiming that R01 can start immediately.

## T02-L01 runtime mirror

The coordinator catalogue already lists `T02-L01-BROWSER-1-SUCCESSOR-3` where the runtime row still lists superseded `T02-L01-BROWSER-1`. The proposed `tasks.json` change updates only that one mirrored dependency. It preserves `required_parent_acceptance: ["T01"]`, every other T02-L01 dependency, and the current parent status.

The replacement is recorded ACCEPTED. Its source-review lineage says the final patch is formatting-only and preserves the existing component behavior; its independent run review confirms a real diagnostic browser flick on the exact accepted SHA. The coordinator acceptance limits that result to the first-flick milestone. The separate `T02-L01-TRANSPORT-1` is ACCEPTED with its own exact-run evidence, while `T02-L01-MATRIX-1` remains CHANGES_REQUIRED. The proposed mirror edit retains both transport and matrix dependencies and does not turn the browser flick into matrix or parent-T02 acceptance.

## Scope and disposition

The proposed edits are limited to the owning dependency fields: one R01 edge in `LOCAL_PACKETS.json` and one stale T02-L01 edge in `tasks.json`. They preserve the parent gates, all other dependency IDs, and all statuses. They add no producer behavior or runtime claim. The pending matrix card remains a required, unaccepted dependency; the audit's separate exact-run review establishes that the prior attempt failed before completing any matrix case.

I ran document-only packet extraction for T02-R01, T02-W01, and C03. Each plan check passed structurally and reported `ready:false`; no implementation/runtime check ran. The current full plan reports no initial-ready packet. In `execution_state/tasks.json`, no PLANNED original-parent task has all listed parent dependencies ACCEPTED: T02 is RUNNING; T04 and T06 wait on T02; later parent work remains transitively blocked. T03 and T11 are already ACCEPTED, not new ready work.

After an independent review of the exact proposed diff, the coordinator may apply these two field-only reconciliations and rerun the document checker. Keep T02-R01 and T02-L01 status unchanged unless their own required implementation, reviews, and evidence are completed.

## Confirmation of applied reconciliation

I verified the applied dependency fields against the current packet records and task mirror. `LOCAL_PACKETS.json#T02-R01.depends_on` now names `T02-F01-ROTATION-1` in the former `T02-F01` position; the other seven dependencies and parent `T02` are unchanged. The replacement is ACCEPTED and the superseded producer remains SUPERSEDED. The extracted R01 card still requires T01 and is `ready:false`.

`COORDINATOR_PACKETS.json#T02-L01.depends_on` and the `tasks.json` T02-L01 mirror both name `T02-L01-BROWSER-1-SUCCESSOR-3` in the former browser-card position. Their remaining dependencies match, including `T02-L01-TRANSPORT-1` and `T02-L01-MATRIX-1`; T01 remains the required parent acceptance gate. The successor is ACCEPTED, while the old browser card remains SUPERSEDED. T02-L01 remains PLANNED, its matrix dependency remains CHANGES_REQUIRED, and parent T02 remains RUNNING.

The exact document checker still reports PASS for 116 packets, 21 remaining parents, and no initial-ready packets. The task-file diff also contains the separately reviewed T02-L01-GOALFRAME-READBACK-1 acceptance and its hosted evidence update; those state changes are outside this two-edge reconciliation and do not imply matrix or parent-T02 acceptance. No source or runtime checks were performed.
