# T02-L01 candidate guard amendment: bounded math and missing freeze

Date: 2026-10-11

## Conclusion

**STOP BEFORE L01 TRIALS under the currently accepted configuration.** The existing `diagnosticGuard` is strictly limited to the D01 direct impulse on `home-6`; it cannot authorize this distinct 24-case restart-loft matrix. The published geometry and the accepted conditional guard arithmetic show that the numeric ceilings 34 energy units, 0.01125 COM-drop/point-sweep units, a 325-unit apron, and 48 explicit calls per nominal tick are *conditionally sufficient* for the L01 envelope if it is a centered impulse no greater than 8 on a mass-1 cap and every trial starts from rest. They are not yet an accepted L01 policy. The packet does not freeze all of the candidate's impulse application semantics, exact per-case initial-state construction, matrix-wide wall/output limits, or L01 guard identity. Those must be made strict, hashed, independently reviewed, and then proven in hosted real-WASM runs before any trial is applied.

The plan checker passed **plan consistency only** and reported T02-L01 ready; that is not implementation or runtime evidence. No application checks or physics trials were run for this analysis.

## Source facts

- The exact T02-L01 packet record fixes 24 tuples in this order: gap `0.75, 1.0` outermost; tilt `45°, 60°`; restart impulse `6, 8`; azimuth `−15°, 0°, +15°` innermost. Each trial uses the canonical factory, restart pose helper, sampler, and pinned Havok WASM. It requires fixed `1/120`-second states, actual contacts, per-substep guard checks, all 15 bodies finite and settled, and complete artifact output only after assertions. The shared simulation config sets a 15-second maximum duration. A no-candidate result is allowed. The record says stop before trials if the guard is not frozen or cannot be enforced.
- `packages/game-protocol/src/config.ts` currently has schema/config version 2, `physicsCalibration: null`, and one `diagnosticGuard` with scope `browser-direct-impulse-v1`: fixture `counterball-protocol-fixtures-v1`, match UUID `00000000-0000-4000-8000-000000000001`, cap `home-6`, impulse `{0,0,8}` at `{0,0.06,-4}`. Its fixed numeric values are energy 34, rest-height drop 0.01125, apron margin 325, point sweep 0.01125, angular sweep `π/8`, 48 substeps per tick, 86,400 total calls, batches of 120, and 30,000 ms. `types.ts` and `schemas.ts` use exact literals for those values and the D01 scope. Changing an input without a separate strict config/schema amendment fails the existing type/schema contract.
- `CONTRACTS.md` says that this guard is consumed only by the explicit direct-shot diagnostic, that calibrated play must reject null `physicsCalibration`, and that the direct scope excludes restart, off-center impulse, initial velocity, extra force, and alternative fixture. It defines `Emax`, the combined linear/angular per-substep formula, the 325-unit open apron condition, and calls for a fail-closed error when the bound or workload is exceeded. This is not an L01 acceptance.
- The configured geometry is pitch `12×20`, cap radius/height `0.32/0.12`, button radius/thickness `0.13/0.045`, cap/button masses `1/0.15`, gravity magnitude `9.81`, fixed tick `1/120 s`, maximum duration `15 s`, and settle thresholds/window from config. `worldFactory.ts` makes a slab whose top is `surfaceY`, with no perimeter walls; caps and button are vertical-endpoint cylinders with configured dimensions and `setMassProperties({mass})`.
- `deriveRestartButtonPose` computes horizontal and vertical button support as `rb*cos(tilt)+(h/2)*sin(tilt)` and `rb*sin(tilt)+(h/2)*cos(tilt)`. It places the button center at `surfaceY + verticalSupport`; the returned orientation depends on azimuth and tilt. These poses have different starting COM heights, so an L01 drop reference must be defined per candidate.
- The existing `intendedShotProbe.test.ts` is a useful setup precedent: it uses `home-0` at `(0, surfaceY+capHeight/2, -5)`, derives the button pose, places `home-1` ahead at a gap, zeroes all body velocities, and applies a planar `+z` impulse at the selected cap's center. It moves other caps to filler slots. This file is a probe implementation, not a frozen L01 contract. Its obstacle is fixed on +z while the candidate button azimuth changes; that detail must not be silently interpreted as a different L01 rule.
- Accepted `T02-GR01-guard-feasibility-review.md` recomputed the direct-guard ideal-cylinder values and found them arithmetically compatible but **not proven safe**: native inertia/readback, energy behavior, full swept support enforcement, and wall-time feasibility remain requirements. It records the cap/button idealized minimum inertias as `0.0268/0.0006590625` and farthest radii as `0.3255764/0.1319327`, and warns that the 48-call button margin is only about 1.74%.

