# T02-GC01 contract decision implementation

Date: 2026-10-11
Author: coordinator

## Result

Authored the diagnostic-only guard amendment in the exact three assigned paths:

- `knowledge_base/execution/CONTRACTS.md`
- `knowledge_base/execution/DECISIONS.md`
- `knowledge_base/execution/completion/CONTRACT_WORK.md`

The guard is limited to the accepted D01 at-rest `home-6` raw centre impulse `{x:0,y:0,z:8}` at `{x:0,y:0.06,z:-4}`. It does not map the input to user power, does not fill `physicsCalibration`, and cannot be used by the calibrated local/AI/online/deployed runner. The proposed canonical field is strict, hashed, and versioned with config schema/version 2; protocol messages remain unchanged. No application source or runtime code was changed in this card.

## Selected diagnostic policy and derivation

These are coordinator-selected fail-closed limits for this one diagnostic input, not measured Havok behavior or game-feel tuning.

- Initial impulse energy: `8²/(2×1)=32` game-energy units.
- Maximum whole-trial COM drop: `0.01125` game units below each fixture body's at-rest reference height. This is the fallback gravitational-work bound; it allows loft and does not assume continuous floor contact.
- All 15 dynamic bodies have total mass `14.15`. At configured gravity magnitude `9.81`, the worst simultaneous gravitational work is `14.15×9.81×0.01125=1.561629375` units. Thus the derived sum is `33.561629375`; the selected ceiling is `34`, leaving `0.438370625` units of rounding allowance. This is not evidence that the solver is passive. Runtime must inspect actual material/mass properties, enforce the swept drop bound, check observed mechanical energy, and stop on any mismatch.
- Using configured masses/dimensions and solid-cylinder principal-inertia lower bounds gives cap `Imin=0.0268`, `rMax=0.3255764119`, `vBound=8.2462112513`, `omegaBound=50.3717523304`; button `Imin=0.0006590625`, `rMax=0.1319327480`, `vBound=21.2916258969`, `omegaBound=321.2115518963`. These are analytic inputs only; the actual browser runtime must verify the pinned Havok mass properties are no less conservative.
- With `dt=1/120`, `maxTranslationPerSubstep=0.01125` full-collider point travel, and `maxRotationPerSubstep=pi/8`, the conservative cap sweep requires 19 translation steps and 2 rotation steps; the button requires 48 and 7. Therefore `Nrequired=48`, which is selected as the hard per-tick maximum. No call may proceed if actual properties or observed energy require more.
- The button COM reach plus its enclosing radius is `21.2916258969×15+0.1319327480=319.5063212`. The selected apron is 325 units beyond each painted edge, without walls or changed crossing planes.
- Work is capped at `1,800×48=86,400` actual public Havok `executeStep` calls per trial, 120 actual calls per host batch (720 maximum batches), 15 simulated seconds, and 30,000 ms wall time. Finishing within the wall cap is not assumed. Any budget or proof failure is `resourceLimit` with no partial success.

## Checks actually run

- `node scripts/check-completion-plan.mjs --write-index` — PASS, 82 catalogue cards and 21 remaining parents; documentation consistency only.
- `node scripts/check-completion-plan.mjs --packet T02-GC01` — PASS, exact coordinator packet is dependency-ready; no app/runtime evidence.
- JSON parse of `execution_state/tasks.json` and `COORDINATOR_PACKETS.json` — PASS.
- `git diff --check` — PASS; only line-ending conversion notices were printed.
- Pure arithmetic derivation from the formulas above — PASS. No package command was used.

No app install/build/test, Havok call, physics trial, browser interaction, deployed check, or user playtest ran. In particular, the document records required future proof; it does not claim that swept drop/apron checks have been implemented or that the first flick exists.

## Review boundary

The independent reviewer owns only `execution_state/reports/T02-GC01-review.md` and should verify the three exact documents against `knowledge_base/execution/completion/COORDINATOR_PACKETS.json#T02-GC01`, D01's accepted tuple, and the revision-2 guard analysis. If the reviewer cannot validate the bound or enforceability wording, return CHANGES_REQUIRED before any type/config/runner source work.
