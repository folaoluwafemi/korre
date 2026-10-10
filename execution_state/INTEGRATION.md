# Integration record

## T00

Workspace packages and entrypoints are under the `@korre/*` naming rule. Browser and headless Counterball exports are separate. Browser, Node, and Worker TypeScript configs use distinct ambient libraries; the API build emits only runtime JS/declarations and source maps. After repair 2, `pnpm install --frozen-lockfile`, `pnpm verify`, `pnpm test:integration`, `pnpm test:e2e`, and a five-path backend import probe passed. The domain lint rule rejects shared and relative UI/presentation imports and app/backend imports. Wrangler remains a 0.36 KiB local health-route dry run with no bindings; it is not deployed Havok evidence. Final independent repair-2 review passed at `execution_state/reports/T00-review-repair-2.md`.

## T01 — accepted after independent review

The first independent review at `execution_state/reports/T01-review.md` reproduced an own `__proto__` canonicalization collision and accepted a 606,802-byte playback chunk with an invalid index. Coordinator repair 1 adds a null-prototype canonical accumulator and fixed protocol-v1 bounds with negative tests, including snapshot metadata/index consistency and aggregate bytes. After the final test addition, frozen install, protocol/SDK package tests (9 and 3), full `pnpm verify` (22 tests/builds), integration, and Chromium E2E passed. The final independent re-review passed and the coordinator reran the frozen install successfully; T01 is `ACCEPTED`. The config carries `physicsCalibration: null` pending T02's pinned calibration; no simulation or deployed Cloudflare result is claimed.

## External services — historical baseline before this review

- Git remote `origin` is `https://github.com/folaoluwafemi/korre.git`; the user has authenticated GitHub CLI access. Hosted CI runs against the `codex/remote-ci-bootstrap` branch. Run 18 is linked below; credentials and temporary artifact URLs are not recorded.
- As of 2026-10-10, read-only `wrangler whoami` and `railway whoami` checks both succeeded through existing sign-ins; identity/account details were withheld. Cloudflare staging has not yet been deployed; its concrete smoke artifact depends on accepted T02.
- The workspace is not linked to a Railway project. One account project is visible, but its name does not match Counterball and its only environment is not labeled staging/development/test; it contains a PostgreSQL-named service. It was not linked, read for variables, migrated, deployed to, or otherwise changed.
- Docker Engine is unavailable and `127.0.0.1:5432` is not accepting connections. T11's real-PostgreSQL acceptance remains unverified. Use a disposable local PostgreSQL service or an explicitly designated nonproduction Railway environment; do not use the unrelated project or production environment for tests.

## Earlier packet wave — historical evidence

- T03 is `ACCEPTED`. The hosted independent review at `execution_state/reports/T03-hosted-review-1.md` confirmed the pitch/goals/caps, canonical fixture geometry, four real button openings, unmount/remount cleanup, and all three one-worker Chromium tests in GitHub run #6. No physical-phone or full gameplay proof is claimed.
- T11-A/B and coordinator API composition/migration runner are locally implemented. The API edge-auth/trusted-client repair passed recorded API typecheck/tests (22 passed, 8 PostgreSQL cases skipped), formatter, scoped lint, migration syntax check, and in-memory boundary integration. Independent T11 parent repair re-review passed in `execution_state/reports/T11-parent-review-repair-1.md`. The migration has not been applied. Real PostgreSQL acceptance remains NOT RUN because no authorized disposable database is available; the unrelated Railway project was not touched.
- T02-A is `ACCEPTED`. The constructor cleanup repair passed independent review, and GitHub run #8 passed the full workspace checks, real-Havok 480-trial calibration probe, integration, and browser E2E. Calibration observations and their limitations are recorded under `execution_state/reports/T02-calibration-observations-*`; no production physics coefficients were selected from them.
- T02-B2's intended-shot diagnostic passed the full hosted pipeline in GitHub run [#18](https://github.com/folaoluwafemi/korre/actions/runs/38042497937), including 40 real pinned-Havok-WASM trials, integration, and three Chromium tests. Artifact `11665948583` is preserved and its provenance/data review passed. Eight trials show positive raw signed clearance, but the canonical clearance epsilon and all configured-threshold classifications remain null. T02-B2 and parent T02 remain open; this is not deployed Cloudflare evidence or a production physics selection.
- The user reports being logged into Wrangler and earlier authorized the requested staging deployment. Use that session only for the plan's T04 staging proof after accepted T02 and a real runner exist. No production deployment or plan change is authorized.

## Current hosted review

GitHub run [38057543954](https://github.com/folaoluwafemi/korre/actions/runs/38057543954) on `22a7375e1b57a01d1bd91e23f18749ed7096d4a8` passed frozen installation, type/lint/format checks, all workspace builds, 98 tests across 24 files with zero skips, migrations twice on disposable PostgreSQL, one health integration test and four built-browser cases with zero retries/skips. Independent final evidence review is recorded in the current review reports before coordinator acceptance.

Real database acceptance no longer needs Railway: CI ran eight repository, two HTTP/service/repository and five migration-runner PostgreSQL cases. The unrelated Railway project remains untouched. Earlier local skipped-test and unapplied-migration statements above describe the historical baseline only. Identity UI, deployed cookie/proxy behavior and database readiness remain future work; `/health` proves liveness only.

D38 now supplies canonical provisional `restart.clearanceEpsilon=0.005`; it needs no human numeric answer. The independently reviewed 40-trial run-22 artifact reports sampled clearance and contacts separately. No tested candidate demonstrates collision-free loft; calibration remains null. The bounded diagnostic can be accepted without accepting parent T02. T02's runner/facts/loft gates and T04/T05 remain unfinished.

The browser now supports pointer/touch/keyboard camera inspection, capped idle/background rendering, and real native context-loss recovery. Hosted checks exercise unsupported preflight and partial engine construction followed by genuine retry without leaked listeners/registry entries. These are static scene checks, not playable matches. Real phones remain unverified.

## C00-A — protocol cancellation contract

2026-10-10: coordinator implemented C00-A under its exact five-path ownership and released source paths after independent source review PASS (`reports/C00-A-review.md`). The optional structural signal is process-local; simulation payloads remain unchanged. The protocol error/event enum adds `cancelled` with strict positive/negative tests and prelaunch version-compatibility documentation. `node scripts/check-completion-plan.mjs --packet C00-A` and `git diff --check` passed. Protocol tests and `pnpm verify` have not run and must run on GitHub against the exact pushed head. There is no deployed gameplay consumer recorded in this integration history; recheck any staged/versioned consumer before launch. Parent T02 remains RUNNING and no simulation cancellation implementation or gameplay acceptance is claimed.

All application builds/tests ran on GitHub. User inspection can use the downloaded passing artifact through the lightweight loopback-only static server, with no local compilation or dependency installation. No Cloudflare/Railway deployment or paid/production change occurred in this review. Runtime authority is `tasks.json` and `reports/current-review-validation.md`; historical entries do not override them.