## Conditional energy and inertia arithmetic

For a centered impulse `J` on a mass-1 cap initially at rest, the immediate kinetic energy is `J²/(2m)`: 18 for `J=6`, 32 for `J=8`. If every dynamic body's COM can descend no more than `d=0.01125` from its *own candidate's at-rest start height*, the worst-case gravitational energy release is:

`ΔUg ≤ (14×1 + 0.15) × 9.81 × 0.01125 = 1.561629375`.

Therefore the largest available kinetic-energy bound over the matrix is `32 + 1.561629375 = 33.561629375`; rounding upward to 34 preserves the existing candidate ceiling. For `J=6`, the corresponding sum is `19.561629375`. The `0.438370625` headroom at `J=8` is small and is not solver-error allowance or a passivity proof.

This reuse is valid only if (a) all 15 bodies start with zero linear and angular velocity for each case; (b) the impulse is applied to the mass-1 selected cap exactly at its native COM, with no other impulse/force; (c) materials are read back and satisfy the non-energy-adding domain (finite nonnegative friction, restitution in `[0,1]`); (d) COM drop is measured from each case's constructed rest pose, not the unmodified fixture pose; and (e) the runtime checks every actual explicit Havok call and fails closed on energy, support, or geometry violations. A lever arm adds rotational impulse energy:

`Erot = 1/2 · (r×J)^T I⁻¹ (r×J)`.

If the L01 impulse is off-center, applied to the button, or starts from nonzero velocity, recalculate the full impulse work with actual native mass/inertia. Do not use 34 until that calculation fits. The current packet/source record does not itself freeze this application point, so it is a blocker until specified.

For conditional solid-cylinder estimates, `Imin=min(mr²/2, m(3r²+h²)/12)` and `rMax=sqrt(r²+(h/2)²)`. These give cap `Imin=0.0268`, `rMax≈0.3255764`, and button `Imin=0.0006590625`, `rMax≈0.1319327`. At `Ekin=34`, the per-body conservative bounds are:

| Body | `vBound=sqrt(2E/m)` | `omegaBound=sqrt(2E/Imin)` | `(vBound+omegaBound*rMax)/120` | Calls required at 0.01125 / `π/8` |
|---|---:|---:|---:|---:|
| Cap | 8.2462113 | 50.3717523 | ≈0.2054 | 19 translation, 2 rotation |
| Button | 21.2916259 | 321.2115519 | ≈0.5306 | 48 translation, 7 rotation |

Thus `Nrequired=max(1,ceil((vBound+omegaBound*rMax)*dt/0.01125),ceil(omegaBound*dt/(π/8)))` is 48 in the idealized worst case, matching but not exceeding the current ceiling. At 48, the estimated full-button point sweep is ≈0.01105381 per call. This leaves only ≈0.00019619 below the per-call limit. Before a trial, the actual pinned runtime must validate every body's mass, full inertia tensor/minimum principal inertia, collider dimensions, and COM against these assumptions. If native values require more than 48, stop; do not round down or enlarge the call duration.

## Candidate apron and workload

Assuming every initial collider lies within the painted `12×20` pitch, the greatest energy-based horizontal center speed is the button's `21.2916259`. A 15-second bound plus the maximum collider radius gives:

`21.2916259 × 15 + 0.1319327 ≈ 319.5063` game units.

The 325-unit margin leaves about 5.4937 units. A uniform physical apron would therefore be `12+2×325 = 662` wide and `20+2×325 = 670` long, with the original slab top at `surfaceY`; it remains open and has no walls. This derivation fails if any candidate body begins outside the painted pitch, if the COM-to-collider radius is larger, or if the energy-derived speed is invalid. For all 24 cases, explicitly check each whole collider's pre/post swept bound remains within this expanded support and that no collider passes below the permitted floor/rest bound.

