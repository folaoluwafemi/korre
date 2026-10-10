# Execution ledger

This file records evidence-backed task transitions. The immutable seed remains at `knowledge_base/execution/status.json`; its initial READY state is not implementation evidence.

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
| T02 | isolated headless Havok shot runner | RUNNING | Coordinator; exact packets in OWNERSHIP.md | T01 | See OWNERSHIP.md | None | D38 resolves the diagnostic epsilon as a provisional engineering default. Review/fix probe classification and run hosted checks. T02 still requires canonical runner, facts, typed failures, cancellation and actual restart loft; no human numeric input is needed. |
| T03 | procedural pitch, caps, and button | ACCEPTED | Coordinator; exact packets in OWNERSHIP.md | T01 | See OWNERSHIP.md | execution_state/reports/T03-implementation.md; execution_state/reports/T03-hosted-review-1.md | Accepted. T05 remains blocked until T02 is ACCEPTED; continue the hosted calibration artifact and deployed Havok gates. |
| T04 | Cloudflare actual WASM smoke | PLANNED | Unassigned | T02 | See OWNERSHIP.md | None | Await accepted T02; then use the user-authorized Wrangler session for the plan-designated staging Havok smoke only. Do not publish production or change plans. |
| T05 | first local flick, touch, and camera | PLANNED | Unassigned | T02, T03 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T06 | pure referee and turn/scoring rules | PLANNED | Unassigned | T01, T02 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T07 | formations and legal restarts | PLANNED | Unassigned | T01, T06 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T08 | placed-shot interface and local match HUD | PLANNED | Unassigned | T05, T07 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T09 | full local rule integration | PLANNED | Unassigned | T06, T08 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T10 | one basic AI | PLANNED | Unassigned | T09 | See OWNERSHIP.md | None | Wait for ACCEPTED dependencies; see TASKS.md |
| T11 | PostgreSQL migrations and identity service | RUNNING | Coordinator; exact packets in OWNERSHIP.md | T01 | See OWNERSHIP.md | None | Run real PostgreSQL repository, HTTP composition and migration checks on the disposable GitHub CI service, then independent parent review. Railway is not needed for CI acceptance. |
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
