# T02-L01-ARTIFACT-1 hosted lint repair 1

## Changes

Repaired the six ESLint findings reported on hosted SHA `cbc1c98a8c6029b783c07e88c7e25253369b6c91`:

- The four test async generators (`orderedCases`, `maximumCases`, `slowCases`, and `firstMaximumCase`) now await a resolved promise before yielding. They remain `AsyncGenerator<LoftCoarseCase>` inputs; the encoder's ordered streaming, backpressure and cancellation behavior is unchanged.
- Removed the unnecessary `LoftCoarseSettleTick` assertion after the existing exact-key validation has narrowed the tick value.
- Added `{ cause: error }` to the `AggregateError` thrown when sink abort also fails. The aggregate still contains both the original write/encoding error and the abort error.

Changed source paths:

- `games/counterball/src/simulation/loftCoarseProbe.ts`
- `games/counterball/src/simulation/loftCoarseProbe.test.ts`

## Checks and limits

- `git diff --check -- games/counterball/src/simulation/loftCoarseProbe.ts games/counterball/src/simulation/loftCoarseProbe.test.ts` — exit 0.
- No local typecheck, lint, unit test, build, browser, physics, or deployment check was run. Fresh hosted verification and independent source review remain pending.
