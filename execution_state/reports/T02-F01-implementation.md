# T02-F01 implementation report

Status: implementation saved; independent review and hosted verification are pending.

## Changed files

- `games/counterball/src/simulation/facts.ts`
- `games/counterball/src/simulation/facts.test.ts`
- `execution_state/reports/T02-F01-implementation.md`

## Implementation

`facts.ts` exports the packet's `PhysicsContactStart`, `PhysicsStepObservation`, and canonical `deriveSimulationFacts` API. It validates canonical body IDs, one finite normalized pose per body, finite contact points, initial history and monotonic timestamps/steps; it clones inputs and does not mutate them. Contact pairs and output order are canonical and deterministic. Contacts retain their interval observation time. Crossings use whole-cylinder support with the interpolated pose, and the event time/point are emitted when the trailing support clears the painted boundary. The earliest boundary event per entity is kept, with exact boundary ties emitted in canonical boundary order.

For end-line button crossings, the full oriented button is checked at its center-plane crossing for post and crossbar clearance; that classification is retained until the trailing-support event is emitted. Tangency is `out`. This also handles the ordinary case where the center crosses in an earlier bounded physics substep than the trailing support. Same-rule-step contacts sort before crossings for attribution only, then by time and stable IDs.

The implementation uses linear position interpolation and shortest-arc quaternion slerp between adjacent supplied poses. It does not establish collision-free transit between observations, infer missing physics, or implement referee/scoring/restart rules.

`facts.test.ts` covers every canonical ID in contact normalization, stable ordering, input immutability, finite/plain/serializable/bounded protocol facts, button side/end crossings, cap exits, fast swept exits, trailing-support timing, multi-substep goal passage, quaternion-dependent support, inside/outside/tangent post and crossbar cases, corner ties, and same-step contact-before-crossing ordering. It also checks malformed history and the fact-count bound.

## Verification

No local test, typecheck, build, lint, format, browser, or physics command was run, as required by the packet.

Still pending on GitHub:

`pnpm --filter @korre/counterball test && pnpm --filter @korre/counterball typecheck && pnpm verify`

No test or runtime result is claimed. T02-F01 is not accepted, and parent T02 remains RUNNING until the independent review and hosted checks pass.
