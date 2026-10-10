# T02-B2 real-Havok artifact retrieval and review — run 18

## Objective and accepted upstream evidence

Retrieve and independently review the complete intended-shot artifact from GitHub Actions run `38042497937`, commit `479fd74a5017640b0e9f69c26cad8e4f384aa325`, in `folaoluwafemi/korre`. Run #18 passed hosted verify (including typecheck, ESLint, Prettier, unit tests, and build), integration, and all three one-worker Chromium tests. The intended-shot test passed its 40-trial matrix; the hosted log reports 1,886 ms. GitHub uploaded artifact `11665948583`.

GitHub artifact API metadata reported:

- name `counterball-intended-shot-observations`;
- size 814,424 bytes;
- ZIP digest `sha256:570ba77d2213477aee6833f1d7c59edea865f0e2266018804f9b86e9728d86ea`;
- workflow run `38042497937`, head commit `479fd74a5017640b0e9f69c26cad8e4f384aa325`.

## Exact ownership

Coordinator may write only:

- `execution_state/reports/T02-B2-intended-shot-observations-run-18.zip`
- `execution_state/reports/T02-B2-artifact-retrieval-run-18.md`

Reviewer `/root/swarm_review` may write only:

- `execution_state/reports/T02-B2-artifact-review-run-18.md`

The already downloaded extraction at `.artifacts/counterball-b2-run18-download/counterball-intended-shot-observations.json` is staging data, not the preserved source artifact. Do not modify it. No source, config, workflow, package, task-status, or ledger files are in artifact-review ownership.

## Coordinator retrieval requirements

Use authenticated GitHub CLI access without displaying or logging credentials. Retrieve the exact run-18 artifact ZIP bytes and verify the local ZIP SHA-256 and length against the GitHub metadata above. Preserve those exact bytes at the coordinator ZIP path. Record the GitHub run/commit/artifact identifiers, server ZIP digest, locally recomputed ZIP digest, byte count, and SHA-256 of the extracted JSON in the retrieval report. Do not claim data review at this stage.

## Independent data review

Read the exact ZIP and retrieval report. Independently verify ZIP integrity and exactly one expected JSON member. Confirm the JSON digest/provenance, top-level Havok/Babylon/WASM and diagnostic metadata, and all 40 observations:

1. The tuples equal the full 5-by-8 tilt/impulse matrix with unique keys and canonical ordering.
2. All per-row numeric inputs and reported body values are finite; contact steps/points are well-formed; material read-back and cap-only planar impulse conditions are consistent.
3. Every row contains honest all-body settle time or a null timeout consistent with duration, actual cap/button contact and path/height/speed fields, obstacle positions, and clearance samples when the horizontal-radius condition occurs.
4. Do not infer a configured epsilon. `clearanceEpsilon` and `clearsByConfiguredEpsilon` are null because canonical config has no clearance-epsilon field. Report raw positive/negative signed-clearance evidence separately and explicitly leave the configured-threshold criterion unresolved.
5. Report any inconsistency or missing evidence as CHANGES_REQUIRED; do not modify the artifact or gameplay/config values.

No local builds/tests/lint/typecheck/server are needed or permitted for this read-only data review. This artifact review alone cannot accept T02-B2 because the canonical clearance-epsilon criterion remains unresolved.
