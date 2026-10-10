# T11 parent repair 1 independent re-review

**Verdict: PASS for the narrow API trust-boundary repair.** This does not accept parent T11.

The API now requires a configured service secret of at least 32 bytes and constructs the app with it. The `/api/v1/*` middleware compares the exact `Authorization: Bearer …` value with `timingSafeEqual` after a length check, before identity handlers run ([config.ts](../../apps/api/src/config.ts:63), [app.ts](../../apps/api/src/app.ts:12)). Missing or incorrect service credentials are rejected. Only after service authentication does the middleware read `CF-Connecting-IP`, validate it with Node's `isIP`, and continue; it does not use `X-Forwarded-For` or a TCP-peer fallback. The production composition passes that validated field through the identity route's client-address dependency, so the service rate limiter receives the proxy-supplied client address ([index.ts](../../apps/api/src/index.ts:38)).

The tests cover all required boundary cases: `/health` remains available without service credentials; a forged `CF-Connecting-IP` without the service credential is denied before the identity service runs; authenticated requests with missing or list-shaped/invalid client metadata are rejected; and an authenticated request with a valid address reaches the identity service with that address ([app.test.ts](../../apps/api/src/app.test.ts:44)). The `.env.example` and README describe the edge-to-API secret as server-side only and state that it must not be exposed to browser code. This establishes the API-side trust boundary; it does not prove that a deployed Cloudflare proxy strips incoming credentials/metadata and sets these values correctly. T13's actual edge proxy remains separate work.

## Checks

- `pnpm.cmd --filter @korre/api typecheck` — exit 0.
- `pnpm.cmd --filter @korre/api test` — exit 0; 5 files passed, 22 tests passed, 8 skipped.
- `pnpm.cmd exec prettier --check apps/api/src/app.ts apps/api/src/app.test.ts apps/api/src/config.ts apps/api/src/config.test.ts apps/api/src/index.ts apps/api/scripts/migrate.mjs tests/integration/health.test.ts README.md` — exit 0; all matched files pass.
- `git diff --check` — exit 0.
- The 8 PostgreSQL-dependent repository tests are **SKIPPED / NOT RUN**. I did not connect to a database or apply migrations. The service-auth boundary and these local tests do not prove database behavior or accept parent T11.

This review is limited to coordinator repair 1's API trust boundary. It does not claim a deployed edge proxy, PostgreSQL acceptance, identity UI integration, or parent T11 completion.
