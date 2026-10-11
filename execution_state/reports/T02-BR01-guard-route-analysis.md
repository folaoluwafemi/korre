# T02-BR01 diagnostic guard route analysis

Date: 2026-10-11

## Verdict

**A contract-conditioned route is feasible for the one accepted D01 diagnostic input, without changing shared contracts or config.** The 325-unit open support apron can be owned by the isolated browser diagnostic by replacing that world's existing surface shape with a larger box of the same top height and material. The existing hashed `diagnosticGuard` supplies all numeric budgets. Conservative energy-derived bounds can replace the unavailable continuous-rotation cast: they enclose every collider point over each explicit Havok call and fail before the call if the full swept enclosure would cross a configured limit.

This is conditional on the model the accepted C00 contract explicitly adopts: nonnegative friction, restitution at most one, no other forces/impulses, the bounded gravity work, and the resulting total mechanical-energy ceiling. The pinned Babylon/Havok API does not independently certify the solver's continuous trajectory or energy passivity inside a call. A hosted real-WASM run can falsify the assumptions by observing energy/bound violations, but one successful run is diagnostic evidence, not a mathematical guarantee about every Havok state or a production calibration. If the required claim is an unconditional API-certified trajectory guarantee, the answer is **no**; that would require a documented native trajectory/speed certificate or a coordinator-approved contract amendment accepting the conditional analytic envelope and its exact limits.

## Evidence inspected

- `knowledge_base/execution/CONTRACTS.md` — C00 pinned-step/energy/sweep contract and the diagnostic-only direct-shot guard section.
- `knowledge_base/execution/completion/CONTRACT_WORK.md` — GC01 diagnostic fallback and its per-substep, open-apron, and no-continuous-floor-contact clauses.
- `packages/game-protocol/src/config.ts` — canonical geometry and hashed `diagnosticGuard`; `physicsCalibration` remains null.
- `games/counterball/src/simulation/worldFactory.ts` — current surface and canonical cap/button cylinders, plus per-world ownership.
- `node_modules/.pnpm/@babylonjs+core@9.30.0/...` and `node_modules/.pnpm/@babylonjs+havok@1.3.14/...` — pinned Babylon/Havok declarations and implementation already audited in `T02-GR01-pinned-api-audit.md`.
- `execution_state/reports/T02-BR01-implementation-2.md` and `T02-BR01-stop-review-1.md` — prior stop and independent rationale.
- `execution_state/reports/T02-GR01-runtime-sweep-surface-audit.md`, `T02-GR01-pinned-api-audit.md`, `T02-GR01-pinned-api-audit-review.md`, and `T02-GR01-guard-feasibility-review.md` — runtime/API inventory, accepted geometric derivation, and provisional arithmetic limits.
- `execution_state/reports/C01-P-T02-D01-run-38100635457-runtime-review.md` and the associated six-row direct-impulse artifact — exact eligible input and its limits.

No source or shared state was changed. No build, test, browser, physics, deployment, or install command was run.

## Diagnostic-owned support apron

The canonical factory currently creates one static slab centered at `(0, surfaceY - surfaceThickness/2, 0)`, with full extents `(pitchWidth, surfaceThickness, pitchLength)` = `(12, 0.2, 20)`. Keep ordinary factory geometry untouched. In the isolated diagnostic world only:

1. Find the existing `counterball-surface` body and retain its original shape.
2. Replace its shape, without adding a second overlapping floor, with a box at the same local center/rotation and top plane, with x/z full extents `pitchWidth + 2*supportApronMargin` and `pitchLength + 2*supportApronMargin`. For the hashed margin 325 these are **662 × 0.2 × 670**, with the same `surfaceY` top and no walls.
3. Carry forward and read back the actual shape material and collision filters. Verify the replacement shape type and its exact constructor dimensions, transform, static body identity, and top plane before applying the input. A failure is `resourceLimit`/initialization failure before the impulse.

Babylon 9.30.0 declares a public `PhysicsBody.shape` setter/getter (`physicsBody.d.ts:109-119`); the setter routes to the pinned plugin's `setShape`. The original factory shape is in its tracked resource list; a diagnostic-created replacement is not. The probe must therefore own the replacement explicitly: in cleanup, attempt to restore the original shape, attempt to dispose the replacement even if restore fails, then always dispose the isolated world/scene/plugin/engine. Preserve a primary simulation error and aggregate cleanup errors; do not leak or double-dispose the replacement. This alters only an isolated diagnostic world and does not move goal planes or add perimeter walls.

## Guard equations and required per-substep checks

