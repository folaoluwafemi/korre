# T02-B2 intended-shot probe implementation report

## Scope and changes

Implemented the bounded intended-direction probe in
`games/counterball/src/simulation/intendedShotProbe.test.ts`. It creates 40 fresh
worlds using the pinned Havok WASM runtime and Physics V2, with the exact
eight-impulse by five-tilt matrix from the packet. Each trial places the
selected cap at the surface, derives the tangent button pose through the
accepted `deriveRestartButtonPose` helper, puts one movable obstacle cap ahead,
and applies one planar center impulse to the selected cap only. The remaining
caps stay fixed at separated starting positions.

The source records full-rate contacts observed by the dynamic bodies, including
stable labels for collisions with static support/frame bodies, finite-state
checks for all 15 bodies at every simulation step, cap and button travel and
speed/height observations, obstacle positions, raw signed vertical-clearance
samples when the button enters the combined horizontal radius, all-body settle
time or an explicit timeout, and material read-back. It asserts the exact unique
trial tuples, the material and impulse conditions, and measurable cap/button
movement after physical contact. It does not assert that any trial lofts.
Observers are drained once, and each world and engine receives cleanup after
every trial outcome.

The complete result is written only after the assertions pass and only when
`COUNTERBALL_INTENDED_SHOT_OUTPUT` is set to a non-empty path.

## Clearance threshold gap

The current `CounterballConfig` has no configured clearance epsilon, while
`GAMEPLAY.md` section 6 assigns that choice to T02. Per the coordinator's
instruction, the probe does not invent or hard-code a threshold. Each record
sets `clearanceEpsilon` and `clearsByConfiguredEpsilon` to `null`, records the
epsilon source/status as unavailable, and preserves the raw signed clearance
samples and maximum so a later decision can classify them. This leaves the
packet's configured-clearance classification criterion unresolved; this report
does not claim full packet acceptance.

## Verification status

No local build, test, typecheck, lint, formatter, or server command was run, as
the packet requires hosted verification. No runtime measurements have been
observed yet. The 40-trial real-WASM run, hosted checks, artifact retrieval and
provenance review, and independent source review remain pending. No gameplay
coefficients or shared configuration were changed.

Exact changed paths:

- `games/counterball/src/simulation/intendedShotProbe.test.ts`
- `execution_state/reports/T02-B2-intended-shot-probe-implementation.md`

## ESLint repair 1

Hosted run `38041738500` reported five lint errors in the probe: `Quaternion`
was imported as a runtime value despite being used only as a type, `EntityId`
was unused, `asPlainQuaternion` was unused, and two cleanup errors were thrown
from `finally` blocks. The repair keeps `Quaternion` as a type-only import and
removes the unused `EntityId` import and helper.

Cleanup now runs after the trial's capture block, outside `finally`. It attempts
every observer removal, then world disposal, then engine disposal, recording
each failure and continuing through the remaining cleanup actions. If trial
execution and cleanup both fail, an `AggregateError` exposes the original trial
error and all cleanup errors after cleanup completes. Measurement logic, the
40-trial matrix, artifact timing, and null clearance classification are
unchanged.

No local test, build, typecheck, lint, or formatter was run, per the repair
packet. Hosted verification is pending. The configured clearance epsilon is
still absent, so the clearance-classification gap described above remains open.
