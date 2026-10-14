# T02-L01 native-dimensions Float32 proposal

Date: 2026-10-14  
Scope: source-free remediation proposal only. No source, test, contract, configuration, status, or catalogue file was changed. No application or physics command was run.

## Finding

Exact hosted run [38599929537](https://github.com/folaoluwafemi/korre/actions/runs/38599929537), commit `929067cc4e277b0ae0ec2d747ba0dd42841c414e`, failed in the diagnostic Chromium matrix before impulse or download. The retained `github-full.log` reports the button's configured radius `0.13` and height `0.045`, expected dimensions `(0.26, 0.045, 0.26)`, native AABB minima `(-0.12999999523162842, -0.02250000089406967, -0.12999999523162842)`, maxima `(0.12999999523162842, 0.02250000089406967, 0.12999999523162842)`, and observed dimensions `(0.25999999046325684, 0.04500000178813934, 0.25999999046325684)` (log lines 2054–2070).

Those three observed dimensions equal the exact Float32 projections of their configured expected values: `Math.fround(0.26) === 0.25999999046325684` and `Math.fround(0.045) === 0.04500000178813934`. This is direct arithmetic on the captured values, not a tolerance-based comparison. Current `loftCoarseRunner.ts` lines 975–1000 computes configured expected dimensions and rejects any unequal raw native dimension. Its error already retains raw AABB extrema and observed dimensions. The gate occurs before mass-property processing and before any impulse.

## Contract interpretation and recommended scope

The accepted SUPPORT-F32 and MATERIAL-F32 amendments in `knowledge_base/execution/completion/CONTRACT_WORK.md` §§162–166 establish a consistent representation policy: compare finite native readbacks to the exact `Math.fround(configured)` projection, keep the configured values and geometry unchanged, retain raw readbacks, use no epsilon, and continue using raw observed values in calculations. Applying that policy to this observed button-dimension mismatch is compatible with those principles.

However, the accepted amendments name support thickness and material values only. They do not yet authorize a geometry-dimension exception. Before implementation, the coordinator should record and independently review a small explicit amendment stating the expected-versus-native comparison for geometry. That amendment should preserve the configured radius/thickness, compare only by exact finite Float32 projection, preserve the unmodified native AABB/dimensions, and keep using raw native dimensions for all later radius, height, sweep, and energy calculations. It must state that no epsilon, geometry rewrite, config/hash change, or projected-value substitution is allowed.

The evidence supports applying the exception to the **button only**. The button is the first dynamic body checked and is the only body for which this run produced a native-dimension readback. It does not establish the actual dimensions of any cap. Keep all cap comparisons exact against their configured dimensions for this first repair. If a later exact hosted run reaches a cap and produces the same kind of mismatch, review that separate evidence and extend the accepted scope deliberately; do not generalize now merely because the bodies use cylinder shapes.

## Smallest bounded implementation and tests

After the amendment is accepted, a one-file runner change is sufficient: in the existing dynamic-dimension guard in `games/counterball/src/simulation/loftCoarseRunner.ts`, use `matchesExactFloat32Projection(expectedDimension, observedDimension)` for the three button axes only, and retain the existing strict equality checks for cap axes. Keep the existing cylinder/type, positive-finite bounds, filter, and other preflight checks unchanged. Preserve the raw values in diagnostics and metadata, and use the raw `dimensions` object downstream. The helper already used for support/material comparisons rejects non-finite values and projection overflow.

`games/counterball/src/simulation/loftCoarseProbe.test.ts` already tests exact projected-value acceptance, rejection of the unprojected configured value and adjacent Float32 values, non-finite values, and finite-value projection overflow (lines 431–465). It also tests raw projected material readback preservation. Those tests cover the comparison helper's exactness; the next hosted Chromium run is needed to prove the button-specific guard is wired correctly and to reveal whether later caps pass. No test should rewrite dimensions or loosen the guard. If inspection before dispatch finds the artifact validator requires decimal configured dimensions instead of preserving raw native dimensions, add only the necessary focused validator/writer assertion and scope that validator change explicitly; do not pre-emptively alter artifact policy.

The repair packet should retain the original T02-L01 dependencies and require a fresh exact-head GitHub run. Acceptance must include successful verification, integration, production-exclusion/build, built-preview, and diagnostic-browser gates, plus the actual complete 24-case matrix artifact and its normal host validation. Require no skipped or retried diagnostic matrix case and review that serialized dimensions remain the raw native readbacks. A successful dimension preflight alone is not a matrix result.

## Safe alternative

If the coordinator or independent contract reviewer does not accept a new geometry representation clause, keep the existing strict dimension guard and treat the captured AABB as diagnostic evidence only. The current report already includes enough detail to distinguish expected decimal values from raw native values. Do not add a tolerance, change button/cap geometry, or substitute projected values. A future evidence packet can collect the native bounds for every dynamic body before stopping, but it must not emit a success matrix or imply physics acceptance.

## Evidence limits

This is not an implementation approval or runtime acceptance. The exact run failed before impulse, simulation steps, matrix download, and matrix artifact validation. The run proves the captured button readback and its exact relation to the configured Float32 projection only; it does not prove the caps' representation, successful matrix execution, continuous collision safety, or playability.
