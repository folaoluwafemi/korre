# Execution ledger

This file records evidence-backed task transitions. The immutable seed remains at `knowledge_base/execution/status.json`; its initial READY state is not implementation evidence.

## Current review accepted

The requested review improved the static preview, real database/migration evidence and physics diagnostics. Final GitHub run 38057543954 on 22a7375e1b57a01d1bd91e23f18749ed7096d4a8 passed all checks/builds, 98 tests with zero skips, migrations twice, one integration test and four clean browser cases. Independent source/runtime reviews passed. This review, T11 API/database scope and T02-B2 diagnostic are ACCEPTED; parent T02 remains RUNNING and actual gameplay remains unfinished. C00-A is now ACCEPTED as a protocol contract packet: exact-head GitHub run 38078890667 passed the focused 10-test protocol suite, full verification (24 files/99 tests, zero skips, build), disposable PostgreSQL migration/recheck twice, one integration test, and four Chromium E2E cases; independent source, format-repair, CI and runtime reviews passed. The earlier run 38078311528 formatter failure and bounded repair remain recorded as history. No runner cancellation behavior, playable match, or deployment is claimed by C00-A. D38 is a provisional engineering margin, needs no human numeric choice and proves no loft. No local application build/test ran; the user preview serves the downloaded GitHub build through a small loopback server. See reports/current-review-validation.md.

## Baseline

- 2026-10-10: initial Git branch `master`, no commits, and no Git remote.
- Before T00: documentation-only workspace: `AGENTS.md` and `knowledge_base/`; no source packages, workspace manifests, lockfile, CI, or runtime execution records.
- Local tools: Node 25.2.0, pnpm 10.33.0, Docker CLI 29.3.1. Docker Desktop's Linux engine is unavailable from this workspace. No PostgreSQL client/server is installed or listening on port 5432.
- At initial T00 start, task states matched the copied seed; evidence-backed transitions are recorded below and in tasks.json.

## T00 review and repair

- 2026-10-10: T00 is `ACCEPTED`. Independent reviews are recorded at [T00-review.md](reports/T00-review.md), [T00-review-repair-1.md](reports/T00-review-repair-1.md), and [T00-review-repair-2.md](reports/T00-review-repair-2.md). Repair 2 closes the relative app/backend import bypass. Frozen install, verification, integration, and Chromium E2E passed after final review; details are in [T00-implementation.md](reports/T00-implementation.md). T01 is now `REVIEWING`.
- 2026-10-10: T01's first independent review found a canonical JSON `__proto__` collision and missing bounded playback/protocol validation; the initial findings and final repair PASS are preserved in [T01-review.md](reports/T01-review.md). Coordinator repair 1 is saved at [T01-implementation.md](reports/T01-implementation.md), with additional direct tests for snapshot metadata, duplicate indexes, and aggregate bytes. After the final test addition, full verify (22 tests/builds), integration, and Chromium E2E passed. The final independent protocol/SDK re-review passed; the coordinator reran the frozen install successfully. T01 is `ACCEPTED`; T02/T03/T11 are unblocked.

## Catalogue snapshot

Derived from execution_state/tasks.json; unassigned paths below are plan ceilings only and do not grant write permission.

