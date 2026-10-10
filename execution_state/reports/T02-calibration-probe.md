# T02-B0 real Havok calibration probe — implementation evidence

Status: **IMPLEMENTED, NOT EXECUTED.** This report records source and local declaration inspection only. It contains no measured physics results and does not accept T02 or T04.

## Assigned files

- `games/counterball/src/simulation/calibrationProbe.test.ts` — adds an executable real-WASM probe. It reads the installed `@babylonjs/havok/lib/esm/HavokPhysics.wasm`, initializes the pinned Havok runtime, parses the canonical fixture, and creates a fresh `NullEngine` plus the existing `createCounterballWorld` for each trial. Each trial uses canonical gravity, dimensions, masses, and 1/120-second steps. It sets and reads back shape materials, applies the actual Physics V2 body impulse, observes real body collision events, and disposes its isolated world.
- This report.

No configuration, world factory, fixture, manifest, lockfile, task status, or other path was changed.

## Probe inputs encoded in the test

The test covers the full Cartesian matrix specified by the packet:

- Direct selected-cap impulses: 5 impulse values × 4 friction values × 4 restitution values = **80 trials**.
- Placed button restarts: 5 impulses × 5 tilt angles × 4 friction values × 4 restitution values = **400 trials**.
- Total: **480 fresh-world trials**. Restart azimuth is held at canonical 0 radians (+z) to isolate tilt; no launch lift or vertical impulse is added.

Each observation includes selected-cap path/final distance, peak rise, maximum/final speed, button path/final speed, actual button-cap collision status, observed collision pairs/steps, simulated duration, and settled time or `null` when the 15-second limit is reached without settling. The probe emits one `COUNTERBALL_CALIBRATION_PROBE` JSON record containing the candidate matrix and observations. A real button-cap event and measurable movement from at least one direct impulse are asserted.

The restart button pose uses configured cap/button radii and thickness with cylindrical support distances for the chosen tilt. The cap and button are centered at their computed surface-support heights. Every other cap is put in a safe, spaced fixture location; no other body is moved during a trial.

## Static API inspection

The installed Babylon 9.30.0 declarations expose the APIs used by the probe: `PhysicsShape.material` read/write with friction, static friction, restitution and combine modes; `PhysicsBody.applyImpulse`, velocity getters, and collision observables/callback enabling; and `HavokPlugin.executeStep(delta, physicsBodies)`. The `PhysicsEngine` declarations expose the fixed-step getter and body list. The existing runtime tests resolve the pinned package WASM through the same package path. This is declaration/source inspection only; it does not show that the probe compiles or that the runtime accepts these materials or reports the expected contacts.

## Required commands and evidence

The coordinator’s resumed packet explicitly prohibited running checks or starting a process. Therefore all checks and measurements below are **NOT RUN**:

1. `pnpm.cmd --filter @korre/counterball typecheck` — **NOT RUN**.
2. `pnpm.cmd --filter @korre/counterball test` — **NOT RUN**. This is the command that must execute the probe and produce real Havok observations.
3. `pnpm.cmd lint` — **NOT RUN**.

No trial values, contact outcomes, WASM initialization result, elapsed times, or coefficient recommendations are claimed. After the authorized hosted test command runs, capture its complete `COUNTERBALL_CALIBRATION_PROBE` record and append the actual observations and any failures before independent review. Until then, no calibration value is selected and neither T02 nor T04 is accepted by this report.
