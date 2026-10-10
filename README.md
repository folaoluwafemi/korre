# Korre / Counterball

Korre is the platform; Counterball is the first game. This repository is the pnpm TypeScript monorepo for the web client, API, Cloudflare realtime worker, shared packages, and game runtime.

The current screen is the initial workspace scaffold. Counterball is **not playable yet**. The first playable flick is an early implementation milestone; the game must use the shared rules and physics packages for local and online play.

## Requirements

- Node.js 24.21.0 (see `.node-version`)
- pnpm 10.33.0
- For browser tests, the Playwright Chromium browser
- PostgreSQL will be needed by the identity task; no database is needed for the current health checks

On Windows, run the `.cmd` command shims if PowerShell blocks the scripts.

## Install and run

```text
pnpm install --frozen-lockfile
pnpm dev
```

The web shell is at <http://127.0.0.1:5173>. The Node API listens at <http://127.0.0.1:3001>; its current health check is `/health`.

Run the local Cloudflare Worker separately with `pnpm dev:realtime`; Wrangler serves it at <http://127.0.0.1:8787>. This local health-only worker is not proof of deployed Havok physics.

## Checks

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm test:integration
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
pnpm verify
```

`pnpm verify` runs typecheck, lint, unit tests, and all workspace builds. Integration and browser checks are separate so their results stay visible. The initial integration check uses the local API and does not require PostgreSQL. CI installs Chromium and runs every check above.

## Local identity API

The API now fails closed unless it has a PostgreSQL database with the identity migrations applied, an exact `APP_ORIGIN`, an internal edge-to-API `IDENTITY_SERVICE_SECRET`, and separate random CSRF and rate-limit secrets (each at least 32 bytes). Copy `.env.example` to `.env` for local development, set all three secrets in that ignored file, and point `DATABASE_URL` only at a disposable local database. Generate each value independently in a local terminal with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`; do not send the values in chat or commit them. The service secret is for the future server-side Cloudflare proxy only, never browser code. Identity routes also require the proxy-supplied `CF-Connecting-IP`; the API rejects calls without both the service credential and a valid trusted address.

Apply local migrations explicitly, then start the API:

```text
pnpm --filter @korre/api db:migrate
pnpm --filter @korre/api dev
```

The migration runner uses a PostgreSQL advisory lock, applies forward-only files in order, and refuses changed checksums for already-applied files. It does not run automatically at API startup. `pnpm dev` starts both the web and API processes and therefore requires the API settings above. To run only the browser preview while PostgreSQL is unavailable, use `pnpm --filter @korre/web dev`.

## Project context

- The execution plan and immutable status seed are in [`knowledge_base/execution`](knowledge_base/execution/README.md).
- Live implementation status and evidence are maintained under `execution_state/`.
- `knowledge_base/assets/` retains the reference material; historical references do not override current human decisions or the canonical contracts.
