# T02 diagnostic guard contract analysis

Date: 2026-10-11

## Finding

**A diagnostic-only guard is numerically feasible for a narrowly bounded raw impulse of 8 under the assumptions below, but it cannot be selected and accepted under the frozen contract as written.** `physicsCalibration` is currently `null`; the only frozen guard fields are nested inside the complete `PhysicsCalibration` object. Making that object non-null with only guard values is not representable by its strict schema and would imply a calibration candidate. Adding a separate hashed field without a reviewed contract/config amendment would invent a competing contract. Therefore T02-L01 and T02-BR01 remain stopped until a coordinator-owned amendment gives the diagnostic guard its own canonical, hashed, diagnostic-only identity while leaving `physicsCalibration: null`.

The C02 packet is not a way around this stop. Its extracted record is plan-consistent but `ready: false`; it depends on T02-L02, T02-D01, and C01-H, and its output is an evidence-supported calibration config. It requires independent proof of collision-free whole-button traversal and all-15-body settling across confirmation cases, and forbids selecting a candidate from peak-only/no-contact observations.

## Contract and stop evidence

The frozen C00 contract says that `CounterballConfig.physicsCalibration` is nullable and that a calibrated runner rejects null. The strict `PhysicsCalibration` object contains materials, damping, impulse policy, restart lift, support apron, workload limits, and translation/rotation/substep limits together. Its numeric schema bounds are admissible ranges, not selected settings. The existing canonical config at `packages/game-protocol/src/config.ts:58-60` still sets `physicsCalibration: null`.

The independent T02-L01 stop review confirms that no guard numbers or config hash were selected and the implementation correctly stopped before any trial. The current world factory uses one fixed 120 Hz Physics V2 step per call; that is not the C00 explicit substep loop. C00 also requires recording the actual substep durations/counts and contacts, and returning `resourceLimit` when a guard or workload budget cannot be enforced. Neither schema bounds nor endpoint observations satisfy this condition.

A safe next change must be coordinator-owned: amend the canonical contract to distinguish a diagnostic safety envelope from calibration; add one strict shared type/schema/config location for that envelope and include it in the canonical config hash; update affected fixtures and hash tests; specify its exact input domain and error behavior; and freeze the meaning of `maxBatchSteps`. Keep the production calibration null and reject use of the diagnostic-only envelope for ordinary local, AI, online, or deployed play. Then implement the same explicit substep loop in the probe/runner, verify it at the public Havok stepping boundary, and record each actual duration, count, and contact. A worker must not privately add a second un-hashed guard type.

## Conditional worked bound for raw impulse 8

This calculation is a review example, **not a selected or accepted config value and not a physics measurement**. It applies only to one raw `PhysicsBody.applyImpulse` of magnitude 8 at the selected cap's center of mass, from the canonical fixture at rest, with no other external impulses, restitution at most 1, nonnegative friction, supported bodies throughout the full shot, and no solver-created energy beyond the conservative bound. A different application point, initial velocity, impulse, or unsupported fall requires a new bound.

Configured dimensions and masses are cap radius 0.32, height 0.12, mass 1; button radius 0.13, thickness 0.045, mass 0.15; surface thickness 0.20; and goal-frame diameter 0.12. The smallest collider thickness is therefore 0.045. The direct center impulse gives initial kinetic energy `E = 8² / (2 × 1) = 32`.

Using solid-cylinder principal inertias about the specified vertical cylinder axis and the configured masses:

| Body | Minimum principal inertia | Farthest collider radius | `vBound = sqrt(2E/m)` | `omegaBound = sqrt(2E/Imin)` |
| --- | ---: | ---: | ---: | ---: |
| Cap | 0.0268 | 0.3255764 | 8.0000 | 48.8678 |
| Button | 0.0006590625 | 0.1319327 | 20.6559 | 311.6210 |

