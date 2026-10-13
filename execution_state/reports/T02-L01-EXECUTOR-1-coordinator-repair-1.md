# T02-L01 executor coordinator repair 1

## Trigger

The independent review at `execution_state/reports/T02-L01-EXECUTOR-1-review-4.md` found that a rejected `sink.abort()` caused the runner to throw a bare `AggregateError`. This discarded an existing `cancelled` or `resourceLimit` code from the primary failure. The worker completed two focused repairs under `knowledge_base/execution/SWARM.md:225-226`; the coordinator made this small repair after that limit.

## Change

In `games/counterball/src/simulation/loftCoarseRunner.ts`, replaced the bare aggregate throw with the already imported `errorWithCleanup(error, [abortError])`. That helper preserves the normalized primary diagnostic code while retaining the abort error in the aggregate cause. It does not change successful sink behavior or any simulation/physics condition.

## Check

- Scoped PowerShell scan of the complete untracked runner source for trailing tabs/spaces — PASS.
- No local application typecheck, lint, tests, build, browser run, Havok/physics run, or deployment check was performed.
- Independent review and exact-head GitHub verification remain pending.

This repair does not accept the executor or make any runtime/playability claim.
