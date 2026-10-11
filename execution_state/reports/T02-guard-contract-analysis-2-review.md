# T02 guard contract analysis revision 2 — independent review

Date: 2026-10-11

## Verdict

**SOURCE: NOT IN SCOPE. ANALYSIS: PASS, conditional on the stated support proof.** Revision 2 addresses the main defect in the first analysis identified by its independent review: it no longer relies on a horizontal apron alone to rule out gravity-driven energy gain, and it does not equate support with continuous floor contact.

## Review findings

- **Full-collider support:** The revised invariant requires every body's full collider to remain horizontally inside the support apron, including orientation-dependent extent and swept motion over each substep. It separately requires the actual oriented full collider not to penetrate below the support floor. This is the needed distinction: a center-only bound or x/z apron does not prevent falling below the slab.
- **Center-of-mass lower bound:** For the stated cylinders, the minimum vertical half-extent over orientations is half the cylinder height because each radius exceeds its half-height (`0.32 > 0.06` for a cap; `0.13 > 0.0225` for the button). Thus full-shape nonpenetration implies the center of mass cannot descend below the canonical upright rest elevation, provided the actual collider geometry and floor plane match those assumptions.
- **Loft:** Airborne motion remains allowed. The example's energy argument is conditional on the collider staying within the support volume and above the floor invariant; it does not impose continuous slab contact or claim that the current finite slab supplies this proof.
- **Fallback energy term:** If support cannot be proved, revision 2 requires a derived maximum downward displacement for each body's center of mass over the complete horizon, including collision-transferred vertical velocity, and adds `Σ(m_i × g × Δh_i)` plus separately bounded external/solver work to `Emax`. It rejects an invented convenient drop distance and states that no finite bound means no usable energy envelope.
- **Recomputed bounds:** It explicitly requires recomputing linear/angular speed, orientation-dependent sweep, substep count, apron, maximum Havok calls, batch count, and wall-time budget from the revised energy envelope. It also preserves fail-closed behavior when the requirement exceeds the declared budget.
- **Conditional assumptions:** The worked example remains limited to the stated center impulse, canonical at-rest fixture, restitution/friction and solver-energy assumptions, verified mass properties, and 15-second horizon. It excludes other impulses, off-center torque, restarts, other initial states, and traversal proof. The report correctly keeps actual substep instrumentation, swept clearance/contact evidence, calibration, and workload verification as outstanding.
- **No values or runtime result selected:** Example guards and calculated values are repeatedly labelled provisional arithmetic only. The report states that config remains unselected, no checks or runtime trial were run, and the current world factory has no apron or per-substep vertical proof. It makes no calibration, traversal, gameplay, or deployed-physics acceptance claim.

## Evidence limit / implementation condition

The analysis is accepted as a conditional guard derivation, not evidence that its invariant exists. Any implementation must establish the full collider's vertical nonpenetration across each complete solver substep, including between sampled endpoint poses; boundary-only checks would not rule out tunnelling below the floor. Revision 2's requirements for swept motion and an invariant at every actual substep support that reading, but a future runner/review must verify that the vertical sweep is covered as well as the horizontal apron. If it cannot establish that proof, it must use the separately derived finite `Δh`/work envelope or return `resourceLimit`.

No source, configuration, runtime, physics, build, test, browser, or deployment evidence was examined or produced in this review.
