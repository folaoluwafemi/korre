# Hosted verification report — run 38090063627

Run: [GitHub Actions 38090063627](https://github.com/folaoluwafemi/korre/actions/runs/38090063627)
Branch: `codex/remote-ci-bootstrap`
Exact head SHA: `e9d7aee4a3202b2e0a14bfb6a6f62bf967a62669`
Result: **FAILURE at Verify**. This run does not accept F01 or T02.

## Workflow resul

The `verify` job had 32 recorded steps: 23 succeeded, 1 failed and 8 were skipped. Step 13, `Verify`, failed. The skipped steps were Worker/browser package and upload steps 14–17, integration and browser preview steps 21–23, and post-setup cleanup step 51. The other 23 steps, including checkout, frozen install, Worker smoke, formatter configuration, Chromium installation, disposable PostgreSQL migrations, protocol tests, log/artifact uploads and cleanup, succeeded.

The Verify log shows all eight workspace package typechecks and the root test-project typecheck completed. ESLint passed. Prettier then reported only `games/counterball/src/simulation/facts.ts`; no unit suite or build ran. The separately completed protocol test command passed 11/11 tests, the Worker smoke passed 1/1 test, and the disposable migration checks passed. Those results do not substitute for the skipped full unit suite or build. Integration and Chromium preview tests did not run.

The hosted Prettier suggestion is preserved at `execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-run-38090063627-artifacts/formatting-repair/formatting-repair.patch`. It changes only `facts.ts`, with two line-wrapping hunks. Its SHA-256 is `c1a80ffd8ad4bcf4eb8f566df92dd02ac7b765e791d8612608aace1e65007bfe`. The current file blob is `22aa7cb06fcedae871970bd92c7f8420ef14ed26`, matching the patch base. `git apply --stat` reports one file, two insertions and seven deletions; `git apply --check` passed. The patch has not been applied. This is evidence for a separate formatting-only repair packet, not permission to bypass independent review.

## Preserved evidence

- Full GitHub log: `execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-run-38090063627-github.log` — 135,167 bytes, SHA-256 `a22f9740fdcfe4c80ae28d0eba2b75299e36f7fbac52e67e447759016b5881dc`.
- Run metadata and per-step conclusions: `execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-run-38090063627-metadata.json` — 6,144 bytes, SHA-256 `3a91f12fdbc39a6cf69cacc8915716b6a596d895bf8f8aa49f0e99510c393f7e`.
- `verify.log` — 1,402 bytes, SHA-256 `2be93eacefea8c66a57529ac96e7370c0d52b68ba29187323d02679bd660b785`.
- `migrations.log` — 416 bytes, SHA-256 `f40a42ad994e1e2145b4a29f0184d5c91570f55d08cbfc8292968de7cb0f9f67`.
- `protocol.log` — 478 bytes, SHA-256 `2f80ec80e096bb45c3a064d3c35b6780f970f1ec1300d3d45b86080acaace01d`.
- `workers.log` — 576 bytes, SHA-256 `43180926fbbea611681a8d61dc628b564ec6db8396aa55b4ac9dae3dea6eea1c`.
- `tooling-format.log` — 66 bytes, SHA-256 `17aa973d3f004560237d9a95171210b0671deff23d61628eecf7322ff5938f20`.
- The verification-log artifact duplicates the same `verify.log` bytes and digest.
- The browser-evidence artifact contains three saved T03 images, not output from this run:
  - `T03-preview.png` — 167,624 bytes, SHA-256 `d06272c44382f35d1e91e7264bbd8cf6c570b77d12ab0960284767c7ac05cd4f`.
  - `T03-inspection.png` — 139,998 bytes, SHA-256 `13a8d0257dd07dfb6650954f07255e53d7c2acf37293059f541fc44bd4b8d34e`.
  - `T03-narrow-viewport.png` — 141,477 bytes, SHA-256 `88b461d66f721b9b5a01096d5422f0f3a99df970aba95cf5b8d584a946ed3cee`.

The workflow produced no Worker package, production browser build or fresh browser preview. The 480-trial calibration and intended-shot probe files were not produced by this failed Verify stage. No deployed Havok, real browser flick, or playable match is proven by this run.

## Limits and next action

The failure is a hosted formatting check, not a newly observed physics or rule failure. The exact patch is narrow and its applicability is verified, but the stop condition in the semantic-repair packet requires a new independently reviewed escalation before another source edit. F01 and parent T02 remain unaccepted. The separately assigned report-only card is `T02-F01-ROTATION-1-CI-FAIL-ESCALATION-2`.