These are global-energy-per-body bounds: they conservatively allow all 32 energy units to be concentrated in whichever one cap or button is being bounded. The engine's actual computed mass properties must be checked against the solid-cylinder assumption before implementation relies on it.

For a worked guard example, set the per-substep translation limit to one quarter of the thinnest collider (`0.045 / 4 = 0.01125`), the rotation limit to `pi/8` radians, and the maximum substep count to 120. These satisfy the C00 numeric ranges but remain provisional. At `dt = 1/120 s`, the cap's combined linear/angular point sweep bound is 0.199252 per tick and its rotation is 0.407232 rad. The button's values dominate: 0.514741 per tick and 2.596842 rad. Hence `Ntranslation = ceil(0.514741 / 0.01125) = 46`, `Nrotation = ceil(2.596842 / (pi/8)) = 7`, and `Nrequired = 46`, below the example budget of 120. The resulting actual Havok call duration would be `1/(120×46) = 0.0001811594 s` per substep. This only bounds the sweep; it does not itself prove collision-free button traversal.

For the same no-fall invariant, C00's apron expression is dominated by the button: `20.6559 × 15 s + 0.131933 ≈ 309.971`; a rounded diagnostic example of 311 game units stays within the schema maximum of 10,000. This must be an invisible open support slab only. The implementation must ensure every full collider remains above the supported extent for every substep; if it cannot establish that, if any body leaves the proven extent, or if observed energy exceeds the bound, fail with `resourceLimit` before allowing an unbounded fall. The apron does not change painted crossing planes or add a wall.

At the configured 15-second maximum duration there are 1,800 nominal ticks. At 46 substeps each, that is up to **82,800 `executeStep` calls per trial**. A 30,000 ms hard wall-time cap is within the schema range but is not evidence that this workload completes in time; expiry must fail as `resourceLimit`. The schema's `maxBatchSteps: 1..120` also needs an explicit meaning: 120 nominal ticks per batch would mean 15 batches, while 120 Havok substeps per batch would require at least 690 batches for this example. Do not treat either figure as a measured runtime or choose the interpretation silently.

The energy bound excludes gravitational potential loss only because the proposed apron proves continuous support from the canonical at-rest start for the full 15 seconds. If that geometric invariant is absent or cannot be checked, gravity adds energy and the calculation is invalid; do not substitute a convenient finite drop assumption.

## What may proceed and what must wait

The coordinator may now author and independently review a narrowly scoped diagnostic-guard amendment, including the candidate calculations, strict config/hash/fixture plumbing, an explicit per-batch meaning, and fail-closed limits. This can make the guard hashable without claiming physical calibration **only after that contract amendment is accepted**. It may then unblock bounded diagnostic measurements for the exact raw impulse envelope while `physicsCalibration` stays null.

Real trials and independent review must still choose actual material/damping/impulse settings and demonstrate all-15-body settling, complete swept whole-button clearance, and absence of button/post/cap contact for any loft candidate. C02 must wait for those results before publishing a non-null calibration, changing the physics adapter/version stamp, or syncing production fixture hashes. The worked guard is limited to raw impulse 8 and cannot be reused as a general gameplay guard unless a separate envelope covers the accepted maximum impulse and application-point torque.

## Inputs and checks

- Read the C00 provisions in `knowledge_base/execution/CONTRACTS.md` and `knowledge_base/execution/completion/CONTRACT_WORK.md`; the T02-L01 implementation stop and independent review; canonical geometry/mass/gravity/duration in `packages/game-protocol/src/config.ts`; the cylinder shape/mass mapping in `games/counterball/src/simulation/worldFactory.ts`; and C02's extracted coordinator packet record.
- `node scripts/check-completion-plan.mjs --packet C02`: **PASS for plan consistency only**; the extracted C02 packet is `ready: false`. This is not an implementation check.
- The substep values above are arithmetic from explicitly stated assumptions. No local build, test, typecheck, lint, physics, browser, server, or Wrangler command ran. No T02-L01 trial or runtime proof exists.
