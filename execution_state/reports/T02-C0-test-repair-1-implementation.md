# T02-C0 test repair 1 — implementation report

## Change

Updated only `placementPose.test.ts`. The flat tangent-pose test now compares each position and identity-quaternion component with Vitest `toBeCloseTo(..., 12)` instead of exact object equality. The expected geometry and helper implementation are unchanged. This keeps the assertion sensitive to material pose errors while allowing binary floating-point operation association at approximately 1e-12 precision.

## Trigger

GitHub Actions run #10 (`38039932545`) passed typecheck, ESLint, and Prettier, then reported 69 unit tests passed, 8 PostgreSQL tests skipped, and one failure in the flat placement test. The failure came from exact comparison of equivalent floating-point expressions grouped differently.

## Verification

No local test, build, typecheck, lint, formatter, or server command was run. Independent source review and a new hosted verification, integration, and one-worker Chromium E2E run are pending. This repair does not accept C0 or T02.
