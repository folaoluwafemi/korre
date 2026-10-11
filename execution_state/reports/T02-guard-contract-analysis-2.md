# T02 diagnostic guard contract analysis — revision 2

Date: 2026-10-11

## Finding

The earlier worked numbers remain arithmetic examples only. No guard value is selected or accepted. Under the frozen contract, `physicsCalibration` is null and the strict `PhysicsCalibration` object combines guard fields with physical calibration coefficients. A diagnostic envelope would need a coordinator-owned typed, schema-validated, hashed contract amendment, while keeping production calibration null and preventing ordinary local, AI, online, and deployed play from consuming the diagnostic envelope.

The worked energy bound is valid only if the runner proves a vertical and horizontal support invariant at every actual Havok substep. An open horizontal apron by itself is insufficient: a collider could leave the vertical support region or pass below its minimum rest elevation, allowing gravity to add energy. “Support” here does not mean continuous floor contact. The button may lift and travel through the air; it must remain within the proven support volume and must not fall below its minimum rest elevation. If this invariant cannot be enforced and observed, a separately derived maximum gravitational potential-drop term is required, and every speed, rotation, apron, and workload bound below must be recomputed before any guard is considered.

## Required support invariant

For every actual substep, including during airborne motion:

- The full collider of every body stays horizontally inside the proven support apron. Bounding only a center point is not enough; include the body's orientation-dependent footprint or a conservative enclosing radius. The certificate must cover the swept collider over each substep, not just the two sampled endpoint poses, or it cannot rule out tunnelling between checks.
- The actual oriented full collider does not penetrate below the support floor plane at `surfaceY`. For the canonical cylinders, this also bounds the center of mass from below by its minimum rest height: `surfaceY + capHeight/2 = 0.06` for a cap and `surfaceY + buttonThickness/2 = 0.0225` for the flat button. Check the full shape against the plane; a center-only test is insufficient.
- The runner records actual substep duration, swept body motion, and contacts, and can establish the invariant at the stepping boundary. If it cannot establish it, if observed energy leaves the derived envelope, or if a step, batch, or wall-time budget is exhausted, the diagnostic returns `resourceLimit` and produces no successful trial result.

This does not require contact with the slab throughout the shot. A button can be lofted and remain airborne while its whole collider stays inside the horizontal apron and does not fall below the minimum rest elevation. Conversely, an apron that only covers x/z motion does not prove this vertical condition and cannot rule out tunnelling below the slab. The current `worldFactory.ts` finite slab has no proposed apron or per-substep vertical proof, so this invariant is not implemented evidence.

If the support invariant cannot be proven, derive a bounded maximum downward displacement `Δh_i` for every body over the complete diagnostic horizon, including vertical velocity that can be transferred from the initial impulse through collisions. Then include at least the possible gravitational energy gain in the total envelope:

`Emax = Einitial + Σ_i(m_i × g × Δh_i) + any separately bounded external/solver work`.

The existing 15-second shot horizon alone is not an approved `Δh` value: a derivation must account for the permitted initial energy, collision transfers, gravity, and all other allowed work. If no finite displacement/work bound can be established for the diagnostic domain, there is no finite energy envelope to use. Do not substitute an arbitrary fall distance. Recompute from the resulting `Emax`: linear and angular speed limits, orientation-dependent point-sweep bounds, required substeps, apron extent, maximum Havok calls, batch count, and wall-time budget. If the resulting substep requirement exceeds the declared budget, fail closed or revise the domain and derive the bounds again.

## Conditional worked example — all values provisional

This example is conditional on the required invariant being implemented and independently verified. It is not a calibration, measurement, selected config, or gameplay default. The assumptions are:

- One direct impulse of magnitude 8 is applied at the selected cap's center of mass.
- The canonical fixture starts at rest; there are no other external impulses or energy sources.
- Restitution is at most 1, friction is nonnegative, body masses and inertias match the assumed geometry, and the solver adds no energy beyond the envelope.
- Every full collider remains within the proven horizontal apron and does not penetrate below the support floor at every actual substep. For these cylinders that prevents the center of mass from dropping below its minimum rest height. Airborne motion is allowed.
- The trial horizon is at most 15 seconds. This bounds the example's nominal tick count; it does not prove the workload completes before a wall-time limit.

