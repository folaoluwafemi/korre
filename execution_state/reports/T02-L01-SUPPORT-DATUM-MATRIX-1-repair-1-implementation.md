# T02-L01-SUPPORT-DATUM-MATRIX-1 repair 1

## Bounded changes

- Required the support apron quaternion to equal `(0, 0, 0, 1)` exactly in
  the runner's early surface guard and native support-plane readback, the strict
  matrix writer, and the independent browser validator. The Euler-only path
  still requires exact zero angles and records the canonical identity quaternion.
- Added a writer rejection mutation with quaternion `z = 5e-13`, which was
  within the former `1e-12` tolerance.
- Added focused supported-pose coverage using the canonical button dimensions.
  It computes the flat and 45-degree cylinder support extents, applies the
  corresponding rotated COM offsets, checks both poses rest on the configured
  support plane and remain above the conservative datum, and checks the exact
  gravity-energy increment for both poses.
- Wrapped the over-width imports and native-AABB return type, and shortened the
  two long test descriptions. No physics, guard, force, schema, or resource
  limit changed. The pure helper source was unchanged.

## Source hashes

SHA-256 of current source bytes:

- `games/counterball/src/simulation/loftCoarseRunner.ts` —
  `0d0481294bc98b8dd5d90383a77ffe9cef60e5196e724d71401ca3aa1d62dfc6`
- `games/counterball/src/simulation/loftCoarseProbe.ts` —
  `aa5c77440a2948ed637a6175ada03433992395e8c97b53584308b8b753f4b2aa`
- `games/counterball/src/simulation/loftCoarseProbe.test.ts` —
  `579f353240d1dd1995fcced7d6107a06ab8eed35521d07e9944e1102bfa3cf35`
- `tests/e2e/counterball-direct-probe.spec.ts` —
  `f68fea78121ea9840549295b857a494aa92d90584a8c6deace7a5ca072e41c2b`
- `games/counterball/src/simulation/nativeCylinderSupportDatum.ts` —
  `930360592e6f2a3a2bb7f3f4de857584160d40289ad4527e17aa83bc7952c4e9`

## Checks and limits

- Scoped `git diff --check` over the five packet source paths — PASS, exit code
  0.
- No install, formatter, typecheck, lint, test, build, browser, physics, or CI
  command ran. Hosted verification and the full 24-case real-Havok matrix are
  still pending; no runtime or acceptance claim is made.
