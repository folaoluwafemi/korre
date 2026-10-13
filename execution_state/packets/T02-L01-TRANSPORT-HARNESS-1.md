# T02-L01-TRANSPORT-HARNESS-1 — expose test-only transport controls in the diagnostic build

**Status:** proposed coordinator packet amendment; not implementation evidence.

**Parent:** T02.

**Objective:** Make the existing restart-loft diagnostic controls and host acknowledgement available in the explicitly flagged `dist-dev` harness, while proving both remain absent from the ordinary production bundle. This fixes the observed Vite build-mode mismatch without changing the CI route or creating new player-facing behavior.

**Authority:** Existing T02 diagnostic-only scope. `VITE_COUNTERBALL_DEV_HARNESS=1` explicitly selects the non-production test harness. The normal production build leaves that flag unset. No gameplay rule, physics setting, identity gate, or shared API changes.

**Depends on:** `C00-B`, `C01`, `T02-B0`, `T02-C0`, `T02-C2`, `C00`, `T02-L01-GUARD-CONTRACT-1`, `T02-L01-GUARD-SCHEMA-1`, `T02-L01-PACKET-SPLIT-1`, and `T02-L01-BROWSER-1-SUCCESSOR-3` (all are preserved from the blocked transport packet).

**Read first:** `AGENTS.md`; `knowledge_base/execution/DECISIONS.md`, `CONTRACTS.md`, `TASKS.md`, `SWARM.md`; completion `README.md`, `OPERATIONS.md`, `CONTRACT_WORK.md`, `ACCEPTANCE.md`, and `LOCAL_NOTES.md`; exact packet `T02-L01-TRANSPORT-1`; accepted browser successor report; failed run report and independent review for run 38438560050; `apps/web/src/CounterballDirectProbe.tsx`; `apps/web/src/App.tsx`; `apps/web/src/vite-env.d.ts`; `tests/production/counterball-dev-match-absent.mjs`; `tests/e2e/counterball-direct-probe.spec.ts`; `.github/workflows/ci.yml`.

**Inputs:** Existing component checks for the loft-matrix panel, host acknowledgement validator, and host callback installation; the declared `VITE_COUNTERBALL_DEV_HARNESS` flag; the already routed diagnostic browser spec; and ordinary production bundle inventory check.

**Output:** In `CounterballDirectProbe.tsx`, one compile-time diagnostic predicate permits the current `DEV` behavior or the explicit harness flag and consistently gates the panel, acknowledgement validation, and callback installation. The existing full-cap E2E test checks panel and write-control visibility promptly before starting its transfer, then verifies a host acknowledgement succeeds for the matching completed download. The production-output check rejects transport-control and host-acknowledgement marker strings.

**Allowed writes (worker):**

- `apps/web/src/CounterballDirectProbe.tsx`
- `tests/production/counterball-dev-match-absent.mjs`
- `tests/e2e/counterball-direct-probe.spec.ts`

The coordinator alone updates catalogues, packet index, ownership and `execution_state/tasks.json`. Implementation report: `execution_state/reports/T02-L01-TRANSPORT-HARNESS-1-implementation.md`. Independent review report: `execution_state/reports/T02-L01-TRANSPORT-HARNESS-1-review.md`.

**Read-only:** All other source, contracts, workflow/configuration, accepted dependency reports, and prior run evidence.

**Do not change:** `.github/workflows/ci.yml`, Playwright routing/config, package scripts, shared contracts, OPFS transport encoding or byte/chunk caps, route selection, gameplay/physics defaults, or diagnostic scope. Do not expose controls in the normal production build. Do not call this a playable match or physics evidence.

**Implementation steps:**

1. Define one `DEV || VITE_COUNTERBALL_DEV_HARNESS === "1"` compile-time predicate in the existing diagnostic component and use it for all three current `import.meta.env.DEV` gates: attestation validation, host callback installation, and panel rendering.
2. Add an early, bounded visibility assertion to the existing full-cap transport E2E before clicking the write control. After the diagnostic scene reaches ready, confirm the host acknowledgement callback is available and the existing transfer accepts it only for the matching completed download. The callback may be installed before scene readiness; do not add a new timing gate. Keep the exact accepted transfer size, deterministic digest, ordering and cleanup assertions unchanged.
3. Extend the existing production marker scan with the transport write-control label and host-ack global marker. Keep the explicit unset-flag guard.
4. Do not alter CI routing. If the existing workflow does not collect the diagnostic E2E or cannot run this prebuilt bundle, stop and request a separately reviewed coordinator card.

**Required checks:**

1. Local lightweight check only: `git diff --check -- apps/web/src/CounterballDirectProbe.tsx tests/production/counterball-dev-match-absent.mjs tests/e2e/counterball-direct-probe.spec.ts`.
2. GitHub exact-head workflow from `.github/workflows/ci.yml`: frozen install, `pnpm verify`, production diagnostic-absence check, integration, production preview E2E, diagnostic build/package, and all routed diagnostic E2E tests. Record exact SHA/run, full logs, step counts, browser JSON, retries/skips and artifact hashes. The diagnostic suite must collect the full-cap transport test and finish with no skip, retry or failure.
3. Independent exact-source and exact-run review; the reviewer must confirm the diagnostic controls and callback exist in the flagged build, production marker check excludes them, and no route/config/physics changes occurred.

**Acceptance:**

- The explicitly flagged diagnostic browser run can see and activate the existing transport writer; after scene readiness, its host acknowledgement callback completes only for the matching downloaded file and valid byte-count/digest attestation.
- The ordinary production build contains neither the transport UI nor its host acknowledgement marker; the production absence command passes.
- Existing full-cap transfer passes on real Chromium with exact size and digest and with browser/host temporary-file cleanup; no skips/retries.
- Exact source and run are independently reviewed. This packet does not accept T02 or the transport card; the coordinator separately records transport evidence against its original acceptance criteria.

**Negative cases:** No mock or Node result can substitute for Chromium; do not lower the accepted byte cap, add a production escape hatch, weaken cleanup, or imply a physics result from the synthetic transfer.

**Review questions:** Are all three gates controlled by the same explicit harness predicate? Does ordinary production remain free of both UI and acknowledgement markers? Does the exact routed browser suite execute the unchanged bounded transport path and cleanup?

**Stop conditions:** If a workflow/routing edit, extra write path, schema/contract change, or new production-visible behavior is needed, stop and request a separately reviewed coordinator packet. Preserve the original transport packet dependencies and its `CHANGES_REQUIRED` evidence until this packet is accepted and transport is independently reviewed.