For the exact center impulse on the mass-1 cap, the initial kinetic energy is `E = J²/(2m) = 32`. Configured dimensions are cap radius 0.32, height 0.12, mass 1; button radius 0.13, thickness 0.045, mass 0.15. Using solid-cylinder principal inertias and the whole energy budget conservatively for whichever body is being bounded gives:

| Body | Minimum principal inertia | Farthest collider radius | `vBound = sqrt(2E/m)` | `omegaBound = sqrt(2E/Imin)` |
| --- | ---: | ---: | ---: | ---: |
| Cap | 0.0268 | 0.3255764 | 8.0000 | 48.8678 |
| Button | 0.0006590625 | 0.1319327 | 20.6559 | 311.6210 |

These are conditional mathematical bounds, not observed Havok behavior. Verify actual mass properties before relying on them. Example-only guard candidates from the prior analysis are: translation limit 0.01125 (one quarter of the 0.045 button thickness), rotation limit `pi/8`, and maximum substep count 120. At 120 nominal ticks per second, the example's full-precision sweep calculations require 46 translation substeps and 7 rotation substeps, so `Nrequired = 46`; the corresponding Havok call duration is approximately `1/(120×46) = 0.0001811594 s`. The provisional open apron calculation for 15 seconds is approximately `20.6559×15 + 0.131933 = 309.971`, with 311 as an example rounded-up extent. None is selected, hashable, or accepted.

At a 15-second horizon, there are 1,800 nominal ticks; 46 substeps per tick would mean 82,800 actual `executeStep` calls per trial. The meaning of `maxBatchSteps` must be frozen explicitly as nominal ticks or actual substep calls. The existing 30-second schema maximum is a bound, not evidence this workload fits. Every exhausted limit returns `resourceLimit`.

## Contract and execution boundary

The independent review confirmed that the current strict calibration schema contains coefficients and guard/workload fields together, with `physicsCalibration: null`; its numeric ranges do not select settings. A separate diagnostic guard could be safe only after a coordinator-owned amendment defines its canonical type, strict schema, config/hash and fixture updates, versioning, exact input domain, batch semantics, and diagnostic-only access boundary. Keep calibration null. Do not add a worker-private or unhashed guard type.

The example excludes other impulses, off-center torque, restarts, noncanonical initial velocity, different geometry, and candidate traversal. It does not prove collision-free movement or settling. C00 still requires actual substep instrumentation and whole-button swept-clearance/contact evidence. The C02 plan record is not ready and its acceptance criteria still require evidence across confirmation cases; no C02 calibration can be inferred from a peak or a no-contact candidate.

## Remaining assumptions and exact inputs/outputs

Inputs consulted: `execution_state/reports/T02-guard-contract-analysis-1-review.md`; `execution_state/reports/T02-guard-contract-analysis-1.md`; `knowledge_base/execution/CONTRACTS.md`; `knowledge_base/execution/completion/CONTRACT_WORK.md`; `knowledge_base/execution/DECISIONS.md`; canonical geometry, masses, gravity, duration, and calibration null state in `packages/game-protocol/src/config.ts`; cylinder construction in `games/counterball/src/simulation/worldFactory.ts`; and the C02 plan extraction/readiness evidence supplied by the coordinator.

Output: this report supplies the corrected conditional support invariant, distinguishes it from continuous floor contact, preserves the prior provisional arithmetic, and specifies the extra potential-drop energy term and full recomputation required if the invariant is unavailable. No config value, guard, calibration coefficient, or gameplay default is selected.

Still missing before selection: coordinator-owned diagnostic guard contract/config/hash amendment; a finite and enforced full-collider support proof at every actual Havok substep or a separately derived finite `Δh`/external-work envelope; verified Havok mass properties and energy behavior; frozen `maxBatchSteps` semantics; actual substep/contact evidence; and demonstrated workload/wall-time compliance. No build, test, physics, browser, deployment, or runtime check was run for this report.
