# Identity cleanup and hosted runtime review

**Initial run-22 review:** Source verdict PASS for the bounded test-helper and cleanup repair; hosted evidence was incomplete. The follow-up below records the full run-23 artifact and supersedes that evidence status. This was a read-only review. I ran no local tests, builds, installs, formatter, server, or database commands.

## Source review at `248273daffa6a8246609f064dc4f397461a7437b`

- `identity.http-postgres.test.ts` wraps `app.request(...)` in `Promise.resolve`, so its helper consistently returns `Promise<Response>` whether the pinned Hono method returns a response directly or a promise. It still exercises `createApiApp`, `IdentityService`, and the real `PostgresIdentityRepository`; no database mock establishes these cases.
- The HTTP suite cleanup independently attempts to close the test pool, drop only a schema matching its generated `cb_http_test_<32 hex>` form, and close the admin pool. It collects failures and raises an `AggregateError` only after attempting the remaining cleanup. A failed pool close or schema drop therefore does not skip closing the admin pool.
- The migration suite's `afterEach` similarly attempts pool close, drops only a validated generated schema, and removes a temp directory only when its resolved parent and generated prefix match. It records errors and continues through remaining cleanup. `afterAll` closes the admin pool. The advisory-lock case retains a nested `finally` only to guarantee `holder.release()` even if unlock fails; the following hook closes the pool. This is safe cleanup control flow, not a throwing `finally` that bypasses later cleanup.
- The child migrator has a 12-second kill deadline and a 1 MiB output cap. It captures stdout/stderr for assertions rather than printing them. I found no test `console.log`/`console.error` path that emits session or recovery credentials. The HTTP suite uses random in-memory secrets and checks that a session token is absent from response JSON.

The review is limited to the new HTTP and migration harnesses. It does not independently re-review the production identity service or authorize a real Railway database.

## Hosted evidence observed

