# T02-L01-BROWSER-1-WEB-TSC-DIAG-1 implementation

The coordinator added a second failure-only trace step in `.github/workflows/ci.yml` for the actual consumer project, `apps/web/tsconfig.json`. It runs `pnpm exec tsc --noEmit -p apps/web/tsconfig.json --listFiles --traceResolution`, saves the full trace, captures the exact compiler exit code, and writes a focused summary for the package declaration file, both query imports, and TS2307. The condition requires the named Verify step itself to fail. The diagnostic returns success after recording the compiler result; Verify remains failed.

The existing always-upload includes `.artifacts/*.log`, covering the three new logs. No other gate, package script, source file, declaration, test, or dependency changed.

Checks actually run:

- `node scripts/check-completion-plan.mjs` — PASS, plan consistency only.
- `node scripts/check-completion-plan.mjs --packet T02-L01-BROWSER-1-WEB-TSC-DIAG-1` — PASS, exact coordinator card and dependency extracted.
- `git diff --check -- .github/workflows/ci.yml` — PASS.

No local app typecheck, build, test, browser run, or deployment was run. Independent workflow review passed and is recorded in `execution_state/reports/T02-L01-BROWSER-1-WEB-TSC-DIAG-1-review.md`. The reviewed change is ready for commit and hosted execution.
