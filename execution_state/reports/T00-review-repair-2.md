# T00 repair 2 independent review

Date: 2026-10-10  
Reviewer: /root/foundation_review  
Verdict: PASS

## Scope and method

This final review checked the current T00 workspace after repair 2, including the ESLint boundary rule, effective TypeScript configurations, and emitted Node API artifact. I also reviewed the prior comprehensive T00 acceptance review and the repair 1 re-review to carry forward their independently checked scaffold, workspace, environment, CI, and truthful-status findings. No implementation, configuration, lockfile, task-state, or ledger file was edited; this report is the sole review write.

## Repair 2 boundary probes

An ESLint stdin probe using a filename under `games/counterball/src/features/.../domain/` imported all ten forbidden targets below. ESLint exited 1 and emitted `no-restricted-imports` diagnostics for every target:

- Bare package imports: `@korre/api`, `@korre/realtime`, and `@korre/ui`.
- Relative imports into `apps/api`, `apps/realtime`, `backend`, and `infrastructure`.
- Relative imports into shared `presentation` and `ui` paths.

The current [eslint.config.js](../../eslint.config.js) contains exact restrictions for the bare app/UI packages and patterns for their subpaths, backend app directories, `backend`, `infrastructure`, `presentation`, and `ui`. The probe confirms the repair 2 backend paths are blocked and the earlier UI/presentation restrictions remain effective.

## Runtime type separation and API artifact

Effective `tsc --showConfig` inspection exited 0 for all three app configs:

| Config | Effective libraries/types | Result |
|---|---|---|
| `apps/web/tsconfig.json` | ES2022, DOM, DOM.Iterable; Vite client types | Browser APIs are available to the web app. |
| `apps/api/tsconfig.json` | ES2022; Node types | No DOM library is inherited by the API. |
| `apps/realtime/tsconfig.json` | ES2022, WebWorker; no ambient type packages | Worker APIs are available, with Node globals excluded. |

The shared [tsconfig.base.json](../../tsconfig.base.json) supplies ES2022 only. After `pnpm.cmd verify`, `apps/api/dist` contained `app.js`, `index.js`, declaration files, and source maps; no test files were emitted. `node --check` passed for both emitted JavaScript modules. The API build config includes only `src` and excludes `src/**/*.test.ts`.

## Acceptance checks

| Command/check | Result |
|---|---|
| `pnpm.cmd install --frozen-lockfile` | PASS, exit 0; all 9 workspace projects in scope and lockfile up to date. |
| `pnpm.cmd verify` | PASS, exit 0; eight workspace typechecks, lint and formatting, 9 unit-test files/12 tests, emitted API build, Vite production build, and Wrangler Worker dry-run passed. |
| `pnpm.cmd test:integration` | PASS, exit 0; 1 file/1 test passed. This is the scaffold Hono health-route check, not a PostgreSQL integration test. |
| `pnpm.cmd test:e2e` | PASS, exit 0; 1 Chromium browser test passed against the local preview. |
| Effective TypeScript config inspection | PASS, exit 0 for web, API, and Worker configs; details above. |
| API artifact inspection and syntax checks | PASS, exit 0; API JavaScript and declarations emitted, test files excluded, both JavaScript modules parse. |
| Domain import boundary probe | EXPECTED REJECTION, ESLint exit 1 with `no-restricted-imports` findings for all ten targets listed above. |

The previous independent acceptance review also confirmed that all eight public workspaces resolve, environment secret files are ignored with only `.env.example` present, CI is wired to frozen install/verify/integration/E2E commands, and the browser shell clearly says Counterball is not playable yet. The root README and page make no gameplay claims.

## Recommendation and limits

**PASS: T00 acceptance criteria are supported by the independent checks and current source.** The coordinator may mark T00 accepted after updating the shared task ledger under its ownership.

The Worker remains a local health-only dry-run and does not contain Havok. Hosted CI has not run, and this review does not claim a deployed Worker, database behavior, online play, or a playable game. Those remain later-task gates rather than T00 failures.