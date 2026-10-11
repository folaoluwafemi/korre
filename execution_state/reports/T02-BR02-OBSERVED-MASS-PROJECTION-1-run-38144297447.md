# T02-BR02-OBSERVED-MASS-PROJECTION-1 hosted attempt 1 — run 38144297447

## Exact run

- Commit: `bb03c75f4d49ad27013d630ee36e3dd76ce1b732`.
- Run: [GitHub Actions 38144297447](https://github.com/folaoluwafemi/korre/actions/runs/38144297447), job 114484315495 (`verify`).
- Exact job window: 2026-10-11 13:43:18–13:44:38 UTC; 1m20s. Overall conclusion: failure.
- Step totals: 23 success, 1 failure, 13 skipped. The sole failure was `Verify`; the 13 skipped steps include every package build, unit suite, integration, built-preview browser and focused diagnostic-browser step, plus the post-run setup cleanup.
- Full job log: `execution_state/reports/T02-BR02-OBSERVED-MASS-PROJECTION-1-run-38144297447-github.log` (141,146 bytes; SHA-256 `488B26872F5815418B14CCC1ACBF3D98660E99876C74B485F5BE1DEAAB735DDA`).
- Step JSON SHA-256 `076AEF860E87564C4781BE9AB3D9DFCACD14BA7A73FA42A4EDFF60E4F20F5F7E`; artifact inventory JSON SHA-256 `215A535C2B7239B2323CFFCDDA8DFFA8FF07F738F3F034AD83A0A01839BC34D5`.

## Checks that actually ran

- Hosted frozen install, dedicated Workers runtime smoke, disposable PostgreSQL migrations, and focused protocol suite passed; protocol reported 12 tests. This Workers smoke was a CI sandbox check, not a deployed Havok proof.
- Workspace/root TypeScript checks passed, including the Worker bundle boundary check. ESLint passed. Prettier stopped `pnpm verify` on exactly `tests/e2e/counterball-direct-probe.spec.ts`; full verification log SHA-256 `82F339013B7CD098288D17E4015CC4DAA9FC1B107DD4F8C276EB2A25AF3D1004`. Unit tests, package builds, integration, production/diagnostic builds, preview, and the real browser physics cases did not run. No WASM/impulse/shot evidence exists for this run.

## Bounded repair evidence

GitHub uploaded the formatting-only patch at `execution_state/reports/T02-BR02-OBSERVED-MASS-PROJECTION-1-run-38144297447-artifacts/formatting-repair/formatting-repair.patch`, SHA-256 `A3338F9EEED40BDF4F5B566D30BDFCB725348BDC9DD7DBBFFD3FD9F099799216` (741 bytes). It changes only line wrapping in the E2E outcome poll: 1 file, 3 insertions, 4 deletions. Its index base `f1305ad` matches the exact source blob at run SHA. Coordinator `git apply --stat` and `git apply --check` both passed without changing files. The hosted artifact also includes counterball browser evidence with three T03 inspection screenshots, which are unrelated static artifacts and are not browser/physics results for this packet.

The repair is authorized only as attempt 1 under the existing packet's bounded SWARM procedure: apply this exact generated patch to the one already-owned E2E path, run no local app command, produce a separate repair report, and release the path for rotated independent review. Then publish a new exact SHA and rerun hosted verification. Do not weaken tests or claim a browser result.
