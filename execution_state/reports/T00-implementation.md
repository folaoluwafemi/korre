# T00 implementation report — workspace and reproducible checks

Date: 2026-10-10  
Owner: coordinator  
Status: accepted after final independent review and coordinator post-review integration checks

## Delivered

- Created the pnpm TypeScript monorepo with the eight planned `@korre/*` workspaces and one root `pnpm-lock.yaml`.
- Pinned Node 24.21.0 for the project/CI, pnpm 10.33.0, and exact compatible package versions in `VERSIONS.md`. The host runtime remains Node 25.2.0; it was not changed.
- Added strict TypeScript configs, type-aware ESLint rules for floating promises, a pure-domain import restriction, Prettier checks, per-workspace test/typecheck/build scripts, and root `verify`, `dev`, and test commands.
- Split shared ES, browser DOM, Node, and Worker TypeScript libraries so Node and Worker checks do not inherit browser globals. The API now emits a clean Node ESM artifact with declarations and source maps; test files are excluded from the build output.
- Expanded pure-domain import restrictions to reject shared UI imports and relative `ui`/`presentation` paths.
- Added a small responsive, keyboard-accessible web shell. It says plainly that Counterball is not playable yet and contains no game controls or gameplay claims.
- Added a Hono API health route and a separate local Cloudflare Worker health route. The Counterball package exposes distinct browser and headless entrypoints.
- Added CI workflow, local setup README, `.env.example`, ignore rules, and runtime execution records. pnpm v10 blocks dependency lifecycle scripts by default; only `esbuild` and Cloudflare `workerd` are explicitly approved because the bundler and local Worker runtime require them.
- Kept `knowledge_base/execution/status.json` unchanged as the seed and copied it to `execution_state/tasks.json`. No task state was advanced before checks/review.

## Checks actually run

| Command/check | Result |
|---|---|
| `pnpm.cmd install` | Passed; generated one lockfile. |
| `pnpm.cmd install --frozen-lockfile` | Passed; lockfile was up to date. |
| `pnpm.cmd -r list --depth -1` | Passed; root plus all eight workspaces resolve. |
| `pnpm.cmd typecheck` | Passed with exit code 0 across all eight workspaces and browser/integration test TypeScript. |
| `pnpm.cmd lint` | Passed with exit code 0; ESLint and Prettier both clean. |
| `pnpm.cmd test` | Passed: 9 files, 12 tests. These are scaffold, API/Worker health, and workspace-link checks only. |
| `pnpm.cmd test:integration` | Passed: 1 file, 1 test against the Hono health route. No database service is needed by this scaffold check. |
| `pnpm.cmd test:e2e` | Passed in installed Chromium: 1 browser test confirms page title, accessible Counterball heading, not-playable status, and skip-link focus. |
| `pnpm.cmd verify` | Passed: typecheck, lint, unit tests, web/API builds, and Wrangler Worker `--dry-run`. |
| `pnpm.cmd dev` + HTTP requests | Passed: web returned HTTP 200 at `http://127.0.0.1:5173/`; API returned `{"status":"ok","service":"api"}` at `/health`. These processes remain running for preview. |
| `pnpm.cmd dev:realtime` + HTTP request | Passed locally: Worker returned `{"status":"ok","service":"realtime"}` at `http://127.0.0.1:8787/health`. The Worker process remains running for preview. |
| Secret-file scan | Only `.env.example` exists among root `.env*` files. It contains local-only placeholder values. No `.env` secret file was found. Git has no commits yet, so there are no tracked files to report; the ignore rule excludes `.env*` except `.env.example`. |

The E2E check first failed because the styled split headline was exposed as “Counter ball.” to assistive technology while the test expected “Counterball.” The page now assigns the correct accessible brand name and the test checks it. An earlier strict typecheck also caught an environment-variable access style issue; it was repaired and the full typecheck passed. The local Worker health handler was made synchronous after the floating-promise lint rule correctly rejected an `async` function with no `await`.

## Limits and external status

- This screen is a scaffold; Counterball cannot be played yet.
- The Worker bundle dry-run includes no Havok simulation. This does not satisfy T04's deployed, real Cloudflare Havok gate.
- The workflow file exists, but the repository has no Git remote and no commits; hosted CI has not run.
- Docker Desktop's Linux engine was unavailable at baseline, and no PostgreSQL server/client was present. No database or identity behavior is claimed.
- No Cloudflare account was accessed or deployed during T00. No production action, paid-plan change, or secret handling was performed.

## Review handoff

The first independent review is saved in `execution_state/reports/T00-review.md` with verdict `CHANGES_REQUIRED`. Repair attempt 1 addressed the three findings in that report. Its independent re-review is saved in `execution_state/reports/T00-review-repair-1.md`; it confirmed those repairs but found a relative import path into `apps/api` that still bypassed the backend boundary. Repair attempt 2 adds relative app/backend and bare app-package restrictions. The final independent review passed in `execution_state/reports/T00-review-repair-2.md`; coordinator post-review verification, integration, and E2E checks also passed. T00 is accepted and unblocks T01.

## Repair attempt 1 checks

The coordinator repaired the three findings in `T00-review.md` and also tightened the emitted API build so it clears stale output and excludes test sources.

| Command/check | Result |
|---|---|
| `pnpm.cmd verify` after the final repair | Passed, exit code 0: all eight workspace typechecks, ESLint/Prettier, 9 unit files/12 tests, emitted API build, Vite production build, and Wrangler dry-run. |
| `pnpm.cmd test:integration` after the final repair | Passed, exit code 0: 1 file/1 test. |
| `pnpm.cmd test:e2e` after the final repair | Passed, exit code 0: 1 Chromium browser test. |
| `pnpm.cmd install --frozen-lockfile` after the final repair | Passed, exit code 0; lockfile up to date for all 9 workspace projects. |
| Temporary domain-import probe | Passed: ESLint rejected both `@korre/ui` and a relative `presentation` import with `no-restricted-imports`; temporary probe was removed. |
| API artifact inspection after build | Passed: `apps/api/dist` contains `app.js`, `index.js`, declarations, and source maps; test files are absent. |

The Worker build remains a local dry-run health endpoint with no bindings or Havok module. It does not satisfy the deployed Cloudflare WASM gate.

## Repair attempt 2 and final checks

Repair 2 adds domain import restrictions for bare `@korre/web`, `@korre/api`, and `@korre/realtime` package names, plus relative imports through `apps/api`, `apps/realtime`, `backend`, or `infrastructure` paths.

| Command/check | Result |
|---|---|
| `pnpm.cmd verify` after repair 2 | Passed, exit code 0: typechecks, lint/format, 9 unit files/12 tests, emitted API build, Vite production build, and Wrangler dry-run. |
| `pnpm.cmd install --frozen-lockfile` after repair 2 | Passed, exit code 0; all 9 workspace projects in scope, lockfile up to date. |
| `pnpm.cmd test:integration` after repair 2 | Passed, exit code 0: 1 file/1 test. |
| `pnpm.cmd test:e2e` after repair 2 | Passed, exit code 0: 1 Chromium test. |
| Temporary domain backend-boundary probe | Passed: ESLint rejected five imports—bare API and realtime packages plus relative API, realtime, and backend paths. Temporary files were removed. |

The final independent review at `execution_state/reports/T00-review-repair-2.md` passed all ten import probes, TypeScript runtime separation, API artifact inspection, frozen install, verification, integration, and E2E. The coordinator then reran `pnpm.cmd verify`, `pnpm.cmd test:integration`, and `pnpm.cmd test:e2e`, all with exit code 0. T00 is accepted.
