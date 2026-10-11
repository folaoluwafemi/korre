# T02-D01 implementation report

Status: **source implementation complete; independent review and hosted execution pending.** This probe supplies diagnostic observations only. It does not choose gameplay coefficients or accept T02/C02.

## Files written

- `games/counterball/src/simulation/directImpulseProbe.test.ts`
- `execution_state/reports/T02-D01-implementation.md`

No other path was written for this packet.

## Probe design

The test loads `tests/fixtures/counterball-v1.json#counterball-protocol-fixtures-v1:states.initial`, validates it with `parseMatchState`, and gives each trial a fresh structured clone. It never moves a cap or button. All fifteen canonical body states are included in every row and must match the fixture exactly before the impulse. The selected fixtures are:

- `home-6`, position `(0, 0.06, -4)`, identity rotation, aimed straight along `+z` at the button initially at `(0, 0.0225, 0)`.
- `home-3`, position `(-2, 0.06, -6)`, identity rotation, aimed at the open longitudinal point `(-3.5, 0)` in the pitch plane. This path avoids the other fixture caps; the other thirteen caps stay in their canonical positions.

All fixture velocities are zero. The probe runs impulses `[2, 4, 8]` against both aims, in a fixed six-row matrix. Each raw input is passed to `PhysicsBody.applyImpulse(vector, selectedCapCenter)` using the same center application-point API as the existing real-Havok intended-shot probe. The values are raw impulse units, not normalized gameplay power. No materials, physics coefficients, calibration config, or production behavior are changed.

The test resolves the pinned Havok WASM from `@babylonjs/havok/lib/esm/HavokPhysics.wasm`, initializes the actual Havok runtime, and constructs the existing `CounterballWorld` for each trial. It records the canonical fifteen body IDs, exact starting body states, immediate velocities, per-tick positions and rotations, per-tick displacement vectors, linear/angular velocity vectors and speeds, all contact observations, per-body cumulative paths and maximum speeds, and all fifteen final body states. Per-tick numeric arrays follow the recorded canonical `bodyIds` order.

Finite checks cover every body's position, rotation, linear/angular velocity and speed on every sample. A trial reports settled only after all fifteen bodies meet both canonical linear and angular thresholds for the configured consecutive quiet-window samples. If any trial fails to settle within the configured maximum duration, has non-finite state, or encounters a runtime/cleanup error, the test logs its collected observations and fails; such results do not enter the shared success artifact.

## Shared CI artifact behavior

When `COUNTERBALL_INTENDED_SHOT_OUTPUT` is absent, this test writes no artifact. When set, the test waits up to five minutes for the existing intended-shot producer's JSON to become complete and stable across two reads. It requires the pinned provenance, the exact ordered 40-row candidate matrix, unique expected row keys, finite measurements, and contact arrays. It rejects an existing `directImpulseProbe` field and rechecks the source bytes before commit. After all six probe assertions pass, it writes a unique same-directory temporary file and atomically renames it over the unchanged source, preserving all existing fields and adding only a separate `directImpulseProbe` object. A missing, invalid, changing, or timed-out input fails instead of replacing it. The workflow is unchanged.

## Checks and limits

- `node scripts/check-completion-plan.mjs --packet T02-D01`: **PASS** for plan consistency only; the extraction reports the packet ready. It did not run implementation checks.
- `git diff --check`: **PASS**, exit code 0, with no whitespace errors. Git printed line-ending notices for other modified workspace files outside this packet.
- Local application install, test, build, typecheck, lint, formatter, browser, and physics commands: **NOT RUN**, as required by the packet.
- Hosted `pnpm verify` and artifact inspection: **pending**.

No local measurement or deployed Havok result is claimed. The six real-WASM rows, full settling outcome, and merged JSON remain unverified until the exact hosted check runs. Independent review is the next step.
