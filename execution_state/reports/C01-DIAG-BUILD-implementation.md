# C01-DIAG-BUILD implementation

Status: **SOURCE REVIEW PASS; exact-head GitHub execution and artifact audit pending.** The independent source review is saved at `execution_state/reports/C01-DIAG-BUILD-review.md`. This packet only separates the renderer diagnostic build from production. It does not prove that the panel ran in a browser, that Havok loaded, or that Counterball is playable.

## Inputs and changes

The accepted inputs are the T03 static preview, the accepted noninteractive `C01-DIAG-PANEL`, the accepted C00 contract preparation, and the existing C01 hosted workflow. Human rules remain unchanged; no cultural or physics defaults were added.

- `apps/web/src/App.tsx` now conditionally lazy-imports the diagnostic panel only when Vite's `VITE_COUNTERBALL_DEV_HARNESS` value is exactly `1`, and renders it as a sibling of the preview route. The regular build leaves the flag unset.
- `.github/workflows/ci.yml` checks the normal production bundle for excluded diagnostic markers. After the existing production preview is packaged and tested, GitHub builds `apps/web/dist-dev` with the flag set, records source SHA/run/attempt/build mode/flag and per-file size/SHA-256 in a distinct inventory, and uploads `counterball-web-diagnostic-${{ github.sha }}` for 14 days. The existing production artifact and browser suite remain separate.
- `tests/production/counterball-dev-match-absent.mjs` fails when the production flag is present, the built directory is empty, the entry page is absent, or either diagnostic marker is found in emitted files.

No Playwright routing or diagnostic browser test was added. `C01-H` owns routing and browser interaction. This card's hosted evidence will establish only the separate build and production exclusion.

## Checks

- `node scripts/check-completion-plan.mjs --packet C01-DIAG-BUILD`: PASS; the exact card is ready after accepted C01-DIAG-PANEL, C00, T03 and the original T01 dependency. This is plan validation only.
- `node scripts/check-completion-plan.mjs`: PASS; 81 catalogue cards cover 21 remaining parents. This is plan consistency only.
- `git diff --check`: PASS on tracked diffs. A separate whitespace scan of the new production script found no trailing whitespace.
- Independent source/config review: **PASS**, report `execution_state/reports/C01-DIAG-BUILD-review.md`. Runtime review is NOT RUN.
- `pnpm verify`, production absence script, diagnostic build, integration tests, Chromium, and artifact inventory/audit: **NOT RUN locally**. These are assigned to the GitHub workflow and independent exact-run review.
- Wrangler/deployment and physical-device checks: **NOT RUN** and outside this card.

## Exact next action

Publish the reviewed tree and run `ci` on GitHub. Retain complete logs and download both the production and diagnostic artifacts before recording any runtime verdict. Keep C01 and T02 open until their distinct acceptance gates pass.
