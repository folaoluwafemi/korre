# T02-L01-TRANSPORT-HARNESS-1 implementation

## Changes

Changed the three assigned source paths:

- `apps/web/src/CounterballDirectProbe.tsx` now defines one compile-time
  predicate: `import.meta.env.DEV || import.meta.env.VITE_COUNTERBALL_DEV_HARNESS === "1"`.
  It gates acknowledgement validation, callback installation, panel rendering,
  and callback cleanup. Gating cleanup also lets the production build eliminate
  the host-global marker when the predicate is statically false.
- `tests/e2e/counterball-direct-probe.spec.ts` now promptly checks that the
  panel and write control are visible after the diagnostic scene reaches ready,
  then checks the host-ack callback once. The existing full-cap test still
  streams and hashes the file before sending the matching acknowledgement.
- `tests/production/counterball-dev-match-absent.mjs` now rejects both the
  `Write transport test file` label and `__counterballLoftMatrixHostAck`, while
  retaining its explicit unset-flag guard.

No route, workflow, configuration, byte limit, digest sequence, acknowledgement
order, or physics code changed. The normal production build remains unflagged;
the separate diagnostic build sets `VITE_COUNTERBALL_DEV_HARNESS=1`.

## Sources consulted

- The exact ready packet, its reviewed amendment, and accepted transport/browser
  reports.
- `apps/web/src/App.tsx`, `apps/web/src/vite-env.d.ts`, `apps/web/vite.config.ts`,
  `.github/workflows/ci.yml`, the production marker scan, and the routed E2E.
- Vite's [environment variables and modes guide](https://vite.dev/guide/env-and-mode),
  which documents that `import.meta.env` constants are statically replaced,
  `DEV` is false for normal production builds, and exposed `VITE_` values are
  strings.

## Checks and limits

- `node scripts/check-completion-plan.mjs --packet T02-L01-TRANSPORT-HARNESS-1`
  — PASS; extraction reported `ready: true` and the accepted T01 parent gate.
- `git diff --check -- apps/web/src/CounterballDirectProbe.tsx tests/production/counterball-dev-match-absent.mjs tests/e2e/counterball-direct-probe.spec.ts`
  — exit 0. Git reported only that the production scanner's LF line endings
  will be converted to CRLF on a future touch.
- Typecheck, lint, unit tests, production build/marker scan, integration,
  browser E2E, and exact-host run review — NOT RUN; coordinator-owned after
  independent source review.

The source change does not itself prove that production output omits the markers
or that the synthetic full-cap transfer succeeds. This packet makes no physics
or playability claim.
