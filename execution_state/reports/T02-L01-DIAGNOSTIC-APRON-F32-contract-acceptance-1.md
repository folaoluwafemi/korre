# T02-L01-DIAGNOSTIC-APRON-F32 contract acceptance

**Date:** 2026-10-14  
**Coordinator:** `/root`  
**Proposal:** `execution_state/reports/T02-L01-DIAGNOSTIC-APRON-F32-contract-proposal-1.md`  
**Independent proposal review:** `execution_state/reports/T02-L01-DIAGNOSTIC-APRON-F32-contract-proposal-1-review.md` — PASS  
**Proposal SHA-256:** `56A65C329E86FC080360C0C5BEDE595BFF7D2121941349FF6D1A8954073B1BBB`

I accept only the narrowly scoped representation clause for the temporary diagnostic matrix `support-apron`: preserve exact `BOX` type and x/z dimensions `662` and `670`, and require finite native local-AABB y to equal exactly `Math.fround(0.2)`. Preserve raw observed dimensions and configured/constructed geometry. No tolerance, neighboring value or alternate dimension is permitted. Every other static check remains unchanged.

The apron’s own y readback remains unobserved. Its expected projection is an inference from the same pinned `PhysicsShapeBox` thickness readback on the canonical support slab. The complete hosted 24-case matrix and independent exact-run/artifact review must validate the result. This acceptance authorizes no source change until its implementation packet is reviewed; it does not accept that packet, the matrix, physics calibration, T02, deployed physics or a playable game.
