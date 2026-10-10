# T11 identity and PostgreSQL — parent implementation evidence

The identity service, repository, HTTP composition, additive migration and bounded migration runner are implemented. This report records real GitHub-hosted PostgreSQL checks, not deployment or identity UI completion.

## Working API behavior

Claiming a normalized unique username creates a stable player ID and a secret session, with the token placed in a host-only secure HttpOnly cookie rather than JSON. Concurrent case-insensitive claims have one winner. Session hashes, expiry and revocation authenticate players; a username alone cannot log in. One-use recovery is bound to the expected username, rotates credentials and revokes earlier sessions atomically. Parameterized queries and keyed persistent rate limits protect the repository. Exact request shapes, size/origin checks, internal service authentication, trusted-address validation and session-bound logout CSRF remain enforced.

Migration 001 adds tables/indexes/constraints without modifying prior tables. The runner serializes migration application, bounds lock/query waits, verifies canonical checksums while retaining equivalent LF/CRLF history, and commits each migration plus history entry transactionally. It refuses real content changes, exits safely on contention, and can recover on a later attempt. No down migration or automatic production migration is added.

## Checks actually run

[GitHub run 38056114718](https://github.com/folaoluwafemi/korre/actions/runs/38056114718), commit `fadb7a3c5bf3fd624d37f80fd54dbcb60f8da446`, used disposable PostgreSQL 17 at explicitly opted-in loopback `korre_test`.

- Frozen dependency install passed.
- Actual migration application and repeat verification passed; each invocation reported one verified forward-only migration.
- `pnpm verify` passed typechecks, ESLint, Prettier, all 24 test files/98 tests with zero skips, and all workspace builds. Complete output is retained as `counterball-verification-log` and locally under ignored `.artifacts/run23-verification/verify.log`.
- Real database coverage: eight repository cases (plus two pure username-policy cases), two actual Hono/service/repository HTTP cases, and five child-runner migration cases. These cover race-safe claims, SQL-looking inputs, session expiry/revocation, one-use recovery/rollback, persisted rate limits, HTTP cookie/CSRF/logout, checksum/history/idempotence, invalid SQL rollback and bounded lock contention/recovery.
- `pnpm test:integration` passed its one health/boundary smoke. This alone is not database proof.
- The workflow as a whole failed one preview WebGL cleanup test; the other three browser tests passed. That independent presentation defect remains tracked and is not reported as an API/database failure or a fully green pipeline.

Independent source reviews are `T11-B-review-repair-1.md`, `T11-parent-review-repair-1.md`, `current-identity-review.md`; the current repairs and full real database evidence have independent PASS in `current-identity-runtime-review.md`. The API source is unchanged after the reviewed cleanup/type repairs at `248273d`.

## Limits

No Railway deployment, external database migration or Cloudflare proxy was exercised. T12 identity UI/browser cookies and T13 actual edge trust-boundary behavior are separate tasks. `/health` is liveness, not ongoing database readiness. Transactional invalid-SQL rollback was executed; compatibility with earlier code is supported by additive-schema inspection, without a prior-binary boot rehearsal. No local database, application build or test was run for this review.