| ID | Milestone | Status | Owner | Dependencies | Owned files | Evidence | Next action |
|---|---|---|---|---|---|---|---|
| T00 | workspace and reproducible checks | ACCEPTED | Coordinator; exact packets in OWNERSHIP.md | None | See OWNERSHIP.md | execution_state/reports/T00-implementation.md; execution_state/reports/T00-review-repair-2.md | Accepted; T01 is unblocked. |
| T01 | canonical protocol, config, SDK, and fixtures | ACCEPTED | Coordinator; exact packets in OWNERSHIP.md | T00 | See OWNERSHIP.md | execution_state/reports/T01-implementation.md; execution_state/reports/T01-review.md | Accepted; T02, T03, and T11 are unblocked. |
| T02 | isolated headless Havok shot runner | RUNNING | Coordinator; exact packets in OWNERSHIP.md | T01 | See OWNERSHIP.md | None | Independently review C00 contract-preparation handoff. Then start only dependency-ready T02 producers, prioritizing the browser flick. Parent T02 still requires runtime/settling/loft/cancellation evidence before acceptance. |
| T03 | procedural pitch, caps, and button | ACCEPTED | Coordinator; exact packets in OWNERSHIP.md | T01 | See OWNERSHIP.md | execution_state/reports/T03-implementation.md; execution_state/reports/T03-hosted-review-1.md | Improved static scene ready for inspection; all four built-browser checks passed. T05 still waits for ACCEPTED T02. |
| T04 | Cloudflare actual WASM smoke | PLANNED | Unassigned | T02 | See OWNERSHIP.md | None | Await accepted T02; then use the user-authorized Wrangler session for the plan-designated staging Havok smoke only. Do not publish production or change plans. |
| T05 | first local flick, touch, and camera | PLANNED | Unassigned | T02, T03 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T06 | pure referee and turn/scoring rules | PLANNED | Unassigned | T01, T02 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T07 | formations and legal restarts | PLANNED | Unassigned | T01, T06 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T08 | placed-shot interface and local match HUD | PLANNED | Unassigned | T05, T07 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T09 | full local rule integration | PLANNED | Unassigned | T06, T08 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T10 | one basic AI | PLANNED | Unassigned | T09 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T11 | PostgreSQL migrations and identity service | ACCEPTED | Coordinator; exact packets in OWNERSHIP.md | T01 | See OWNERSHIP.md | execution_state/reports/T11-hosted-implementation.md; execution_state/reports/current-identity-runtime-review.md | Accepted T11. T12 still waits for T05; T13 still waits for T04/T12. Identity UI, actual proxy and Railway deployment remain future tasks. |
| T12 | same-origin identity UI and mandatory gate | PLANNED | Unassigned | T11, T05 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T13 | edge proxy, authenticated rooms, and slots | PLANNED | Unassigned | T04, T11, T12 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T14 | durable authoritative shot transaction | PLANNED | Unassigned | T13, T06, T07 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T15 | client authority and shared playback | PLANNED | Unassigned | T14, T09 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T16 | recovery, hibernation, and result persistence | PLANNED | Unassigned | T14, T15 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T17 | authenticated two-browser online match | PLANNED | Unassigned | T10, T12, T15, T16 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T18 | spectators, private waiting queue, and rematch | PLANNED | Unassigned | T17 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T19 | share links and username invitations | PLANNED | Unassigned | T18, T11 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T20 | public casual matchmaking | PLANNED | Unassigned | T17, T18 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T21 | sound, cinematic, visual and mobile polish | PLANNED | Unassigned | T09, T10, T15 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T22 | integrated security, reliability, and QA | PLANNED | Unassigned | T17, T18, T19, T20, T21 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T23 | staging deployment and operational handoff | PLANNED | Unassigned | T22 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T24 | user playtest, production gate, and finish | PLANNED | Unassigned | T23 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |

## T02 intended-shot run 18

