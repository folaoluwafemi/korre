# T02-B0 repair 3 — source implementation report

**Source-only repair complete; hosted verification pending.**

GitHub Actions run `c806bc5` passed workspace/root TypeScript typechecks and then failed lint with `@typescript-eslint/require-await` at `calibrationProbe.test.ts:237`: `runTrial` was declared `async` and returned `Promise<TrialObservation>` despite containing no asynchronous operation.

Removed `async` and the `Promise<TrialObservation>` annotation from `runTrial`, whose direct return type is `TrialObservation`. Removed the two `await` operators from the direct-cap and restart call sites. World construction, synchronous fixed-step simulation, cleanup, trial ordering, all 480 matrix cases, observations, physics values, and assertions are unchanged.

No local build, test, lint, typecheck, formatter, or server command was run, per the user’s request for remote builds. The hosted lint retry, 480-trial real-WASM measurements, unit test, and remaining hosted gates are pending. No calibration result or T02/T04 acceptance is claimed.
