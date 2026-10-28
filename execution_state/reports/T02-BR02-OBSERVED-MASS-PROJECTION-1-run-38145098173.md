# T02-BR02-OBSERVED-MASS-PROJECTION-1 exact-head run 38145098173

**Result: hosted checks and both focused diagnostic browser tests passed; independent exact-run review is pending.** This is evidence for the diagnostic browser flick only. It does not make the match playable or prove deployed Havok.

## Provenance

- GitHub run: [38145098173](https://github.com/folaoluwafemi/korre/actions/runs/38145098173)
- Workflow: `ci`; job `verify` / `114486675740`
- Exact source SHA: `88c8302c8ce4b0d0217de33419efcb8145c11188`
- Run interval: 2026-10-11 13:55:23–13:57:47 UTC; job completed successfully.
- Exact job snapshot, full GitHub log, GitHub artifact API inventory and extracted-file hash inventory are alongside this report. The fetched run artifacts are under `T02-BR02-OBSERVED-MASS-PROJECTION-1-run-38145098173-artifacts/`.

## Hosted results

The workflow recorded 35 successful steps, two failure-only formatting steps skipped after success, and zero failed or cancelled steps. Application test suites reported no skips, retries, flaky or unexpected tests:

- `pnpm verify`: typecheck, lint, format, build and unit tests passed; Vitest reported 29/29 files and 163/163 tests.
- Focused protocol: 12/12; Workers runtime smoke: 1/1; disposable PostgreSQL migration applied and rechecked; integration: 1/1.
- Ordinary built-browser preview: 4/4; diagnostic one-worker Chromium suite: 2/2, with `expected=2`, `skipped=0`, `unexpected=0`, and `flaky=0` in the Playwright result JSON.
- Production diagnostic-route exclusion, dry-run Worker packaging, production browser packaging, and separate diagnostic browser packaging passed. None of these is a deployment.

## Browser evidence

Both focused tests passed: the direct pointer flick, and a case that deliberately blocks one real `.wasm` load, verifies the visible error and failed-instance cleanup, then unblocks the request, retries and completes a real shot. The captured traces record the same actual shot in both cases:

- Selected cap `home-6`; observed impulse `{x:0,y:0,z:8}` at application point `{x:0,y:0.06,z:-4}`.
- `button`/`home-6` contact, cap travel `5.826547096074273`, button travel `2.3875367620379495`.
- All 15 bodies settled; 328 WebGL pixels changed on a 1102×490 canvas.
- Scene facts: 7 home caps, 7 away caps, one button with four visible holes, green-concrete texture, and zero enclosing walls.
- The post-shot teardown and the post-blocked-load/retry teardowns each report 0 engines, 0 listeners and 0 resize observers at a zero-engine baseline.

The exact diagnostic browser build contains `HavokPhysics-BqNY-4N9.wasm` (2,094,563 bytes; SHA-256 `026917766f534c156286f07975850978dabf17c42e742bbfaaebbcb2215e4e11`). The diagnostic app uses the real pinned browser adapter, and both Chromium simulations completed. In the retry test, one request was deliberately aborted and the subsequent retry produced the complete real shot. This run's attached trace does not separately record the post-retry HTTP status code; run 38142200238 recorded HTTP 200 for the same-sized pinned WASM during the preceding readback diagnosis. No exact HTTP status is asserted here.

The screenshots, machine-readable Playwright results and decoded trace/teardown JSON are preserved under this run's `counterball-browser-evidence/` and `diagnostic-evidence/` directories. The two decoded shot traces are byte-identical, while the Playwright JSON retains each test's separately captured attachments and outcomes.

## Scope and next gate

This proves the first actual browser direct shot through real Chromium and the pinned Havok/WASM diagnostic runner. It does not prove ordinary/restart play, goal/foul rules, complete-match lifecycle, real loft over a cap, username-gated AI, two-browser online play, deployed Cloudflare physics, staging, or mobile-device behavior. The separate loft guard remains blocked. Keep T02 and BR02 unaccepted until the exact-run reviewer verifies all required browser and cleanup artifacts; if the missing explicit successful-request status is material under the acceptance criterion, keep the card open and create a bounded evidence packet rather than infer a status.

Exact focused browser outputs and counts are in `...run-38145098173-artifacts/counterball-browser-evidence/.artifacts/browser-test-results-diagnostic.json`, `.../counterball-hosted-checks-88c8302c8ce4b0d0217de33419efcb8145c11188-run-38145098173-attempt-1/e2e-diagnostic.log`, and the trace/teardown files. Full hosted logs and inventories retain their SHA-256 values in the neighbouring inventory records.
