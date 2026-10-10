# T02-F01-ROTATION-1-SEMANTIC-REPAIR-2 implementation

Status: implementation saved; independent source review and exact-SHA GitHub verification are pending. This report does not accept F01 or T02.

## Changed paths

- `games/counterball/src/simulation/facts.ts`
- `games/counterball/src/simulation/facts.test.ts`
- `execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-implementation.md` (this report)

No other paths were edited.

## Implementation

- Emitted fact point coordinates now canonicalize either signed zero to positive zero at the final fact boundary. Contact facts still receive copied points, so inputs remain unmodified.
- Exact contact ties sort by the lexical IDs of the already-normalized `(a,b)` pair, followed by point coordinates. Within-pair canonicalization still follows `ENTITY_IDS`; contact-before-crossing and crossing ordering are unchanged.
- Cylinder support extents now evaluate the radial projection as `|axis × direction|`, avoiding cancellation in `sqrt(1 - projection²)` near parallel alignment. The support axis is normalized first. Support points use `(axis × direction) × axis` for the in-plane direction, avoiding the previous subtract-nearly-equal-vectors calculation.
- The clearance Lipschitz coefficient now uses the accepted sharper finite-cylinder bound `max(radius, half-height)`. The accepted selected-branch angular travel calculation, its outward margin, centre travel, earliest-root search, depth/node caps, unresolved-interval errors, root expectation, and tolerance remain unchanged. This coefficient follows the independently reviewed piecewise derivative bound, including the one-sided limits at parallel, perpendicular, and support-tie orientations; it does not change the supported geometry or interpolation model.
- Goal-mouth proof now requires each strict left, right, and top clearance to exceed a scale-aware allowance of `64 * Number.EPSILON * scale`, where scale covers the configured goal/button dimensions and both segment endpoint coordinates. The same allowance is retained in the interval lower-bound comparison. Bottom clearance remains nonnegative because ground contact is allowed. This conservatively keeps exact post tangency out without treating floating-point residue as positive space.
- The two end-line-normal support fixtures now expect `goal`: their centered button passages clear the posts, floor, and crossbar under provisional D20. The other support-case expectations are explicit and unchanged. A separate passage with 1e-9 positive post clearance is asserted as a goal; exact post tangency remains out and crossbar tangency remains out.

## Verification

- `node scripts/check-completion-plan.mjs --packet T02-F01-ROTATION-1-SEMANTIC-REPAIR-2`: exit 0; packet extraction reports `ready: true`. This is a plan-consistency/document check only.
- No local application install, test, typecheck, lint, format, build, browser, physics, or runtime command was run, as required by the packet.
- Independent source review and the exact-SHA GitHub workflow have not run yet. No test or runtime result is claimed.

The intended fix for the prior shallow SLERP search failure is the stable radial evaluation together with the accepted sharper support coefficient; it remains unverified until the coordinator's hosted checks run. If the original root/tolerance or search limits fail, stop under the packet's stop condition. Havok deployment, collision-free physical traversal, playability, and T02 acceptance remain separate gates.
