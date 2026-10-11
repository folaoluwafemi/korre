# T02-L01 packet-split architecture review

**SOURCE/PLAN verdict: CHANGES_REQUIRED before dispatching the proposed split.** The three serial source packets fit the existing ownership boundaries and can reuse the accepted Chromium route. The proposed OPFS-to-download handoff is not established by the accepted contract/API evidence and must be demonstrated without materializing the complete matrix in memory. **RUNTIME: NOT RUN.** No source, runner, browser, Havok or physics execution was performed.

## Accepted baseline

The exact checker records for `T02-L01`, `T02-L01-GUARD-CONTRACT-1`, and `T02-L01-GUARD-SCHEMA-1` were extracted. Plan consistency passed; `T02-L01` is currently ready. The two guard-card records are no longer unstarted packets. The accepted contract report says the guard document work alone did not run physics; the accepted schema report accepts config/schema/fixture scope only and explicitly does not accept T02 or L01.

The current L01 record already has the proposed union of five source paths: `loftCoarseProbe.ts`, its `.test.ts`, `browser.ts`, `CounterballDirectProbe.tsx`, and `counterball-direct-probe.spec.ts`. Its Vitest file is explicitly pure; only Chromium with Babylon Engine and pinned Havok can run the 24 trials. Its acceptance requires exact tuple/setup/provenance checks, strict guard enforcement, all recorded rows, streamed host verification, zero skipped/retried matrix tests, and no gameplay/calibration inference.

## Decomposition assessment

The proposed serial division is structurally sound, with these packet boundaries:

1. **CORE:** `games/counterball/src/simulation/loftCoarseProbe.ts` and `games/counterball/src/simulation/loftCoarseProbe.test.ts`. The latter must contain only pure matrix, identity, guard, serialization and byte-sink tests; it must never call Babylon physics, Havok or NullEngine. The runner should write through an awaited, bounded sink with backpressure, propagate cancellation, retain at most the current bounded case, and abort the sink without a success result on any guard or output failure.
2. **BROWSER:** `games/counterball/src/browser.ts` and `apps/web/src/CounterballDirectProbe.tsx`. This should expose a distinct development-only matrix action that passes the page's real Engine and connects the bounded sink. The page may show a compact summary only. It must remove temporary storage after error, cancellation, unmount or failed finalization.
3. **HOST:** `tests/e2e/counterball-direct-probe.spec.ts`. The test must wait for the successful matrix download, save it under `test-results/`, stream the byte/hash/tuple/case/call/batch/time assertions with at most one 20-MiB case plus the envelope retained, and atomically finalize and attach only after all checks pass. It must remove temporary/final output and attach nothing on failure.

The existing CI diagnostic route already selects `counterball-direct-probe.spec.ts`; the existing evidence upload includes `test-results/`. Keeping the matrix test in that file avoids a new Playwright allowlist entry and workflow candidate. No CI routing or workflow change is needed for this split. The hosted command remains the existing Chromium diagnostic command with `COUNTERBALL_DEV_E2E=1 COUNTERBALL_PREBUILT_PREVIEW=1`; `DEV_E2E` selects the separately compiled `dist-dev` build. `pnpm verify` remains pure helper/schema/unit/build coverage and cannot be reported as the matrix run.

The coordinator should materialize this split before assigning source work. Reclassify `T02-L01` as a zero-source-path coordinator integration/acceptance packet whose dependencies include all three accepted child packets while preserving every current L01 dependency and parent T01 edge. The existing L01 dependencies are `C00-B`, `C01`, `T02-B0`, `T02-C0`, `T02-C2`, `C00`, `T02-L01-GUARD-CONTRACT-1`, and `T02-L01-GUARD-SCHEMA-1`; none may be dropped or reordered. Confirm the plan validator accepts the zero-write coordinator record; if not, materialize a separate coordinator integration packet and keep the original graph requirements intact. The integration packet must own the original acceptance matrix and integrated exact-SHA run/artifact review, not duplicate source ownership.

## Transport/API gap

