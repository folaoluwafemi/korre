# T02-F01 repair 1 implementation report

Status: repair source saved; independent review pending. No acceptance claim for F01 or parent T02.

## Changed files

- `games/counterball/src/simulation/facts.ts`
- `games/counterball/src/simulation/facts.test.ts`
- `execution_state/reports/T02-F01-repair-1-implementation.md`

## Repairs

Goal classification now tracks each end-line passage from the interpolated leading-support contact through trailing-support clear. It checks the complete oriented button against both post-opening limits and the crossbar underside over each supplied substep interval in that passage. Adaptive clearance bounds use linear center travel plus the button circumradius times a physical angular-travel bound for the shortest-arc quaternion interpolation, including its near-identical normalized-lerp branch. Strict post and crossbar clearance must be proven; tangency, a sampled obstruction, non-finite clearance, or clearance still unproven at depth 12 makes the crossing `out`. A retreat fully into play resets the passage state for a later attempt. The crossing fact remains timestamped at trailing-support clear time.

Whole-body support crossings use left-first adaptive subdivision with a Lipschitz lower bound from center-coordinate travel and collider circumradius times bounded angular travel along the shortest-arc quaternion interpolation. This searches same-sign endpoints and latches the first descending sign bracket. Search depth is bounded at 22 with a 65,536-node work cap; the first bracket is refined for 36 bisection steps. If the method cannot prove a region clear or establish a crossing within those bounds, it throws instead of silently omitting an exit. This describes only the supplied linear-position/shortest-arc pose interpolation, not the actual continuous Havok trajectory.

Added regression coverage includes the reviewed 85° to 95° button rotation with positive endpoint clearance and negative midpoint clearance; an 80° to 100° interval with two roots that asserts the earliest descending event; and separate-substep sideways and upward drift after the button center passes the goal line. The centered multi-substep goal case and existing goal/tangency, deterministic tie, attribution, immutability, and protocol-shape tests remain.

## Verification and limits

No local application tests, builds, typechecks, lint, formatting, browser, or physics commands were run, as required by the repair packet.

Pending hosted command on the exact reviewed commit:

`pnpm --filter @korre/counterball test && pnpm --filter @korre/counterball typecheck && pnpm verify`

No check result or physical collision-free traversal is claimed. Missing motion between observations remains unknowable. Independent source review and exact-head hosted verification are still required.
