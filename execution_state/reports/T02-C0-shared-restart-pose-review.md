# T02-C0 shared restart pose — independent source review

**Verdict: PASS for the helper and its source-level tests. T02 remains open pending hosted verification and the remaining T02 work.**

## Findings

- The helper uses only type imports from `@korre/game-protocol`; it introduces no Babylon dependency and returns plain protocol-shaped `Vec3` and `Quat` values.
- For valid inputs, the equations match the B0 `buttonRestartPose`: radial direction is `(sin(azimuth), 0, cos(azimuth))`; tangent axis is `(-radialZ, 0, radialX)`; horizontal/vertical cylinder support uses button radius and half-thickness; and the center is offset from the cap by cap radius plus horizontal support. At zero azimuth, the returned quaternion matches B0's `Quaternion.RotationAxis` components. The direct half-angle quaternion is unit length mathematically because the sine/cosine tangent axis is unit length.
- The resulting button support touches `surfaceY`; at zero tilt this reduces to the existing flat center height and cap/button radii. The helper does not move the cap center vertically, and computes x/z from the cap center as the B0 geometry does.
- Validation rejects non-finite vector/angle/config values, non-positive used radii or button thickness, negative maximum tilt, and tilt outside the configured range with the stable `TypeError` message. A postcondition rejects non-finite derived position/quaternion components, including arithmetic overflow. Arbitrary finite azimuths retain periodic `sin`/`cos` behavior. The function only reads inputs and returns fresh objects.
- The tests cover flat and maximum tilt support, quaternion normalization/orientation, four azimuths, periodic wrapping, configured tilt enforcement, invalid values/geometry, finite outputs, and fresh result/input non-aliasing. The azimuth cases check finiteness, while explicit tangent/support equations are checked at zero and maximum tilt for zero azimuth; source inspection confirms the same formula is used for other azimuths.

No local build, test, typecheck, lint, formatter, or server command was run, per instruction. Hosted checks remain pending; this review does not claim runtime test results or accept T02.