The accepted contract at `CONTRACT_WORK.md:188-192` requires the browser to expose the completed compact JSON as a download, the Playwright host to save and stream-validate it, and a named path attachment after atomic rename. It forbids the full matrix in DOM text or a single page-evaluation/IPC result. The proposed CORE byte sink and HOST streaming validator align with these bounds.

The proposed BROWSER implementation changes the staging mechanism to an OPFS temporary file and then exposes a “downloadable File.” The accepted records do not establish that this conversion streams the OPFS-backed file into the browser download manager without buffering a substantial or complete payload in page memory. A full `Blob`/string assembly or `page.evaluate` transfer would violate the accepted bounded-memory contract. The browser must also clean up its OPFS temp on quota/write/cancel/unmount failures, and the host must clean up its `test-results` temporary path. Therefore OPFS is a viable candidate only if the Browser/Host packets include a reviewed real-Chromium transport proof of chunked writing, completed-file download, download-to-disk, host streaming validation and failure cleanup. No separate workflow routing is needed; a separate bounded transport proof card is appropriate only if that evidence cannot fit safely into BROWSER/HOST acceptance before the matrix trials. If a bounded download path cannot be proven, stop for an accepted transport-contract amendment rather than sending the whole JSON through DOM or one IPC message.

The fixed envelope permits 504,365,056 bytes (481 MiB) maximum, with up to 20 MiB per case. OPFS capacity, download backing, host disk space, attachment copying and cleanup behavior at those sizes have not been demonstrated in the reviewed accepted records. The transport test must treat unavailable space or any cap violation as a fatal incomplete run with no success artifact; it may not truncate or omit rows.

## CI budget and acceptance hazards

The guard allows 720,000 ms (12 minutes) for the full matrix, while the hosted CI job has a 20-minute total timeout. The remaining eight minutes must cover frozen install, type/lint/format, full Vitest/build, integration, production browser tests, diagnostic build, transport validation and attachment. Static arithmetic shows the matrix ceiling is below the total job ceiling, but it does not show that the complete job will fit. The accepted L01 packet itself calls these stop ceilings, not a measured fit guarantee, and requires a hosted run within the job deadline. Thus the 20-minute cap cannot be accepted without an exact-hosted benchmark and a full successful exact-SHA matrix run. Do not lower the tuple, row, call, or time limits to make the run green; if it cannot meet the job budget, use a separately reviewed workflow/deadline amendment.

Other conditions for acceptance:

- Preserve all 24 tuples in the required order and all current case/setup/provenance/material/energy/sweep/settling assertions across the child packets. The coordinator's final L01 card must review the merged execution and complete artifact, not just each card's source review.
- Validate both lifecycle layers: Core cancels and closes its sink; Browser removes OPFS temporary data; Host removes partial files. A timeout or failed Playwright attachment must never leave a success file.
- Keep the artifact attachment as a path using the accepted named `testInfo.attach(name, { path, contentType })` shape; do not pass a 481-MiB string or buffer as an attachment body.
- Require exact-head CI completion with the matrix test collected and zero skips/retries, the full JSON attached under `test-results/`, and independent source plus artifact review. No successful run exists in the evidence reviewed for this analysis.
- Keep every guard value provisional and diagnostic-only. Schema acceptance does not accept physics calibration, continuous-motion proof, gameplay rules, parent T02, or deployed Havok.

## Check evidence and limits

- Ran `node scripts/check-completion-plan.mjs --packet T02-L01`, `--packet T02-L01-GUARD-CONTRACT-1`, and `--packet T02-L01-GUARD-SCHEMA-1`. These are plan-consistency checks only; they report no implementation/runtime execution.
- Read `knowledge_base/execution/completion/CONTRACT_WORK.md`, `ACCEPTANCE.md`, `OPERATIONS.md`, `execution_state/reports/T02-L01-guard-contract-acceptance-1.md`, and `execution_state/reports/T02-L01-guard-schema-acceptance-1.md`.
- No source, install, build, test, browser, physics, deployment, schema, or workflow check was run. This report makes no runtime or physics claim.
