# T11-B repair 1 independent re-review

**Verdict: PASS**

The repair closes the reviewed recovery-boundary gap. The route now checks the exact recovery object shape and string types, then passes any such strings within the existing streamed 4 KiB request bound to `IdentityService.recover` ([identityRoutes.ts](../../apps/api/src/features/identity/http/identityRoutes.ts:262)). It no longer rejects over-policy username or code lengths before the service can apply its generic recovery behavior.

The route tests cover both a 25-character username and a 129-character code. They verify each reaches the service, returns the same generic `recoveryFailed` response, and sets no session cookie ([identity.routes.test.ts](../../apps/api/src/features/identity/identity.routes.test.ts:161)). Separate tests retain `invalidRequest` for non-string, missing, and extra fields, and `requestTooLarge` for a body beyond the byte cap; the service is not called for these inputs ([identity.routes.test.ts](../../apps/api/src/features/identity/identity.routes.test.ts:186)).

The service rate-limits both the IP and account buckets before parsing the username or checking the code length ([identityService.ts](../../apps/api/src/features/identity/application/identityService.ts:163)). The new service test confirms over-policy username and code cases consume both hashed buckets before returning the generic failure, do not reach code redemption, and return `rateLimited` when the repository denies the buckets ([identity.service.test.ts](../../apps/api/src/features/identity/identity.service.test.ts:123)). This preserves generic public failure behavior while bounding request work and keeping raw credentials/address out of the rate-limit bucket data.

## Checks

- `pnpm.cmd --filter @korre/api typecheck` — exit 0.
- `pnpm.cmd --filter @korre/api test` — exit 0; 5 files passed, 19 tests passed, 8 skipped.
- `pnpm.cmd exec prettier --check apps/api/src/features/identity/http/identityRoutes.ts apps/api/src/features/identity/identity.routes.test.ts apps/api/src/features/identity/identity.service.test.ts` — exit 0; all matched files pass.
- The 8 PostgreSQL integration checks are **NOT RUN**; this review does not claim database proof.

This is a re-review of packet T11-B repair 1 only. It does not accept parent T11; app composition and real PostgreSQL acceptance remain outside this packet.
