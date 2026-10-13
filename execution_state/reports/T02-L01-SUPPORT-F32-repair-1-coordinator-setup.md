# T02-L01-SUPPORT-F32 repair attempt 1 — coordinator setup

## Trigger

GitHub run 38469673506 on source SHA `d7477075de44ade129067e177acc07f8f5cb0655` passed workspace typecheck and ESLint, then failed Prettier on exactly `games/counterball/src/simulation/loftCoarseRunner.ts`. Exact log and actual artifacts are recorded in `execution_state/reports/T02-L01-SUPPORT-F32-run-38469673506.md`. This is the first focused repair attempt for this formatting failure signature.

## Exact input and ownership

- Apply only `execution_state/reports/T02-L01-SUPPORT-F32-run-38469673506/formatting-repair/formatting-repair.patch` (931 bytes; SHA-256 `6eb84e0321521a963dbcee86424202cc98e0f335671f2884f92d61410d423e0a`).
- Sole source write: `games/counterball/src/simulation/loftCoarseRunner.ts`.
- Implementation report: `execution_state/reports/T02-L01-SUPPORT-F32-repair-1-implementation.md`.
- Independent source review: `/root/executor_type_review`, report `execution_state/reports/T02-L01-SUPPORT-F32-repair-1-review.md`.
- Independent review of failed run 38469673506: `/root/run_evidence_review`, report `execution_state/reports/T02-L01-SUPPORT-F32-run-38469673506-independent-review.md`.
- `/root` owns shared task/ledger/ownership state, exact-source commit and GitHub rerun. No reviewer or worker edits shared status.

## Commands and acceptance

1. Apply the downloaded patch exactly with `git apply execution_state/reports/T02-L01-SUPPORT-F32-run-38469673506/formatting-repair/formatting-repair.patch`. Do not run Prettier locally or recreate formatting manually.
2. Run only `git diff --check -- games/counterball/src/simulation/loftCoarseRunner.ts` locally. No app install, typecheck, lint, test, build, browser, physics, deployment, or Cloudflare/Wrangler command.
3. The implementation report records exact patch hash, changed paths, command and exit code. Independent review confirms the complete runner diff is precisely the hosted one-hunk formatting patch, preserving the reviewed exact-float32 rule.
4. Only after source-review PASS, `/root` commits and pushes the exact reviewed source and runs the hosted Verify plus the unchanged routed real-Havok Chromium suite. Preserve all 24 matrix cases and all original assertions/caps/timing/artifact rules.
5. Failure does not accept F32 or MATRIX-1. At most one more focused attempt is permitted for the same formatting mechanism; then follow the bounded escalation rule.
