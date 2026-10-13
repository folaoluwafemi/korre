# T02-L01-BROWSER-1-ROOT-TSC-DIAG-1 implementation

Added a failure-only diagnostic step to `.github/workflows/ci.yml`. It independently runs the root test TypeScript project (`tests/tsconfig.json`) and web server/config project (`apps/web/tsconfig.server.json`) with `--listFiles --traceResolution`. Each compiler's full output, exit code, and focused resolution summary is saved separately under `.artifacts/`; the existing always-upload step already captures `.artifacts/*.log`.

The step runs only when the named Verify step itself fails. It records each non-zero compiler result without changing Verify's failure or downstream gates. No product source, tests, declarations, dependencies, or scripts changed.

Checks actually run:

- `node scripts/check-completion-plan.mjs --packet T02-L01-BROWSER-1-ROOT-TSC-DIAG-1` — PASS, exact coordinator diagnosis packet extracted under T02 with accepted prerequisites.
- `node scripts/check-completion-plan.mjs` — PASS, 102 packets and 21 remaining parents; document consistency only.
- `git diff --check -- .github/workflows/ci.yml` — PASS.

No local application typecheck, install, build, test, browser run, or deployment was run. Independent workflow review and exact-SHA hosted verification are pending.

Independent workflow review passed: execution_state/reports/T02-L01-BROWSER-1-ROOT-TSC-DIAG-1-review.md. Exact-SHA hosted verification is pending.