Use constructor geometry from the canonical factory/config, never a rotated AABB as cylinder introspection. For a cylinder of radius `r_i`, endpoint separation `h_i`, and native COM offset `c_i` from geometric center:

```
Imin_i = mass_i * min(unitPrincipalInertia_i)
rMax_i = |c_i| + sqrt(r_i^2 + (h_i/2)^2)
vBound_i = sqrt(2 * Emax / mass_i)
omegaBound_i = sqrt(2 * Emax / Imin_i)
pointSpeedBound_i = vBound_i + omegaBound_i * rMax_i
Nrequired = max(
  1,
  ceil(max_i(pointSpeedBound_i * dt / maxPointSweep)),
  ceil(max_i(omegaBound_i * dt / maxRotation))
)
delta = dt / Nrequired
```

Babylon's native mass-property readback documents inertia for unit mass; multiply the returned unit moments by returned native mass. Use `PhysicsBody.getMassProperties()` for the active body, not `computeMassProperties()`, whose pinned implementation can fall back to synthetic values. Reject missing, non-finite, non-positive, or otherwise unusable mass, inertia, COM, orientation, velocity, material, or geometry. The getter returns actual native values but its Babylon wrapper discards the low-level status code, so also validate the full returned tuple and compare its mass/shape-derived moments to the canonical body domain; a missing/invalid tuple must stop the trial. Use the shape material getter that reads the native Havok material; require finite nonnegative static/dynamic friction and restitution in [0,1] for all interacting shapes.

For the configured solid cylinders, ideal-shape calculations are only a plausibility check, never a substitute for native readback:

| Collider | Configured mass | Conditional physical Imin | rMax | vBound at E=34 | omegaBound at E=34 | N from point sweep | N from rotation |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Cap | 1 | 0.0268 | 0.325576412 | 8.246211251 | 50.371752330 | 19 | 2 |
| Button | 0.15 | 0.0006590625 | 0.131932748 | 21.291625897 | 321.211551896 | 48 | 7 |

At `dt=1/120`, the whole-button point sweep requires 48 calls, the configured maximum. With actual native values, compute at full precision; if `Nrequired > 48`, fail before any call. The theoretical point sweep at 48 is approximately 0.01105381, below 0.01125 by only about 1.74%; do not round bounds before the comparison. The actual impulse must be the sole D01 input: fixture `counterball-protocol-fixtures-v1`, match `00000000-0000-4000-8000-000000000001`, `home-6`, `{x:0,y:0,z:8}` applied at `{x:0,y:0.06,z:-4}` once. Verify the at-rest initial state and that this point gives the contract's center-impulse work; otherwise compute the actual angular impulse work and fail if it violates the frozen ceiling. Do not use the other five D01 rows.

For each dynamic body and each actual `executeStep` call, let `delta=1/(120*Nrequired)`. Before the call:

- Check the rotation-independent horizontal collider envelope: a sphere around the pre-step COM with radius `rMax_i + vBound_i*delta`. Require its entire x/z projection to fit within the replacement slab's open support extents. This covers all orientations and is conservative; a tighter bound is unnecessary.
- Bound every collider point's travel by `pointSpeedBound_i*delta`; require it to be at most the hashed 0.01125 and require `omegaBound_i*delta <= pi/8`.
- Bound COM descent over the full call by `vBound_i*delta`. Require the resulting lowest possible COM to remain no lower than that body's canonical fixture rest reference minus the hashed 0.01125.
- Compute the current oriented cylinder's exact vertical support from its constructor radius/height and quaternion. Let `a = R*(0,1,0)` be its world axis and `cWorld = R*cLocal` its COM offset from the cylinder's geometric center. Its lowest point is `lowY = COM_y - cWorld_y - (h/2)*abs(a_y) - r*sqrt(max(0, 1-a_y^2))`. Subtract `pointSpeedBound_i*delta` from `lowY`; require this whole-call lower support bound to remain above the slab underside `surfaceY - surfaceThickness`. This prevents full traversal through the slab while allowing the collider to be airborne; do not impose continuous pavement contact.
- Include all 15 dynamic bodies, not only the selected cap. Check the pre-state's total mechanical energy and each body's values are finite and within the frozen envelope.

After the call, before allowing the next call, verify finite transforms and velocities, observed total mechanical energy no greater than 34, each COM no lower than its rest reference minus 0.01125, and current full-cylinder support above the slab underside. Compute kinetic energy as `sum(0.5*m*|v|^2 + 0.5*omegaWorld^T*IWorld*omegaWorld)` using native mass, unit-mass principal inertia multiplied by mass, and the reported inertia orientation; add configured gravitational potential relative to the fixture rest references. Record the call count/duration, actual contacts, guard margins, and settle samples. A post-step check does not replace the whole-call pre-bound. Any failed premise, bound, property, energy check, cancellation, budget, or output cap returns a typed non-settled failure with no partial successful result.

