# C01-DIAG-BUILD static-env repair 1 implementation

Status: source repair saved; independent review and fresh hosted validation are pending. No source SHA is available until the coordinator commits the reviewed tree.

## Changed paths

- `apps/web/src/App.tsx`
- `apps/web/src/vite-env.d.ts`
- `execution_state/reports/C01-DIAG-BUILD-static-env-repair-1-implementation.md` (this report)

## Change

Changed the diagnostic flag lookup in `App.tsx` from bracket access to `import.meta.env.VITE_COUNTERBALL_DEV_HARNESS`, the statically replaceable Vite form. Added a no-import global `ImportMetaEnv` augmentation declaring `readonly VITE_COUNTERBALL_DEV_HARNESS?: string`.

The flag value comparison remains the literal string `"1"`. The existing conditional lazy import, `/preview` render condition, null branch when unset, and all build and production assertions remain unchanged. This addresses the hosted finding that the bracket-form reference left `renderer-diagnostic__label` in the flag-unset production CSS output. It adds no route, control, identity or gameplay behavior.

## Checks actually run

- `node scripts/check-completion-plan.mjs --packet C01-DIAG-BUILD`: exit 0; exact record reports ready. This proves plan consistency only.
- `git diff --check`: exit 0. Git printed LF-to-CRLF advisories for the edited App file and unrelated existing task/catalogue files; no whitespace error was reported.

## Checks not run and limits

No local install, typecheck, unit test, lint, formatter, build, browser, physics, deployment, or hosted check was run. The exact-head hosted run must confirm the flag-unset production marker scan passes and the separately flagged diagnostic artifact contains the marker with correct provenance and hashes. Run 38095656864's successful `pnpm verify` followed by the production marker failure predates this repair and does not validate it. This source repair proves neither production exclusion nor a working diagnostic browser flow.
