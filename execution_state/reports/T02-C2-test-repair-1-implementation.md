# T02-C2 test repair 1 — implementation report

GitHub Actions run #12 passed typecheck, ESLint, and Prettier. The `sampling.test.ts` suite reported 11 passing and one failing test, the canonical-order/pose-only sample test; the hosted log did not retain the assertion-level diff. Build, integration, and E2E did not run.

Changed only that test. Computed sample times and the first canonical body's numeric pose are now compared component-by-component at 12 decimal places. The test still checks the exact sample count, t=0, expected fourth-tick cadence, canonical IDs, button ID, identity rotation, position, and pose-only field set. The sampler implementation and every other test are unchanged.

No local test, build, typecheck, lint, formatter, or server command ran. Independent review and a fresh hosted verify, integration, and one-worker Chromium E2E run are pending. This repair does not accept C2 or T02.
