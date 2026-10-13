# T02-L01-SUPPORT-F32-1 proposed packet independent review

**Verdict: PASS.** This approves the contract amendment and bounded packet for implementation review; it does not accept MATRIX-1 or any runtime result.

The proposal and `CONTRACT_WORK.md:162` keep canonical geometry exactly `12 × 0.2 × 20`. Only native support-AABB Y is compared, by exact equality to `Math.fround(config.geometry.surfaceThickness)`, with configured `0.2` retained in diagnostics. No tolerance, decimal-string rounding, or dual raw/projected acceptance is allowed. Non-finite values are rejected, and raw observed dimensions remain the values for later calculations.

The packet is ready according to the exact checker output (`verdict: PASS`; `initialReady` contains `T02-L01-SUPPORT-F32-1`) and preserves required parent acceptance `T01`. Its three exact worker paths are the probe helper, its unit tests, and the runner. The added tests now explicitly reject raw `0.2`, the adjacent float32 value, non-finite readbacks, and finite `Number.MAX_VALUE` when `Math.fround(Number.MAX_VALUE)` is `Infinity`, including when observed equals the configured input. This covers the prior test-specification gap.

The MATRIX-1 catalogue amendment adds F32 as a prerequisite while retaining every existing dependency. The matrix’s original 24-tuple, full artifact, exact caps, zero-skip/retry, and 20-minute hosted requirements remain present. F32 acceptance only allows the real run to proceed past this support-Y preflight; MATRIX-1 remains separately unaccepted unless its complete existing evidence passes its own review. The generated packet index reflects the added dependency.

This is a pre-implementation document review only. No source, build, unit, browser, physics, or hosted runtime check was run or accepted.
