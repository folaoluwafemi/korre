# T11 parent repair 1 — authenticate the edge proxy and trusted client address

Coordinator/author: `/root`. Independent reviewer: `/root/toolchain_audit`.

## Finding

The independent parent review at `execution_state/reports/T11-parent-review.md` returned `CHANGES_REQUIRED`: `apps/api/src/index.ts` passed the Railway TCP peer address to the identity rate limiter. Under the planned Cloudflare-to-Railway proxy, that may be the proxy address shared by every player. `knowledge_base/execution/PLATFORM.md` section 9 requires the edge to strip caller-supplied forwarded identity/secret headers, send `IDENTITY_SERVICE_SECRET` and trusted request metadata, and Railway to reject calls without that credential.

## Result

Require a sufficiently long `IDENTITY_SERVICE_SECRET` at API startup. Protect every `/api/v1/*` identity route with a constant-time comparison of an exact internal bearer credential. After successful service authentication, require and validate `CF-Connecting-IP` as an IP address, and use only this trusted proxy-supplied value as the identity rate-limit address. Do not accept `X-Forwarded-For`, browser `Authorization`, or a TCP-peer fallback. Keep the unauthenticated health route non-sensitive and available for readiness probes.

Update local setup instructions to make clear this is an API-to-edge secret; the secret must be supplied only by server-side configuration and must never be exposed to the browser. Tests must show a request without the internal credential is denied even when it forges `CF-Connecting-IP`; authenticated calls with invalid/missing client metadata are denied; authenticated valid requests reach the identity service with the forwarded client address; health remains non-sensitive. Preserve exact-origin, CSRF, bounded body, and durable HMAC rate-limit behavior.

This repair implements only the API trust boundary. It does not implement T13's Cloudflare proxy, choose deployment credentials, create a remote secret, connect to a database, apply migrations, or claim PostgreSQL acceptance.

## Exact write paths

- `apps/api/src/app.ts`
- `apps/api/src/app.test.ts`
- `apps/api/src/config.ts`
- `apps/api/src/config.test.ts`
- `apps/api/src/index.ts`
- `apps/api/scripts/migrate.mjs`
- `tests/integration/health.test.ts`
- `.env.example`
- `README.md`

Coordinator owns all listed paths. The identity worker has stopped writing T11-B files. Reviewer may read these paths and write only `execution_state/reports/T11-parent-review-repair-1.md`.

## Required checks

Run each from `C:\Users\USER\StudioProjects\korre` separately:

1. `pnpm.cmd --filter @korre/api typecheck`
2. `pnpm.cmd --filter @korre/api test`
3. `pnpm.cmd exec prettier --check apps/api/src/app.ts apps/api/src/app.test.ts apps/api/src/config.ts apps/api/src/config.test.ts apps/api/src/index.ts apps/api/scripts/migrate.mjs tests/integration/health.test.ts README.md`
4. `git diff --check`

Record the existing eight PostgreSQL tests as SKIPPED/NOT RUN unless a safe, explicitly authorized disposable Postgres service actually becomes available. This review or these local checks cannot accept parent T11.

## Bounded repair

This is coordinator repair 1. Do not broaden the identity contract or alter gameplay/shared protocol. If a trusted metadata path cannot be made fail-closed without violating the plan, stop, preserve the source and report the smallest unresolved decision.
