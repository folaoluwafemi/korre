# T02-L01-ARTIFACT-1 hosted test repair 1

Run `38167503608` on SHA `fa86a7dde9c2c6a86e8e1e451bf81004a8db7d93` reported one lint error: `@typescript-eslint/prefer-promise-reject-errors` rejected the test's direct `Promise.reject(undefined)`.

## Change

In the focused aggregate-failure test, the abort sink now returns `ReadableStreamDefaultReader.closed` from a stream that is errored with `undefined` through its standard `controller.error(undefined)` API. That promise rejects with the exact `undefined` reason under test, while avoiding a direct non-Error Promise rejection call. The assertions still verify both aggregate entries and the original operation error as `cause`. No production source or behavior changed.

Changed path:

- `games/counterball/src/simulation/loftCoarseProbe.test.ts`

## Checks and limits

- `git diff --check -- games/counterball/src/simulation/loftCoarseProbe.test.ts` — exit 0.
- No local lint, typecheck, test, build, browser, physics, or deployment check was run. A fresh hosted run is required to verify lint and test behavior.
