# Diagnostic support-apron native dimension contract proposal

**Date:** 2026-10-14  
**Status:** PROPOSED; not accepted and not yet implemented  
**Evidence run:** [GitHub Actions run 38613508970](https://github.com/folaoluwafemi/korre/actions/runs/38613508970)  
**Exact source commit:** `533df8426d8187875565a74b2997987886a1ca71`

## Observed failure and bounded inference

The exact-head hosted run passed verification (30 files, 184 tests), integration (1/1), and the ordinary Chromium preview (4/4). Its routed real-browser diagnostic suite collected four tests: three passed and the full-Havok matrix test failed before downloading or running a case. The surfaced failure is the existing strict check that the temporary diagnostic `support-apron` dimensions equal `(662, 0.2, 670)`.

The failure result does not expose which apron axis differed. The x/z constructor inputs are the exact integers 662 and 670. The apron is a `PhysicsShapeBox` constructed with the same configured thickness `0.2` as the canonical support slab. In exact pinned-browser/Havok run 38466161040, the same constructor/readback path returned canonical slab dimensions `(12, 0.20000000298023224, 20)`: x/z were exact and y equalled `Math.fround(0.2)`. **Inference, not direct apron readback:** the new failure is the apron Y dimension's binary32 projection. The next hosted full-matrix run is required to validate this inference; a projection match alone does not accept the packet.

## Proposed clause

For only the temporary matrix support body named `support-apron`, retain exact `BOX` type and exact local-AABB x/z dimensions 662 and 670. Compare its finite local-AABB y dimension to exactly `Math.fround(0.2)` (the configured/constructed thickness); accept no epsilon, neighboring float, alternate dimension, or non-finite value. Preserve and serialize the unmodified observed dimensions. Keep the canonical surface transform and configured/constructed `662 × 0.2 × 670` geometry unchanged. Keep all other static collider checks unchanged.

This is a narrowly scoped native readback representation rule for the synthetic, diagnostic-only apron attached during the restart-loft matrix. It does not alter the product pitch slab, any configured geometry, the hashed guard/config/fixture, physics behavior, matrix inputs/order, metadata schema, production defaults, or match rules. It does not relax the already accepted canonical support-slab clause or the dynamic-cylinder clause. It makes no matrix, calibration, deployed-physics, T02, or playability acceptance claim.

## Required review and validation

Before implementation, an independent reviewer must confirm the proposal's scope, exact-value semantics, compatibility with the prior support and dynamic-geometry clauses, and the explicitly labelled inference. If accepted, the implementation may change only the existing temporary-apron Y comparison and its focused assertion. Hosted verification, integration, preview and diagnostic suites must run on the exact reviewed commit. Accept the implementation only if the real pinned-Havok browser matrix completes all 24 ordered cases, host-validates and downloads the full actual artifact with zero skips, retries or flakes, and a separate reviewer verifies exact run/commit provenance, artifact contents and hashes. Any further preflight failure remains a failure and requires a new evidence-based bounded response.
