# T02 calibration observations — independent data review 1

## Trigger and inputs

GitHub Actions run `38038728521` passed on commit `7d5469d377e1923410068fcdca61cb146419987d` and uploaded artifact `counterball-calibration-observations` (artifact ID `11664084850`, GitHub SHA-256 `4bd44c5e058d7063491e6d3c08b69feab5c9d0bddf5ffb539e8c345ac1fab8ac`). The extracted JSON is preserved at:

- `execution_state/reports/T02-calibration-observations-run-8.json`

Its extracted-file SHA-256 is `B81E5D190E7D81E540E6657F1D39BA805F177545C93075B604B7DD6818D59013`.

Review the full data file and the probe implementation in `games/counterball/src/simulation/calibrationProbe.test.ts`, together with `knowledge_base/execution/DECISIONS.md`, `CONTRACTS.md`, `TASKS.md`, and `GAMEPLAY.md`.

## Exact reviewer output path

Reviewer `/root/swarm_review` may write only:

- `execution_state/reports/T02-calibration-observations-review-1.md`

Do not edit source, config, packets, status, ledger, or the observation artifact. Do not spawn agents.

## Review questions and acceptance conditions

Independently verify and record:

1. Artifact provenance and schema: the stated run/commit/asset match; `observedTrials` equals the array length; it contains the complete expected Cartesian matrix exactly once (80 direct-cap and 400 restart-button records); candidate values and nullable fields are consistent with the probe.
2. Data quality: required numeric fields are finite; report settling timeouts, missing/false contacts, duplicate or missing tuples, implausible values, and any other material anomaly. Do not silently treat a timeout as settled.
3. Physics interpretation: summarize how direct-cap distance varies by impulse and friction/restitution; how restart cap/button movement, tilt, contact, loft, and settling behave; state what this controlled probe does and does not demonstrate about play feel or pavement.
4. Decision support: recommend a conservative provisional selection or explicitly say the data do not justify selecting values yet. Tie recommendations to observed records and the decision requirement that values are pinned, versioned, and labelled provisional. Do not change configuration or choose on the coordinator's behalf.

The candidate grid is one observation per parameter tuple, not repeated sampling. The probe uses one fixture and one restart azimuth, so do not claim confidence intervals, pavement calibration, or external Havok deployment. Treat any inferred tuning preference as an inference, not an observed fact.

## Environment

This is a read-only independent data review. No local build, test, typecheck, lint, formatter, or server command. Report only the verdict, checks, concerns, concise quantitative findings, and recommendation/limits. A PASS requires artifact integrity and full-matrix validation; a physical anomaly may still be documented under a PASS verdict if accurately bounded and not hidden.
