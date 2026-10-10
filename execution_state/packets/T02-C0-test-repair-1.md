# T02-C0 test repair 1 — tolerate floating-point association

## Triggering evidence

GitHub Actions run #10 (`38039932545`) on `5f4be8baaf320842917fc48322519f7a7b3b420a` passed typecheck, ESLint, and Prettier, then ran unit tests: 69 passed, 8 PostgreSQL cases were skipped, and the flat placement pose test failed at its exact object equality. The helper computes `capZ + (capRadius + buttonRadius)` while the expected expression groups as `(capZ + capRadius) + buttonRadius`; both represent the same geometry but can differ by a binary floating-point rounding unit. No implementation formula or physics behavior change is warranted.

## Exact coordinator write paths

Coordinator `/root` may edit only:

- `games/counterball/src/features/restarts/domain/placementPose.test.ts`
- `execution_state/packets/T02-C0-test-repair-1.md`
- `execution_state/reports/T02-C0-test-repair-1-implementation.md`
- `execution_state/tasks.json`
- `execution_state/LEDGER.md`

Independent reviewer `/root/foundation_review` may write only `execution_state/reports/T02-C0-test-repair-1-review.md`.

Change the flat test's exact object equality into per-component `toBeCloseTo` comparisons at 12 decimal places for the expected position and identity quaternion. Keep expected geometry, function inputs, assertions' meaning, implementation formula, and all other tests unchanged. Do not run a local build, test, typecheck, lint, formatter, or server; remote CI is required.

## Review and acceptance

Reviewer checks the single test-file diff and confirms it only relaxes binary floating-point representation to a strict 1e-12-scale comparison without masking material geometric errors. After review PASS, coordinator pushes the repair and records the new hosted `pnpm verify`, integration, and one-worker Chromium E2E outcomes. C0 remains open until those hosted checks pass.
