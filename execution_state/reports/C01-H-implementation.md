# C01-H implementation report

## Scope

Implemented the coordinator-owned browser routing and Node config checks in the
five assigned paths: `apps/web/tsconfig.server.json`, `package.json`,
`playwright.config.ts`, `.github/workflows/ci.yml`, and `vitest.config.ts`.
No game rules, physics, UI, identity service, or online service implementation
was changed.

## Suite and artifact routing

The default Playwright config selects only the two existing production static
regressions: `tests/e2e/home.spec.ts` and
`tests/e2e/counterball-preview.spec.ts`. It checks every discovered `.spec.ts`
against a reviewed filename catalogue and throws on an unmapped file, so a new
browser test cannot disappear into an unrelated suite.

`COUNTERBALL_DEV_E2E=1` selects only the local diagnostic catalogue and starts
the static server on `apps/web/dist-dev`. It takes precedence over
`COUNTERBALL_PREBUILT_PREVIEW=1`; the static server has no Vite or production
fallback, and local reuse is disabled for either prebuilt mode. Production
prebuilt mode selects `apps/web/dist`. Diagnostic JSON results use a separate
path, and browser retries are disabled so a retry cannot hide a failing case.

The exact local diagnostic candidates are `counterball-direct-probe.spec.ts`,
`counterball-physics.spec.ts`, `local-flick.spec.ts`, `local-restart.spec.ts`,
`local-match.spec.ts`, and `counterball-cinematic.spec.ts`. The direct probe is
owned by T02-BR02. The other names come from their respective local packet
records. The catalogues contain no separate hotseat spec; T09-R02 owns the
local first-to-three/rematch browser spec. GitHub checks the packet ledger and
the corresponding source files, then invokes Playwright with the exact
produced diagnostic filenames. An implemented/reviewed/verified/accepted
producer whose file is absent fails the preflight. When no local diagnostic
producer exists, CI records that fact and does not issue an empty test command.

Identity-service filenames (`identity-gate.spec.ts`,
`identity-ai-gate.spec.ts`) are recognized but excluded from this config; O04
owns their API/Vite/proxy/guarded-PostgreSQL config. Online-service filenames
(`online-recovery.spec.ts`, `online-match.spec.ts`, `private-room.spec.ts`,
`invitations.spec.ts`, `casual-match.spec.ts`, `online-cinematic.spec.ts`, and
`security-reliability.spec.ts`) are also recognized but excluded; O19 owns
their authenticated staging config. The C01-H config does not start or imply
either service.

The Node type project includes the existing web Vite config, API startup
config, root Playwright/Vitest configs, and the explicit future
`apps/web/server/**/*.ts` source discovery. Root `typecheck` runs that project.
Node Vitest explicitly includes `apps/web/server/**/*.test.{ts,tsx}` and
excludes both `.worker.test.*` and `.workers.test.*` files.

CI retains the production prebuilt E2E command and separately builds/packages
the diagnostic artifact with provenance before running any produced local
diagnostic tests. Identity and online suites remain assigned to their later
service-aware cards. The exact CI commands owned by C01-H remain:

```text
pnpm verify
COUNTERBALL_PREBUILT_PREVIEW=1 pnpm test:e2e --workers=1
```

The diagnostic command is assembled from the exact existing packet-to-filename
map in CI and runs only when at least one mapped local spec has been produced:

```text
COUNTERBALL_DEV_E2E=1 COUNTERBALL_PREBUILT_PREVIEW=1 pnpm test:e2e <produced local spec files> --workers=1
```

## Checks and limits

- `node scripts/check-completion-plan.mjs --packet C01-H`: PASS (document and
  dependency check only).
- `git diff --check`: PASS.
- Ran the already-installed Prettier only on the five owned configuration
  files; it changed `playwright.config.ts` formatting. This was source
  formatting, not an application build or test.
- No local install, typecheck, lint, unit test, integration test, browser test,
  build, or Wrangler command was run. Exact integrated checks and browser
  evidence remain pending GitHub Actions on the implementation commit.
- No diagnostic browser spec currently exists, so this report makes no browser
  flick, gameplay, or Havok deployment claim.
