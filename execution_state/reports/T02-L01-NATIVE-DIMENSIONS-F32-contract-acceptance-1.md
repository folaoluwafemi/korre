# T02-L01 native-dimensions Float32 contract acceptance

Date: 2026-10-14  
Coordinator: `/root`  
Verdict: ACCEPTED as a representation contract amendment only.

## Basis

The proposed clause SHA-256 `0428E62E29171A205D9E595A73E5C1649BFA8F791F4144F8215691B4EBB356F9` passed independent wording review at `execution_state/reports/T02-L01-NATIVE-DIMENSIONS-F32-contract-proposal-1-review-2.md` (SHA-256 `FCF6A7B27382830BB79113ACE8757D62ADFBBCD7E622885BEB377F1AC04D2C1B`). The independent scope adjudication at `execution_state/reports/T02-L01-NATIVE-DIMENSIONS-F32-SCOPE-ADJUDICATION-1.md` (SHA-256 `45BEA397A2F04D5F60084E0EB6450091E5A2D4A71BCF1D962BBAC90F41DD1EC2`) supports the same exact projection rule across the shared dynamic-cylinder path. It explicitly records that only the button AABB was measured in run `38599929537`; cap readbacks remain unverified.

The accepted clause is now recorded in `knowledge_base/execution/completion/CONTRACT_WORK.md`. It permits only exact finite `Math.fround(expected)` equality for each dimension of the button and fourteen caps, with no epsilon. It preserves raw dimensions in current serialized facts and downstream calculations, raw extrema in existing failure diagnostics, and makes no artifact schema, geometry, configuration, hash, or physics changes. Static shapes retain existing checks.

`git diff --check -- knowledge_base/execution/completion/CONTRACT_WORK.md execution_state/reports/T02-L01-NATIVE-DIMENSIONS-F32-contract-proposal-1.md` passed. This acceptance is limited to contract semantics. No source implementation, application command, browser run, cap readback, matrix, T02, calibration, or playability was accepted or run.

## Next gate

The bounded implementation/matrix successor packet must be independently reviewed and extracted as ready before dispatch. It must retain every original MATRIX-1 dependency plus accepted geometry readback, supersede only the failed MATRIX-1 attempt, keep raw values, and pass the complete hosted 24-case pinned-WASM Chromium matrix with its actual artifact and independent exact-run review before acceptance.
