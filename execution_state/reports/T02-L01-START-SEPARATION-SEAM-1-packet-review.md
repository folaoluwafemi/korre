# T02-L01-START-SEPARATION-SEAM-1 packet review

**Verdict: PASS.** This approves the bounded pure-math extraction packet only. It does not approve a native control, production consumer change, matrix run, or physics claim.

The exact packet extraction reports plan consistency PASS for 128 packets and `ready:true`; it is the only initially ready packet. Its direct dependencies are the accepted `T02-L01-NATIVE-RADIUS-HELPER-1` and `T02-L01-SUPPORT-DATUM-CONTRACT-1`, with inherited `T01` parent acceptance. It adds no config dependency. The two write paths are the new `games/counterball/src/simulation/loftStartSeparation.ts` and `.test.ts`, disjoint from the separately owned native contact adapter paths.

The proposal freezes two internal, Babylon-free functions using only the canonical protocol `Vec3` type:

- `nativeAabbOriginRadius({ minimum, maximum })` returns the maximum `Math.hypot(x, y, z)` over the same eight min/max corners used in `loftCoarseRunner.ts` today. The loop ordering and arithmetic are explicit, and the helper must fail closed for non-finite, inverted/zero-span, or non-finite/nonpositive results.
- `isLoftStartSeparated(buttonZ, buttonRadius, obstacleZ, obstacleRadius)` preserves the exact strict predicate `buttonZ + buttonRadius < obstacleZ - obstacleRadius`; non-finite inputs, nonpositive radii, or invalid endpoint arithmetic must fail closed.

The proposed `Vec3` import is type-only from `@korre/game-protocol`; it introduces no Babylon, physics, app, or config dependency. The seam preserves the current strict boundary and arithmetic. It adds no epsilon, radius policy, config field, COM-radius change, sweep change, eligibility behavior, or barrel export. Its tests cover the original corner calculation, asymmetric bounds, invalid inputs, and before/touch/overlap strict-boundary cases.

The packet correctly limits implementation to adding and testing the shared helpers. The present runner remains unchanged in this card. Later native-control and matrix consumers must call these same accepted helpers; duplicating the formula and calling that production behavior would not satisfy the seam’s purpose. The native-proof readiness report also warns that the existing initial-obstacle rejection is currently inline, and requires use of the native `farthestOriginRadius`, not configured radii. This packet supplies the reusable math but does not by itself prove the native control invokes it or that a matrix case is rejected.

The acceptance boundary is concrete: independent source review plus the existing hosted `pnpm verify`, integration, and production-preview checks; no local app tests. Only pure helper/unit acceptance is in scope, and native onset delivery, production coupling, the complete matrix, and T02 remain separate gates.

**Checks performed:** exact packet extraction, proposal and source inspection for the existing corner loop and `startsBefore` predicate, and review of the native-proof interface readiness report. No source edits or application/runtime checks were performed.
