# T02-C2 playback sampling implementation

## Scope

Implemented the pure playback sampler in `games/counterball/src/simulation/sampling.ts` and focused synthetic-body tests in `games/counterball/src/simulation/sampling.test.ts`. The sampler imports only canonical protocol values and types; it has no Babylon or runtime dependency.

The API is `createPlaybackSampler(config).record(step, bodies)` followed by one `finish()`. It validates the fixed-step/sample-rate ratio and maximum duration, requires step zero and contiguous non-negative safe-integer steps, validates all 15 canonical body IDs and finite poses with the protocol quaternion tolerance, and copies transforms into canonical `ENTITY_IDS` order. It records step zero and regular integral sample intervals, computes time from `step * fixedStepSeconds * 1000`, and appends the exact last pose only when it is not already a regular sample. It rejects malformed input, lifecycle misuse, duration overflow, and playback beyond 451 frames without truncating output. Sampling errors carry stable `invalidInput`, `invalidBody`, or `resourceLimit` codes for runner mapping.

## Coverage added

The tests cover canonical 1/120-second and 30-Hz samples, all-15 ordering and pose-only frames, isolation from later body mutation, non-periodic and periodic endpoints, finite fractional step-derived time, invalid and non-integral rates, missing/duplicate/unknown IDs, non-finite positions and rotations, non-normalized quaternions, negative/skipped steps, one-shot lifecycle, exactly 451 frames at 15 seconds, and duration/frame-limit rejection.

## Verification

No local build, test, typecheck, lint, formatter, or server command was run, as required by the packet. All checks are **NOT RUN**; hosted verification and independent review remain pending. This report does not accept T02 or the parent simulation task.
