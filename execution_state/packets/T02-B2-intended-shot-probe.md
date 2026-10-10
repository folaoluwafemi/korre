# T02-B2 — measure the intended cap-into-button restart

## Trigger and frozen inputs

The accepted B0 probe and its independent review show that its restart case launched the button into a stationary cap, opposite the intended canonical gameplay shot. The gameplay contract launches the selected cap at the placed button. The review also found no button height/obstacle-clearance measurement and one unsettled high-restitution restart. This packet measures the intended direction and real tilt contact before any full calibration is frozen.

Use `knowledge_base/execution/CONTRACTS.md`, `GAMEPLAY.md` section 6, `DECISIONS.md`, the B0 source, and the independent reports:

- `execution_state/reports/T02-calibration-observations-run-8.json`
- `execution_state/reports/T02-calibration-observations-review-1.md`

Diagnostic-only baseline: friction `0.15`, restitution `0`; it is the reviewer's suggested next-experiment baseline, not a production/config choice. Use real pinned Havok WASM and actual Physics V2 worlds. Do not use mocks, a vertical force, or a hidden lift. Keep T04 deployed Cloudflare evidence separate.

Prerequisite: accepted `T02-C0` shared restart-pose helper. Import `deriveRestartButtonPose` from its production path; do not copy the calibration test's trigonometry into this diagnostic.

## Exact worker write paths

Worker `/root/toolchain_audit` may edit only:

- `games/counterball/src/simulation/intendedShotProbe.test.ts`
- `execution_state/reports/T02-B2-intended-shot-probe-implementation.md`

The probe reads `COUNTERBALL_INTENDED_SHOT_OUTPUT`; when non-empty it writes the complete JSON only after all test assertions pass. With the variable absent, normal runs write no artifact. Do not change existing B0 source or assertions, shared protocol/config, fixture, world factory, manifests, CI, task/ledger, or any unlisted path. Do not select final gameplay values.

## Controlled setup and matrix

For each trial create a fresh actual Havok world from the fifteen-body fixture; set all starting velocities to zero; place `home-0` at the surface and derive the ordinary button's tangent pose with `deriveRestartButtonPose` at azimuth `0` on its `+z` side. Place exactly one other cap ahead in the button's expected `+z` path as a stationary-at-start, movable obstacle; put the remaining caps in safe, separated in-pitch fixture positions. Do not reposition other caps during the shot.

Use friction `0.15` and restitution `0` for the surface, selected cap, button, and obstacle. Apply exactly one **planar +z impulse to the selected cap at its center of mass**, toward the tangent button; do not impulse the button. Sweep:

- impulse magnitude: `0.5`, `1`, `1.5`, `2`, `3`, `4`, `6`, `8`;
- button tilt: `0°`, `15°`, `30°`, `45°`, `60°`.

This is 40 fresh-world trials. Preserve a deterministic candidate ordering and unique tuple key. The coefficient/material and impulse range are measurement inputs only.

## Required observations and checks

Use the canonical 1/120-second step and maximum duration. Observe every step, validate all fifteen bodies' position, rotation, linear velocity, and angular velocity are finite, and collect full-rate contact facts. For every row record the complete input tuple; cap and button path/final distances; cap and button peak heights and maximum/final speeds; actual cap/button contact; obstacle position; whether the button entered the obstacle's combined horizontal radius and cleared its top by at least the configured clearance epsilon; every-body settle time or explicit `null` timeout; simulated duration; and relevant contacts/steps. Never label a capped trial settled.

The real-WASM test asserts exactly the 40 unique finite tuples, verifies material read-back, verifies the cap receives the impulse (not the button), and requires at least one trial to move both cap and button measurably through post-impulse physical contact. Do not assert that loft succeeds: report which angles/impulses actually clear the obstacle. This diagnostic passes when observations are complete and honest, even if no tested trial lofts or a timeout is observed. Always unsubscribe and dispose each world/engine in `finally`.

## Coordinator-owned hosted artifact

Coordinator alone will edit `.github/workflows/ci.yml`, `execution_state/tasks.json`, and `execution_state/LEDGER.md`: set `COUNTERBALL_INTENDED_SHOT_OUTPUT=.artifacts/counterball-intended-shot-observations.json` on `pnpm verify` and upload it as a separate `counterball-intended-shot-observations` artifact under `if: always()`, with missing-file behavior `ignore`. Keep the workflow read-only. `.artifacts/` is already ignored. Record hosted commands/results only after observing them.

## Acceptance and stop

1. Source records the 40 intended-direction real-Havok trials as specified, with full-body finite/settlement data and no fabricated loft.
2. Independent source review passes the exact changed paths.
3. Hosted GitHub verification, integration, and one-worker browser tests pass; the separate artifact is uploaded, retrieved, hash/provenance checked, and its 40 records independently reviewed.
4. Coordinator decides whether the data justify a provisional canonical config and whether loft requires a labelled approximation. No configuration is changed in this packet.

No local build, test, lint, typecheck, formatter, or server command. Use hosted GitHub Actions for execution. Stop after the report and artifact; wait for coordinator decision and the separately bounded `SimulationRunner` packet. This packet alone does not complete or accept T02.
