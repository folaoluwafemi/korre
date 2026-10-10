# Identity cleanup and hosted runtime review

**Source verdict: PASS for the bounded test-helper and cleanup repair. Hosted evidence: INCOMPLETE for exact zero-skip and migration-suite counts. Parent T11 remains RUNNING.** This was a read-only review. I ran no local tests, builds, installs, formatter, server, or database commands.

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

## T11 acceptance status

`execution_state/tasks.json` still marks T11 `RUNNING`, with no parent implementation or review report recorded. The current task plan requires real database checks for concurrent normalized-name claims, SQL-looking input, session expiry/revocation, name-only rejection, recovery use/rotation, and migration forward/rollback compatibility. This run shows useful disposable-PostgreSQL evidence for the migration's twice-run application and for the visible repository and HTTP suites. Its truncated verification output does not prove the exact full suite or zero skips, and the five migration-runner tests have no visible per-file result. T11 should remain unaccepted until the full captured log resolves those points and the coordinator records the parent implementation evidence and independent parent review.

T12's identity UI, T13's deployed edge proxy, Railway deployment, and browser/mobile preview failures are separate scopes; this review does not claim them complete or use them as a substitute for T11 database evidence.
