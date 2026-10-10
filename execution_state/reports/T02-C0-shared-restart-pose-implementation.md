# T02-C0 — shared restart pose implementation

## Result

Added `deriveRestartButtonPose` as a pure game-domain helper at `games/counterball/src/features/restarts/domain/placementPose.ts`. It returns protocol-style position and quaternion values without importing Babylon. The formula uses the canonical cap/button radii, button half-thickness, pitch surface, azimuth convention, and configured tilt limit; oriented cylinder support keeps the button tangent to the cap while its lower support touches the surface.

The companion test covers flat and maximum tilt, cylindrical support, normalized orientation, four azimuths, periodic wrapping, finite output, input immutability, fresh result allocation, invalid numbers, tilt bounds, and invalid geometry. It verifies that the returned pose values are independent of caller mutation.

## Scope and limits

Only the two source/test files and this execution packet/report were changed for C0. This centralizes the existing calibration-probe formula; it does not change physics, shared configuration, calibration coefficients, ownership/anchor/overlap validation, or T02's acceptance state. The canonical runner, decisive facts, sampled frames, timeout/cancellation handling, and intended loft diagnostic remain unimplemented.

Independent source review passed at `execution_state/reports/T02-C0-shared-restart-pose-review.md`. No local formatter, build, typecheck, lint, test, or server was run. This follows the user instruction to keep builds off the laptop. Hosted GitHub verification is pending; C0 is not accepted until it passes.
