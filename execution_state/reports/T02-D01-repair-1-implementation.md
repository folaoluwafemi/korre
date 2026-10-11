# T02-D01 repair 1 implementation

Date: 2026-10-11

## Change

Updated `games/counterball/src/simulation/directImpulseProbe.test.ts` so each trial row in the fixed six-case matrix must record at least one selected-cap per-step displacement of `1e-4` canonical world units or greater. The tolerance is documented beside the constant as a small movement floor above numerical noise. The assertion uses the selected cap's canonical body index and the recorded `displacementByBody` vector for each physics step. Missing components cannot pass because they become `NaN`; malformed arrays also remain covered by the existing per-tick validation.

This closes the review finding that nonzero immediate velocity alone could pass without recorded motion. Fixture selection, initial transforms, six-case matrix, and artifact behavior are unchanged.

## Checks and limits

- Read the independent review at `execution_state/reports/T02-D01-review.md` and re-read the edited source around the tolerance and per-trial assertion.
- `git diff --check -- games/counterball/src/simulation/directImpulseProbe.test.ts`: **PASS** (exit 0; no output).
- Runtime, real Havok probe, application tests/build, browser, and hosted CI: **NOT RUN**.

This is a source-only repair. The new movement assertion and all six real physics trials still require the coordinator's hosted verification and independent review.
