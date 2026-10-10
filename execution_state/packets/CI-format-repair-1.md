# Hosted format gate repair 1

## Triggering evidence

GitHub Actions run #4 on commit `a47c642` passed all workspace/root TypeScript checks and ESLint. The hosted Prettier check then reported exactly three files: `apps/web/src/App.tsx`, `games/counterball/src/scene/pieces.test.ts`, and `games/counterball/src/simulation/calibrationProbe.test.ts`. The workflow stopped before unit tests/build, so the real-WASM calibration probe did not execute.

## Exact implementation write paths

- `apps/web/src/App.tsx`
- `games/counterball/src/scene/pieces.test.ts`
- `games/counterball/src/simulation/calibrationProbe.test.ts`
- `execution_state/reports/CI-format-repair-1-implementation.md`

Only Prettier formatting may change. Preserve all application behavior, route flows, scene assertions, probe trial matrix/order/physics/data, and runtime semantics.

## Independent review

Reviewer: `/root/swarm_review`.

Reviewer report-only path:

- `execution_state/reports/CI-format-repair-1-review.md`

Inspect the exact diff against the packet. Confirm all differences are formatting-only. Do not run local build, test, lint, typecheck, formatter, or server commands. Do not edit implementation or status/config paths.

## Verification and acceptance

The coordinator ran only `pnpm.cmd exec prettier --write` on the three listed files. This low-cost formatting command was the only local action after the user requested remote builds; no local build/test/typecheck was run. Independent source review and a new hosted run are required. Hosted CI must pass typecheck, lint/format, unit tests including all 480 actual-Havok-WASM trials, build, integration, and one-worker Chromium E2E before affected parent tasks can be accepted.
