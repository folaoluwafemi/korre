# Proposed amendment — exact native float32 support-thickness readback

**State: PROPOSED, pending independent contract/packet review. No source change is authorized by this proposal alone.**

## Evidence and scope

Run 38466161040 on source SHA `1dedcf96e92a0eefcdc4938f45ad50c1d863209a` read the canonical support shape's local AABB from `PhysicsShape.getBoundingBox()`. The expected configured Y dimension is `0.2`; the real Chromium/pinned-Havok readback is `0.20000000298023224`, exactly `Math.fround(0.2)`. The x and z dimensions, support transform, identity rotation, null parent, and unit scale match exactly. Independent review confirms the failure happened before any matrix impulse/`executeStep` and produced no completed matrix artifact.

The accepted diagnostic-only packet explicitly barred changing equality. This is therefore proposed as a distinct exact-representation contract amendment and new implementation packet. It does not reinterpret the configured geometry or authorize an epsilon.

## Proposed rule

Keep the canonical support slab configured and constructed at exactly `12 × 0.2 × 20`, with its existing transform, material, collision filters, trigger state, and open-pavement treatment. At the existing pre-impulse support-AABB check, compare only the Y readback to `Math.fround(config.geometry.surfaceThickness)` by exact equality. Keep the x and z comparisons and every other guard clause unchanged. Keep the configured expected value `0.2` visible in diagnostics and add the exact projected readback expectation when reporting a mismatch.

This is a single, deterministic representation projection. Do not add a tolerance, compare rounded decimal strings, accept either raw/projected values, or adjust the configured shape. Reject non-finite readbacks and every value other than the exact projected number. The unmodified observed native dimensions remain the values used by subsequent native-geometry calculations; this projection applies only to the preflight comparison.

## Proposed bounded implementation

Add one pure helper in `loftCoarseProbe.ts` for the exact dimension projection predicate and unit tests in `loftCoarseProbe.test.ts`. The helper must accept `observed === Math.fround(configured)` only when both inputs and the projected expectation are finite. Exercise the helper from the existing support-Y preflight in `loftCoarseRunner.ts`; update the Y clause match map and mismatch diagnostics to expose configured `0.2`, the projected expectation, and the actual readback. Leave x/z and all other comparisons byte-for-byte semantically unchanged.

The focused unit tests must show: the exact projected value is accepted; configured decimal `0.2` is not accepted as its own native readback; the immediately adjacent float32 value is rejected; `NaN`/infinite observed values are rejected; and finite `Number.MAX_VALUE` is rejected when its float32 projection is infinite, even when the observed input equals the configured input. No physics, matrix, tuple, transport, artifact, CI, or UI assertion is changed.

## Validation boundary

The worker may run only the three-path scoped `git diff --check` locally. The coordinator runs full Verify and the complete existing 24-case real-WASM Chromium matrix on the exact reviewed SHA in GitHub; do not use local builds/tests/browser automation or Cloudflare/Wrangler. The representation packet can be accepted if the focused unit tests pass, real Chromium proceeds beyond this exact support-Y preflight, and independent exact-source/run review confirms only this guard comparison changed. If a later independent matrix guard fails, preserve its exact evidence and keep MATRIX-1 unaccepted. MATRIX-1 itself is accepted only if all 24 cases and the full artifact pass their existing requirements with zero skips/retries and independent review.

## Coordinator disposition — 2026-10-13

The contract amendment and packet passed independent review at `execution_state/reports/T02-L01-SUPPORT-F32-packet-review.md`. The coordinator accepted this narrow diagnostic contract for implementation under `T02-L01-SUPPORT-F32-1` and dispatched its worker on the exact three paths in the packet. The source change and all runtime gates remain pending; this approval accepts no matrix result.
