# T02-B2 ESLint repair 1

## Objective and trigger

Repair the five ESLint errors reported by hosted GitHub Actions run `38041738500` on commit `f9052dd79f61a2dcfd587637c2eff12d5e9e0c74`, limited to the intended-shot probe source. The failure occurs before unit tests, probe execution, integration, or E2E. This packet does not resolve the separate missing canonical clearance-epsilon decision.

Hosted findings in `games/counterball/src/simulation/intendedShotProbe.test.ts`:

- line 5: `Quaternion` import is type-only;
- line 17: unused `EntityId` import;
- line 126: unused `asPlainQuaternion` helper;
- line 568: unsafe throw from a `finally` block;
- line 658: unsafe throw from a `finally` block.

## Exact ownership

Worker `/root/toolchain_audit` may edit only:

- `games/counterball/src/simulation/intendedShotProbe.test.ts`
- `execution_state/reports/T02-B2-intended-shot-probe-implementation.md`

Reviewer `/root/swarm_review` may edit only:

- `execution_state/reports/T02-B2-eslint-repair-1-review.md`

Coordinator owns this packet, `execution_state/OWNERSHIP.md`, and runtime task/ledger records. No other source, workflow, config, test, contract, or fixture path is in scope.

## Read first

- `AGENTS.md`
- `knowledge_base/execution/SWARM.md`, especially bounded failure handling
- `knowledge_base/execution/CONTRACTS.md`
- `knowledge_base/execution/GAMEPLAY.md` section 6
- `execution_state/packets/T02-B2-intended-shot-probe.md`
- `execution_state/reports/T02-B2-intended-shot-probe-review.md`
- hosted log for run `38041738500`

## Acceptance

1. Remove the unused `EntityId` and `asPlainQuaternion`; correct the `Quaternion` import or remove it if no longer needed.
2. Restructure observer and world/engine cleanup so `finally` blocks do not throw, while cleanup still runs on every success and failure path and cleanup failures remain observable after cleanup completes.
3. Preserve the 40-trial matrix, real pinned WASM setup, raw clearance observations and null threshold fields, assertions, artifact timing, and all measurement behavior.
4. Do not add `eslint-disable`, weaken repository lint settings, invent a clearance epsilon, or edit canonical config.
5. Save an implementation-report addendum listing the hosted findings and the limited repair. Local tests/builds/formatters are forbidden for this packet; state that hosted verification is pending.
6. Independent source review passes this exact diff. Coordinator then pushes it for hosted verification. The threshold review issue remains open regardless of this repair.

## Failure handling

This is repair attempt 1 for the hosted ESLint failure. If the same lint failure remains after the hosted run, permit one focused second attempt. After two unsuccessful attempts, stop edits and escalate to the coordinator with the exact lint output and smallest next proposal.
