# T02-L01-GOALFRAME-F32-MATRIX-1 source review

**Source verdict: PASS. Runtime verdict: NOT RUN.**

I compared the two assigned source files with baseline `d41c04a068543df8e1cc1b0e92dc0330e09a6e9c`, checked the implementation report against the accepted packet and contract, and verified the resulting file hashes. The source diff contains only the requested goal-frame comparator substitutions and focused tests.

In `loftCoarseRunner.ts`, exactly the existing X/Y/Z strict comparisons for goal-frame native dimensions now call `matchesExactFloat32Projection(expectedAxis, dimensions.axis)`. The expected upright/crossbar formulas remain unchanged; `PhysicsShapeType.CYLINDER` is still required. The helper computes `Math.fround` from the configured expected span, requires finite values and exact equality, and does not round the observed dimension. Failure mapping/order and the JSON disclosure of configured geometry, raw observed dimensions, and same-read native local AABB bounds are unchanged. The apron, material/mass/filter, support, energy, sweep, and workload checks are unchanged. No geometry, physics, config/hash, schema, protocol, manifest, or public API change appears in the diff.

The added test derives upright `(0.12, 0.8, 0.12)` and crossbar `(2.4, 0.12, 0.12)` spans from canonical geometry. It verifies exact projections pass; original configured doubles fail; and both immediate Float32 neighbors fail for every axis. Thus this source change is consistent with the accepted diagnostic-only clause. The remaining crossbar/other-frame projection values are still inference until each real native preflight runs; this source review does not convert them into measured evidence.

The supplied SHA-256 values match the inspected files:

- `games/counterball/src/simulation/loftCoarseRunner.ts`: `30CBB8D4C29A61063685198EAC8E6FC1F82D0E1A91A0D524F436D1A7BD89FDC6`
- `games/counterball/src/simulation/loftCoarseProbe.test.ts`: `31625E4DD89A79C6DBDB758945490DC0D6539988D9E1C59ACAE5AC3126509406`

Checks performed: exact packet extraction (plan consistency PASS; active packet is no longer initial-ready), `git diff` against the accepted baseline, and SHA-256 inspection. No local tests, typecheck, lint, build, browser, physics, or Cloudflare command ran. Hosted exact-SHA verification and full 24-case artifact review remain required. Even a passing matrix accepts only this bounded diagnostic repair, not parent T02, calibration, deployed Havok, or playability.
