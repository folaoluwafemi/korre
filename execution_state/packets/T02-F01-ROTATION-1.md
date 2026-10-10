# T02-F01-ROTATION-1 — conservative rotational support bound

Parent: T02-F01 under T02  
Status: implementation saved; independent source review pending  
Role: worker implementation  
Author: `/root/toolchain_audit`  
Independent reviewer: `/root/swarm_review`  
Supersedes the failed source assignment `T02-F01`; this ownership handoff does not accept it.  
Accepted design prerequisite: `T02-F01-math-escalation-1`.

## Objective

Correct whole-button support-clearance bounds for the actual shortest-arc quaternion interpolation in `facts.ts`. Preserve the F01 contract and all previous regressions. Add the reviewed parameterized symmetry-axis bound, prove it catches the pi/4 small-circle hidden crossing, and fix the hosted unsafe-assignment lint error. This is a new bounded source packet after the two-attempt repair cycle and independent math escalation. It authorizes one implementation and one independent review cycle only.

## Read first

- `execution_state/packets/T02-F01-facts.md`
- `execution_state/packets/T02-F01-repair-2.md`
- `execution_state/packets/T02-F01-math-escalation-1.md`
- `execution_state/reports/T02-F01-repair-2-review.md`
- `execution_state/reports/T02-F01-math-escalation-1.md`
- `games/counterball/src/simulation/facts.ts`
- `games/counterball/src/simulation/facts.test.ts`
- `knowledge_base/execution/CONTRACTS.md`
- `knowledge_base/execution/DECISIONS.md`
- `knowledge_base/execution/SWARM.md`
- `knowledge_base/execution/completion/LOCAL_NOTES.md`

The exported `deriveCounterballFacts` signature and canonical output contract stay unchanged. All source helpers remain local to the simulation module.

## Exact write paths

Implementation author may edit only:

- `games/counterball/src/simulation/facts.ts`
- `games/counterball/src/simulation/facts.test.ts`

The author may also write only `execution_state/reports/T02-F01-ROTATION-1-implementation.md` for the implementation record. Do not edit package files, physics config/defaults, contracts, catalogue, shared runtime status, ownership, integration notes, or CI configuration. No agent may spawn another agent.

The independent reviewer may read the exact diff, the accepted math report, relevant contract, and hosted evidence. The reviewer may write only `execution_state/reports/T02-F01-ROTATION-1-review.md` and must stop before implementation or status changes.

## Required implementation

1. Match `interpolateQuaternion` exactly: normalized endpoints, negative-dot sign flip, physical shortest angle `theta`, and the existing `cosine > 0.9995` normalized-linear branch. Derive the selected relative **world** rotation and initial world vertical symmetry axis `v0`.
2. For `theta > 0`, calculate `s = |u × v0|` with finite, outward-conservative handling. Use parameterized symmetry-axis speed `theta*s` for SLERP and `4*tan(theta/4)*s` for normalized linear interpolation. Do not treat endpoint-axis geodesic separation as path length. For a near-degenerate angle or uncertain axis, use a proved full-angle fallback or fail closed; for exact zero rotation, support travel is zero.
3. Multiply angular travel by the proved finite-cylinder support coefficient `rho = hypot(radius, height/2)` and add absolute centre-coordinate travel. Retain the existing left-first earliest-root search, depth/node bounds, explicit unresolved-interval errors, observation validation, stable same-step ordering, and input immutability. Apply the bound to existing button edge and goal-aperture clearance proofs that use this helper.
4. Fix the hosted ESLint `no-unsafe-assignment` at `facts.ts:221` without suppressions or weakening type safety.
5. Add named regression coverage for: pure vertical-axis yaw; theta pi/4/beta .01 path versus endpoint angle; the accepted test-only `.02` button-thickness hidden-crossing fixture; actual NLERP threshold branches; q/-q, near-zero and pi-tie inputs; support alignment/nonsmooth cases; and all existing F01 regressions (85°→95° equal-sign, multi-root earliest, yaw, goal drift/tangency, deterministic boundary ties, contacts-before-crossings, immutability and bounded output).

The test-only thickness is not a production tuning change. Do not alter the seven-cap rule, restart behavior, pitch geometry, physics defaults, or cultural proposals.

## Checks and evidence

Coordinator runs `node scripts/check-completion-plan.mjs --packet T02-F01-ROTATION-1` before dispatch. It must report `ready: true`; `depends_on` contains only ACCEPTED prerequisites. `supersedes` closes the failed source assignment and orders write ownership; it is not an acceptance dependency.

The implementation author must not run local application installs, builds, tests, typechecks, formatters, browser automation, physics, or dry-runs. Coordinator runs the following on GitHub against the exact pushed commit after source review:

```text
pnpm --filter @korre/counterball test && pnpm --filter @korre/counterball typecheck && pnpm verify
```

Record complete suite counts, zero skipped tests, exact SHA, full logs, artifact identifiers/digests, and every downstream check that ran or was skipped. A GitHub failure remains a failure; do not weaken checks.

The reviewer independently checks the derivation against `execution_state/reports/T02-F01-math-escalation-1.md`, branch/angle handling, whole-cylinder support use, all preserved regressions, the new hidden crossing, lint safety and exact source scope. The reviewer does not claim hosted or Havok acceptance from source review.

## Acceptance

- The bound covers the parameterized symmetry-axis path for every interpolation branch selected by the production helper. The theta=pi/4 hidden-crossing fixture has positive endpoints and midpoint but finds the earliest descending root near `t=.0005`.
- Zero/yaw/sign/threshold/tie/alignment cases are finite and conservative or fail closed; unresolved intervals never certify clear.
- All earlier F01 contracts and regressions remain intact; exported interfaces and production defaults do not change.
- Independent source review is PASS and the exact reviewed SHA passes the focused Counterball tests, typecheck, lint, all unit tests and required builds on GitHub with no skipped required checks.
- This packet accepts only the F01 fact producer if all evidence passes. T02 and the deployed-Havok gate remain separate.

## Stop conditions

- If a branch, frame, numeric fallback, support nonsmooth point, or clearance proof is not covered by the accepted derivation, stop and report CHANGES_REQUIRED.
- If the adversarial fixture cannot reproduce the old false certificate and prove the earliest root after the fix, stop.
- If source review or hosted verification fails, preserve complete evidence and stop this packet. Do not begin another source retry without a new independently reviewed escalation.
- Do not proceed to T02 consumers or staging claims until F01 and all original T02 dependencies are ACCEPTED.
