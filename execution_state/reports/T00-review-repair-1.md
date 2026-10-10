# T00 repair 1 independent re-review

Date: 2026-10-10  
Reviewer: /root/foundation_review  
Verdict: CHANGES_REQUIRED

## Review scope

Read the first review at `execution_state/reports/T00-review.md`, the updated T00 implementation report, and the changed base/runtime TypeScript configs, API build config and script, root build script, and ESLint boundary rule. No implementation, config, lock, or shared status file was edited.

## Prior findings rechecked

1. **TypeScript runtime separation — PASS.** [tsconfig.base.json](../../tsconfig.base.json) now supplies only ES2022. Effective `tsc --showConfig` output confirms the web config has DOM/DOM.Iterable; API has ES2022 and `types: ["node"]`; Worker has ES2022 + WebWorker and `types: []`. API and Worker therefore do not inherit DOM or Node globals respectively.
2. **API build output — PASS.** [apps/api/package.json](../../apps/api/package.json) runs the clean script then `tsc -p tsconfig.build.json`; [apps/api/tsconfig.build.json](../../apps/api/tsconfig.build.json) emits ESM, declarations, and source maps to `dist` and excludes `src/**/*.test.ts`. After the independently run root verify, `apps/api/dist` contained app/index JavaScript, declarations, and maps, no test files; `node --check` passed for both emitted JavaScript modules.
3. **Shared UI and relative presentation/UI lint probes — PASS.** ESLint rejected a direct `@korre/ui` import, a relative `presentation` import, and a relative `ui` import with `no-restricted-imports` (each probe exited 1 for the expected rule).

## Remaining finding

**The domain boundary still permits relative imports into the API/backend.** An ESLint stdin probe named as a domain file imported `../../../../../../apps/api/src/app.js`; ESLint exited 0 and reported no restriction. The path is inside the backend application and bypasses the current package-alias rules in [eslint.config.js](../../eslint.config.js). This leaves the T00 requirement that domain cannot import backend code unenforced. Add restrictions for relative `apps/api` and `apps/realtime` paths (and bare app package names as applicable), then rerun the probe and lint.

## Independent checks and results

| Command/check | Result |
|---|---|
| `pnpm.cmd install --frozen-lockfile` | PASS, exit 0; all 9 workspace projects in scope, lockfile up to date. |
| `pnpm.cmd verify` | PASS, exit 0; all eight workspace typechecks, lint/format, 9 unit files/12 tests, emitted API build, Vite build, and Wrangler local dry-run passed. |
| `pnpm.cmd test:integration` | PASS, exit 0; 1 file/1 test passed. |
| `pnpm.cmd test:e2e` | PASS, exit 0; 1 Chromium browser test passed. |
| `pnpm.cmd exec tsc --showConfig -p apps/api/tsconfig.json` | PASS, exit 0; ES2022 only, Node types. |
| `pnpm.cmd exec tsc --showConfig -p apps/realtime/tsconfig.json` | PASS, exit 0; ES2022 + WebWorker, no automatic types. |
| `pnpm.cmd exec tsc --showConfig -p apps/web/tsconfig.json` | PASS, exit 0; DOM and DOM.Iterable enabled. |
| Emitted API syntax checks | PASS, exit 0 for `node --check apps/api/dist/app.js` and `node --check apps/api/dist/index.js`; no test files were emitted. |
| Direct UI / relative presentation / relative UI probes | EXPECTED REJECTION, each ESLint exit 1 with `no-restricted-imports`. |
| Relative API import probe | FAILS THE BOUNDARY, ESLint exit 0 for `../../../../../../apps/api/src/app.js`. |

The Worker dry-run remains a health-only local bundle. It does not prove a deployed Havok simulation.

## Recommendation

Keep T00 in CHANGES_REQUIRED until the relative backend-import probe is rejected and the affected lint and full verify checks pass. No task status or ledger was changed.
