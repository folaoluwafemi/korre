# Review before user testing — final validation

Status: ACCEPTED after independent source/runtime review and final hosted verification. Run [38057543954](https://github.com/folaoluwafemi/korre/actions/runs/38057543954) verified source commit `22a7375e1b57a01d1bd91e23f18749ed7096d4a8`. Earlier failed runs below are retained as history.

## Changes reviewed

- Static WebGL preview: pointer orbit, touch/pinch and labelled keyboard controls; view reset/button inspection; skip navigation, scene description and live status; idle/background rendering savings and capped device pixel ratio; startup/context-loss retry and resource cleanup.
- Identity/database: bounded migration waits, deterministic SQL checksums with equivalent legacy newline history; real HTTP-to-PostgreSQL claim/session/CSRF/logout/recovery tests; real migration rollback/checksum/lock failure tests. Existing secure-secret authentication remains; username alone cannot authenticate.
- Physics/protocol: D38 canonical positive clearance margin `0.005` game units, explicitly provisional; synchronized types/schema/hash fixture; separate peak/minimum/sampled/contact diagnostics; no loft or continuous-traversal claim. Seven caps per side and visible four-hole button remain.
- Remote verification: disposable GitHub PostgreSQL, migrations twice, complete verification log and structured browser results, tests against remotely built browser files, downloadable preview. No Railway/Wrangler service changed.

## Actual evidence

Independent source reports are `current-physics-review.md`, `current-identity-review.md`, `current-identity-runtime-review.md`, `current-browser-review.md`, `current-browser-repair-review.md` and `current-coordinator-review.md`. The independently inspected run-22 physics artifact is recorded in `current-physics-runtime-review.md`. It has 40 real Havok trials, all settled; seven exceed the margin at their peak but also hit the obstacle. The candidate list is empty and successful loft remains unproven.

Run 22 passed its Verify and integration steps but failed two browser cases. Focused test-setup repairs were independently reviewed before the fresh run. Earlier failures and fixes are retained in `current-coordinator-improvement.md`; a red workflow is never described as a full pass.

Run 23's complete verification artifact confirms 24 files and 98 tests passed, with zero skips; all type/lint/format/build steps passed. The real database cases include eight repository cases, two HTTP composition cases and five migration-runner cases. Migrations also applied/rechecked twice; the separate health integration test passed. Independent T11 scope review passed in `current-identity-runtime-review.md`; application-code rollback is supported by additive-schema inspection, not a prior-binary boot rehearsal. Three browser cases passed, including emulated mobile camera/reachability. The remaining case now correctly prevents WebGL startup and exposed one leaked resize listener from partially constructed Babylon. The browser author is repairing owned partial-constructor listeners and engine-registry retention; recovery has not yet passed.

## Final hosted result

The final run passed frozen installation, all workspace type/lint/format checks and builds, 98 tests across 24 files with zero skips, migrations twice on disposable PostgreSQL, one health integration test and four built-browser cases. Browser JSON has four expected passes, zero unexpected/flaky/skipped cases and no retries. Native graphics-context loss was supported and actual restoration/retry executed. Unsupported preflight and a partially constructed engine both cleaned up before genuine retry. The earlier failed constructor and browser synchronization results above are superseded by this run; their original reports remain.

Independent final browser evidence review passed in `current-browser-sync-repair-review.md` and `current-browser-constructor-repair-review.md`; final database/build confirmation passed in `current-identity-runtime-review.md`. T11 API/database scope and the bounded T02-B2 diagnostic are ACCEPTED. Parent T02 remains RUNNING. No application-code rollback binary rehearsal was run. The migration failure tests exercised actual transaction rollback.

Screenshots: [full pitch](current-preview.png), [four-hole button](current-button-inspection.png), [emulated mobile](current-mobile-preview.png). The downloaded browser artifact is `.artifacts/browser-preview-final`; the intended loopback preview is <http://127.0.0.1:4173/preview>, served with `node scripts/serve-preview.mjs .artifacts/browser-preview-final`. Preview startup is recorded below after it actually runs.

## Current product limits and resume

The user's testable flow is scene inspection, not a playable match. The canonical shot runner, decisive crossing/contact facts, typed timeout/cancellation and actual restart loft still need T02 acceptance. T04 deployed Cloudflare Havok and T05 real browser flick remain unfinished. Scoring/full matches, AI, public identity UI, online rooms and social features are later work. `/health` is liveness; deployed database readiness must be addressed in the deployment work. Mobile checks are Chromium viewport/synthetic-touch emulation; real Android and iOS are unverified.

The scene is lazy loaded, but its current minified scene chunk is about 6.22 MB (1.37 MB gzip) and the hosted build reports a size warning. Further module/bundle reduction belongs in the later presentation work; this review does not claim a measured network-performance target. Constructor cleanup addresses observed no-context failures and exact synchronous listener/registry retention, not every hypothetical later driver-resource failure. Other live engine identities are protected by a source-reviewed snapshot; simultaneous engines were not independently exercised in the current single-preview browser flow.

Do not request a numerical epsilon from the user again. Preserve D38's engineering-default label and continue T02 through bounded runner/facts/calibration packets. Only ACCEPTED dependencies unblock later work. No new user requirement or deployment credential is needed for those source tasks.

No local application dependency install, compilation, application tests, physics run or database service occurred during this review. Documentation tooling and source/data inspection were lightweight local work. The preview server started successfully at <http://127.0.0.1:4173/preview> from the GitHub-built files, with no build; its HTTP HEAD returned 200 with HTML content type. Opening the Codex browser panel was requested; the app returned queued, so visible opening is not independently confirmed. To restart later, run `node scripts/serve-preview.mjs .artifacts/browser-preview-final`; Ctrl+C stops it. All source/runtime review writers completed and released their paths; the final coordinator record review is separate.

Final coordinator record consistency review: PASS in current-review-final-review.md. All three subagents have finished; no subagent is still running. The final evidence/documentation commit changes no application source, tests, dependencies or CI config from the verified source SHA, so it uses [skip ci] to avoid a duplicate hosted build.
