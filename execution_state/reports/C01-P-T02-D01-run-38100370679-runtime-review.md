# C01-P / T02-D01 hosted runtime review — run 38100370679

Date: 2026-10-11

## Verdicts

- **Run: CHANGES_REQUIRED.** GitHub Actions run [38100370679](https://github.com/folaoluwafemi/korre/actions/runs/38100370679) completed with failure on the requested exact SHA `9bbf997e1e19f0cd6fb961be7db7a743b675a994`.
- **C01-P headless bundle probe: PASS as an individual check.** The `games/counterball typecheck` step resolved both public exports, executed the Worker-target esbuild check rooted at the public headless export, printed `Public Counterball headless Worker-target bundle boundary passed.`, and completed TypeScript checking. The overall `pnpm verify` still failed later at formatting, so C01-P is not accepted by this run.
- **T02-D01 runtime/artifact: NOT RUN / no evidence.** `pnpm verify` stopped in lint before Vitest. There is no six-row directImpulseProbe result and no merged intended-shot JSON artifact to inspect. Do not treat the failure as a physics assertion result.

## Exact evidence

The run metadata reports `status: completed`, `conclusion: failure`, head SHA `9bbf997e1e19f0cd6fb961be7db7a743b675a994`, and one completed `verify` job. `pnpm install --frozen-lockfile`, the disposable-secret setup, Workers smoke, workflow/root-config formatting, Chromium installation, two disposable PostgreSQL migration passes, and focused protocol tests all succeeded. The Workers smoke passed **1/1** test; the focused protocol suite passed **11/11** tests. Migration output verified one forward-only migration on each of the two runs.

Inside `pnpm verify`, all workspace typechecks completed, including `apps/realtime typecheck`. The Counterball typecheck log shows the two `import.meta.resolve` public-export assertions and the package's `check:headless-bundle` script. The hosted bundle check resolved `@korre/counterball/headless`, bundled in memory with `write:false` and a metafile, rejected the listed browser/React/DOM module paths and globals, and emitted the explicit PASS line. Typechecking then completed for realtime and web.

The same `pnpm verify` then stopped at root lint/formatting. The captured `verify.log` reports `games/counterball/src/simulation/directImpulseProbe.test.ts` as the file failing Prettier's check. No Vitest test command ran after that failure, and the `pnpm build` stage was not reached. The production marker scan, Worker packaging, integration tests, and browser preview were skipped. Therefore the run has **no full-suite test count or no-skip result**; the only completed test counts are the separate 1/1 Worker smoke and 11/11 focused protocol tests above.

## Artifact and row audit

GitHub listed four unexpired, nonempty artifacts: `counterball-hosted-checks-9bbf997e1e19f0cd6fb961be7db7a743b675a994-run-38100370679-attempt-1`, `counterball-verification-log`, `formatting-repair`, and `counterball-browser-evidence`. The preserved verify log confirms the failure and the successful headless package-boundary subcheck. The `formatting-repair` artifact is diagnostic evidence only; no patch was applied during this review.

There is **no `counterball-intended-shot-observations` artifact** in the run's artifact inventory. Although the workflow's upload step completed under `if: always()`, the workflow ignores missing files; that step status does not mean an artifact was produced. The calibration-observations artifact is also absent. Since Vitest did not run, I could not validate the input artifact, recompute its integrity/schema, inspect the six required rows, verify their selected-cap movement assertions, or confirm that `directImpulseProbe` was merged without changing the existing 40-row payload. **Zero of the six D01 rows are available.**

## Acceptance limits

The C01-P bundle check itself now has hosted evidence on this SHA, but the failed `pnpm verify` means the packet's full check is not green. The package probe is still a current-headless-entry boundary check, not deployed Worker execution or physics proof.

T02-D01 remains unverified: the run's failure is a formatting gate, not evidence that the Havok trials passed or failed. A corrected formatting commit must receive a fresh exact-SHA hosted run that reaches Vitest and uploads `counterball-intended-shot-observations`; then an independent reviewer can verify artifact integrity, schema, all six unique rows, and every required assertion. No deployed Cloudflare Havok or playable gameplay result is established here.