- 2026-10-10: GitHub Actions run [#18](https://github.com/folaoluwafemi/korre/actions/runs/38042497937) on commit `479fd74a5017640b0e9f69c26cad8e4f384aa325` completed successfully. Hosted verification, the integration test, and all three one-worker Chromium E2E tests passed. The 40-trial intended-shot diagnostic used the pinned Havok WASM and uploaded artifact `11665948583`. The exact 814,424-byte ZIP is preserved at `reports/T02-B2-intended-shot-observations-run-18.zip`; recomputed SHA-256 `570ba77d2213477aee6833f1d7c59edea865f0e2266018804f9b86e9728d86ea` is recorded exactly in `reports/T02-B2-artifact-retrieval-run-18.md` and matches GitHub metadata. The extracted JSON digest is recorded there as well. Independent run-18 artifact review PASS is recorded at `reports/T02-B2-artifact-review-run-18.md`. T02-B2 remains `CHANGES_REQUIRED` until the canonical clearance epsilon criterion is resolved; no epsilon classification or production physics selection is inferred from raw signed clearances.

## T02 run-18 coordinator record audit

- 2026-10-10: The independent status audit first identified stale pending language and hash attribution, then two bounded record repairs were reviewed with further findings. Coordinator repair 3 addressed the final stale ledger sentence; independent re-review PASS is recorded at `reports/T02-B2-run18-status-audit-repair-3-review.md`. The run-18 hosted/artifact evidence is now consistent across `tasks.json`, this ledger, and `OWNERSHIP.md`. T02 remains `RUNNING`; T02-B2 remains `CHANGES_REQUIRED` because canonical clearance epsilon is unresolved.
## Current build review
- User requested a pass over the implemented code before testing. Three independent source audits cover browser/scene/SDK, physics/protocol, and identity/API/database.
- D38 now supplies the clearance margin as an adjustable engineering default. Historical run-18 null measurements remain preserved; new classification must distinguish peak from traversal. T02 is still RUNNING and does not unblock first flick/deployed physics.
- T11's disposable PostgreSQL checks are prepared on GitHub; they have not run yet for these changes. The user need not provision Railway to run these tests. No unrelated Railway project is touched.
- Browser usability/performance fixes are in progress. T03 remains an accepted static preview; improvements require fresh independent review and hosted evidence before acceptance.
- The catalogue table above is regenerated from tasks.json for readability. Earlier run reports below remain historical evidence, not current blockers.

## C00-B calibration contract/schema accepted
- C00-B is ACCEPTED for its canonical nullable calibration type/schema and frozen contracts after exact-head run 38080651730 on `63c8cdb379a508fa9333d2ec6f3c510739a8e0ac`. Focused tests passed 11/11; `pnpm verify` passed typecheck/lint/format/build with 24 files and 100 tests; PostgreSQL migrations passed twice; integration passed 1/1; Chromium passed 4/4 with zero skipped/unexpected/flaky. The exact-head review is `reports/C00-B-runtime-review-run-38080651730.md`; full logs and actual artifacts are under `reports/C00-B-run-38080651730/`. The initial formatting failure in run 38080345526 and reviewed repair are retained. This acceptance does not claim runner null rejection, candidate labels, substeps, settling, shot traversal, deployed Havok or playability. C00 is now under independent coordinator-handoff review; T02 remains RUNNING.

## C00 handoff accepted; T02-F01 dispatched
- Independent C00 handoff review PASS is saved at `reports/C00-contract-preparation-review.md`. C00 is ACCEPTED only for C00-A/B contract/schema evidence and frozen producer signatures; it does not accept a runner, physics behavior, deployed Havok, playability, or parent T02.
- The exact completion checker reports T02-F01 ready after ACCEPTED `parent:T01`, T02-C0, T02-C2, C00-A and C00. The fact producer is assigned to `/root/toolchain_audit` on only the files listed in `execution_state/packets/T02-F01-facts.md`; `/root/swarm_review` is its independent reviewer. No local application checks run. Hosted implementation verification and source review remain pending; parent T02 remains RUNNING.

## Review accepted after hosted verification

GitHub run 38057543954 on 22a7375e1b57a01d1bd91e23f18749ed7096d4a8: all 24 files/98 tests passed with zero skips, workspace checks/builds, migrations twice, integration and all four built-browser cases passed. No local build/test. Independent current review reports passed; no deployed physics or gameplay claim.

T11 and the bounded T02-B2 diagnostic are ACCEPTED. T02 remains RUNNING, T04/T05 and full gameplay remain unfinished. Current authority is tasks.json plus reports/current-review-validation.md; preceding review-progress entries are historical. No credentials or numeric epsilon input are needed for the next independent source packets.
C01 is materialized under T02 and remains IMPLEMENTING. Coordinator source includes a separate Cloudflare Workerd Vitest job and named binding smoke test, protected one-run identity test secrets, hosted log capture with source/run identity, a complete Wrangler dry-run output/hash inventory, and a production-only browser build inventory. The independent source/config review passed at `execution_state/reports/C01-review.md`. Exact-head hosted verification and artifact integrity checks remain pending. A diagnostic browser/game harness producer does not yet exist, so no diagnostic artifact or C01 acceptance is claimed. `execution_state/reports/C01-implementation.md` records the current scope and local document/lockfile-only checks.
T02-F01 implementation is saved in exactly `games/counterball/src/simulation/facts.ts`, `games/counterball/src/simulation/facts.test.ts`, and `execution_state/reports/T02-F01-implementation.md`. The pure producer latches oriented goal-mouth qualification at the center-plane crossing and emits the whole-body event at trailing-support clearance; its report explicitly limits interpolation claims. `/root/swarm_review` is assigned independent source review only. No local application checks ran, hosted checks are pending, and parent T02 remains RUNNING.
The independent F01 review returned CHANGES_REQUIRED at `execution_state/reports/T02-F01-review.md`. It supplied concrete multi-substep sideways/upward mouth-drift and 85°→95° rotational exit/re-entry counterexamples. Repair 1 is bounded by `execution_state/packets/T02-F01-repair-1.md`: revalidate the entire goal passage and find earliest support roots without endpoint-sign monotonicity, with explicit regressions. `/root/toolchain_audit` implements; `/root/foundation_review` re-reviews. No local tests ran; F01 and parent T02 remain unaccepted.
