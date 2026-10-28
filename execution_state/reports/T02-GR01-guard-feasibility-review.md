# T02-GR01 diagnostic guard feasibility review

Date: 2026-10-11

## Verdict

**ARITHMETIC: CONDITIONALLY COMPATIBLE. OVERALL GUARD-SAFETY VERDICT: CHANGES_REQUIRED.** The missing runtime properties and per-substep invariants below prevent endorsing these numbers as a safe executable guard.

I found no arithmetic contradiction in the D39/GC01 values when they are evaluated against the configured masses and cylinder dimensions using the stated ideal-solid-cylinder assumptions. The 48-substep ceiling is just sufficient for the computed whole-button point-sweep bound at energy 34, with only about 1.74% margin. The runtime has not yet proved the assumptions that make those calculations safe. In particular, this audit does not establish Havok inertia readback, solver energy behavior, enforced full-collider swept support at each substep, or that the workload fits the wall-time budget.

## Frozen values checked

D39 and `packages/game-protocol/src/config.ts` specify a diagnostic-only center impulse of magnitude 8 on mass-1 `home-6`; energy limit 34; maximum COM drop and full-collider point sweep 0.01125; maximum rotation per substep π/8; at most 48 substeps per nominal 1/120-second tick; 325-unit support apron; at most 86,400 actual Havok calls per shot, 120 per batch, and 30,000 ms wall time. Configured body values are cap mass 1, button mass 0.15, cap radius/height 0.32/0.12, button radius/thickness 0.13/0.045, and gravity 9.81 units/s². The physical calibration remains null. These are provisional diagnostic policy values, not player power or gameplay tuning.

## Recomputed conditional arithmetic

For a solid cylinder of radius r, axial length h, and mass m, I used I_axis = m r²/2 and I_transverse = m(3r²+h²)/12, with the smaller principal inertia as I_min. The conservative farthest-point radius is √(r²+(h/2)²). Taking the full energy allowance 34 for whichever single body is being bounded gives:

| Body | I_min | Farthest-point radius | v_bound = √(2E/m) | ω_bound = √(2E/I_min) |
| --- | ---: | ---: | ---: | ---: |
| Cap | 0.0268 | 0.3255764 | 8.2462113 | 50.3717523 |
| Button | 0.0006590625 | 0.1319327 | 21.2916259 | 321.2115519 |

Using the frozen 1/120-second tick, the conservative point sweep (v_bound + ω_bound × r_max)/120 is approximately 0.205384 for a cap and 0.530583 for the button. Dividing by the per-substep limit 0.01125 and rounding up requires 19 and 48 substeps, respectively. The rotational requirement (ω_bound/120)/(π/8), rounded up, is 2 for a cap and 7 for the button. Thus the maximum combined requirement is 48, matching the configured ceiling. At 48, the button's calculated point sweep is about 0.01105381 per call, only 0.00019619 below the limit (about 1.74% of the limit). This depends on full precision and exact assumed properties; rounding intermediate bounds or slightly larger actual inertia geometry/speed invalidates the margin. The rotation limit has substantially more room.

For the one center impulse, J²/(2m) = 8²/2 = 32. If all 14 caps and the button could descend by 0.01125, the gravity work term is (14 + 0.15) × 9.81 × 0.01125 = 1.561629375, so the sum is 33.561629375, below 34 by 0.438370625. This arithmetic applies only if the support/COM-drop invariant holds, and if external or numerical solver work does not add unbounded energy. It is not a solver guarantee.

At the button speed bound, the conservative 15-second horizontal travel plus its farthest-point radius is 21.2916259 × 15 + 0.1319327 ≈ 319.5063, below the 325 apron by about 5.4937. This assumes the full shape starts inside the region covered by the apron and remains governed by the energy/speed bound. The 1,800 nominal ticks times 48 calls equals the 86,400-call maximum; 120-call batches imply 720 batches. Those counts agree exactly with the configured caps. The 30-second wall limit has no arithmetic proof of feasibility.

## Evidence from accepted D01 data

The accepted hosted D01 report identifies exact run 38100635457 at SHA `8f0e840d340a480f51d4d76c4f33c791aad05f56`, running pinned Babylon 9.30.0/Havok 1.3.14 WASM in the CI NullEngine. Its six raw direct-impulse observations use the canonical fixture and apply the impulse at the selected cap center. For impulse 8, the artifact records immediate selected-cap linear velocity (0, 0, 8), consistent with the configured mass-1 linear impulse response; the unrelated bodies started at rest. All 15 bodies settled in the six observations, and the hosted verification passed 141 tests with no skips.

The D01 observations are at the nominal 120-Hz stepping rate, not the proposed 48 guarded substeps per tick. The accepted review explicitly says they prove neither continuous traversal nor deployed physics. Sampled pose/contact records therefore cannot prove the per-substep sweep, floor-support, energy, or apron invariants required here. The recorded nominal-step movement for the impulse-8 row is approximately 0.066667, above 0.01125; that is not a contradiction because D01 did not apply this new substep guard.

A posthoc calculation from the retained sampled D01 JSON at `execution_state/reports/C01-P-run-38100635457-artifacts/counterball-intended-shot-observations/counterball-intended-shot-observations.json` used each stored body velocity and height relative to its fixture start; rotational kinetic energy was conservatively upper-bounded using the largest configured principal inertia times angular-speed squared over two. On the impulse-8 straight row, the aggregate sampled maximum was approximately 31.99829, with a maximum observed COM drop of approximately 0.00004307. This is an upper-bound calculation on recorded 120-Hz samples, not instrumented Havok energy or substep evidence. The samples show no obvious large energy excursion in that particular nominal-step run, but cannot exclude energy growth or tunnelling between samples and do not establish the guarded runtime envelope.

## Required proof before endorsing runtime implementation

The arithmetic is conditional, and current source does not provide the necessary guard implementation. Before treating these values as a safe executable envelope, the diagnostic runner must:

- Read back or otherwise verify actual pinned-Havok masses and principal inertia against the assumptions, including button inertia; configured shape/mass setters alone do not prove the resulting runtime properties.
- Enforce and record, before/after every actual Havok substep, the full oriented collider's swept horizontal apron containment and nonpenetration below the support floor. Endpoint poses or center-only checks do not rule out tunnelling. Airborne motion is allowed; the full collider must stay inside the apron and above the floor.
- Measure actual substep motion/contact provenance and check the mechanical-energy bound. Establish that allowed material/contact behavior and solver error cannot add energy outside the bound, or fail closed whenever the bound cannot be established.
- Enforce the exact integer requirement with full precision, fail closed above 48 substeps, and account for all actual calls, batching, and wall time. The 30-second budget must be demonstrated on the hosted target, not inferred from call counts.
- Keep all this isolated to the versioned, hashed diagnostic scope; it must not become ordinary local/AI/online play calibration while `physicsCalibration` is null.

Until this exists and is independently checked with actual pinned-WASM execution, do not endorse the guard as safe or claim a runtime pass. No source, config, contract, or task state was changed. This audit ran no build, test, browser, physics, install, Wrangler, or deployment command.

