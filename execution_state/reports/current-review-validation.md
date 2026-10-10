# Review before user testing — final validation

Status: browser cleanup repair pending. Hosted run 38056114718 on `fadb7a3c5bf3fd624d37f80fd54dbcb60f8da446` passed verification/build and integration but failed one browser case. No complete review acceptance is claimed yet.

## Changes reviewed

- Static WebGL preview: pointer orbit, touch/pinch and labelled keyboard controls; view reset/button inspection; skip navigation, scene description and live status; idle/background rendering savings and capped device pixel ratio; startup/context-loss retry and resource cleanup.
- Identity/database: bounded migration waits, deterministic SQL checksums with equivalent legacy newline history; real HTTP-to-PostgreSQL claim/session/CSRF/logout/recovery tests; real migration rollback/checksum/lock failure tests. Existing secure-secret authentication remains; username alone cannot authenticate.
- Physics/protocol: D38 canonical positive clearance margin `0.005` game units, explicitly provisional; synchronized types/schema/hash fixture; separate peak/minimum/sampled/contact diagnostics; no loft or continuous-traversal claim. Seven caps per side and visible four-hole button remain.
- Remote verification: disposable GitHub PostgreSQL, migrations twice, complete verification log and structured browser results, tests against remotely built browser files, downloadable preview. No Railway/Wrangler service changed.

## Actual evidence to complete

Independent source reports are `current-physics-review.md`, `current-identity-review.md`, `current-identity-runtime-review.md`, `current-browser-review.md`, `current-browser-repair-review.md` and `current-coordinator-review.md`. The independently inspected run-22 physics artifact is recorded in `current-physics-runtime-review.md`. It has 40 real Havok trials, all settled; seven exceed the margin at their peak but also hit the obstacle. The candidate list is empty and successful loft remains unproven.

Run 22 passed its Verify and integration steps but failed two browser cases. Focused test-setup repairs were independently reviewed before the fresh run. Earlier failures and fixes are retained in `current-coordinator-improvement.md`; a red workflow is never described as a full pass.

Run 23's complete verification artifact confirms 24 files and 98 tests passed, with zero skips; all type/lint/format/build steps passed. The real database cases include eight repository cases, two HTTP composition cases and five migration-runner cases. Migrations also applied/rechecked twice; the separate health integration test passed. Independent T11 scope review passed in `current-identity-runtime-review.md`; application-code rollback is supported by additive-schema inspection, not a prior-binary boot rehearsal. Three browser cases passed, including emulated mobile camera/reachability. The remaining case now correctly prevents WebGL startup and exposed one leaked resize listener from partially constructed Babylon. The browser author is repairing owned partial-constructor listeners and engine-registry retention; recovery has not yet passed.

## Current product limits and resume

The user's testable flow is scene inspection, not a playable match. The canonical shot runner, decisive crossing/contact facts, typed timeout/cancellation and actual restart loft still need T02 acceptance. T04 deployed Cloudflare Havok and T05 real browser flick remain unfinished. Scoring/full matches, AI, public identity UI, online rooms and social features are later work. `/health` is liveness; deployed database readiness must be addressed in the deployment work. Mobile checks are Chromium viewport/synthetic-touch emulation; real Android and iOS are unverified.

Do not request a numerical epsilon from the user again. Preserve D38's engineering-default label and continue T02 through bounded runner/facts/calibration packets. Only ACCEPTED dependencies unblock later work. No new user requirement or deployment credential is needed for those source tasks.

No local install, compilation, application tests, physics run or database service occurred during this review. User preview may run a lightweight loopback server that serves only the GitHub-built files, with no build.
