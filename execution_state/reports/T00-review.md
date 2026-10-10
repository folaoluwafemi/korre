# T00 independent review

Date: 2026-10-10  
Reviewer: /root/foundation_review  
Verdict: CHANGES_REQUIRED

## Scope

Read the current AGENTS.md, execution README, DECISIONS.md, CONTRACTS.md, TASKS.md, SWARM.md, all eight workspace manifests and TypeScript configs, root tooling, CI, environment setup, scaffold sources, tests, and the T00 implementation report. The verdict is based on source and independently rerun checks, not the implementation report alone.

## Findings requiring a bounded repair

1. **Browser, Node, and Worker type environments are not separated.** T00 requires browser/server TypeScript configs (TASKS.md, T00 step 2). [tsconfig.base.json](../../tsconfig.base.json) globally supplies `DOM` and `DOM.Iterable`; [apps/api/tsconfig.json](../../apps/api/tsconfig.json) only adds Node ambient types and does not remove DOM types; [apps/realtime/tsconfig.json](../../apps/realtime/tsconfig.json) inherits the same DOM types and does not declare Worker-specific types or exclude Node globals. This lets browser-only and Node-only APIs typecheck in runtime targets where they do not belong, weakening the Worker import/runtime boundary. Repair with an ES-only shared base and explicit web, API, and Worker configs (Worker types from Wrangler-generated types or the Cloudflare type package, without Node globals).

2. **The Node API build emits no build artifact.** The root plan says `pnpm build` must build the web app, Node API, and Worker bundle (execution README, toolchain table). [apps/api/package.json](../../apps/api/package.json) defines `build` as `tsc --noEmit -p tsconfig.json`; [apps/api/tsconfig.json](../../apps/api/tsconfig.json) also sets `noEmit: true`. The command passes as a second typecheck, but emits no deployable Node API output. Give the API a real build target and ensure the root build invokes it.

3. **The domain import rule does not cover all UI imports.** [eslint.config.js](../../eslint.config.js) blocks React and app/backend paths for the future domain glob, but does not forbid the shared UI package `@korre/ui` or relative imports into presentation/UI code. Thus a domain file can import the named shared UI workspace without the required lint failure. Extend the boundary rule to cover the shared UI package and relative presentation paths, and keep the rule scoped to the pure domain.

## Acceptance checks independently run

| Check | Result |
|---|---|
| `pnpm.cmd install --frozen-lockfile` | PASS, exit 0; pnpm reported all 9 workspace projects in scope and the lockfile up to date. |
| `pnpm.cmd verify` | PASS, exit 0; typecheck covered all eight workspaces and tests; ESLint/Prettier passed; 9 unit test files and 12 tests passed; web and Worker bundles built. |
| `pnpm.cmd test:integration` | PASS, exit 0; 1 file and 1 test passed. This is the in-process Hono health-route check and does not prove a PostgreSQL integration. |
| `pnpm.cmd test:e2e` | PASS, exit 0; 1 Chromium browser test passed against the configured local web server. Playwright is configured to reuse an existing local server outside CI. |
| `pnpm.cmd -r list --depth -1` | PASS, exit 0; listed exactly the expected eight named workspaces plus the root project. |
| Realtime workspace import of `@korre/counterball/headless` | PASS, exit 0; resolved to the headless entry. The Counterball package test also imports browser and headless entries separately. |
| Environment ignore check | PASS for ignore rules: `.env` and `.env.local` are ignored; only `.env.example` exists. `git ls-files .env .env.*` returned no tracked files (the repository has no commits yet), so no tracked secret file was present. The example contains disposable local placeholders. |
| CI source check | PASS; the workflow contains frozen install, Chromium setup, verify, integration, and E2E commands. Hosted CI has not run. |
| Truthful scaffold check | PASS; README, page content, unit test, and E2E test all identify the game as not playable yet. |

The Worker dry-run bundle is only the health endpoint (367 bytes), and contains no Babylon or React imports. This is valid scaffold evidence, but the Worker does not yet import Counterball's headless entry; therefore it does not prove a game runtime or the deployed Havok gate. Those belong to later tasks.

## Recommendation

Keep T00 in CHANGES_REQUIRED until the three findings above are repaired and the affected typecheck, lint, and build checks rerun. The frozen install, tests, truthful scaffold, workspace list, environment ignore rules, and CI command wiring are otherwise supported by the checks above. No task status or shared ledger was changed by this review.
