# T02-F01-ROTATION-1-SEMANTIC-REPAIR-2 — repair seven hosted fact failures

Parent: T02
Role: worker source repair after independent failure escalation
Author: `/root/toolchain_audit`
Independent reviewer: `/root/foundation_review`
Hosted verification and shared status: coordinator only

## Accepted prerequisites

- `parent:T01`
- `T02-F01-math-escalation-1`
- `T02-C0`
- `T02-C2`
- `C00-A`
- `C00`
- `T02-F01-ROTATION-1-FORMAT-ESCALATION-1`
- `T02-F01-ROTATION-1-CI-FAIL-ESCALATION-1`

The previous exact-head source attempt remains CHANGES_REQUIRED. This card supersedes that failed attempt; it does not treat its failure as an accepted dependency or accept F01/T02.

## Objective

Repair the seven `facts.test.ts` failures from GitHub run 38088587482 while preserving the accepted rotational-support proof, complete fact protocol, earliest-root behavior, and all search limits. Keep D20 labelled as the provisional default: a whole-button passage between posts and below the crossbar is a goal; exact post tangency is out. The two centered end-line fixtures are clear goal passages and their case-specific expected kind must say `goal`.

## Read inputs

- `execution_state/packets/T02-F01-ROTATION-1.md`
- `execution_state/packets/T02-F01-ROTATION-1-FORMAT-REPAIR-1.md`
- `execution_state/packets/T02-F01-ROTATION-1-CI-FAIL-ESCALATION-1.md`
- `execution_state/reports/T02-F01-math-escalation-1.md`
- `execution_state/reports/T02-F01-math-escalation-1-review.md`
- `execution_state/reports/T02-F01-ROTATION-1-ci-fail-escalation-1.md`
- `execution_state/reports/T02-F01-ROTATION-1-ci-fail-escalation-1-review.md`
- `execution_state/reports/T02-F01-ROTATION-1-format-repair-1-run-38088587482.md`
- `games/counterball/src/simulation/facts.ts`
- `games/counterball/src/simulation/facts.test.ts`
- `packages/game-protocol/src/schemas.ts`
- `packages/game-protocol/src/config.ts`
- `knowledge_base/execution/CONTRACTS.md`
- `knowledge_base/execution/DECISIONS.md`
- `knowledge_base/execution/SWARM.md`

## Exact ownership

The author may edit only:

- `games/counterball/src/simulation/facts.ts`
- `games/counterball/src/simulation/facts.test.ts`
- `execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-implementation.md`

The independent reviewer may write only `execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-review.md`. The coordinator owns the packet/catalogues, `execution_state/tasks.json`, ledger/ownership/integration notes, Git publication, hosted checks, and hosted evidence. Workers do not spawn agents or edit shared state. No local application install, build, test, typecheck, lint, formatter, browser, physics, or dry-run is allowed.

## Required repair

1. Canonicalize signed zero in emitted finite fact coordinates so JSON round trips remain equal; keep the immutability and protocol-shape assertions.
2. Preserve the test's deterministic normalized-pair order for exact contact ties: compare normalized entity IDs lexically and deterministically. Preserve canonical within-pair orientation, callback-order independence, and same-step contact-before-crossing attribution.
3. Replace cancellation-prone `sqrt(1 - dot*dot)` radial support evaluation near parallel axes with a numerically stable equivalent. Use the stable path consistently in support extent/point calculations. Keep the accepted SLERP `theta*s` and NLERP `4*tan(theta/4)*s` rotational travel bounds and finite-cylinder support coefficient from the accepted math report.
4. Make the existing selected-SLERP near-threshold crossing resolve the earliest descending root under the current bounded left-first search. Keep the expected root and `5e-9` tolerance. Do not increase `maximumDepth` or `maximumNodes`, skip an unresolved interval, or weaken a conservative certificate. If the bound remains unresolved, stop and report evidence.
5. Set only the two centered `awayEnd` support fixtures that clear the floor, posts, and crossbar to expect `goal`, consistent with provisional D20. Keep exact post tangency as `out`; keep crossbar tangency and all other expected classifications intact.
6. Add a scale-aware outward roundoff allowance to the strict goal-mouth clearance proof so exact post tangency remains `out` despite floating-point residue. The allowance must be explained in the implementation report and tested with both exact tangency and a distinctly clear passage; do not substitute an arbitrary broad gameplay margin.

Do not change config, Havok/material tuning, physics defaults, the seven-cap rule, restart rules, protocol shape, or the accepted math derivation. Do not claim that a pure facts test proves continuous Havok motion.

## Checks and evidence

1. Run `node scripts/check-completion-plan.mjs --packet T02-F01-ROTATION-1-SEMANTIC-REPAIR-2` before implementation; it must report the exact record ready with only accepted dependencies.
2. The author performs source inspection only and records exact changed paths, test names, and rationale. No local application command is allowed.
3. Obtain an independent source review against the accepted math report and all preserved expectations. Reviewer PASS is required before publication.
4. After review, coordinator commits and pushes the exact reviewed source SHA to GitHub. Require the existing `ci` workflow to finish successfully: Worker smoke, two migration checks, protocol tests, `pnpm verify` (typecheck, ESLint, Prettier, full unit suite, and builds), integration tests, production browser preview E2E, and artifact uploads. Capture the complete run URL/ID, exact SHA, logs, artifacts and digests, and exact collected/passed/failed/skipped counts. Required suites must report zero skips. If Verify fails, downstream workflow steps are recorded as skipped, never passed.
5. Preserve run logs and artifacts under a unique `execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-run-<id>` directory, with a run report at `execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-run-<id>.md`.

## Acceptance

- The exact seven previously failed facts tests pass without loosening tolerances or changing the expected root; both clear end-line passages expect and produce `goal`, and exact post tangency expects and produces `out`.
- Stable support evaluation resolves the existing SLERP case while preserving the accepted path bound, fail-closed unresolved behavior, and original search depth/node caps.
- Signed-zero JSON equality, deterministic contact order, callback-order independence, immutability, and same-step attribution checks all pass.
- Independent source review is PASS, and the exact reviewed SHA passes the full GitHub workflow with no skipped required checks; complete logs and artifacts are retained.
- This accepts only the F01 fact producer if every check passes. T02, the deployed-Havok gate, browser flick, and playability remain separate.

## Negative cases and stop conditions

- Never change the expected pi/4 root or widen its tolerance; never change root search caps to force a green test.
- Never reinterpret the two clear goals as outs, or exact post tangency as a goal, without a new human rule decision. Keep D20 labelled provisional.
- Never treat calibration/intended-shot probes, Node results, screenshots from another SHA, or source review as deployed physics or real-browser proof.
- If stable evaluation does not resolve the actual bounded SLERP crossing, the numerical margin cannot be justified, or another hosted check fails, preserve exact evidence and stop. No further source retry or consumer card without another bounded, independently reviewed escalation.
