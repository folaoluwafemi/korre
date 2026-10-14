# T02-L01-DIAGNOSTIC-APRON-F32-1 exact hosted run

Date: 2026-10-14

## Provenance

- Commit: `4d8a4d8da2827074ddd2767c3978e62fb305f9fc`
- Branch: `codex/remote-ci-bootstrap`
- GitHub run: [38618192294](https://github.com/folaoluwafemi/korre/actions/runs/38618192294)
- Run status: completed; workflow conclusion `failure` in the diagnostic browser suite
- Run JSON: `execution_state/reports/T02-L01-DIAGNOSTIC-APRON-F32-1-run-38618192294-run.json`
- Complete captured GitHub log: `execution_state/reports/T02-L01-DIAGNOSTIC-APRON-F32-1-run-38618192294-github.log`
- Full downloaded hosted artifacts: `execution_state/reports/T02-L01-DIAGNOSTIC-APRON-F32-1-run-38618192294-artifacts/`
- Independent exact-run review: `execution_state/reports/T02-L01-DIAGNOSTIC-APRON-F32-1-run-38618192294-independent-review.md` (PASS for evidence integrity only)

## Hosted results

- `pnpm verify`: PASS; 30 test files, 185 tests, zero reported skips/failures.
- Disposable migrations: PASS on both invocations; one forward-only migration verified.
- Focused protocol tests: PASS, 13/13.
- Integration: PASS, 1/1.
- Built preview Chromium: PASS, 4/4; zero skips, retries or flaky tests.
- Real pinned-Havok diagnostic Chromium: 3 passed, 1 failed; zero skips, retries or flaky tests.
- The diagnostic suite reached the real matrix preflight. The apron Y exact Float32 projection passed. The first subsequent failure was the `goal-frame-0` canonical dimension check.
- The browser error remains generic and provides no actual native bounds or observed dimensions. The strict failure occurred before the first impulse, any `executeStep`, any matrix tuple completion, or a successful matrix download. No matrix-result artifact exists.

This run does not accept the full 24-case matrix, T02, deployed Cloudflare Havok, calibration, or playability. The exact-run independent reviewer verified the captured logs and all hosted artifact inventory entries. A separate bounded readback diagnostic is needed to expose the failing native goal-frame bounds without changing its strict predicate.
