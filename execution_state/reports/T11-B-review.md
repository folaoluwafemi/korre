# T11-B independent review

**Verdict: CHANGES_REQUIRED**

The service and routes satisfy the main identity boundaries on inspection: session values are random and stored as SHA-256 digests; the session token is cookie-only; recovery and CSRF values appear only in issuance/restore responses; logout checks session-bound CSRF; and recovery compares the normalized expected username and code hash in one transaction before consuming the code, revoking prior sessions, and inserting replacement credentials. Production cookie attributes use `__Host-korre_session`, `HttpOnly`, `Secure`, `SameSite=Lax`, and `Path=/`, with no `Domain`. Development uses a distinct insecure cookie and accepts only a loopback origin. Mutations enforce the configured exact Origin, JSON content type, a 4 KiB streamed-body cap, and exact object keys.

## Finding

- **P2 — Recovery input bounds return a different public failure and skip rate limiting.** In [identityRoutes.ts](../../apps/api/src/features/identity/http/identityRoutes.ts:265), well-formed recovery objects with a username longer than 24 characters or a code longer than 128 characters return `invalidRequest` directly. They never reach `IdentityService.recover`, whose invalid-username, malformed-code, wrong-code, and wrong-username paths return the generic `recoveryFailed` response and consume both recovery rate-limit buckets. These over-limit string values fit inside the overall 4 KiB body cap, so they are semantic recovery attempts rather than oversized requests. Map invalid recovery values to the same public recovery failure and ensure they consume the repository-backed limits; retain distinct errors for malformed JSON or an invalid object shape if desired.

## Review notes

- **Origin, body, and schema:** [identityRoutes.ts](../../apps/api/src/features/identity/http/identityRoutes.ts:136) rejects a supplied foreign Origin and requires exact Origin for non-GET requests. It rejects cross-site session GETs using Fetch Metadata. `boundedJson` caps streamed bytes before parsing; `exactKeys` rejects missing and unknown fields. There is no credentialed CORS setup in this route factory.
- **Credentials and cookies:** The session token is set only as a cookie and is omitted from JSON. Recovery code is returned at creation/recovery issuance, while session restore returns the public player and CSRF token. CSRF uses HMAC over the opaque session token and logout compares it with `timingSafeEqual`. The cookie mode is a required route dependency; app composition still must select production mode from trusted deployment configuration and mount no development route in production.
- **Recovery transaction:** [postgresIdentityRepository.ts](../../apps/api/src/features/identity/infrastructure/postgresIdentityRepository.ts:241) checks both the digest and normalized username within a transaction, consumes only an unconsumed matching code, revokes existing sessions, and inserts the replacement session and recovery digest before commit. Wrong username does not reach the consume update. Code and user values use SQL parameters. These SQL claims remain code inspection only because PostgreSQL cases did not run.
- **Rate limits and cleanup:** [identityService.ts](../../apps/api/src/features/identity/application/identityService.ts:163) HMACs address and lowercased username buckets with a configured secret. [postgresIdentityRepository.ts](../../apps/api/src/features/identity/infrastructure/postgresIdentityRepository.ts:63) sorts bucket locks, increments all buckets in one transaction with `ON CONFLICT`, caps stored attempts at six, and prunes at most 100 expired rows per call with `SKIP LOCKED`. The migration stores only bucket hashes and indexes expiry in [001_identity.sql](../../infrastructure/database/migrations/001_identity.sql:72).
- **Trust boundary:** The route factory receives both the mode and client-address lookup as dependencies, as required by the packet. The future composition root must provide a trusted client-address source and cannot allow request data to choose development mode. App wiring was outside this review.

## Checks

- `pnpm.cmd --filter @korre/api typecheck` — exit 0.
- `pnpm.cmd --filter @korre/api test` — exit 0; 4 files passed, 14 tests passed, 8 skipped.
- The 8 real-PostgreSQL cases are **NOT RUN**. They require both `IDENTITY_TEST_DATABASE_URL` and explicit `IDENTITY_TEST_DATABASE_ALLOW=1`; unit doubles do not prove SQL behavior.
- `pnpm.cmd lint` was not part of this review packet and was not run.

This review covers only T11-B. It does not accept parent T11: API composition/mounting and real PostgreSQL acceptance remain outside this packet and unverified.
