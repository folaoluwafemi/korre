# T02-L01-CONTACT-CONTRACT-1 independent review

**Verdict: CHANGES_REQUIRED.** The additive contact contract and dependency gates are coherent, but the coordinator packet's declared write set does not cover all paths its steps and implementation report say it changed. No application, physics, build, test, browser, or deployment checks were run.

## Findings

The frozen contact semantics match the actual diagnostic world and resolve the reviewed blocker. `CONTRACT_WORK.md` keeps the existing 15 dynamic IDs first, then the seven diagnostic-only IDs in metadata order (`goal-frame-0` through `goal-frame-5`, `support-apron`). Its explicit aliases match the names generated in `worldFactory.ts`: the four posts and two crossbars map in their construction order, while `counterball-surface` maps to `support-apron`. The aliases are kept outside protocol `EntityId`; the text preserves raw callback occurrence order, duplicate/symmetric callbacks, and the existing row/count/byte caps. Nothing in the reviewed diff changes protocol source, fixture hashes, gameplay IDs, physics/config values, or matrix limits.

The catalogue graph also gates the work correctly. `T02-L01-CONTACT-SCHEMA-1` depends on the contract card, and `T02-L01-EXECUTOR-1` adds the schema card after its original ten dependencies; those ten remain in their prior order. The task mirror marks the contract `IMPLEMENTED`, schema `PLANNED`, and executor `PLANNED`/unassigned. The current ledger and ownership checkpoint describe the stopped runner and require contract and schema acceptance before it can resume.

The remaining issue is the bounded write set. The coordinator card in `COORDINATOR_PACKETS.json#T02-L01-CONTACT-CONTRACT-1` declares only the five completion-document paths in `write_paths`, but its step 4 requires materializing `execution_state/tasks.json` and reconciling runner ownership; the implementation report also lists `execution_state/tasks.json`, `execution_state/LEDGER.md`, and `execution_state/OWNERSHIP.md` as changed paths, and the scoped hygiene command checks all eight. The card should enumerate those state files as coordinator-owned write paths and explicitly include the ledger update in its steps, or move that update to a separately bounded coordinator record. Until the declared scope matches the actual changes, the contract card is not ready for acceptance.

## Checks and limits

- `node scripts/check-completion-plan.mjs --packet T02-L01-CONTACT-CONTRACT-1` — PASS; 98 packets, 21 remaining parents; the coordinator card is IMPLEMENTED and not yet unblocked for acceptance.
- `node scripts/check-completion-plan.mjs --packet T02-L01-CONTACT-SCHEMA-1` — PASS extraction; it remains PLANNED behind the contract card.
- `node scripts/check-completion-plan.mjs --packet T02-L01-EXECUTOR-1` — PASS extraction; it remains PLANNED/unassigned behind the schema card, with the original dependencies preserved.
- The implementation report records the global index and eight-path `git diff --check` as PASS. I did not rerun those checks independently.
- No app tests, build, browser run, Havok trial, matrix run, or deployment check was run. This review makes no physics or playability claim.
