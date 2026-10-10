# T02-F01 repair 2 implementation report

Status: source repair saved; independent review pending. This does not accept F01 or parent T02.

## Changed files

- `games/counterball/src/simulation/facts.ts`
- `games/counterball/src/simulation/facts.test.ts`
- `execution_state/reports/T02-F01-repair-2-implementation.md`

## Repair

The support-clearance Lipschitz bound now tracks the button or cap's vertical symmetry axis instead of charging it for all quaternion rotation. The axis travel is the endpoint angle between the rotated local vertical axes. Under the shortest-arc quaternion interpolation, this bounds the axis's spherical path; the normalized-lerp branch is covered by scaling for its maximum angular-speed ratio. Rotation about the cylinder's own vertical axis therefore contributes zero support travel, while tilted-axis motion remains bounded. The bound still includes absolute centre travel and collider circumradius times axis travel. It is used by both whole-pitch crossing isolation and full-button goal-passage clearance proof.

The bounded left-first root isolation, depth and node limits, and fail-closed errors for unresolved earlier intervals are unchanged. This is a tighter bound for the geometry's symmetry, not an endpoint-only crossing search or a relaxation of uncertainty handling.

Added the named regression for the packet's default-geometry path: button centre x=5.8, then x=6.12 with identity rotation, then x=6.14 with a 10-degree vertical-y yaw. The test requires exactly one button/right/out crossing, on step 2, at 1.5 fixed intervals within six decimal places. Existing 85°→95° equal-sign, multi-root earliest-crossing, goal-drift, tangency, deterministic tie, immutability, attribution-order, and bounded-output cases remain in the test source.

## Verification and limits

No local application tests, builds, typechecks, lint, formatting, browser, server, or physics commands were run, as required. The new and preserved tests are unverified until the independent review and hosted run complete.

Required hosted command on the exact reviewed commit:

`pnpm --filter @korre/counterball test && pnpm --filter @korre/counterball typecheck && pnpm verify`

This source-only repair does not establish actual Havok trajectory continuity or collision-free traversal between observations. Parent T02 remains unfinished.
