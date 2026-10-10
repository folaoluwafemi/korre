# T02-C2 test repair 1 — canonical pose assertion

## Trigger and evidence

GitHub Actions run #12 (`38040673950`) on commit `e8c22a7b9baca76343be05fd97a40343db4e3111` passed workspace/root typecheck, ESLint, and Prettier, then reported one failed test in `sampling.test.ts`: “records t=0 and every fourth tick in canonical order with pose-only bodies.” The sampler test file reported 11 passing and 1 failing. The hosted log available through `gh run view` identifies the failing case but does not preserve its assertion diff. Build, integration, and browser E2E did not run.

## Exact ownership

Coordinator `/root` may edit only:

- `games/counterball/src/simulation/sampling.test.ts`
- `execution_state/packets/T02-C2-test-repair-1.md`
- `execution_state/reports/T02-C2-test-repair-1-implementation.md`
- `execution_state/tasks.json`
- `execution_state/LEDGER.md`
- `execution_state/OWNERSHIP.md`

Independent reviewer `/root/swarm_review` may write only `execution_state/reports/T02-C2-test-repair-1-review.md`. The sampler implementation remains unchanged.

## Bounded change

In the one failing test, replace exact equality of computed sample times and the first canonical body's numeric pose with component-wise `toBeCloseTo(..., 12)` assertions. Keep step inputs, expected values, canonical ID order, pose-only key assertion, cadence, sampler implementation, and all other tests unchanged. This protects the geometry/time assertions against binary representation details at strict 1e-12 precision without relaxing meaningful bounds.

Do not run local tests, builds, typecheck, lint, formatter, or server. Push only after independent review; GitHub Actions is the check path. If hosted verification reports another failure in this test, stop after this repair and follow SWARM's bounded escalation with the exact runner evidence; do not widen tolerances or remove assertions.

## Acceptance

Independent review must confirm only numeric equality representation changed and the 1e-12 comparisons retain useful sensitivity. C2 and C0 remain unaccepted until a fresh hosted `pnpm verify`, integration, and one-worker Chromium E2E run passes.
