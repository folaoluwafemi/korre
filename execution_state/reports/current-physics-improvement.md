# Current physics probe improvement — implementation report

**Verdict:** source-only implementation complete; hosted verification is pending. No local build, test, typecheck, lint, formatter, physics run, or server was run, as assigned.

Updated only `games/counterball/src/simulation/intendedShotProbe.test.ts` and this report.

The probe now reads `clearanceEpsilon` from `COUNTERBALL_CONFIG_V1.restart.clearanceEpsilon` and records that exact source. It retains raw per-step clearance samples and the maximum, and also emits the minimum sampled clearance, whether the peak exceeds epsilon, whether every sample in the measured window is above epsilon, and whether the button-obstacle pair produced a collision callback. Epsilon comparison fields are `null` when there are no samples. Assertions tie the row values to the canonical config and independently recompute the sample minimum/maximum.

The artifact states `continuousTraversalProven: false` for every row. Peak/minimum measurements inside the sampled combined-radius window do not establish a complete swept crossing. It separately lists potential no-contact candidates that both contacted the selected cap and entered that broad horizontal window without a recorded button-obstacle contact; these remain candidates only and are not described as loft success. The 40-trial candidate matrix, real pinned Havok setup, and physical coefficients are unchanged.

The settle-window check now accepts a complete quiet window that ends exactly on the maximum allowed physics step. Existing assertions still require 40 expected unique trial keys, finite measurements, material readback, and valid contact records; new assertions check the configured epsilon, clearance extrema/classifications, traversal status, obstacle contact, and settle-window timing. These assertions have not yet run.

## Required hosted verification

Run the existing GitHub CI `pnpm verify` job with its `COUNTERBALL_INTENDED_SHOT_OUTPUT=.artifacts/counterball-intended-shot-observations.json` environment and upload the JSON artifact. Review the hosted test result and all 40 unique rows, including the epsilon value/source, finite metrics, settle results, collision observations, and explicit `continuousTraversalProven: false`. The CI integration and browser commands remain unchanged. This implementation report does not pass the probe, prove traversal, choose production coefficients, or accept T02/T04.
