# T02-L01-DIAGNOSTIC-APRON-F32-1 source review

**SOURCE: PASS.**  
**RUNTIME: NOT RUN; hosted exact-SHA verification and the complete matrix remain pending.**

## Scope and diff

The packet extraction records `ready:true` and limits source writes to `loftCoarseRunner.ts` and `loftCoarseProbe.test.ts`. The implementation report and current diff agree with that scope. The runner diff changes one comparison: temporary `support-apron` Y now uses `matchesExactFloat32Projection(0.2, dimensions.y)`. No other production expression changed in the reviewed diff.

At `games/counterball/src/simulation/loftCoarseRunner.ts:1122–1127`, the check remains restricted to `id === "support-apron"`; native shape type remains exactly `BOX`, X remains strictly equal to `662`, and Z remains strictly equal to `670`. Only Y uses the projection helper. The existing shape-dimensions path rejects non-finite/non-positive dimensions before this branch, and the helper itself also rejects non-finite configured/observed values and non-finite projections. No tolerance, neighbor acceptance, static-shape expansion, geometry construction, canonical support, goal-frame, or dynamic-cylinder check changed.

Raw native dimensions remain intact: the same `dimensions` object is kept in the named static body at lines 1160–1165 and serialized into static facts at lines 1169–1173. No projected value is substituted into metadata or calculations. No public gameplay API or additional source path was added.

## Focused test and coverage note

The added test at `games/counterball/src/simulation/loftCoarseProbe.test.ts:431–453` uses the existing exact projection helper. It accepts exactly `Math.fround(0.2)`, rejects decimal `0.2`, constructs the adjacent Float32 value and rejects it, and asserts the fixed footprint values remain `662` and `670`. Existing tests for generic adjacent, non-finite, and projection-overflow cases remain unchanged.

The X/Z assertions lock the intended constants; they do not invoke the runner's private static-body predicate. The production diff itself retains strict X/Z equality, and the packet separately requires independent source review plus the exact hosted matrix, so this unit-test boundary is not a source blocker. The focused test has not been run.

## Source hashes

Recomputed SHA-256:

| File | SHA-256 |
| --- | --- |
| `games/counterball/src/simulation/loftCoarseRunner.ts` | `43E1459AC6C912B1820E6774C15EC237DD2C3ED31659F6D9F9E05037C443F423` |
| `games/counterball/src/simulation/loftCoarseProbe.test.ts` | `FF1D6C8B1B89345C8B3FDEF5A46FE00508FC5879B9D5395ACF787D371A7D9F92` |

The hashes match the implementation report. No local tests, build, browser automation, or physics run was performed. This review does not establish runtime behavior, matrix completion, artifact acceptance, calibration, T02, deployed physics, or playability.
