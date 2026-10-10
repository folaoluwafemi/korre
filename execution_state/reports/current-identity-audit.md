# Current identity/API/database audit

Recommendation: **CHANGES_REQUIRED before T11 acceptance**, with small migration repairs and real PostgreSQL acceptance evidence. No new confirmed credential-forgery or recovery-rotation flaw was found on source inspection. This review did not execute application code or connect to a database.

## Scope and evidence

Read root AGENTS, the relevant DECISIONS/CONTRACTS/TASKS/PLATFORM sections, all current API source and tests, both API scripts, migration 001, root/package test configuration, health integration test, README, current CI, and T11 original/repair reports. Previous T11 evidence recorded 22 tests passing and eight PostgreSQL tests skipped; those earlier results do not establish SQL behavior.

During this audit the coordinator added the current CI PostgreSQL 17 service, loopback `korre_test`, explicit test opt-in variables, and migration execution twice. These are prepared checks, not a missing-feature finding, and not an observed hosted pass. Railway credentials are unnecessary for disposable hosted database acceptance.

## Concrete implemented-code findings

1. **P2 — Migration checksums depend on checkout line endings.** `apps/api/scripts/migrate.mjs:55` hashes the raw UTF-8 SQL; lines 64–65 reject a different checksum. No `.gitattributes` currently fixes SQL checkout endings, and this checkout reports `core.autocrlf=true`. A Windows checkout can hash CRLF while Linux hashes LF for the same committed migration, preventing the second environment from recognizing the applied migration. Independent in-memory hashing of the current SQL produced LF SHA-256 `0bfd788977244b5d7480c5d6a1e4ac8633d64c2b174f5e48b6e335e06d3b731b` and equivalent CRLF SHA-256 `3f1985a890409ad9e0d3452bc7b73af97d9cf72f0e569743df9652450b1ccf93`. The current working SQL is LF; no already-applied database mismatch is claimed. Fix checkout determinism before first deployment; do not weaken checksum enforcement or silently rewrite existing migration history.
2. **P2 — Migration advisory-lock wait is unbounded.** `migrate.mjs:43` waits on `pg_advisory_lock`; the pool's 5-second connection timeout does not set a SQL lock or statement deadline. Another live session holding that lock can leave the migration process waiting indefinitely. A stuck migration can block deployment until an external job timeout kills it. Add bounded migration lock/query deadlines, retain failure exit status and cleanup, and prove the contention failure against disposable PostgreSQL. This is a control-flow finding; contention was not reproduced locally.
3. **P2 operational gap — Current health route cannot report database loss.** `apps/api/src/app.ts:22` returns unconditional `{status:'ok'}`; `index.ts:22` checks database/schema only at startup. If PostgreSQL becomes unavailable after startup, identity requests fail while the documented `/health` route continues returning 200. Keep a liveness endpoint if useful, but expose a distinct bounded readiness check wired to the actual database dependency and document which endpoint deployment uses. This is availability reporting, not an authentication bypass.

## Existing protections and limits

- Username parsing retains ASCII display spelling and lowercases the lookup key. Parameterized inserts plus a unique normalized-key constraint decide concurrent claims; the expected PostgreSQL constraint error maps to a public conflict. No availability precheck is used as authority.
- Sessions/recovery codes use random 32-byte secrets; only SHA-256 digests are passed to the repository. Session restore requires an unrevoked, unexpired row; username alone cannot authenticate. Production cookies have the required host-only, HttpOnly, Secure, Lax attributes; token values are omitted from JSON. Recovery codes are intentionally non-expiring one-use credentials under the current design, not forgotten session-expiry checks.
- Recovery locks the player first on both redemption and replacement paths, consumes the expected username/code, revokes old sessions, and inserts replacements in one transaction. Guarded consumption prevents replay; transaction rollback preserves the old credentials on replacement failure. No new source-level race defect was identified. Real concurrent and rollback behavior remains to be measured.
- Registration and recovery limits use HMAC bucket keys. Recovery lowercasing matches the accepted username policy; multi-bucket consumption sorts locks and commits all increments together. Expired pruning is bounded and uses SKIP LOCKED. Account-level limits can temporarily deny recovery after attempts from other addresses; this is the explicit D36 policy, not a new implementation defect.
- The API validates the server-only service credential before accepting trusted client-IP metadata. Origin/JSON/exact-key/4-KiB checks and logout's session-bound CSRF remain intact. The separately planned edge must strip/replace untrusted headers; its absence is not a T11 source bug.
- Migration files are sorted, serialized by an advisory lock, and each migration/history insert commits transactionally. Result/invitation tables are schema preparation; deferred ingestion, invitations, socket tickets, identity UI, and deployed edge behavior are not reported as implemented-code bugs.

