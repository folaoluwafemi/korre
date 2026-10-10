# T02-C2 format repair 1 — implementation report

GitHub Actions run #11 (`38040386810`) passed workspace/root typecheck and ESLint, then failed hosted Prettier on exactly `sampling.ts` and `sampling.test.ts`. Unit tests, build, calibration probe, integration, and E2E did not run.

Ran the packet's pinned formatter command on those two files only. It exited 0. The inspected diff contains only Prettier line-wrapping changes, and `git diff --check` exited 0. No local tests, builds, typecheck, lint, or server ran. Independent diff review and a fresh hosted verify, integration, and one-worker Chromium E2E run are pending. The repair does not accept C2 or T02.
