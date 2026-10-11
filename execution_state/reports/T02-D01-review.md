# T02-D01 independent review

Date: 2026-10-11

## Verdicts

- **SOURCE: CHANGES_REQUIRED.** The source follows the canonical fixture and direct-impulse setup, but it does not assert that the selected cap actually moves during a physics tick. It only asserts nonzero immediate velocity after `applyImpulse`; if stepping failed to advance the body while returning finite, quiet state, the six-row probe could still pass and emit an artifact.
- **RUNTIME: NOT PROVEN.** `T02-D01-implementation.md` explicitly leaves hosted `pnpm verify` and artifact inspection pending. No exact-head T02-D01 run or merged artifact was present in the reviewed reports. I ran no application command or physics test.

## Source review

The exact packet extracts as T02-D01, a six-case diagnostic using impulses `[2, 4, 8]` crossed with `straight-at-button` (`home-6`) and `open-longitudinal-lane` (`home-3`). The implementation uses that fixed ordered matrix and derives the target from the unchanged canonical initial fixture. Each trial deep-clones the initial state without repositioning any cap or the button; before stepping, it compares the runtime's 15 bodies, transforms, and velocities against all 15 exact fixture states. Only the selected cap receives `PhysicsBody.applyImpulse(inputImpulse, selectedCapCenter)`, matching the direct center-application API used by the existing intended-shot probe. Inputs remain raw impulse units, with no config or coefficient edits.

The probe resolves the pinned Havok WASM and initializes the existing runtime. It records every tick's positions, rotations, displacement vectors, linear/angular velocities and speeds in canonical ID order, finite-state flags, final states, path/speed summaries, and collision callbacks labelled by pair, step, type, and optional point. It checks each recorded numeric array for completeness and finiteness. Settlement requires all 15 bodies to satisfy both configured linear and angular speed limits for 60 consecutive fixed steps, matching the configured 0.5-second window. Trial/runtime/cleanup failures are carried into `runtimeError` or `trialErrors` and fail the assertions. Observer removal, world disposal, and engine disposal are each attempted even if an earlier cleanup action fails.

The concrete gap is in `failedTrialChecks`: it verifies a nonzero, forward-projecting immediate selected-cap velocity, but it never asserts that a later tick has nonzero selected-cap displacement or that its accumulated path is positive. Tick displacement and path are only checked for finite values. Add an assertion tied to the selected cap's recorded tick measurements (and preferably a small explicit positive movement tolerance) so a no-op physics step cannot count as a successful direct-shot observation. The probe records button/cap contacts but does not require a contact for each row; that is appropriate for this matrix because the open-lane case is intended to avoid the button and lower-impulse cases may not reach it.

The artifact merge waits for two identical reads of a complete JSON document, checks pinned version/diagnostic metadata and the exact ordered 40-row candidate matrix with unique keys, then rereads and byte-compares the source before writing. It creates a unique same-directory temporary file with exclusive creation, rechecks the original bytes, and renames atomically; write/rename failures attempt temporary-file cleanup. It adds only `directImpulseProbe`, preserving the prior root fields. These are source-level findings only: the merge has not been executed for this packet, and the intended-shot artifact is not evidence for a completed D01 merge.

The implementation report records only plan extraction and whitespace checks, and marks the hosted run and artifact inspection pending. No six observed tuples, runtime pass, or deployed Havok evidence can be accepted from the current evidence.

## Reviewed inputs

- Exact T02-D01 packet extraction (`node scripts/check-completion-plan.mjs --packet T02-D01`; plan consistency PASS only).
- `knowledge_base/execution/completion/CONTRACT_WORK.md`, canonical `knowledge_base/execution/CONTRACTS.md`, `knowledge_base/execution/DECISIONS.md`, and `packages/game-protocol/src/config.ts` for fixture/settle/API context.
- `games/counterball/src/simulation/directImpulseProbe.test.ts`, `worldFactory.ts`, `calibrationProbe.test.ts`, and the unchanged `tests/fixtures/counterball-v1.json`.
- `execution_state/reports/T02-D01-implementation.md`, `T02-B2-intended-shot-probe-implementation.md`, `T02-B2-intended-shot-probe-review.md`, and `T02-calibration-observations-review-1.md`.

No source, configuration, or shared status was changed. No build, test, browser, physics, installation, or deployment command was run.