## Required acceptance evidence still missing

The current repository suite installs migration SQL directly into a random schema (`identity.repository.test.ts:81`). It therefore does not exercise the actual migration runner, history/checksum verification, startup readiness, or HTTP/service/repository composition. `tests/integration/health.test.ts` supplies identity doubles and proves only in-memory app routing. The new CI service and twice-run migration step address initial application/reapplication and enable the eight real repository tests, but full HTTP-to-real-database acceptance and negative migration cases still need explicit coverage. Do not equate a green health smoke or skipped suite with those checks.

## Bounded repair packets

All checks below run on GitHub's disposable service, not this laptop. Keep each packet independently reviewed; coordinator owns shared workflow/configuration. Do not modify migration 001 after it is applied.

### A — Deterministic migration checkout (two paths)

Allowed writes: `.gitattributes`, `README.md`. Add an explicit LF rule for `infrastructure/database/migrations/*.sql` and document checksum/checkout requirements. Do not normalize unrelated files or rewrite historical registry values. Verify the committed migration blob is unchanged and a clean hosted checkout uses LF. CI checks: `git ls-files --eol infrastructure/database/migrations/001_identity.sql`, then the two existing `pnpm --filter @korre/api db:migrate` steps. No source or credential change is needed.

### B — Bounded migration execution and negative acceptance (three paths)

Allowed writes: `apps/api/scripts/migrate.mjs`, new `tests/integration/identity-migrations.test.ts`, `README.md`. Add explicit bounded advisory-lock/query handling with safe configuration validation and generic failure output. Test actual runner startup, twice-run idempotency, unchanged stored checksum/history count, concurrent serialization, held-lock timeout/nonzero exit, and rejection of changed SQL without extra committed history. Use an isolated temporary migration fixture/runner copy for tamper tests; never alter the repository's real migration or touch a non-test database. Capture child output without secrets; ensure child and database cleanup even on failure. CI checks: `node --check apps/api/scripts/migrate.mjs`; `pnpm exec vitest run --config vitest.integration.config.ts tests/integration/identity-migrations.test.ts`; then `pnpm verify` and `pnpm test:integration` after independent source review. The tests may need a deliberately longer bounded hook timeout than ordinary unit tests; record it explicitly.

### C — Real PostgreSQL identity HTTP acceptance (two paths)

Allowed writes: new `tests/integration/identity.test.ts`, `apps/api/src/features/identity/identity.repository.test.ts`. Construct the real repository, service, and `createApiApp` against a uniquely named test schema in the explicitly opted-in loopback `_test` database. Fail if database acceptance is required but its URL/authorization is absent; retain optional local skips outside that required mode. Exercise HTTP claim → cookie restore → wrong CSRF/logout rejection → successful logout → recovery → old-cookie revocation → rotated recovery-code reuse rejection; wrong username must not consume the code. Verify raw session secrets never appear in JSON/SQL rows, production cookie attributes, actual rate-limit exhaustion and expiry, and concurrent case-insensitive claim. Add concurrent reversed-order two-bucket limit calls and replacement-versus-redemption recovery coverage using real PostgreSQL. Avoid mocks as database evidence. CI checks: `pnpm --filter @korre/api test` (all eight existing DB cases execute, zero DB skips); `pnpm exec vitest run --config vitest.integration.config.ts tests/integration/identity.test.ts`; `pnpm test:integration`; `pnpm verify`. CI must pass the explicit required-database mode selected by this packet, so missing service variables cannot silently skip acceptance.

The coordinator explicitly defers a new readiness feature. Keep finding 3 as an operational limitation for later deployment review; it does not block the focused real database/HTTP acceptance work. Do not implement a new endpoint under this audit. Next priority is the coordinator's bounded `tests/integration/identity.test.ts` packet and, if needed, a separately authorized two-file migration-runner test packet.

Before accepting T11, save a parent implementation report and independent final review citing the actual hosted run/SHA, migration results, zero skipped required DB cases, real HTTP identity checks, and remaining deployed-edge/UI limits. Full staging/online acceptance remains in its later tasks.

## Review execution limits

Read-only file/diff/config inspection completed; an in-memory Python hash comparison exited 0. No database connection, migration application, application test, local build, typecheck, lint, formatter, server, or service was run. No source/shared record was edited; this report is the sole write. Proposed checks are not claimed passed.
