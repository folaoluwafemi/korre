# Korre / Counterball

Korre is the platform; Counterball is the first game. This repository is the pnpm TypeScript monorepo for the web client, API, Cloudflare realtime worker, shared packages, and game runtime.

The current build includes a real WebGL pitch preview at `/preview`, with seven caps per side and a four-hole plastic button. Counterball is **not playable yet**: physics diagnostics and the identity API exist, but the canonical shot runner, flick controls, rules, AI, and online matches remain unfinished. The game must use the shared rules and physics packages for local and online play.

## Try the remotely built preview

GitHub CI builds the browser and tests the built files. To try a passing build without installing dependencies or compiling on your laptop, download its `counterball-browser-preview` artifact:

```text
gh run download <passing-run-id> --name counterball-browser-preview --dir .artifacts/browser-preview
node scripts/serve-preview.mjs
```

Open <http://127.0.0.1:4173/preview>. This lightweight local server serves the existing built files only. Press Ctrl+C to stop. The preview needs WebGL; it does not need a database, Railway, or Wrangler. It is a scene inspection, not an AI or online match. Use the camera controls to inspect the pieces and the button holes.

## Requirements

- Node.js 24.21.0 (see `.node-version`)
- pnpm 10.33.0
- For browser tests, the Playwright Chromium browser
- PostgreSQL is required to run the identity API; CI supplies a disposable database for its tests. The static browser preview needs no database.

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

`pnpm verify` runs typecheck, lint, unit tests, and all workspace builds. Integration and browser checks are separate so their results stay visible. CI provisions an isolated disposable PostgreSQL service, explicitly enables the real database tests, applies migrations twice, and tests the built browser files with Chromium. No Railway database is touched. Local database tests are skipped unless `IDENTITY_TEST_DATABASE_URL` points at an explicitly opted-in loopback database ending in `_test` and `IDENTITY_TEST_DATABASE_ALLOW=1`.

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
