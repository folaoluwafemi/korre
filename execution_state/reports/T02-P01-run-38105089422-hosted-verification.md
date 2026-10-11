# T02-P01 exact-head hosted verification

Date: 2026-10-11

## Exact source

- Commit: `98abd0caf819f0f08ba093fb51aa6556ba2aae88`
- Branch: `codex/remote-ci-bootstrap`
- GitHub Actions run: [38105089422](https://github.com/folaoluwafemi/korre/actions/runs/38105089422)
- Conclusion: **success**; `pnpm verify` job completed in 1m56s against that exact SHA.

## Checks observed

- Frozen pnpm install, workflow/config formatting, disposable Workers runtime smoke, migration checks, focused protocol tests, workspace typecheck/lint/format, full workspace tests/build, production diagnostic-isolation check, Worker/browser packaging, integration, and Chromium browser checks all completed successfully.
- Main Vitest suite: **28 files, 146 tests passed**; no skipped tests were reported.
- Focused protocol suite: **1 file, 11 tests passed**.
- Integration suite: **1 file, 1 test passed**.
- Built-browser Playwright suite: **4 passed of 4, one Chromium worker, zero retries**. The JSON result metadata names the exact commit SHA and run. These existing scenarios inspect the rendered idle scene, recovery, and cleanup; they do not exercise a flick or match.
- The run uploaded the production browser bundle, diagnostic browser bundle, realtime prebuilt, browser-preview output, browser evidence, calibration observations, intended-shot observations, full verification output, and hosted-check logs. Their downloaded contents are preserved under `execution_state/reports/T02-P01-run-38105089422-hosted-checks/artifacts/` (1,383 files, approximately 49.46 MB total).
- Full GH log: `execution_state/reports/T02-P01-run-38105089422-hosted-checks/github-run.log`. The workflow's dedicated verify log and structured Playwright result JSON are included in the artifact folders.

## Scope and limit

This is exact-head package/workspace and browser-build evidence for T02-P01. The hosted tests cover the scene presentation API and its render integration. They do not establish an interactive shot, completed match, accepted physics calibration, or deployed Cloudflare Havok. Independent exact-run artifact review remains required before accepting T02-P01.
