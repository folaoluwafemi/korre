# T02-L01 material-matrix failure diagnosis

## Finding

Run `38595010780` is the exact requested commit, `417a2e95b5b59aebd984be903e0b406caae2bc15` (`HEAD` in this checkout at inspection). The saved Playwright diagnostic results report 3 passed, 1 failed, 0 skipped, and 0 flaky tests. The failed test is **“the full real-Havok loft matrix downloads and passes bounded host validation.”** Its error context and trace show that after clicking **Run 24-case Havok matrix**, the page reported: “The export failed and no successful download is available,” with the alert “Dynamic body button native dimensions differ from canonical cylinder geometry.” The test failed while polling that status, before attempting the matrix download.

The runner attempted setup/preflight for the first case, but no case completed and no physics trial ran: `readNativeBodies` throws during the button check before `applyImpulse` at `loftCoarseRunner.ts:1673` and before any `executeStep` at `loftCoarseRunner.ts:1931`. The artifact bundle has the Playwright error context and trace, but no successful L01 matrix download or matrix artifact. The E2E trace confirms it never reached the download action. A partial temporary sink write cannot be ruled out from these artifacts; the page explicitly reports that no successful download is available.

## Expected-versus-observed comparison

The expected dimensions are unambiguous: config sets `buttonRadius` to `0.13` and `buttonThickness` to `0.045` (`packages/game-protocol/src/config.ts:18-19`). `worldFactory.ts:303-309` builds the button collider as a cylinder with radius `0.13` and segment endpoints at `y = ±0.0225`. In the runner, `shapeDimensions` derives `{x,y,z}` from `shape.getBoundingBox().maximum - minimum` (`loftCoarseRunner.ts:429-435`); the button preflight then requires `x = 0.26`, `z = 0.26`, and `y = 0.045` exactly (`loftCoarseRunner.ts:948-964`). The thrown message includes none of the measured axis values or box endpoints.

The button is not identity-oriented in these matrix cases: `regeneratedState` takes `tiltDegrees` from each tuple and assigns `deriveRestartButtonPose(...).rotation` to the button (`loftCoarseRunner.ts:550-590`); the pose helper derives a rotation from the requested tilt (`placementPose.ts:21-72`). However, the pinned Babylon.js 9.30.0 source says `HavokPlugin.getBoundingBox` calls `HP_Shape_GetBoundingBox` with an identity transform and labels the result a local AABB ([source, lines 2047-2056](https://raw.githubusercontent.com/BabylonJS/Babylon.js/9.30.0/packages/dev/core/src/Physics/v2/Plugins/havokPlugin.ts)). Rotation alone should therefore not explain this getter's result. The observed extents could still differ from the configured decimal dimensions because of exact Float32 representation, or indicate a real native geometry/readback discrepancy. The current run did not disclose the values needed to distinguish those possibilities; the diagnosis remains unresolved.

The material preflight for the button ran immediately before its dimension comparison (`loftCoarseRunner.ts:939-964`), so that button's material readback passed on this run. The run stopped before checking all remaining shapes; it does not establish the whole matrix's material validation.

## Evidence needed

Before changing geometry or comparison semantics, capture one exact browser-Havok preflight with the expected `{x:0.26,y:0.045,z:0.26}`, observed dimensions, raw bounding-box minimum and maximum, and shape type. Compare those actual values with the configured decimals and their exact Float32 projections to determine whether this is representational or a real shape/readback discrepancy. Preserve the current strict predicate until those values are known; do not infer a matrix result from the failed setup or make any physics-policy change from this diagnosis.

## Inputs and checks

- The packet extractor returned `PASS` for plan consistency. It reported `ready:false` because the packet was no longer an unstarted ready item; this was not an implementation check.
- Read `knowledge_base/execution/completion/LOCAL_NOTES.md`, the exact `run.json`, full GitHub log, diagnostic E2E log, Playwright browser-results JSON, error context, and both trace streams from `execution_state/reports/T02-L01-MATERIAL-F32-run-38595010780/`.
- Confirmed the saved run's head SHA matches the requested commit and the checkout HEAD.
- No standalone run summary or independent exact-run-review report for this run was present in `execution_state/reports/` at inspection.
- No local application checks, browser runs, or physics runs were performed.