The [GitHub run](https://github.com/folaoluwafemi/korre/actions/runs/38047543611) is for the reviewed SHA and ended **failure** overall.

- The disposable PostgreSQL migration step ran `pnpm --filter @korre/api db:migrate` twice. Each invocation logged `Verified 1 forward-only migration(s).` The job used the explicitly opted-in loopback test database; the credential in the run log is masked.
- The `Verify` step is marked successful. The visible log includes `identity.repository.test.ts` with 10 tests and `identity.http-postgres.test.ts` with 2 tests. The repository file has two pure username-policy tests and eight tests inside the real-PostgreSQL suite; CI sets the opt-in variables, and the visible database HTTP suite passed.
- The retrieved verification log stops in repeated Babylon NullEngine output. It has no final Vitest summary and no visible `migrations.test.ts` case line. Therefore I cannot verify the requested exact total, that all five migration-runner cases executed, or a zero-skipped count from this run. Do not infer those counts from source definitions or from the successful Verify-step status alone. Capture and review the full verification artifact on a fresh run before using those claims for T11 acceptance.
- `pnpm test:integration` logged one passing health test; that is not identity/PostgreSQL evidence. The browser E2E step ran four tests, with two passes and two failures: mobile preview camera interaction (`counterball-preview.spec.ts:186`, failing at line 355) and WebGL failure/context-loss recovery (line 363, failing at line 387). These are preview tests outside T11. They make this workflow run red but do not indicate an identity regression.

The coordinator's pending `.github/workflows/ci.yml` diff pipes `pnpm verify` through `tee .artifacts/verify.log` with `set -o pipefail`, then uploads the file under an `if: always()` step. By inspection this preserves the command's failure status while retaining full output when checks fail. The new capture has not yet run on GitHub, so it supplies no additional verification evidence yet.

## Historical T11 status after run 22

`execution_state/tasks.json` still marks T11 `RUNNING`, with no parent implementation or review report recorded. The current task plan requires real database checks for concurrent normalized-name claims, SQL-looking input, session expiry/revocation, name-only rejection, recovery use/rotation, and migration forward/rollback compatibility. This run shows useful disposable-PostgreSQL evidence for the migration's twice-run application and for the visible repository and HTTP suites. Its truncated verification output does not prove the exact full suite or zero skips, and the five migration-runner tests have no visible per-file result. T11 should remain unaccepted until the full captured log resolves those points and the coordinator records the parent implementation evidence and independent parent review.

T12's identity UI, T13's deployed edge proxy, Railway deployment, and browser/mobile preview failures are separate scopes; this review does not claim them complete or use them as a substitute for T11 database evidence.

## Follow-up: full run-23 verification artifact

**Independent T11 review verdict: PASS for the T11 PostgreSQL identity, migration, and API scope.** The coordinator will record final T11 acceptance after the integrated browser check is green. This review does not accept T12 or T13 and does not change runtime status itself.

Run [38056114718](https://github.com/folaoluwafemi/korre/actions/runs/38056114718) used commit `fadb7a3c5bf3fd624d37f80fd54dbcb60f8da446`. Its uploaded local evidence is `.artifacts/run23-verification/verify.log`. The full `pnpm verify` log records all workspace typechecks, ESLint, Prettier, unit/integration-style tests, and workspace builds succeeding. Vitest reports **24 test files passed and 98 tests passed**, with no skipped tests. The three identity/PostgreSQL suites report:

- `identity.repository.test.ts`: 10 passed; two pure username-policy checks and eight opted-in real-PostgreSQL cases.
- `identity.http-postgres.test.ts`: 2 passed against the real disposable PostgreSQL service through the actual Hono app, identity service, and repository.
- `migrations.test.ts`: 5 passed against the real disposable PostgreSQL service and actual child-process migration runner.

The CI job sets the explicit database opt-in and a loopback `korre_test` URL. The separate workflow step applied/rechecked the actual additive migration twice; both invocations logged `Verified 1 forward-only migration(s).` No local or Railway database was accessed.

The T11 acceptance criteria are supported by the code and these executed cases: PostgreSQL's normalized-name unique constraint decides concurrent claims; parameterized repository queries avoid SQL interpretation; sessions store token hashes and enforce expiry/revocation; usernames alone do not restore sessions; recovery is scoped to the normalized expected username, consumed once, rotated with session revocation in a transaction; and HMAC rate-limit buckets persist/expire without storing raw IPs or usernames. The HTTP cases also cover production host-cookie attributes, cookie restore, CSRF/logout, and recovery replay/rotation. Source inspection confirms the API requires server-side service auth before accepting validated `CF-Connecting-IP`, fails startup when required environment/schema configuration is missing, and the migrator takes an advisory lock, verifies stable checksums, applies each migration/history row transactionally, and closes its pool/client on exit. The five runner tests cover reapplication, LF/CRLF history, changed/corrupt checksums, invalid-SQL rollback, and bounded lock contention/recovery.

The GitHub run is still **red overall** because the separate preview E2E step had three passes and one failure: WebGL startup/context-loss cleanup expected zero `resizeListeners` but observed one (`tests/e2e/counterball-preview.spec.ts:369`, assertion at line 412). This is outside T11 and does not invalidate the successful API/PostgreSQL verification. Keep the preview failure tracked in its own task.

The API source is unchanged between the previously reviewed repair commit `248273daffa6a8246609f064dc4f397461a7437b` and run-23 commit `fadb7a3c5bf3fd624d37f80fd54dbcb60f8da446`. At report time, `execution_state/tasks.json` still lists T11 as RUNNING and has no parent implementation report; coordinator-owned status/report bookkeeping is the remaining step to record this PASS.

### Scope and rollback notes

The migration only adds identity/result/inbox/rate-limit tables, indexes, and constraints; it does not alter or drop pre-existing application tables. That supports application-code rollback compatibility by source review. The five PostgreSQL migrator tests prove transaction rollback for invalid SQL, but they do not boot a prior application binary against the migrated schema, so this report does not claim a binary rollback rehearsal. The platform's later socket-ticket table is not in migration 001 and must be added by the appropriate later task before socket authentication uses it. Likewise, this T11 verdict does not prove a deployed edge strips forged `CF-Connecting-IP` headers; that remains T13 work.

## Coordinator parent implementation report review

**Review verdict: PASS for `execution_state/reports/T11-hosted-implementation.md`.** Its reported run ID and SHA match the GitHub metadata; its 24-file/98-test, zero-skip counts and the 10 repository, 2 HTTP, and 5 migration-suite counts match the full run-23 artifact. The twice-applied migration result, all-workspace `pnpm verify` result, one passing integration smoke, and 3-pass/1-fail E2E status are consistent with the run logs. The report keeps the WebGL failure outside the T11 API/database result and explicitly limits application rollback compatibility to additive-schema inspection rather than claiming an old-binary rehearsal. I found no unsupported T11 evidence claim or correction to request.

The current task record remains `RUNNING` pending the coordinator's planned integrated browser-green status transition. That sequencing does not leave a T11-specific source or database acceptance finding open.
