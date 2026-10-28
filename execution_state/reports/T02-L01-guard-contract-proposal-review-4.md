# T02-L01 guard contract proposal 4 review

**SOURCE/CONTRACT verdict: PASS.** The guard and schema split is suitable for shared contract/schema materialization. One browser-artifact transport requirement remains before dispatching the L01 matrix source card; it does not require a guard or schema contract change.

This was a read-only source/contract review. Runtime and physics were **NOT RUN**.

## Review-3 findings

1. **Browser route, command, and evidence are specified.** Proposal lines 84–86 assign the five-path matrix card, keep its Vitest file pure, call for a distinct test in `tests/e2e/counterball-direct-probe.spec.ts`, name the Chromium diagnostic invocation and require zero skips plus the raw attachment. The current Playwright config selects Chromium and maps that spec. The CI workflow maps the same path at `.github/workflows/ci.yml:335`, runs the expanded diagnostic list at lines 371–373, and uploads `test-results/` at lines 377–387. This verifies routing and retention requirements, not an executed matrix.
2. **Schema card ID is exact and consistent.** `T02-L01-GUARD-SCHEMA-1` appears in the amendment, schema dependencies, L01 appended dependencies, and dispatch gate (proposal lines 82–86).
3. **Sweep field names are consistent.** The strict inventory and operative prose use `maximumPointSweepPerCall`, `maximumRotationPerCall`, and `maximumCallsPerNominalTick` (lines 32 and 62).
4. **Artifact comparisons are inclusive.** The inventory maxima, prose `<=` limits, and `>` rejection comparison agree (line 72).

## Earlier findings and contract checks

- The config-independent fixture digest recomputes to `6ce26e4203017e446687dfd8ad95106ba582f09420f8c623129c7d1bbe6b625d` after recursively omitting the eight `configHash` leaves and canonicalizing the remaining JSON. The proposal correctly keeps the exact post-update fixture-byte digest as separate provenance to freeze after the fixture update (line 12).
- Scene facts distinguish the six unchanged goal-frame colliders from the seventh support slab; the slab remains open and preserves its top, thickness, material, filters, and trigger flag while the apron dimensions change (line 46).
- Case metadata enumerates the required identity, provenance, native body/material/static-scene reads, energy, final-state, and settling facts, and requires actual UTF-8 byte counting against 65,536 bytes (line 70).
- The four proposed write sets have 2, 4, 5, and 5 paths, respectively: contract docs; packet/catalogue/task control files; schema/config/fixture files; and matrix runner/test/browser/page/E2E files (lines 80–84). These sets are disjoint.
- The packet record retains original L01 dependencies in their exact order: `C00-B`, `C01`, `T02-B0`, `T02-C0`, `T02-C2`, `C00`; the proposal appends the contract and schema cards without deleting or reordering them (line 82). The current ledger confirms T01 and those original dependencies are ACCEPTED; T02-L01 remains BLOCKED, as the proposal requires until the added contract/schema prerequisites are accepted.
- The matrix preserves the exact 24 tuples and nested order: gap outermost, then tilt, impulse, azimuth (proposal line 42; packet record). The setup applies only the planar impulse at the selected cap’s native COM. The new hashed guard is diagnostic-only, leaves the accepted direct-shot guard unchanged, keeps `physicsCalibration: null`, and cannot feed local, AI, online, or deployed simulation (lines 8, 40–62).
- The guard semantics retain the 34 energy ceiling, 0.01125 COM-drop and point-sweep limits, 0.005 diagnostic clearance margin, 325-unit open apron, and at most 48 public calls per nominal tick. The proposal explicitly avoids claiming those public calls are low-level WASM substeps and describes the result as bounded discrete-step evidence (lines 32, 45–62).
- Workload arithmetic is consistent: 1,800 × 48 = 86,400 calls/case; 24 cases = 2,073,600 calls; 720 batches/case and 17,280 total; 27,015 body rows/case and 648,360 total; 8,192 contacts/case and 196,608 total. The stated worst-case case arithmetic is 19,935,744 bytes, below 20 MiB. Twenty-four 20-MiB cases plus the 64-KiB matrix envelope total 503,382,016 bytes, below the 504,365,056-byte cap (line 72).
- Runtime authorization is properly staged: contract work is document-only; the schema card follows accepted contract and packet cards; L01 dispatch waits for accepted contract/schema cards; no physics trial is authorized by this proposal (lines 80–86). T01 and the original dependencies are ACCEPTED in the current ledger; the packet checker’s `ready: false` is consistent with T02-L01 remaining BLOCKED.

## Required matrix source-card transport

Proposal line 72 requires streaming to a temporary output, hashing the complete encoded bytes, and atomically renaming only after all assertions pass. The physics matrix runs in a browser page, which cannot create or atomically rename a host filesystem file. Line 84 also requires Playwright to attach the complete matrix JSON (up to 504,365,056 bytes) without specifying the browser-to-test artifact path. The current D01 page renders its small trace as DOM JSON, and the current spec reads `textContent` and attaches a JSON body; those patterns do not establish a bounded route for this matrix size.

Before dispatching T02-L01, its source card should assign host-file operations to the Playwright test and require this acceptance path: the page shows only a compact summary and emits the complete artifact as a browser download; the test saves that download to a temporary path under `test-results/`, checks the exact byte cap and complete integrity hash by streaming the saved file, runs the required tuple/row/call/batch/time assertions, atomically renames the validated file within that directory, and attaches it with `testInfo.attach({ path })`. The full matrix must not be rendered in the DOM or returned as one large `page.evaluate`/IPC value. On any failure, no successful artifact is attached or left at the final path. CI already uploads `test-results/`.

This is a precise implementation requirement for the matrix source card, not a blocker to contract/schema materialization. No application test, build, browser run, Havok trial, or physics validation was performed.

