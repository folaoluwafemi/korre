# T02-B2 coordinator CI artifact wiring

Added `COUNTERBALL_INTENDED_SHOT_OUTPUT=.artifacts/counterball-intended-shot-observations.json` to the hosted Verify step. Added a separate `if: always()` upload step named `counterball-intended-shot-observations` for that exact path, with `if-no-files-found: ignore`. The existing workflow permission remains read-only, and the existing calibration artifact path is unchanged.

No local workflow validation, test, build, typecheck, lint, formatter, or server command was run. GitHub Actions will provide the execution check after the intended-shot probe source passes independent review and is pushed. The artifact is not produced until the probe's assertions pass.
