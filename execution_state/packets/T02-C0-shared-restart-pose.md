# T02-C0 — one pure shared restart-pose function

## Trigger and frozen inputs

The canonical restart formula currently exists only inside `calibrationProbe.test.ts`. The T02 design audit found that copying the formula into the runner and later T07 placement solver would create divergent implementations. The coordinator will define one pure game-domain helper now; later simulation and placement code must call it.

Read `knowledge_base/execution/CONTRACTS.md`, `GAMEPLAY.md` sections 6–7, `DECISIONS.md` D07–D10 and D25, and the existing calibration helper `buttonRestartPose` in `games/counterball/src/simulation/calibrationProbe.test.ts`.

## Exact coordinator write paths

Coordinator `/root` owns only:

- `games/counterball/src/features/restarts/domain/placementPose.ts`
- `games/counterball/src/features/restarts/domain/placementPose.test.ts`
- `execution_state/packets/T02-C0-shared-restart-pose.md`
- `execution_state/reports/T02-C0-shared-restart-pose-implementation.md`
- `execution_state/tasks.json`
- `execution_state/LEDGER.md`

Independent reviewer `/root/foundation_review` may write only:

- `execution_state/reports/T02-C0-shared-restart-pose-review.md`

No changes to protocol/config types, canonical config/hash/fixture, calibration probe, world factory, APIs, manifests, or other source paths in this packet. Do not spawn agents.

## Function contract

Export a pure `deriveRestartButtonPose(capPosition, buttonAzimuth, buttonTilt, config)` function. Inputs use canonical game units: `capPosition` is the selected cap centre; azimuth uses the same x/z convention as `buttonRestartPose`; tilt is radians; config supplies canonical geometry, `surfaceY`, and maximum restart tilt. Return plain protocol-style `{ position: Vec3, rotation: Quat }` values, with a tangent button centre and cylinder orientation derived once from cap/button radii and half-thickness. Keep all support-distance and quaternion math engine-free; do not import Babylon.

Reject non-finite inputs, non-positive geometry, and tilt outside `[0, config.restart.maxButtonTiltRadians]` with a stable `TypeError` message. Preserve arbitrary finite azimuth periodicity through `sin`/`cos`. Do not perform anchor, overlap, ownership, or rules validation; those remain caller responsibilities. Return fresh values and do not mutate any input/config.

At zero tilt, the button's support top and base must match the existing flat placement. At 60° with current canonical dimensions, its support stays on the surface, centre remains tangent, and quaternion is finite/unit-normalized. Preserve the present B0 helper geometry exactly for valid inputs; this packet is a code centralization, not a physics change.

## Tests and acceptance

Pure tests cover zero tilt, maximum tilt, multiple azimuths and periodic wrapping, tangent/support equations, normalized orientation, finite/invalid inputs, configured maximum enforcement, fresh-output immutability, and no Babylon import. Do not run local tests/build/typecheck/lint/formatter/server.

Acceptance is an independent source review plus hosted CI (`pnpm verify`, integration, `pnpm test:e2e --workers=1`). Stop and wait; the coordinator will use this helper in a separate intended-shot diagnostic and later T07 solver. This helper does not accept T02 or choose physics coefficients.
