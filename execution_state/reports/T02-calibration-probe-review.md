# T02-B0 calibration probe independent review

## Source-review verdict

**Source review: PASS WITH RUNTIME EVIDENCE OUTSTANDING. Do not accept T02 from this review.** The probe is wired to the pinned real Havok package and its WASM file, encodes the requested candidate matrix, uses the T02-A world factory, and does not mutate frozen configuration or claim measured coefficients. This review did not execute commands or a server, as required by the laptop restriction.

## Findings

- `calibrationProbe.test.ts` resolves `@babylonjs/havok/lib/esm/HavokPhysics.wasm` from the installed package, reads those bytes, passes them to `initializeHavokRuntime`, and creates each trial through `createCounterballWorld`. The factory attaches a Babylon Physics V2 `HavokPlugin`; the T02-A repair 2 source wraps only the actual initialized runtime’s constructor allocations for cleanup. This is the pinned Havok/WASM path, not a mock or replacement engine.
- The nested loops encode all 480 requested combinations: 80 direct trials (5 impulses × 4 friction values × 4 restitution values) and 400 placed-button trials (5 impulses × 5 tilt values × 4 friction values × 4 restitution values). The restart azimuth is explicitly fixed at canonical 0 radians. Each call constructs a new `NullEngine` and world, clones the fixture state before assigning controlled poses, uses the configured masses, gravity and 1/120-second step, and disposes the world and engine in `finally` blocks.
- Material candidates are assigned to the surface and selected cap, and also to the button for restart trials. The source reads back friction, static friction and restitution and throws if those values differ. The impulse uses Babylon Physics V2 `PhysicsBody.applyImpulse`; the test enables actual collision callbacks on the selected cap and button, deduplicates observed pair/type/step events, and records positions, travel, speed, peak rise, contact and simulated duration. It asserts the 480/80/400 counts, finite numeric observations, at least one direct-cap movement and at least one restart button-cap contact.
- The code reads configuration and uses it to construct local poses, gravity, limits, and material-independent settings. The trial mutates only its cloned match-state bodies and per-world shape materials. No config, hash, fixture, manifest, or production coefficient is changed. The implementation report correctly labels the probe **IMPLEMENTED, NOT EXECUTED** and claims no measurements or coefficient recommendation.
- One source-level observation needs explicit runtime interpretation: `settledAtSeconds` is nullable when a trial reaches the configured time limit. That is useful evidence of a bounded non-settling trial, but it is not a finite settled-time result for that trial. The run must report how many trials settle and how many reach the horizon; do not summarize the full matrix as settled if any value is null.

## Check status and limits

The required typecheck, counterball test command, lint command, and all runtime trials are **NOT RUN by this review**, due to the explicit laptop restriction. The implementation report also records those three commands as NOT RUN. Therefore compilation, WASM initialization, actual material read-back, collision delivery, all 480 finite observations, settled counts, and probe runtime remain unverified. Static source and declaration inspection cannot substitute for those results.

No config selection, T02 acceptance, T04 deployed-physics claim, shot-feel claim, or Cloudflare compatibility claim is supported here. Preserve the probe report's unexecuted status until an authorized runtime run emits and records the complete matrix, including unsettled trials and any failures.
