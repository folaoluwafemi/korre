# T02-L01-EXECUTOR-1 run 38404197531 independent evidence review

**Verdict: PASS (run-evidence report accuracy)**  
**Run outcome: FAIL; no browser, physics, or playability proof**

## Provenance and step totals

The saved job snapshot identifies run `38404197531`, commit `139e82ec5c20caf93466adf5fef132e59a02aaba`, URL `https://github.com/folaoluwafemi/korre/actions/runs/38404197531`, and conclusion `failure`. The full log checks out the same SHA. Grouping the snapshot's steps gives exactly 23 success, 1 failure, and 13 skipped. The run report's counts are correct. Twelve skipped steps are downstream product gates (steps 14–18 and 22–28); the remaining skip is post-job setup cleanup (step 61).

## Checks that ran

- Workspace typecheck completed successfully. The hosted log includes all workspace package checks, tests/web TypeScript projects, Counterball's public-export resolution, its Worker-target headless bundle-boundary check, and Counterball's own `tsc` check.
- The focused protocol suite passed 13/13 tests. The dedicated Workers smoke passed 1/1, and both disposable PostgreSQL migration passes completed. The standalone workflow/root-config formatting check passed; Chromium installation also completed.
- `pnpm verify` stopped in ESLint after typecheck. `verify.log` records eight errors in `loftCoarseRunner.ts`: two unused declarations, one rejected non-Error promise reason, one useless assignment, two unnecessary assertions, and two non-Error throws. Since the lint command uses `eslint ... && prettier --check ...`, its Prettier phase did not run. The separate post-failure formatting-suggestion step ran Prettier to create a patch; it is not a verification pass.

The snapshot and full log confirm the main unit suite and workspace build were not reached. Integration tests, preview browser tests, production/diagnostic browser builds, diagnostic browser suites, and Worker/production packaging were skipped. No L01 matrix or direct diagnostic browser spec ran.

## Artifacts

The four uploaded archives are identified in the full log: `counterball-verification-log` (ID `11816676791`), `counterball-browser-evidence` (`11817081632`), the exact-run hosted-checks artifact (`11816671718`), and `formatting-repair` (`11816831757`). I recomputed SHA-256 and byte length for all 10 extracted files in the saved download directory; all 10 hashes and sizes match `T02-L01-EXECUTOR-1-run-38404197531-artifact-inventory.json`. This verifies extracted file bytes, not an independently recomputed archive digest.

The three PNGs are named `T03-inspection.png`, `T03-narrow-viewport.png`, and `T03-preview.png`. They are previously uploaded T03 review images; they do not show a browser test from run 38404197531, whose browser steps were skipped. The remaining artifacts are hosted logs and a formatting patch. None proves deployed Havok, the 24-case physics matrix, a flick, or playability.

No source, configuration, or shared status was changed, and no app command was run for this review.
