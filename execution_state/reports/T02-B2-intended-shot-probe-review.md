# T02-B2 intended-shot probe — independent source review

**Verdict: CHANGES_REQUIRED for packet acceptance.** The implementation is honest about unavailable clearance classification, but the packet's canonical clearance-epsilon criterion is still unresolved. The probe source is otherwise consistent with the bounded diagnostic scope.

## Source findings

- The test resolves and reads the pinned Havok WASM, passes it to `initializeHavokRuntime`, creates a fresh `NullEngine` and world per trial, and checks a concrete `PhysicsEngineV2`, the canonical fixed step, and supported Havok bodies. This is source evidence of the intended real-WASM path, not evidence that the runtime has executed.
- The nested candidate loops cover five tilts by eight impulses. Each call to `runTrial` creates a fresh world; deterministic keys are compared against the full expected order and asserted unique for all 40 observations.
- Setup derives the button pose through `deriveRestartButtonPose`, places one movable obstacle cap ahead, checks all body velocities start at zero, and applies one +z impulse at the selected cap's center only. The immediate-velocity assertions reject a button impulse or non-planar cap impulse.
- Every fixed step checks position, quaternion, linear velocity, and angular velocity for all 15 dynamic bodies. Settlement requires every body's linear and angular speeds to remain within the configured thresholds for the full quiet window; capped trials report `null` and are asserted to have reached the maximum duration.
- Collision observers are installed on all dynamic bodies, and observations retain step, pair, type, and an optional finite point. Button/obstacle clearance is recorded as raw signed vertical clearance while the button center is within the combined horizontal radius. No vertical-clearance threshold is fabricated: `clearanceEpsilon` and `clearsByConfiguredEpsilon` remain `null`, with the missing config field documented. The test does not claim loft.
- Result construction and the environment-gated JSON write occur after the matrix, motion, material, finite-state, contact, and clearance assertions. Each trial removes observers and disposes its world and engine in `finally`.

## Unresolved criterion and verification

`GAMEPLAY.md` assigns clearance epsilon to T02, but the current canonical config has no such field. The probe correctly preserves raw signed measurements instead of inventing a threshold, but it cannot yet report whether any trial clears the obstacle by the configured epsilon. Coordinator action is needed to define/version that canonical value or revise the criterion before this packet can be accepted.

No local test, build, typecheck, lint, formatter, or server command was run. Hosted checks, actual 40-trial Havok observations, artifact upload/retrieval, and provenance review remain pending. This source review does not establish runtime results and does not accept T02 or T04.
