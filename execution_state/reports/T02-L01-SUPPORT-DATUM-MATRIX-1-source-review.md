# T02-L01-SUPPORT-DATUM-MATRIX-1 independent source review

**SOURCE: CHANGES_REQUIRED. RUNTIME: NOT RUN.**

The five assigned files implement the accepted conservative datum formula and carry raw native AABB, shape-type, COM, support-plane and initial-state facts through the runner, strict writer and independent Playwright validator. The guard thresholds, tuple workload and physics actions appear preserved. No local application checks or physics ran. The plan checker passed document consistency; `ready:false` is expected because the card is RUNNING.

## Required bounded repairs

1. **The apron validator does not require the accepted identity rotation.** The runner accepts quaternion components within `1e-12` of `(0,0,0,1)` at `loftCoarseRunner.ts:1171-1179`; the writer repeats that tolerance at `loftCoarseProbe.ts:697-700`; the host repeats it at `counterball-direct-probe.spec.ts:996-1009`. The controlling contract requires an identity rotation, while `nativeTopY` is computed as `position.y + nativeLocalAabb.maximum.y` (`loftCoarseRunner.ts:1193`) and does not account for any rotation. A non-identity quaternion inside the tolerance therefore passes while the recorded top calculation assumes an unrotated slab. Require exact identity components consistently in producer, writer and host, and add a negative writer test for a small nonzero quaternion that is inside the old tolerance. Do not add a tolerance or alter the top formula.

2. **The required tilted-support test is missing.** The new helper test at `loftCoarseProbe.test.ts:626-669` checks the formula for one nonzero COM vector and checks shifted energy at a high COM height and the drop boundary. It does not model a tilted cylinder, verify the cylinder’s lower support remains above the computed datum, or relate the rotated COM height to that support. The packet calls for flat/tilted supported-pose energy coverage. Add one focused deterministic test using a representative canonical tilted pose, compute the rotated COM and support extent, assert the lower-support inequality, and verify the initial elevation remains charged. Preserve the current formula and guard values.

3. **Several added lines are likely to fail the repository’s Prettier check.** The root `lint` script runs `prettier --check` (Prettier 3.9.9; no project override was found; default print width is 80). Reflow the added import lines at `loftCoarseRunner.ts:60`, `loftCoarseProbe.ts:5`, and `loftCoarseProbe.test.ts:7`; the return-type line at `loftCoarseProbe.ts:617`; and the test declarations at `loftCoarseProbe.test.ts:626` and `:1075`. These exceed the configured/default width and are ordinary wrap points. No formatter was run under this review, so the exact formatter diff remains to be checked by hosted CI after repair.

The helper’s input checks and formula in `nativeCylinderSupportDatum.ts:10-72` are consistent with the accepted bound. The runner assigns this datum from actual native facts before planner/energy/impulse checks (`loftCoarseRunner.ts:1664-1675`); the old numeric limits remain unchanged. The host recomputes the datum from the recorded raw AABB and COM (`counterball-direct-probe.spec.ts:1099-1110`). These findings do not establish that the full 24-case matrix executes or passes.

## Hygiene and source identity

`git diff --check` over the five packet paths passed. SHA-256 of the reviewed current files:

- `games/counterball/src/simulation/loftCoarseRunner.ts` — `cc9de94f1b34438b26a2fc13796156a0a7536a5e9079f644d705c76b33c92b30`
- `games/counterball/src/simulation/loftCoarseProbe.ts` — `4ce8c7c0ff3489bde0c121762f18d1453063b00307e5a38fa6f79fb9b559b5d7`
- `games/counterball/src/simulation/loftCoarseProbe.test.ts` — `5213563ad5fbe588a41ff86fb0002a7f8c3dfe83f84af50b1845e57ae9f64875`
- `games/counterball/src/simulation/nativeCylinderSupportDatum.ts` — `930360592e6f2a3a2bb7f3f4de857584160d40289ad4527e17aa83bc7952c4e9`
- `tests/e2e/counterball-direct-probe.spec.ts` — `6ca8d169223339fab94f4e350fe817fd6a938c4d918c971c6e5f22db1bdb7b1d`