The contract-authorized energy budget is: the center impulse contributes 32; the maximum allowed collective gravity work is `14.15*9.81*0.01125 = 1.561629375`; their sum 33.561629375 is rounded up to 34. That bound assumes exactly this input, at-rest initial velocities, no other force/impulse, nonnegative friction and restitution at most one, and the configured gravity/drop cap. It does not establish Havok solver passivity by itself. Check endpoint mechanical energy after every call and stop on an excess. The derived continuous sweep remains conditional on that accepted passive-energy model; the pinned API has no public angular cast, no within-call pose trace, and no hard real-time interruption API.

The apron is large enough under the frozen energy envelope for a start anywhere on the painted pitch. The worst configured cylinder is the button:
`vBound*15 + rMax = 319.506321201 < 325`, leaving about 5.493679 game units. The cap reach bound is about 124.018745. Validate each actual fixture start is inside the painted pitch and check the per-call enclosure against the physical expanded slab. The global calculation does not excuse missing per-step checks.

Use the hashed workload only: at most 1,800 nominal ticks × 48 explicit calls = 86,400 calls; at most 120 actual calls per yielded batch, hence at most 720 batches; at most 30,000 ms from the trial's monotonic start; and 15 seconds simulated time. Check cancellation and elapsed wall time before and after each call and at each host yield. A synchronous WASM call cannot be interrupted mid-call on the same browser thread; if it returns after the wall cap, fail and publish no success. Preserve protocol output limits (451 playback frames, 8,192 facts, 1 MiB snapshot) and never truncate into an apparent success. Require all 15 bodies to satisfy both settle thresholds for the full configured quiet window.

For resource ownership, use a fresh isolated Havok world per trial. No global/shared mutable world; no added forces, teleports, clamps, walls, or production coefficients. Restore/dispose the diagnostic floor and then attempt every remaining world resource cleanup on success, failure, cancellation, timeout, and thrown errors.

## Falsifiable hosted check

A fresh exact-head GitHub run should execute the diagnostic from a real Chromium browser using the pinned Babylon/Havok WASM; NullEngine-only tests are not this check. The browser assertion should fail if any of the following differs: the exact fixture/input/one-impulse count; 15 canonical bodies; actual native properties/materials are missing or out of domain; diagnostic slab extents/top/material/filter are wrong; computed `Nrequired` exceeds 48; any actual call is not the selected substep duration; total calls exceed 86,400; any batch exceeds 120 calls; elapsed run exceeds 30 seconds; any pre-step swept/support/drop test, post-step energy/drop test, finite check, or contact extraction is skipped; the trial exceeds facts/frame/bytes limits; cancellation or any guard failure produces partial success; or resources remain after normal and forced-failure cleanup.

On the success path, require the exact D01 input and all-body settling window, record/hash the guard/config identity and summary maxima/minima for every per-call guard, and upload a diagnostic artifact labelled as raw, diagnostic-only evidence. Include pure adversarial tests for exact boundary equality, just-outside rejection, non-finite properties, and max-substeps overflow. Those pure tests may validate the bound logic but do not substitute for the Chromium/Havok run. The test must not assert that a passed diagnostic selects gameplay coefficients, proves arbitrary continuous Havok trajectories beyond the accepted model, enables production, or accepts T02/T05.

## Limits and next action

The prior BR01 stop was correct for its then-permitted current-world geometry and lacked selected guards. With GC02 values now hashed and the diagnostic allowed to own an isolated expanded floor, the apron mismatch is repairable without a shared source/config change. The pinned API gap is handled only by the conservative energy-derived envelope under C00's stated assumptions; it is not handled by shape casts or endpoint sampling.

Proceed only as a diagnostic implementation within the already approved BR01 source packet if its write paths allow the diagnostic to replace its own support shape. If they do not, the smallest coordinator-owned change is a packet update that explicitly permits replacement/ownership of the surface shape inside the browser diagnostic—not a gameplay/worldFactory/config change. If the coordinator requires an unconditional backend-certified continuous path instead of C00's conditional bound, that cannot be furnished by these pins; the coordinator must explicitly relax that proof criterion or authorize a separately scoped backend/API change. This report does not implement or accept BR01.

**Checks:** source/document/API read-only inspection only. Local tests, builds, physics, browser, install, and deployment: **NOT RUN**.
