# T02-L01-BROWSER-1-WEB-TSC-DIAG-1 implementation

The coordinator added a failure-only trace step in `.github/workflows/ci.yml` for the actual consumer project, `apps/web/tsconfig.json`. It runs the project with `--listFiles --traceResolution`, saves the full trace, captures the exact compiler exit code, and writes a focused summary for the package declaration file, both query imports, and TS2307. The condition requires the named Verify step itself to fail. The diagnostic returns success after recording the compiler result; Verify remains failed.

The existing always-upload includes `.artifacts/*.log`, covering all three diagnostic logs. No other gate, package script, source file, declaration, test, or dependency changed.

The exact-SHA run was `38421056934` on `a38cc5395375f2ddc2081873eb850bdce10536a6`. Verify failed on the two original TS2307 errors. The package and web diagnostic steps succeeded; the web TypeScript project returned 0 and its program omitted `games/counterball/src/viteAssetModules.d.ts`. Independent exact-run review confirmed 25 success, 1 failure, 13 skipped, and all 16 downloaded artifact hashes/sizes. The result rules out `apps/web/tsconfig.json`; it does not distinguish the remaining root tests and server configs.

Checks actually run:

- `node scripts/check-completion-plan.mjs` — PASS, plan consistency only.
- `node scripts/check-completion-plan.mjs --packet T02-L01-BROWSER-1-WEB-TSC-DIAG-1` — PASS.
- `git diff --check -- .github/workflows/ci.yml` — PASS.
- Independent workflow review — PASS, `execution_state/reports/T02-L01-BROWSER-1-WEB-TSC-DIAG-1-review.md`.
- GitHub run `38421056934` — diagnostic steps PASS; Verify FAIL as expected.
- Independent exact-run review — PASS, `execution_state/reports/T02-L01-BROWSER-1-WEB-TSC-DIAG-1-run-38421056934-independent-review.md`.

No local app typecheck, build, test, browser run, source repair, or deployment was run. Card accepted after both workflow and exact-run evidence review.
