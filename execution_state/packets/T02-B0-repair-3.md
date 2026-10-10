# T02-B0 repair 3: remove unnecessary async from synchronous trial runner

## Triggering evidence

Hosted GitHub Actions run #3 (`c806bc5`) passed all workspace and root TypeScript typechecks, then failed lint at `games/counterball/src/simulation/calibrationProbe.test.ts:237` with `@typescript-eslint/require-await`: `runTrial` is declared `async`, contains no `await`, and performs all world creation and fixed-step simulation synchronously.

## Exact implementation write paths

- `games/counterball/src/simulation/calibrationProbe.test.ts`
- `execution_state/reports/T02-calibration-probe-repair-3-implementation.md`

Remove `async` and the `Promise<TrialObservation>` return annotation from `runTrial`, giving it the direct `TrialObservation` return type (or an equivalent inferred return type). Remove the two now-unnecessary `await` operators at its call sites so the call sites reflect the synchronous operation. Do not change trial ordering, the 480-case matrix, setup/teardown, step count, observations, physics values, or assertions.

No shared config, status, contracts, lockfile, or other source paths may be changed in this packet.

## Independent review

Reviewer: `/root/foundation_review`.

Reviewer report-only write path:

- `execution_state/reports/T02-calibration-probe-repair-3-review.md`

Inspect the packet, implementation, and hosted lint failure. Confirm the function has no async work and that removing Promise wrapping/await preserves the trial loop and all observations. Do not run local build, test, lint, typecheck, formatter, or development-server commands. Do not edit implementation files.

## Acceptance

1. Only unnecessary async/Promise wrapping/await is removed.
2. Independent source review passes.
3. Hosted verification reaches and passes lint, unit tests (including actual Havok-WASM 480-trial probe), and build; then integration and one-worker browser E2E must also pass for parent T02/T03 gates.

## Environment constraint

The user asked to run builds and tests off their laptop. Run no local verification commands. Hosted GitHub Actions is the verification environment. Do not claim probe measurements until the hosted probe test actually runs and records them.
