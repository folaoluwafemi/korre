# C00 contract-preparation handoff

Status: ACCEPTED for contract/schema preparation only; independent review passed.

## Accepted inputs

- C00-A is ACCEPTED as the portable protocol contract packet. Its source/runtime evidence and exact-head review are recorded in `C00-A-implementation.md`, `C00-A-review.md`, and `C00-A-runtime-review-run-38078890667.md`.
- C00-B is ACCEPTED as calibration schema and contract preparation only. Source review passed in `C00-B-review.md`; the first formatting failure and bounded repair remain preserved; exact-head GitHub run 38080651730 passed and is independently reviewed in `C00-B-runtime-review-run-38080651730.md`.
- The C00-B exact source SHA was `63c8cdb379a508fa9333d2ec6f3c510739a8e0ac`. Hosted verification, integration and browser preview checks passed on that SHA; exact artifact metadata is recorded in the runtime review.

## Handoff boundary

The canonical protocol types, runtime schemas, nullable calibration shape, geometry validation and future producer signatures are frozen in `knowledge_base/execution/CONTRACTS.md`. C00-B preserves `physicsCalibration: null` in the canonical config and fixtures. The later runner must reject null, and probes must label candidate inputs; no runner, substep execution, physical traversal, deployed Havok or playable match is accepted here.

The named next producer can use the existing canonical `SimulationFact` union and config geometry: contacts and oriented whole-button crossings must be derived from complete fixed-step observations, with deterministic ordering and no dependence on downsampled playback. The separate scene and referee signatures are also concrete in CONTRACTS. These boundaries are recorded for the reviewer; C00 does not dispatch all consumers at once.

## Checks

- `node scripts/check-completion-plan.mjs --packet C00`: PASS; C00 is ready because C00-B and required parent T01 are accepted.
- `node scripts/check-completion-plan.mjs`: PASS; plan consistency only.
- `execution_state/tasks.json` JSON parse: PASS.
- Independent handoff review PASS: `C00-contract-preparation-review.md`. The reviewer confirmed the accepted C00-A/B source and exact-head hosted evidence, concrete canonical fact/config contracts, and the T02-F01 producer boundary.
- C00 accepts contract/schema preparation only. It does not accept a runner, physics behavior, deployed Havok, playable match, or parent T02.
