# T02-L01-GOALFRAME-F32-MATRIX-1 packet review

**Verdict: PASS for dispatch of this bounded packet. Runtime: NOT RUN.**

## Plan and ownership

The exact extraction `node scripts/check-completion-plan.mjs --packet T02-L01-GOALFRAME-F32-MATRIX-1` passed: 118 packets, 21 remaining parents, and this packet as the sole initial-ready packet. It reports `ready:true` and inherited `required_parent_acceptance: ["T01"]`. I verified all 15 explicit dependencies are ACCEPTED in `execution_state/tasks.json`. T01 is ACCEPTED; parent T02 remains RUNNING, so this packet can proceed without implying parent acceptance.

The two source write paths are exactly `games/counterball/src/simulation/loftCoarseRunner.ts` and `games/counterball/src/simulation/loftCoarseProbe.test.ts`. The packet owns no config, schema, fixture, protocol, UI, E2E, CI, task-state, or ledger changes. The implementation report is evidence only. The task row remains PLANNED. The source paths have no pending local diff at review time.

## Contract and source scope

The accepted clause in `knowledge_base/execution/completion/CONTRACT_WORK.md:206-212` permits one narrow change: in the temporary L01 diagnostic goal-frame preflight, keep the `CYLINDER` check and require every finite positive X/Y/Z native span to equal exactly `Math.fround(existing configured expected span)`. It forbids rounding observed values, epsilon/neighbor acceptance, geometry/config/hash/schema changes, and changes to raw native metadata or the same-read local-AABB failure evidence. The accepted contract report and corrected proposal review preserve that scope.

The current runner computes upright and crossbar expected spans from the existing geometry and strictly compares native dimensions at [loftCoarseRunner.ts:1139-1155](../../games/counterball/src/simulation/loftCoarseRunner.ts). The already available `matchesExactFloat32Projection` rejects non-finite inputs and non-finite projections, then uses strict equality against `Math.fround(configured)` at [loftCoarseProbe.ts:564-571](../../games/counterball/src/simulation/loftCoarseProbe.ts). The packet's proposed substitutions therefore fit the existing helper and change no public contract. Exact tests in the assigned helper suite can cover the stated upright spans `(0.12, 0.8, 0.12)` and crossbar spans `(2.4, 0.12, 0.12)`, rejecting nominal doubles and adjacent projected values while preserving all other helper and runner behavior.

The measured evidence is limited to goal-frame-0: the independent review of run 38624231947 confirms native spans `0.11999999731779099`, `0.800000011920929`, `0.11999999731779099`, equal to the Float32 projections of configured `(0.12, 0.8, 0.12)`. The run stopped at strict preflight before impulse, executeStep, any completed tuple, or matrix download. Crossbar X `Math.fround(2.4) = 2.4000000953674316` and the remaining goal-frame readbacks remain inference, not measurements. The accepted contract explicitly requires every actual native read in the full matrix to pass; any discrepancy remains fail-closed. This is a sound bounded test of the hypothesis, not certification of unseen shapes.

## Verification boundary

The existing workflow dynamically selects the produced diagnostic E2E suite (`.github/workflows/ci.yml:389-431`), and the current full-matrix test already invokes the matrix action, waits for the successful download, and performs bounded host validation at [counterball-direct-probe.spec.ts:2780-2917](../../tests/e2e/counterball-direct-probe.spec.ts). The packet keeps the accepted producer and workflow unchanged. It requires the exact reviewed SHA to pass `pnpm verify`, integration, production Chromium, and the selected diagnostic Chromium suite with zero skips, retries, or flakes, followed by independent full artifact review. The CI job limit is 20 minutes and the matrix test timeout is 1,100,000 ms; the complete exact-SHA job and artifact must demonstrate that the matrix plus surrounding checks fit. If they do not, the packet correctly stops for a separately reviewed workflow amendment before another matrix attempt.

The accepted contract and run evidence make the state boundary explicit: even a passing matrix would accept only this bounded L01 diagnostic result. It would not accept T02, physics calibration, a production runner, deployed Cloudflare Havok, or a playable match. No application, test, browser, physics, or Cloudflare command was run for this packet review.
