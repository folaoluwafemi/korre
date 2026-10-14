# T02-L01-SUPPORT-DATUM-MATRIX-1 implementation

The saved pre-dispatch extraction records plan consistency PASS and
`ready:true`. The card is now RUNNING, so its live extraction correctly reports
`ready:false`. This implementation report does not accept the card or its
parent. The full 24-case native matrix and its hosted checks remain pending.

## Changes

- Added the internal `deriveNativeCylinderSupportDatum` helper. It accepts only
  finite, centered, dimensionally consistent native cylinder bounds with equal
  X/Z spans, and returns the conservative COM lower-support datum. It has no
  package-barrel export.
- The runner retains each dynamic collider's actual shape-type snapshot and one
  actual native AABB read. It rejects any shape other than native cylinder
  type 2, verifies centered symmetric bounds and exact configured Float32
  dimensions, and includes the raw AABB/type in each case fact.
- The runner retains the actual support-apron box type, symmetric local AABB,
  pose, rotation, scale, parent state and top. It checks native box type 3,
  configured position, identity rotation, no parent, unit scale, and a finite
  top on or above the configured support reference. Euler identity is recorded
  as the equivalent identity quaternion only when all observed Euler angles are
  exactly zero.
- Before planner setup, energy preflight or impulse, every metric's existing
  `restY` is assigned from its actual native AABB, actual native COM offset and
  the validated support reference. The generic energy calculation, initial
  hashed transforms, zero velocities, impulse, sweep formula and every limit
  remain unchanged.
- The strict matrix writer and independent Playwright host validator require
  the new exact metadata keys, verify dynamic centered cylinders and the
  support plane, match recorded dimensions to the raw bounds, and independently
  recompute each datum from raw AABB and COM facts. The host also checks native
  Float32 dimensions against the exact projected configured values.
- Updated the runner and host fixture-file SHA pins to the actual unchanged
  fixture bytes: `beaa25d969b7e0c5e863538af13d54ba9b2f8b9547c4827ef220ea863aa1b092`.
  The fixture payload digest, config, protocol, hashed physics values, matrix
  tuples, workload, row counts, energy/drop limits and transport caps were not
  changed.
- Added focused helper/energy tests and writer rejection cases for malformed
  dynamic bounds, wrong native types, and invalid support-plane bounds, pose,
  scale, parent, top and reference.

## Source hashes

SHA-256 of current source bytes:

- `games/counterball/src/simulation/loftCoarseRunner.ts` —
  `cc9de94f1b34438b26a2fc13796156a0a7536a5e9079f644d705c76b33c92b30`
- `games/counterball/src/simulation/loftCoarseProbe.ts` —
  `4ce8c7c0ff3489bde0c121762f18d1453063b00307e5a38fa6f79fb9b559b5d7`
- `games/counterball/src/simulation/loftCoarseProbe.test.ts` —
  `5213563ad5fbe588a41ff86fb0002a7f8c3dfe83f84af50b1845e57ae9f64875`
- `tests/e2e/counterball-direct-probe.spec.ts` —
  `6ca8d169223339fab94f4e350fe817fd6a938c4d918c971c6e5f22db1bdb7b1d`
- `games/counterball/src/simulation/nativeCylinderSupportDatum.ts` —
  `930360592e6f2a3a2bb7f3f4de857584160d40289ad4527e17aa83bc7952c4e9`

## Checks and limits

- `git diff --check -- games/counterball/src/simulation/loftCoarseRunner.ts games/counterball/src/simulation/loftCoarseProbe.ts games/counterball/src/simulation/loftCoarseProbe.test.ts tests/e2e/counterball-direct-probe.spec.ts games/counterball/src/simulation/nativeCylinderSupportDatum.ts` — PASS, exit code 0.
- No local install, typecheck, lint, unit test, build, browser, physics or CI
  command ran. Hosted Verify and the unchanged full 24-case real-Havok matrix
  are still required. No runtime or matrix acceptance is claimed.
