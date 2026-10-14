# T02-L01 to T02-L02 handoff readiness

**Disposition: L02 remains blocked.** This is a read-only handoff audit. It does not accept L01, select a candidate, or claim any refinement run.

## Current gate state

Both exact packet extractions pass plan consistency, with 124 packets and no initially ready packet:

- `node scripts/check-completion-plan.mjs --packet T02-L01` — `ready:false`.
- `node scripts/check-completion-plan.mjs --packet T02-L02` — `ready:false`.

In `execution_state/tasks.json`, T01 is ACCEPTED and T02 is RUNNING. L01 remains PLANNED. Thirteen of L01's fourteen direct dependencies are ACCEPTED; `T02-L01-SUPPORT-DATUM-MATRIX-1` is CHANGES_REQUIRED. L02 has only the parent dependency `T02-L01` and retains `required_parent_acceptance: ["T01"]`. Therefore no L02 work is unblocked. The current L01 implementation report says the full matrix and hosted checks are pending. The earlier run 38638496304 stopped before WASM fetch, impulse, or `executeStep`; it is not matrix evidence.

## Minimal L01 closeout before handoff

After the matrix repair, coordinator integration should:

1. Re-extract `T02-L01` while it is still PLANNED; require `ready:true` and confirm all listed direct dependencies remain ACCEPTED plus T01.
2. Require independent source review and one exact-SHA hosted run that completes the accepted Chromium/Havok 24-tuple matrix with zero skips, retries, or flakes. Verify every tuple, actual-call guard counters, native/support/material facts, per-body/contact/sweep/settling rows, eligibility rules, encoded byte/workload caps, downloaded JSON digest, and named artifact. Review the complete raw artifact; do not accept a partial matrix or the earlier failed run.
3. Record the run SHA, run/attempt, total hosted job time, suite counts, artifact identity/path/digest, and independent source/run-artifact verdicts. Accept L01 and update its parent ledger only after every requirement passes. Preserve the explicit negative branch: a complete matrix with zero eligible candidates is valid diagnostic evidence, not playable calibration.

Only after L01 is ACCEPTED should a fresh `T02-L02` extraction be considered for dispatch.

## L02 handoff contract as currently written

The packet has one implementation write path, `games/counterball/src/simulation/loftRefinedProbe.test.ts`. Its declared inputs are `execution_state/reports/T02-L01-implementation.md`, `games/counterball/src/simulation/loftCoarseProbe.test.ts`, `packages/game-protocol/src/config.ts`, and `games/counterball/src/features/restarts/domain/placementPose.ts`. It requires at most nine refined real-Havok trials around one coarse eligible candidate, or zero trials with an explicit no-candidate result. If a candidate exists, the packet fixes a unique 3×3 grid: hold azimuth and gap; use its specified bounded/sorted tilt and impulse values; keep tilt in [30°, 60°] and impulse in [5.5, 8]. Reuse full-button crossing, swept clearance, actual no-contact, 15-body finite/settling, and the frozen every-substep guard. Keep config and fixture hashes unchanged.

The declared checks are hosted `pnpm verify` and independent review of candidate selection/output. No implementation, local, browser, or deployed-physics check is claimed here.

## Missing executable producer and smallest handoff amendment

The accepted coarse runner currently exports only `runLoftCoarseMatrix`; it always creates the canonical 24 tuples. Its one-case `runCase` and `makeCases` are private. `writeLoftCoarseMatrix` also rejects a non-24-case matrix. `browser.ts` exports the coarse API only, and no `loftRefinedProbe` file currently exists. Thus the single L02 test path cannot invoke the accepted guarded per-case implementation for only the required 3×3 grid, and it has no declared handoff of the exact accepted L01 matrix bytes/digest from which to derive the center. Copying the private physics loop into a test would duplicate the native preflight, per-call guard, sweep/contact, settlement, and cleanup logic.

Before dispatch, make the smallest coordinator-owned amendment that supplies (a) the exact accepted L01 artifact/run/SHA/digest as a bounded input and a frozen case-score rule, and (b) a reviewed reusable single-case/grid executor that calls the existing guarded implementation rather than copying it. A concrete API boundary is a `runLoftRefinedGrid({ engine, signal, candidate, sink, onProgress })` accepting a coordinator-validated candidate tuple plus the exact source matrix identity, constructing only the nine unique tuples, and returning a compact summary. The no-candidate branch must not call this executor and must return zero trials with the explicit reason. Assign any runner/export changes their own exact write paths; they are outside the current one-file L02 card.

For deterministic selection, the existing phrase “highest-clearance eligible candidate” needs to define how multiple overlap rows produce one score. A conservative reproducible rule is the minimum `minimumWholeButtonObstacleClearance.value` across all rows whose interval is not `no-horizontal-overlap`; choose the highest case score among validated eligible cases, then apply the existing tie-breaks (lower impulse, lower tilt, lower absolute azimuth, original tuple order). If the coordinator intends another score, freeze that exact aggregation before implementation.

Nine refined tuples are not members of the canonical 24-tuple coarse matrix. Keep the accepted L01 `matrixId`, tuple list, config and guard hashes unchanged. If refinement results are serialized, give them a distinct versioned diagnostic identity that references the accepted source L01 matrix ID and digest, plus the source tuple index and refinement index; do not relabel the nine rows as the canonical 24-case matrix. No production protocol identity or physics coefficient needs to change when the same accepted guard/config is reused.

## Sources and checks

Inspected the exact L01/L02 checker extracts, current task/packet state, `T02-L02-input-readiness-audit-20261014.md`, the accepted support-datum implementation/report and packet review, `loftCoarseRunner.ts`, `loftCoarseProbe.ts`, `loftCoarseProbe.test.ts`, `worldFactory.ts`, `havokRuntime.ts`, `browser.ts`, and the existing direct-probe E2E matrix flow. The source search found no `loftRefinedProbe` implementation.

Only the two packet document checks above and read-only PowerShell/`rg` inspection ran. No application tests, builds, browser runs, physics trials, or deployments ran. No catalogue, task, source, config, or contract files were changed.
