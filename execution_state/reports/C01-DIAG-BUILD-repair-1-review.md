# C01-DIAG-BUILD repair 1 independent source review

**Verdict: PASS — source review only. Hosted validation is pending.** This review accepts only the bounded TS4111 source repair, not C01-DIAG-BUILD, its production exclusion, or either browser artifact.

## Exact diff scope

The plan extractor for `C01-DIAG-BUILD` returned `PASS`, `ready: true`, and noted that this is plan consistency only. The current diff is exactly one line in `apps/web/src/App.tsx`: `import.meta.env.VITE_COUNTERBALL_DEV_HARNESS` is now read as `import.meta.env["VITE_COUNTERBALL_DEV_HARNESS"]`. It retains the same literal `=== "1"` condition, lazy diagnostic import, and null production branch. The full source diff contains no changes to `.github/workflows/ci.yml` or `tests/production/counterball-dev-match-absent.mjs`.

This bracket access is the narrow fix for the recorded TypeScript TS4111 error on the Vite env index signature. The `/preview` branch still renders the diagnostic component only when the condition selects its lazy import. No route, copy, controls, rules, physics, identity, or other product behavior changed in this repair.

## Preserved checks and artifact separation

- The production absence script still rejects any defined `VITE_COUNTERBALL_DEV_HARNESS`, requires nonempty `apps/web/dist` with `index.html`, and scans every emitted file for both `Development-only renderer diagnostic` and `renderer-diagnostic__label`.
- The workflow still runs that production assertion after the normal production build and before production packaging. Production inventory and upload remain separately named `counterball-web-production-${github.sha}` with `buildMode: "production"` and `devHarnessFlag: "unset"`.
- The diagnostic build still sets the flag only on its own build step, writes `dist-dev`, requires emitted files plus `index.html` and the diagnostic marker, and records source SHA, run ID, attempt, `buildMode: "renderer-diagnostic"`, `devHarnessFlag: "set"`, and every emitted file's path, byte size, and SHA-256. It uploads to the distinct `counterball-web-diagnostic-${github.sha}` artifact with 14-day retention.
- The production preview, integration and Chromium checks remain ahead of the diagnostic build/upload. The repair changes none of those workflow assertions or artifact names/provenance.

The earlier run 38094866745 failed at web typecheck with the stated TS4111 error, before unit tests, the production absence assertion, the browser build, or diagnostic packaging. That run does not validate this repair. The actual Vite production tree-shaking boundary, absence scan, diagnostic marker, full workflow counts, and downloaded artifact hashes all remain to be proven on a fresh exact-head hosted run.

## Checks and limits

- `node scripts/check-completion-plan.mjs --packet C01-DIAG-BUILD`: exit 0; exact record reports ready. Plan consistency only.
- No package install, app test, typecheck, lint, formatter, build, browser action, or deployment was run for this review.
- Required hosted validation and artifact inspection are **PENDING**. No diagnostic browser interaction, physics, flick, match, or playability result is claimed.
