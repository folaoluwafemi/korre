# Current identity improvement — implementation

Implemented the bounded three-file packet. No local application checks or database/service execution ran; independent review and GitHub verification remain pending.

## Exact source changes

- `apps/api/scripts/migrate.mjs`: sets a 5-second SQL lock timeout and a 30-second statement timeout before acquiring the existing advisory lock. Hashes and applies canonical LF SQL. Existing stored checksums are accepted only when they match the same content's LF or CRLF bytes; actual content changes still fail. Applied history is preserved. Exports `migrate` for isolated child-process acceptance tests; direct script execution retains the existing entry point, generic failure output, nonzero exit, and pool/lock cleanup. Importing the module does not start a migration.
- `apps/api/src/features/identity/identity.http-postgres.test.ts`: two tests compose the real API, IdentityService, and PostgresIdentityRepository in a fresh random schema. Covers claim, case-insensitive HTTP conflict and concurrent race, secure cookie attributes, cookie restoration, name-only rejection, incorrect logout CSRF, wrong-name recovery without consumption, one-use recovery and replay denial, session/recovery rotation, old-session revocation, hashed session persistence, correct logout, and post-logout denial. No doubles establish database behavior. This uses in-memory HTTP handling against real PostgreSQL; it does not prove deployed proxy or browser cookie behavior.
- `apps/api/src/migrations.test.ts`: five tests launch the actual migration module in bounded child processes with schema-isolating PGOPTIONS. Covers actual migration twice/unchanged history, equivalent legacy CRLF checksum acceptance without rewriting history, changed source rejection, corrupted history rejection, invalid SQL rollback without history/table commit, and advisory-lock contention failing within a bounded deadline followed by recovery after release. Temporary SQL fixtures are isolated; the repository migration is never changed.

Both new suites require explicit `IDENTITY_TEST_DATABASE_URL` and `IDENTITY_TEST_DATABASE_ALLOW=1`, reject non-PostgreSQL/non-loopback/non-`_test` URLs and query/fragment overrides before suite execution, and throw in CI rather than silently skipping when authorization/configuration is absent. Each suite uses independent random schemas; migration cases additionally use a fresh schema per test. Cleanup verifies its generated schema/temporary-directory target and closes owned pools. Child output is captured rather than printed; credential-bearing assertions compare booleans/statuses/digests instead of displaying raw session/recovery secrets.

## Required checks — NOT RUN

The coordinator will execute on GitHub's opted-in disposable PostgreSQL service:

1. `pnpm --filter @korre/api db:migrate` twice against the disposable database.
2. `pnpm verify`, including all eight existing real repository cases and seven new real database cases. Required DB cases must execute without skips.
3. `pnpm test:integration`.
4. `pnpm test:e2e --workers=1`, plus the coordinator's built browser artifact evidence.

No test, typecheck, lint, formatter, build, migration application, database connection, or local server was run by this worker. Therefore no exit codes or runtime PASS results are claimed. Source edits and read-only inspection are the only implementation evidence at handoff. The coordinator's `.gitattributes` and workflow edits are outside this worker's ownership.

## Limits and handoff

This packet does not add readiness endpoints, expand repository race coverage beyond the existing acceptance scope, implement identity UI/edge services, use Railway, or accept T11. Preserve the existing migration's committed content and wait for independent review followed by hosted execution. Any hosted type/lint/format/test failure requires a bounded repair with the actual evidence; do not fabricate results or treat a skipped database suite as acceptance.

Only the three listed implementation paths and this report were written. No task/ledger/status records were modified.
