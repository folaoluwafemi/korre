# T02-L01-CONTACT-ONSET-CONFIG-1 run 38647338857 independent evidence review

**EVIDENCE REPORT: PASS. RUN: FAILED. CONFIG/ADAPTER ACCEPTANCE: NOT ESTABLISHED. NATIVE/MATRIX RUNTIME: NOT RUN.**

## Run identity and outcome

The saved run metadata identifies [GitHub Actions run `38647338857`](https://github.com/folaoluwafemi/korre/actions/runs/38647338857), attempt 1, workflow `ci`, branch `codex/remote-ci-bootstrap`, commit `37daf6b206f999add7feba74e301724415f20a23`, and conclusion `failure`. The single job snapshot has 40 step entries: 26 success, one failure, and 13 skipped. `Verify` is the only failed step. The skipped entries are production exclusion/Worker and production packaging (steps 17–21), integration and preview (25–27), diagnostic browser bundle/package/upload/test (28–31), and post-setup-node cleanup (67).

`pnpm verify` completed typecheck, including workspace TypeScript checks and the headless Worker-target bundle boundary, then failed during ESLint in `pnpm lint`. The retained `verify.log` shows 11 `@typescript-eslint/no-unsafe-*` errors in `nativeCollisionSubscription.ts` at lines 75, 78–80, 87, 91, and 93: `Array.isArray(orderedBodies)` narrowed the typed readonly parameter to `any[]`. The `pnpm lint` Prettier phase, full Vitest run, and `pnpm build` did not run. A separate limited workflow/root-test-config formatting step passed; it is not the full repository formatting gate.

Before Verify, the focused protocol log records one file and 15/15 passing tests. The exact source at this SHA contains the canonical config-hash test that compares the computed hash with the fixture hash, so this run supports that narrow protocol check. The dedicated Worker smoke log records 1/1 passing test. The migration step ran apply/recheck and logged verification of one forward-only migration on each invocation; it does not report two distinct migrations. None of these focused checks is the full workspace unit suite or the adapter unit suite: `pnpm test` was downstream of the lint failure and did not run.

## Retained artifacts

The artifact API lists four artifacts, each linked to workflow run `38647338857` and the exact SHA above. API-reported archive metadata is:

| Artifact | ID | Archive bytes | API-reported SHA-256 |
|---|---:|---:|---|
| `counterball-verification-log` | 11933291303 | 1,903 | `062de2aba950a90f53365384f3880f51a74814620a0f356a552703e677feef53` |
| `counterball-hosted-checks-37daf6b206f999add7feba74e301724415f20a23-run-38647338857-attempt-1` | 11932109348 | 1,327,149 | `0eda5cda4a740da8113b9972111799fb2f3e3ea5815e7d68409d075a00e55787` |
| `counterball-browser-evidence` | 11932024704 | 437,511 | `00d002426d4ef240559e2e211da5a058f980e06e4bffa038c998ff783f7f1c55` |
| `formatting-repair` | 11931934975 | 914 | `9127fde7f82a4e7484db97e64058163a9e9d0eb10234cd38aab4c38f8d9150d1` |

I independently recomputed byte sizes and SHA-256 for all 22 extracted files against `T02-L01-CONTACT-ONSET-CONFIG-1-run-38647338857-artifact-inventory.json`: 22/22 matched, with no extra or missing files; total extracted bytes were 48,618,852. The GitHub API digests above are archive digests reported by the API; they were not recomputed from downloaded ZIP archives. The duplicate `verify.log` copies are byte-identical at 5,917 bytes with SHA-256 `10c077d33ed3caca979a02177c8a3330c741492eaf6481067e632bb09198aaeb`.

The `counterball-browser-evidence` extraction contains only three older `T03-*.png` screenshots. They are carried evidence, not browser results for this run. There is no current `browser-test-results.json`, matrix output, diagnostic browser execution, production bundle, or Worker package/upload. Thus the run did not initialize native Havok for the contact-onset adapter, test its new unit file, execute the full fixture consumer, or prove native event masks/contact delivery.

The full captured GitHub log SHA-256 is `a56ccb21e4169833ed40360f1ffdbce29177e13b97d4a63f24d3e4a26da41e67`. Evidence inputs are retained under `execution_state/reports/T02-L01-CONTACT-ONSET-CONFIG-1-run-38647338857-*`. This review confirms the saved run evidence and its limits; it does not accept the config producer, adapter, physics, or matrix.
