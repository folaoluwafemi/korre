# T02-L01-MATERIAL-DIAGNOSTIC-1 proposed packet independent review

**Verdict: PASS. Packet is READY for implementation.** This is approval of the bounded diagnostic card only; it accepts no material change, MATRIX-1 result, artifact, or parent T02.

The exact packet checker returns plan PASS, lists `T02-L01-MATERIAL-DIAGNOSTIC-1` in `initialReady`, and reports `required_parent_acceptance: ["T01"]`. Its dependencies preserve every explicit MATRIX-1 prerequisite—including the accepted support-preflight and SUPPORT-F32 gates—and add the required executor dependency. MATRIX-1’s own original dependencies and 24-case acceptance requirements remain intact.

The sole worker write path is `games/counterball/src/simulation/loftCoarseRunner.ts`. The proposal changes only the existing mismatch message in `setAndReadMaterial`. The source still validates finite/domain-safe native material values in `materialValues` (`:324-369`) and uses strict `readback[key] !== setter[key]` before the unchanged `resourceFailure` (`:382-411`). JSON serialization of those validated finite number/string scalars provides a round-trip representation without tolerance, projection, or rounding; the failing key plus setter and native readback can be reported without altering setters, getters, or material semantics.

The accepted F32 run/review establish the new material mismatch occurs after the support-Y preflight and before the matrix produces a success artifact. The packet gives exact Verify and routed Chromium commands, requires complete logs/result JSON/context/trace/artifact metadata and hashes, expects the same native material mismatch with exact values, requires other diagnostic and preview checks to have recorded counts with zero skips/retries/flakes, and explicitly forbids claiming any matrix case, download, or artifact. This is consistent with the prior F32 run’s 4/4 preview checks and diagnostic result of three passed checks plus the expected matrix failure, with no skips/retries/flakes. The matrix remains unaccepted pending its separate full run and review.

This was a pre-dispatch document/source-context review only. No app, browser, physics, or runtime command was run.
