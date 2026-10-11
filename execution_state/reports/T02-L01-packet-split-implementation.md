# T02-L01 packet split — coordinator implementation report

Status: ACCEPTED for control-plane scope after independent review. Scope is control-plane only; no application/runtime/physics claim.

## Result

The original L01 browser-matrix card is now a coordinator integration gate. Its eight original direct prerequisites remain unchanged and first, in this order: `C00-B`, `C01`, `T02-B0`, `T02-C0`, `T02-C2`, `C00`, `T02-L01-GUARD-CONTRACT-1`, `T02-L01-GUARD-SCHEMA-1`. The accepted parent T01 gate remains implicit and mandatory. The five implementation packets retain those eight prerequisites and the amendment as their serial graph requires. The coordinator integration gate appends the amendment and all five child IDs without removing an existing prerequisite or acceptance condition. Four pre-existing coordinator-card read-path references to T02-L01 were updated from the former LOCAL catalogue pointer to its new COORDINATOR catalogue pointer, with matching runtime task mirrors; the five child IDs remain in LOCAL and their pointers are unchanged.

The exact write ownership is:

| Packet | Exact source/control writes | Ordering |
|---|---|---|
| `T02-L01-PACKET-SPLIT-1` | `COORDINATOR_PACKETS.json`, `LOCAL_PACKETS.json`, generated `PACKETS.md`, `tasks.json`, `OWNERSHIP.md` | This amendment is the only ready card. |
| `T02-L01-ARTIFACT-1` | `loftCoarseProbe.ts`, `loftCoarseProbe.test.ts` | After the accepted amendment. |
| `T02-L01-EXECUTOR-1` | `loftCoarseRunner.ts` | After ARTIFACT. |
| `T02-L01-BROWSER-1` | `games/counterball/src/browser.ts`, `apps/web/src/CounterballDirectProbe.tsx` | After EXECUTOR. |
| `T02-L01-TRANSPORT-1` | `tests/e2e/counterball-direct-probe.spec.ts` | After BROWSER; proves exact-cap transfer. |
| `T02-L01-MATRIX-1` | `tests/e2e/counterball-direct-probe.spec.ts` | After TRANSPORT; same file is serialized by dependency. |
| `T02-L01` | `tasks.json`, `LEDGER.md`, `OWNERSHIP.md` | Integration only after all child and original prerequisites. |

The producer boundary is explicit: the pure module exports `LOFT_COARSE_TUPLES`, `LoftCoarseTuple`, `LoftCoarseCase`, `LoftCoarseMatrixMetadata`, `LoftCoarseByteSink`, `LoftCoarseMatrixSummary`, and `writeLoftCoarseMatrix({ metadata, cases, sink, signal })`. It consumes an `AsyncIterable` and awaits bounded 256-KiB-or-smaller sink writes; the aggregate envelope is written after cases. The browser runner exports `LoftCoarseRunOptions`, `LoftCoarseProgress`, `LoftCoarseRunSummary`, and `runLoftCoarseMatrix({ engine, signal, sink, onProgress })`, returning only compact counts, timings and hashes. The existing browser entrypoint re-exports that function and types to the existing diagnostic page.

The existing `createCounterballWorld()` builds the canonical pitch-size slab. No accepted world-factory override exists. The runner packet therefore explicitly replaces only that new diagnostic world's support shape, following the accepted direct-probe replacement/cleanup pattern, and verifies the hashed 662-by-0.2-by-670 slab facts. It cannot edit canonical config, the factory, other static bodies, or crossing planes.

The browser packet uses the existing `/diagnostic/direct-shot` route and its page-owned Engine. It specifies OPFS awaited writes, bounded chunks, successful-file-only download, cancellation/failure cleanup, and a development-only max-size transport action. The serial transport packet requires a real Chromium transfer of exactly 504,365,056 bytes through that same file writer/download path, with incremental host hashing and cleanup. Only after that proof may the matrix packet run the real 24-case pinned-Havok matrix. The current 20-minute hosted job and every accepted workload/output cap remain unchanged; a timeout blocks another matrix attempt pending a separately reviewed workflow amendment.

Runtime status preserves old L01 checks as historical entries, marks the updated integration gate PLANNED, records the split amendment READY, and records all five children PLANNED. Parent T02 remains RUNNING. The current top-level blocker says the strict guard and schema are accepted but no 24-case restart-loft matrix has run; deployed Havok and a playable match remain open.

## Checks

- `node scripts/check-completion-plan.mjs --write-index` — PASS; regenerated 96-card index, 21 remaining parents, only `T02-L01-PACKET-SPLIT-1` initially ready.
- `node scripts/check-completion-plan.mjs --packet <ID>` for the amendment, five children, and integration gate — PASS for all seven extractions.
- `node scripts/check-completion-plan.mjs` — PASS; 96 packets, 21 remaining parents, only the amendment ready.
- `git diff --check -- knowledge_base/execution/completion/COORDINATOR_PACKETS.json knowledge_base/execution/completion/LOCAL_PACKETS.json knowledge_base/execution/completion/PACKETS.md execution_state/tasks.json execution_state/OWNERSHIP.md` — PASS. Git emitted only configured LF-to-CRLF working-copy notices.
- No application build, package test, browser, physics, deployment, or external-service command ran for this control-plane packet.

Independent graph/runtime-state review is assigned to `/root/foundation_review` at `execution_state/reports/T02-L01-packet-split-review.md`; `/root/br02_review` stopped before writing its report after identifying the stale catalogue pointers, which were corrected before the rotated review. No child implementation is released until that review passes and the amendment is recorded ACCEPTED.
