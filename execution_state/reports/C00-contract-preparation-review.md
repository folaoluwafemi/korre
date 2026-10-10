# C00 coordinator handoff review

**Verdict: PASS for C00 source/schema preparation and the T02-F01 handoff only.** This does not accept parent T02 or any runner, physics, deployed Havok, or playable-game behavior.

## Accepted prerequisites and hosted evidence

`node scripts/check-completion-plan.mjs --packet C00` reports C00 ready and lists `parent:T01` as a required accepted parent. The current task records show T01 `ACCEPTED`, T02 still `RUNNING`, C00-A `ACCEPTED` with `depends_on: [parent:T01]`, and C00-B `ACCEPTED` with `depends_on: [parent:T01, C00-A]`. The original T01 dependency is preserved on both contract packets. C00 itself remains `REVIEWING`; this report does not edit or preempt the coordinator's status decision.

C00-A's exact-head runtime review is PASS for GitHub run [38078890667](https://github.com/folaoluwafemi/korre/actions/runs/38078890667), SHA `4bfecb4e6d700f85f89b7d521e168cab9489c6ec`. It records the standalone protocol command passing 10/10 tests, full Verify passing with 99 tests and no skips, both disposable PostgreSQL migration checks, integration 1/1, and Chromium E2E 4/4 with no skipped, unexpected, or flaky tests. The independent C00-A source review and CI configuration review also pass. The earlier formatting-failing run is explicitly superseded by this exact-head run.

C00-B's source review is PASS, and its exact-head runtime review is PASS for GitHub run [38080651730](https://github.com/folaoluwafemi/korre/actions/runs/38080651730), SHA `63c8cdb379a508fa9333d2ec6f3c510739a8e0ac`. The report records focused protocol tests 11/11, full Verify with 100 tests, migration verification twice, integration 1/1, and Chromium E2E 4/4 with no skips, unexpected, or flaky tests. The exact-head review confirms the artifacts and states that the run validates schema/workspace compatibility only. The earlier formatting failure and its reviewed whitespace-only repair are preserved in the reports.

## Next producer boundary

The exact T02-F01 record asks for pure deterministic contact and oriented whole-button crossing facts from complete fixed-step observations. Its output is already named by the canonical contract as `SimulationFact = ContactFact | CrossingFact`: contact records carry step/time, two canonical entity IDs, and a point; crossing records carry step/time, entity, one of the four canonical boundaries, a point, and `goal`/`out`. The contract also fixes deterministic ordering, stable tie-breaks, contact-before-same-step-crossing attribution, and the rule that facts come from complete fixed-step physics observations rather than downsampled playback. F01's geometry inputs are the canonical config and its goal/field geometry; the F01 packet names these inputs and tests whole-button orientation, exact ties, mouth/height, and side/end exits.

C00-B provides a concrete strict nullable `PhysicsCalibration` schema and geometry cross-checks while preserving `physicsCalibration: null` in the initial config and historical fixtures. The canonical fact/config types and crossing semantics needed by F01 are therefore defined without choosing production coefficients. C00-B's source review distinguishes existing exports from future signatures; no private competing fact type or producer API is needed for F01. The source inventory and future producer signatures for the later scene, referee, and local-controller consumers are explicitly documented as contracts rather than claims that those implementations already exist.

No unresolved contract ambiguity blocks this facts producer. The cancellation compatibility check, measured calibration, calibrated-runner null rejection, physical traversal, bounded substeps, settling, and deployed-WASM evidence remain open requirements for later T02 work; they are outside F01's pure fact-derivation boundary and remain parent acceptance gates. C00 can be accepted only as contract/schema preparation, not as runner behavior, physics evidence, deployed Havok proof, playability, or T02 completion.

## Checks performed

- Read the exact C00 and T02-F01 records with `node scripts/check-completion-plan.mjs`; both plan queries exited 0. The checker explicitly reports plan consistency only, not implementation or runtime verification.
- Read C00-A/C00-B implementation and independent source/runtime reports, C00-B repair review, canonical contracts, decisions, contract work, and current task statuses.
- No local application install, test, build, typecheck, lint, formatter, server, or physics check was run.
