# T02-L01 guard-contract repair 1 review

**Verdict: PASS for the bounded contract repair.** The documents preserve proposal 4's separate restart-loft guard and matrix limits. The invalid one-argument attachment example is corrected to the pinned Playwright API. Runtime and physics remain **NOT RUN**; this review does not authorize or accept a trial.

## Review scope and checks

- Extracted `T02-L01-GUARD-CONTRACT-1` with `node scripts/check-completion-plan.mjs --packet T02-L01-GUARD-CONTRACT-1`. Plan consistency passed. Current task state shows parent T01 is ACCEPTED and this card is IMPLEMENTED; the checker reports `ready: false` because the card is no longer an unstarted READY/PLANNED packet. This result does not establish runtime readiness.
- Read the exact coordinator packet, proposal 4 and its independent review, the initial implementation report/review, the repair 1 implementation report, and the two assigned documents: `knowledge_base/execution/CONTRACTS.md` and `knowledge_base/execution/completion/CONTRACT_WORK.md`.
- Read the locally installed pinned Playwright declaration at `node_modules/.pnpm/playwright@1.64.0/node_modules/playwright/types/test.d.ts:2382-2402` for the attachment signature. No app build, test, browser, Havok, physics or deployment command was run.

## Findings

The restart-loft contract remains consistent with proposal 4. `CONTRACTS.md:367-371` defines a separate `restartLoftDiagnosticGuard`, preserves the accepted `browser-direct-impulse-v1` guard and `physicsCalibration: null`, retains protocol wire version 1, and defers the outer config change from schema/config version 2 to 3 to a later schema implementation. `CONTRACT_WORK.md:120-150` specifies that outer version change and the nested `schemaVersion: 1`, `configSchemaVersion: 3`, `protocolVersion: 1` values. The strict identity, fixture and WASM digests, matrix and setup, materials, energy, sweep, workload and artifact fields still match proposal 4. The existing direct-shot guard and its nested version are not changed.

The repaired call at `CONTRACT_WORK.md:192` is valid for Playwright 1.64.0: `await testInfo.attach("counterball-l01-matrix.json", { path: finalPath, contentType: "application/json" })`. The pinned declaration uses `attach(name: string, options?: { ... path?: string; contentType?: string })`; the stable JSON filename and both supplied options match that API. This corrects the original `testInfo.attach({ path })` defect without changing the artifact semantics.

The bounded transport requirements remain intact at `CONTRACT_WORK.md:188-192`: the browser exposes the complete payload only as a download after success; the full matrix is not put in DOM text or returned through one page-evaluation call; Playwright saves to a temporary file under `test-results/`, streams byte counting, hashing and validation within the stated caps, and atomically renames only after all assertions pass. It then attaches the verified final path. The failure path removes temporary/final files and creates no success attachment. The case and matrix byte ceilings and workload values remain those of proposal 4 (`CONTRACT_WORK.md:145-146,178-184`).

The contract continues to label material, energy, clearance and workload selections as provisional diagnostics, not gameplay calibration or rule defaults (`CONTRACTS.md:369`; `CONTRACT_WORK.md:120,142,150,160,178`). It states that no restart-loft trial is authorized before accepted guard/schema contracts and the exact runtime packet, and does not claim any runtime, traversal, playability or deployed-Havok result (`CONTRACTS.md:371`; `CONTRACT_WORK.md:190-192`).

No further contract finding blocks this repair. The matrix still requires a later accepted schema/runtime packet and exact-head hosted verification; none was performed here.
