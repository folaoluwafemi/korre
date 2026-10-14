# T02-L01-DIAGNOSTIC-APRON-F32-1 repair attempt 1 — coordinator setup

## Trigger

GitHub run 38616985171 on exact source SHA `41f70f1dd3bada6871c2099807408851ca757dba` failed only at Prettier for `games/counterball/src/simulation/loftCoarseProbe.test.ts`. Independent run review is `PASS` in `execution_state/reports/T02-L01-DIAGNOSTIC-APRON-F32-1-run-38616985171-independent-review.md`. It confirms typecheck passed, ESLint passed, Prettier named only that test file, and unit/build/integration/browser/diagnostic matrix steps did not run.

## Exact input and ownership

- Apply only the hosted formatter patch `execution_state/reports/T02-L01-DIAGNOSTIC-APRON-F32-1-run-38616985171-artifacts/formatting-repair/formatting-repair.patch` (2,412 bytes; SHA-256 `1e6592c83044c6dec079d4fe8f31351db837343d3e6ffb041bb38c2d45315340`). The independent reviewer verified that its only target is `games/counterball/src/simulation/loftCoarseProbe.test.ts` and it contains no semantic changes.
- Sole source write: `games/counterball/src/simulation/loftCoarseProbe.test.ts`.
- Repair implementation report: `execution_state/reports/T02-L01-DIAGNOSTIC-APRON-F32-1-repair-1-implementation.md`.
- Independent post-repair source review: `/root/run_evidence_review`, report `execution_state/reports/T02-L01-DIAGNOSTIC-APRON-F32-1-repair-1-review.md`.
- `/root` owns shared task state, source commit/push and the next GitHub run. No reviewer or worker edits shared status.

## Commands and acceptance

1. Apply the downloaded hosted patch exactly with `git apply execution_state/reports/T02-L01-DIAGNOSTIC-APRON-F32-1-run-38616985171-artifacts/formatting-repair/formatting-repair.patch`. Do not run Prettier locally or recreate the formatting manually.
2. Run only `git diff --check -- games/counterball/src/simulation/loftCoarseProbe.test.ts` locally. No local app install, typecheck, lint, test, build, browser, physics, deployment, or Cloudflare/Wrangler command.
3. The repair report records the exact patch hash, changed path, post-repair source hash, scoped command and exit code. Independent source review confirms the complete test-file diff is exactly the hosted one-hunk formatting patch, preserving the already reviewed assertion.
4. After independent source-review PASS, `/root` commits and pushes the exact reviewed source. The next GitHub run must pass the unchanged Verify, integration, preview-browser and complete routed 24-case pinned-Havok diagnostic suite before any matrix claim.
5. This is repair attempt 1 for the formatting failure signature. One more focused attempt is permitted for the same mechanism. Preserve this failed run and its artifacts; do not weaken acceptance or claim matrix/runtime success.
