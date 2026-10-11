# T02-L01-ARTIFACT-1 implementation

Status: **IMPLEMENTED; independent review and exact-head hosted verification pending.**

## Changes

Added a pure bounded matrix serializer in `games/counterball/src/simulation/loftCoarseProbe.ts` and focused Node/Vitest coverage in `games/counterball/src/simulation/loftCoarseProbe.test.ts`. The public exports are the requested ordered tuple constant, tuple/case/matrix metadata/byte-sink/summary types, and `writeLoftCoarseMatrix`.

The writer emits compact deterministic JSON in the order `metadata`, streamed `cases`, and a final `envelope`. It checks the exact canonical 24-tuple order, indices, per-case and aggregate row/workload counts, finite JSON values, and inclusive UTF-8 limits from the frozen L01 guard. It preserves number precision using JSON's round-trippable number form, including negative zero. It accounts for delimiters and the final envelope, returns exact byte totals, and rejects output larger than the configured matrix cap before appending the over-limit bytes. It retains one input case plus a chunk buffer no larger than 256 KiB, and awaits every sink write. Cancellation, malformed input, limits, and sink errors call `sink.abort` and never return a success summary.

The pure tests cover the exact 24 tuple order and uniqueness, deterministic compact output, UTF-8 byte accounting and full-precision values, exact and over row/metadata limits, malformed/non-finite values, missing/reordered/extra cases, sink backpressure, cancellation, and sink failure. The files do not import Babylon, Havok, or NullEngine.

## Inputs and checks

Read the extracted packet, AGENTS and execution instructions, accepted L01 guard/schema reports, packet-split review, canonical L01 contract/caps, local notes, config/types/fixture and restart-pose helper.

- `node scripts/check-completion-plan.mjs --packet T02-L01-ARTIFACT-1` — plan consistency verdict **PASS**. The extracted packet record itself reported `ready: false`, `required_parent_acceptance: ["T01"]`, and no initial-ready packets; this implementation does not change that shared state.
- `git diff --check -- games/counterball/src/simulation/loftCoarseProbe.ts games/counterball/src/simulation/loftCoarseProbe.test.ts` — **exit 0**.
- Unit tests, typecheck, lint, formatter, build, browser, and physics checks — **NOT RUN** as required. Hosted `pnpm verify` remains pending independent review.

The accepted row-count and row-byte ceilings imply a 19,935,744-byte maximum case payload before small JSON framing, below the 20-MiB case cap. Twenty-four 20-MiB cases plus the two 64-KiB metadata/envelope caps also remain below the matrix cap. The case and matrix limits are enforced, but their exact threshold cannot be reached by a valid input while all stricter row/count ceilings remain in force; tests exercise the reachable row and metadata boundaries instead. The fixed envelope is bounded and checked against its 64-KiB cap.

No real Havok, Chromium, loft, calibration, playable match, or deployed-physics result is claimed. The source commit SHA is not available until the coordinator records the reviewed changes in a commit.

## Changed paths

- `games/counterball/src/simulation/loftCoarseProbe.ts`
- `games/counterball/src/simulation/loftCoarseProbe.test.ts`
- `execution_state/reports/T02-L01-ARTIFACT-1-implementation.md`

Next: independent source review, then coordinator-run `pnpm verify` on the exact reviewed SHA.
