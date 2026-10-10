# T11 coordinator-level independent review

**Verdict: CHANGES_REQUIRED**

The composition, identity routes/service, repository, migration, and migration runner are otherwise coherent on code inspection. The API mounts the health and identity routes, requires database/schema and secret configuration before serving, does not select the development cookie unless configured as development, and closes the server before ending the pool on shutdown. The routes enforce exact-origin checks on mutations, JSON and exact object shapes, a streamed 4 KiB cap, no-store responses, production `__Host-` cookie attributes, and session-bound CSRF for logout. Credential digests and parameterized queries are used; recovery checks the expected normalized username and consumes/rotates credentials transactionally. The runner sorts migration names, serializes runners with a PostgreSQL advisory lock, verifies SHA-256 checksums, and applies each migration and history row in one transaction.

## Finding

- **P2 — The configured rate-limit address is the TCP peer, not necessarily the client.** [index.ts](../../apps/api/src/index.ts:43) supplies `getConnInfo(context).remote.address` to the identity routes. The pinned `@hono/node-server` helper reads `incoming.socket.remoteAddress`, so this is the immediate network peer. The deployment plan routes browser traffic through Cloudflare to the Railway API and says the edge should send trusted request metadata ([PLATFORM.md](../../knowledge_base/execution/PLATFORM.md:7), [PLATFORM.md](../../knowledge_base/execution/PLATFORM.md:93)). With that proxy path, the API sees the proxy hop rather than each browser's address. Registration and recovery limits can therefore be shared by unrelated users, causing one user's attempts to exhaust another user's allowance; the per-client limit also does not reliably identify a client. Wire a client address from a trusted proxy field only after the edge overwrites/removes caller-supplied copies and the API verifies the trusted path/credential. Do not treat arbitrary `X-Forwarded-For` as trusted input.

## Checks

- `pnpm.cmd --filter @korre/api typecheck` — exit 0.
- `pnpm.cmd --filter @korre/api test` — exit 0; 5 files passed, 19 tests passed, 8 skipped.
- `node --check apps/api/scripts/migrate.mjs` — exit 0.
- `pnpm.cmd exec prettier --check apps/api/src apps/api/scripts/migrate.mjs` — exit 0; all matched files pass.
- The 8 tests requiring explicitly authorized disposable PostgreSQL are **SKIPPED / NOT RUN**. I did not connect to a database. The skipped cases cover real migration/repository behavior, including concurrent claims, expiry/revocation, recovery transactions, and durable rate limits; mocks and source inspection do not replace this proof.

The available T11 reports include the T11-B finding and its repair re-review; no parent `T11-implementation.md` report was present at review time. T11 cannot be ACCEPTED regardless of this local review until the trusted client-address wiring is resolved, the parent implementation evidence is recorded, and the 8 PostgreSQL checks pass against an explicitly authorized disposable database. This review does not change task status.
