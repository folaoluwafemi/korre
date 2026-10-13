# T02-L01-BROWSER-1-TSC-DIAG-1 implementation

The coordinator added one failure-only diagnostic step immediately after `Verify` in `.github/workflows/ci.yml`. The Verify step now has an explicit `verify` id; the diagnostic condition is `failure() && steps.verify.outcome == 'failure'`, so earlier failures that skip Verify do not trigger the trace. It runs the Counterball TypeScript project with `--listFiles --traceResolution`, captures the complete trace, writes the exact compiler exit code, and writes a focused summary for the declaration file, both Vite query imports, and TS2307. It captures an expected failing typecheck without changing the job's existing Verify failure.

The existing `if: always()` hosted-check uploader includes `.artifacts/*.log`, so all three new diagnostic logs are covered. No other workflow gate, source file, test assertion, or dependency changed.

Checks actually run:

- `node scripts/check-completion-plan.mjs` — PASS, plan consistency only.
- `node scripts/check-completion-plan.mjs --packet T02-L01-BROWSER-1-TSC-DIAG-1` — PASS, card remains ready under T02 with T01 as its only required parent acceptance.
- `git diff --check -- .github/workflows/ci.yml` — PASS.

No local application typecheck, build, test, browser run, or deployment was run. Workflow source review is pending before commit and hosted execution.