Per worst-case candidate: 15 seconds × 120 nominal ticks/s = 1,800 ticks; at 48 explicit calls/tick this is 86,400 calls; batches of 120 actual calls require 720 yields. Across 24 sequential candidates the maxima become **2,073,600 calls**, **17,280 batches/yields**, and, if the direct guard's 30-second wall cap is separately chosen per candidate, **720,000 ms (12 minutes)** worst-case matrix wall time, before setup/serialization. Those matrix totals are not the existing D01 `maxTotalSubsteps=86,400` or `maxWallTimeMs=30,000`; the existing values are explicitly a one-shot guard. A distinct hashed L01 policy must bound both per-candidate and aggregate calls, per-candidate and aggregate wall time, batch/yield cadence, cancellation, and output bytes. The packet requires up to 43,224 nominal frames and 648,360 body transforms if all trials reach 15 seconds. A concrete JSON byte/contact cap cannot be derived from the current hashed config or the listed source schema; choose and test one before trial execution, never truncate while reporting a complete 24-case artifact.

## Required new hashed identity (proposal only)

Keep `diagnosticGuard` unchanged. A separate strict `restartLoftDiagnosticGuard` (name provisional) should have its own schema/type and a new diagnostic-only scope/version, rather than widening the direct-shot literals. At minimum, hash and validate:

1. Guard schema/version/scope; candidate matrix version; exact `PROTOCOL_VERSION`, `PHYSICS_VERSION`, `configVersion`, and geometry/body/simulation inputs.
2. Fixture ID and immutable fixture-content digest; match ID; selected cap and obstacle IDs; button ID; exact 24 ordered tuple values and units.
3. Exact initial state construction: selected-cap pose, button-pose helper/version and azimuth/tilt inputs, obstacle placement formula/anchor/gap semantics, every other cap's placement, rotations and zero initial velocities. The effective 15-body canonical state for each tuple must be hashed or deterministically regenerated and compared before impulse.
4. Exact impulse vector by tuple, selected entity, world/local coordinate meaning and application point; require it equals the selected cap's measured COM unless the added rotational work is bounded explicitly.
5. Material policy/readback domain; gravity; candidate-specific rest-height reference; max COM drop; maximum available kinetic energy and separate observed mechanical-energy rule; apron margin; point-sweep and angular-sweep limits; maximum calls per tick, per candidate and matrix; batch count; per-candidate and matrix wall caps; cancellation behavior; output schema and byte/contact cap.
6. Pinned Babylon/Havok versions, exact WASM digest, probe algorithm version, and truthful result provenance. The WASM digest and canonical fixture digest should be checked against the actual loaded assets, not supplied only as labels.

The type and strict Zod schema must require this field and reject extra/missing/altered tuple values. Because this changes the canonical config shape, coordinator-owned config/schema/configVersion/hash/fixture work and all canonical fixtures/consumers must be updated together. `physicsCalibration` stays `null`; this proposal must not change normal, AI, online, or deployed runner behavior or the direct-shot guard's scope. Since no wire message shape changes, a protocol-version bump is not implied by the inspected contract, but the coordinator must verify compatibility before deciding.

## Runtime and proof boundary

The conditional calculations do not prove native Havok inertia, exact effective materials, zero initial velocity, bounded solver energy, or the sweep/apron invariant. The diagnostic must obtain these from the actual pinned WASM runtime before applying any impulse, derive `Nrequired` at full precision for every body and every tick, and reject any out-of-range actual state before the next native call. For each actual `executeStep` call it must record actual duration/contact facts, ensure call count/yield/wall/output budgets, verify all 15 bodies are finite, enforce candidate-relative COM-drop and whole-collider apron/floor swept bounds, and fail with typed non-settled output rather than publish a partial successful artifact. This is bounded discrete-step evidence only; it cannot be labelled a continuous collision-free path or production calibration.

The present evidence cannot authorize trial execution: the currently accepted strict guard has a different scope and exact inputs, the proposed L01 inputs are not fully frozen, and matrix-wide workload/output bounds are absent. **Next action:** coordinator freezes the separate schema-3 config-hashed L01 guard and exact setup/application semantics, gets independent contract/math review, then a source packet adds fail-closed preflight and measured per-call assertions. Only after that should CI run the full exact 24-case pinned-WASM matrix and upload a digest-verified complete artifact for independent review. Until then no L01 trial should apply its impulse.

## Inspected inputs and checks

Inspected only the T02-L01 checker record; the `CONTRACTS.md` diagnostic-guard section; `packages/game-protocol/src/config.ts`, `types.ts`, `schemas.ts`; `games/counterball/src/simulation/worldFactory.ts`, `intendedShotProbe.test.ts`, `features/restarts/domain/placementPose.ts`; and the accepted `T02-GR01-guard-feasibility-review.md`.

Ran `node scripts/check-completion-plan.mjs --packet T02-L01`: PASS for plan consistency only. No install, app test, typecheck, build, browser, physics, deployment, or source/config modification was performed.
