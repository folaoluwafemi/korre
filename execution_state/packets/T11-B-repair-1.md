# T11-B repair 1 — keep recovery failure generic and rate limited

Coordinator: `/root`. Implementer: `/root/swarm_review`. Independent reviewer: `/root/toolchain_audit` after repair. Parent dependency: T01 is `ACCEPTED`; T11 remains `RUNNING`.

## Review finding

`execution_state/reports/T11-B-review.md` found that a recovery request with a string username longer than 24 characters or code longer than 128 characters is rejected by the HTTP route as `invalidRequest` before `IdentityService.recover` can consume its IP/account rate-limit buckets or return the generic `recoveryFailed` outcome. This distinguishes invalid recovery credentials and permits rate-limit bypasses with syntactically valid requests.

## Exact write paths

- `apps/api/src/features/identity/http/identityRoutes.ts`
- `apps/api/src/features/identity/identity.routes.test.ts`
- `apps/api/src/features/identity/identity.service.test.ts`

Do not edit repository code, migration, app composition, manifests, contracts, reports, task state, or any unlisted path. Do not change the 4 KiB request limit, exact JSON object shape, field types, registration length policy, or database claims. Do not spawn agents.

## Required repair

For a recovery object with exactly string `username` and `code` fields, pass bounded-by-request-size values to the service even when either value exceeds its semantic credential length. The service must consume the configured keyed rate-limit bucket(s) before parsing/validating these values and return the same generic recovery failure for invalid username/code. Non-string values and unknown/missing keys remain `invalidRequest`; over-4-KiB bodies remain `requestTooLarge`.

Add route tests for over-policy username and code values proving the service handles them and the public response is the generic recovery failure. Add service tests proving an invalid over-policy recovery request consumes IP/account rate-limit buckets before returning that same generic error. Keep credentials out of responses and logs.

## Checks and stop condition

Run one command at a time from the workspace root:

1. `pnpm.cmd --filter @korre/api typecheck`
2. `pnpm.cmd --filter @korre/api test`
3. `pnpm.cmd exec prettier --check apps/api/src/features/identity/http/identityRoutes.ts apps/api/src/features/identity/identity.routes.test.ts apps/api/src/features/identity/identity.service.test.ts`

Maximum two focused repairs for a repeated failure. Report exact changed paths and exits to the coordinator. Stop for independent re-review; do not write the parent T11 implementation report or change status.
