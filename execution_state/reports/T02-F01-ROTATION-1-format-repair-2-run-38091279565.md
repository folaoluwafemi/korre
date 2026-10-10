# GitHub run 38091279565 — exact-head verification and artifact audit

Verdict: **PASS for the bounded F01 source/format repair gates.** This does not accept the T02 parent, prove continuous Havok traversal, establish deployed physics, or make the browser game playable.

## Provenance

- Workflow: [`ci`](https://github.com/folaoluwafemi/korre/actions/runs/38091279565)
- Branch: `codex/remote-ci-bootstrap`
- Exact source commit: `ec6c35cb3b8e62c70c94d4fd6b26ed577f0088cf`
- Job: `verify` (`114328050457`), completed successfully at `2026-10-10T22:26:29Z`
- Complete GitHub run log: `execution_state/reports/T02-F01-ROTATION-1-format-repair-2-run-38091279565-github.log` (212,803 bytes; SHA-256 `1400558d85c45f4bf5f85dc8fcbb6caf4e606992bb15614ad73dbc3ce1f86ec5`)
- Complete `pnpm verify` log: `execution_state/reports/T02-F01-ROTATION-1-format-repair-2-run-38091279565-artifacts/counterball-verification-log/verify.log` (892,491 bytes)
- Run metadata and GitHub artifact API response are saved beside this report. The extracted-file SHA-256 manifest is `execution_state/reports/T02-F01-ROTATION-1-format-repair-2-run-38091279565-artifact-manifest.json`.

## Checks actually run

The workflow has 30 successful steps, no failed steps, and two skipped optional formatting-suggestion steps. The required suites were not skipped.

- Hosted Workerd smoke: 1 test passed.
- Disposable PostgreSQL migrations: applied and rechecked successfully.
- Focused protocol suite: 11 tests passed.
- `pnpm verify`: typecheck, ESLint, formatting, all builds, and 25 test files / 139 tests passed (139 collected, 0 failed, 0 skipped).
- Integration suite: 1 test passed.
- Built-browser Playwright: 4 passed, 0 skipped, 0 flaky, 0 unexpected. Structured result metadata ties the run and commit to the exact tested build.
- Calibration producer: all 480 real pinned Havok-WASM trials ran and produced the downloaded observation JSON.
- Intended-shot producer: all 40 real pinned Havok-WASM diagnostic trials ran and produced the downloaded observation JSON.
- Production browser and Wrangler dry-run Worker packaging/upload steps completed on GitHub.

The focused Counterball tests and typecheck are included in the successful monorepo `pnpm verify`; this run did not separately invoke the two filtered package commands. The full hosted log and package test summary are retained so this distinction stays explicit.

## Artifacts

GitHub reports eight unexpired artifact archives for this exact run. Their IDs, sizes, archive digests, and the SHA-256/size of every extracted file are recorded in the manifest. The extracted files total 926 files and 31,919,225 bytes.

The browser results cover the real WebGL preview, lifecycle/recovery, and the home-page assertion that the game is not playable yet. No flick or completed match is tested. No `counterball-web-diagnostic` artifact was produced.

The Worker inventory identifies `buildMode: "wrangler-dry-run"` and the right commit, but its emitted `dist/index.js` is only 367 bytes. This is packaging evidence, not an uploaded or running Cloudflare Havok runtime. No Wrangler command or staging deployment ran.

The calibration JSON records 480 observations with Babylon `9.30.0` and Havok `1.3.14`. The intended-shot JSON declares `diagnosticOnly: true`, 40 trials, and `continuousTraversalProven: false`; its sampled/peak-clearance readings do not prove a complete obstacle traversal. Neither artifact selects production physics coefficients or resolves the unsettled calibration limitation.

## Acceptance boundary

The exact reviewed source SHA passed the full hosted checks and browser-preview suite with no required skips. Together with the independent source review and byte-for-byte pinned formatting-patch review, this verifies the seven repaired fact regressions and the formatting-only repair. It does not satisfy the separate T02 calibrated-runner, all-body settling, continuous-traversal, or deployed-Havok gates. The browser still presents a static scene preview.

No application install, build, test, browser automation, physics run, or dry-run ran on the laptop. All application checks and artifacts above came from GitHub Actions.
