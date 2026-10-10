# C01-DIAG-BUILD repair 1 implementation

## Scope

Repair the compiler error from exact-head GitHub run 38094866745. The sole source change is in `apps/web/src/App.tsx`, within the existing C01-DIAG-BUILD write scope.

## Change

TypeScript reported TS4111 because the Vite env type exposes custom names through an index signature. Updated the feature-flag lookup from dot access to bracket access:

```ts
import.meta.env["VITE_COUNTERBALL_DEV_HARNESS"] === "1"
```

The condition, lazy import, production flag-unset behavior, workflow, assertions, and artifact naming/provenance are unchanged. No contracts or product features changed.

## Checks

- `node scripts/check-completion-plan.mjs --packet C01-DIAG-BUILD`: PASS; validator reported 81 packets/21 remaining parents and C01-DIAG-BUILD ready. This is plan consistency only.
- `git diff --check`: PASS, exit 0; Git emitted only the workspace's LF-to-CRLF advisory.
- Trailing-whitespace scan over the scoped source and both current reports: PASS.
- Independent source review: PASS, `execution_state/reports/C01-DIAG-BUILD-repair-1-review.md`; review scope is source only and hosted validation remains pending.
- Full GitHub `ci` exact-head run: pending; no local package install, app build, test, or browser automation ran.

The previous failed run's full report is `execution_state/reports/C01-DIAG-BUILD-run-38094866745.md`. It does not count as validation of this repair. Do not accept C01-DIAG-BUILD until fresh exact-head hosted checks, downloaded-artifact verification, and independent review pass.
