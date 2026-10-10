# T02-F01-ROTATION-1 implementation

Status: source implementation saved; independent review and hosted verification are pending. This report does not accept F01 or T02.

## Changed paths

- `games/counterball/src/simulation/facts.ts`
- `games/counterball/src/simulation/facts.test.ts`
- `execution_state/reports/T02-F01-ROTATION-1-implementation.md`

## Implementation

`shortestArcEndpoints` now owns the same negative-dot sign selection and `cosine > 0.9995` branch decision used by quaternion interpolation. The support bound forms the selected relative world quaternion as `end * inverse(start)`, obtains its physical angle `theta`, and measures `s = |u × v0|` from that world rotation axis and the initial world vertical symmetry axis. It bounds SLERP travel by `theta*s` and the normalized-linear branch by `4*tan(theta/4)*s`. It does not use endpoint-axis geodesic separation as path length.

Equivalent quaternion endpoints return zero travel. Near-degenerate relative axes use the full branch-specific angular-speed bound (`s <= 1`); finite checks reject invalid angle, axis, or travel values. The calculation includes outward floating-point allowances for angle, axis, travel, and final clearance-bound arithmetic. The proved finite-cylinder coefficient remains `rho = hypot(radius, height/2)`. Both pitch-edge root bounds and goal-aperture proofs use this path bound plus absolute center-coordinate travel. The existing left-first search, bounded depth/work limits, errors for unresolved intervals, ordering, validation, and immutable input normalization remain in place.

The unsafe `any` assignment in observation normalization now reads from an explicitly narrowed `readonly unknown[]`. No lint suppression or validation weakening was added. The exported `deriveSimulationFacts` signature and protocol output are unchanged.

## Regression coverage added and retained

New named cases compare the pi/4, beta=.01 small-circle path with its endpoint-axis angle; reproduce the accepted `.02`-thickness hidden crossing with positive interval endpoints and midpoint plus a negative clearance near t=.0005; and assert one earliest right/out fact on rule step 2 at the independently bisected first root. The fixture uses sub-.005 positional increments before the rotation interval and lifts the button above the open surface. Separate NLERP/SLERP threshold-side cases use dot values .9995001 and .9994999, sample the analytic support curve densely for the corresponding axis-speed bound, and exercise a relative rotation axis nearly parallel to the initial button axis.

Additional cases cover q/-q equivalence, a near-zero rotation, an exact pi tie, symmetry axes parallel/perpendicular to side and end-line normals, and equal radial/axial support. Existing F01 tests remain present, including the 85°→95° equal-sign and multi-root earliest-crossing regressions, vertical-axis yaw, goal drift and tangency, deterministic ties, contact-before-crossing order, immutability, and bounded output.

## Checks and limits

Per the packet, no local application command was run: no install, build, test, typecheck, lint, formatter, browser, physics, or dry-run command. The following exact-SHA hosted command remains NOT RUN pending independent source review and coordinator dispatch:

```text
pnpm --filter @korre/counterball test && pnpm --filter @korre/counterball typecheck && pnpm verify
```

The analytic fixture and dense support sampling are unit-test source only; they are not executed evidence, Havok evidence, deployed proof, or proof of collision-free motion between observed physics poses. The coordinator-owned hosted checks and `/root/swarm_review` source review must pass before F01 can be accepted. T02 and its deployed-Havok gate remain separate.
