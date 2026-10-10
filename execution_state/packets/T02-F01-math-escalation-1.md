# T02-F01 bounded math escalation 1

Parent: T02-F01 (under T02)
Status: READY
Role: worker, math design only
Writer: `/root/toolchain_audit`
Independent reviewer after completion: `/root/swarm_review`

## Objective

After repair 2 failed independent review, derive and document a conservative rotational support-clearance bound for the actual shortest-arc quaternion interpolation used by F01. This is a design escalation only. It authorizes no source repair and does not reopen the exhausted two-attempt repair packet.

## Read first

- `execution_state/packets/T02-F01-facts.md`
- `execution_state/packets/T02-F01-repair-2.md`
- `execution_state/reports/T02-F01-repair-2-implementation.md`
- `execution_state/reports/T02-F01-repair-2-review.md`
- `games/counterball/src/simulation/facts.ts`
- `games/counterball/src/simulation/facts.test.ts`
- `knowledge_base/execution/CONTRACTS.md` simulation-facts section
- `knowledge_base/execution/DECISIONS.md` geometry and numeric defaults
- `knowledge_base/execution/TASKS.md` T02
- `knowledge_base/execution/SWARM.md` bounded failure procedure
- `knowledge_base/execution/completion/LOCAL_NOTES.md` F01 and whole-button evidence requirements

## Exact write paths

Worker may write only:

- `execution_state/reports/T02-F01-math-escalation-1.md`

Do not edit source, tests, packets, contracts, config, dependencies, or runtime records. The independent reviewer may write only `execution_state/reports/T02-F01-math-escalation-1-review.md`.

## Required analysis

1. Define normalized endpoint quaternion conventions and shortest-arc SLERP, including sign selection and relative rotation for the local vertical symmetry axis expressed in the needed frame.
2. Derive an upper bound on the parameterized path length of the cylinder symmetry axis for every interval. Show both the ordinary SLERP case and the normalized-linear case actually used by the adapter. Do not substitute endpoint geodesic separation for path length without proof.
3. Derive a conservative Lipschitz constant for the finite cylinder support function used by button/cap boundary and goal-aperture clearance. State how cylinder radius and half-height enter, including nonsmooth alignment/tie cases.
4. Verify the bound for zero/nearly-zero rotation, axis-aligned yaw, tilted small-circle rotations, rotations near the shortest-arc limit, and the contract's per-substep rotation range. State when the interval must fail closed.
5. Specify the smallest source-level algorithm change and named adversarial regression cases that would consume this proof. Preserve earliest-crossing search, work/depth limits, input immutability, same-step ordering, and every earlier review regression.
6. State whether the proposed bound is tight, conservative but useful, or likely to resource-limit ordinary motion. No cultural or production physics default may be changed.

## Acceptance

- Every inequality and interpolation-rate factor is derived from the implemented interpolation, with frames and angle units explicit.
- An independent reviewer can reproduce the `theta=pi/4` small-circle comparison from the report and confirm the proposed inequality covers it.
- Report names any unproved interval/branch and rejects it rather than claiming a clearance certificate.
- No app command or runtime result is claimed. This packet does not pass F01 or T02 and does not unblock consumers.

## Next step and stop condition

After independent review, the coordinator decides whether to materialize a separate implementation packet with new exact tests and a fresh review cycle. Do not edit source in this packet or start that implementation without coordinator dispatch. If a conservative/useful proof cannot be established, report the smallest contract or algorithm question requiring a human decision.
