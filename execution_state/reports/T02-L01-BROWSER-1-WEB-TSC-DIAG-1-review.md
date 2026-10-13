# T02-L01-BROWSER-1-WEB-TSC-DIAG-1 workflow review

## Verdict: PASS

The workflow diff implements the exact coordinator packet in `.github/workflows/ci.yml` and adds only the requested diagnostic step. It is placed immediately after the existing Counterball package trace and before the unchanged production gate.

- The condition is `failure() && steps.verify.outcome == 'failure'`. This runs the web trace only after the named Verify step fails; an unrelated earlier failure that prevents Verify from running does not satisfy the condition.
- It invokes `pnpm exec tsc --noEmit -p apps/web/tsconfig.json --listFiles --traceResolution` and redirects complete stdout/stderr to `.artifacts/counterball-web-tsc-resolution.log`.
- `set +e` allows the diagnostic compiler to finish; `tsc_status=$?` captures its exit code immediately; `set -e` is restored before writing `.artifacts/counterball-web-tsc-status.log` and the focused `.artifacts/counterball-web-tsc-summary.log`. The summary covers the declaration path, both queried imports, and TS2307.
- The existing “Upload complete hosted check logs and structured browser results” step is unchanged, still uses `if: always()`, and still uploads `.artifacts/*.log`. Therefore the full trace, status, and summary are all covered.
- The complete workflow diff inserts this step only. It does not alter Verify, test assertions, existing diagnostic commands, downstream gates, or upload conditions.

This review covers workflow structure only. It does not establish that the remote trace will be complete or conclusive; the exact-SHA GitHub run and artifact review remain required. No local application command was run.
