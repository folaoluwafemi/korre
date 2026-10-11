# T02-BR02-MASS-READBACK-1 acceptance

**Status: ACCEPTED for diagnostic-readback scope only.** T02 and T02-BR02 remain open; this card proves no impulse, successful shot, cap-mass result, deployed Havok, or playable flow.

The amended exact-source review passed at `execution_state/reports/T02-BR02-MASS-READBACK-1-scope-review.md`. The exact-run evidence review passed at `execution_state/reports/T02-BR02-MASS-READBACK-1-run-38142200238-review.md`. GitHub run 38142200238 on `bf80bfb028310e77005e74a5b9c41c00bfbe9b98` passed `pnpm verify` (29 files/161 tests), integration (1/1), and built preview (4/4). The focused Chromium diagnostic collection had zero skips, but both cases failed before impulse after loading real Havok/WASM. The observed button native value was `0.15000000596046448`; the configured value was `0.15`. Cap masses remain unmeasured, and cleanup after the retry's mass rejection remains unverified. The complete exact-run record is `execution_state/reports/T02-BR02-MASS-READBACK-1-run-38142200238.md`.

A non-application Node numeric sanity check confirmed `Math.fround(0.15) === 0.15000000596046448`. This is an exact observed numerical match for the button measurement; it does not establish that Babylon/Havok documents or guarantees a float32 mass representation. The canonical configuration and setter values remain unchanged.

The bounded successor is `T02-BR02-OBSERVED-MASS-PROJECTION-1`. Its exact packet extraction and the plan-wide document check pass; it preserves the canonical masses and strict rejection bound, and tests the projection against all browser-read bodies before any impulse. The previous BR02 formatting card is SUPERSEDED (not accepted) only to serialize its already-applied formatting diff with that repair.
