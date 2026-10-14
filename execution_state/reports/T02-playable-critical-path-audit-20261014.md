# Counterball T02 playable critical-path audit — 2026-10-14

**Finding:** T02 is REVIEWING. The foundations and early diagnostic work are accepted, but no reusable one-shot production runner or complete playable local match exists yet. A real pointer flick was shown in the diagnostic browser; that is not the product flow. `T02-L01-GOALFRAME-READBACK-1` has passed independent source review; exact-hosted run 38624231947 is in progress, so runtime evidence remains unverified.

## Current accepted work and immediate blocker

`T01` and `T03` are ACCEPTED. Within T02, the accepted building blocks include the world/calibration probes (`T02-A`, `T02-B0/B1/B2`), restart-pose and sampling helpers (`T02-C0/C2`), fact production (`T02-F01-ROTATION-1`), direct impulse observations (`T02-D01`), scene update/picking (`T02-P01`), and browser diagnostic shot (`T02-BR01/BR02`). The L01 serializer, contacts, executor, browser/transport flow and exact support-thickness check are also accepted within their diagnostic scopes. These do not accept parent T02.

The latest completed L01 matrix run was 38618192294 on SHA `4d8a4d8da2827074ddd2767c3978e62fb305f9fc`. Verify, integration and the production preview passed; the diagnostic Chromium suite had 3 passes and 1 failure with zero skips/retries/flakes. The matrix failed at `goal-frame-0` strict native dimensions before any impulse or `executeStep`; there are no completed tuples or matrix artifact. The same run passed the support-apron projection and the prior dynamic-body checks. The saved error has no actual goal-frame dimensions, which is why the current same-AABB readback card is needed.

Current relevant task state: `T02-L01-GOALFRAME-READBACK-1` is REVIEWING (source PASS; exact-hosted run 38624231947 in progress); `T02-L01-MATRIX-1` and `T02-L01-GEOMETRY-F32-1` are CHANGES_REQUIRED; `T02-L01-DIAGNOSTIC-APRON-F32-1` is SUPERSEDED. The parent `T02-L01` remains PLANNED, and T02 is REVIEWING. Preserve the inherited T01 gate.

## Minimum ordered work to accept T02

1. The source review for `T02-L01-GOALFRAME-READBACK-1` passed. Complete the in-progress exact-hosted run and obtain its independent evidence review. It should disclose the compared dimensions and raw bounds from one read, then stop before physics. Do not infer a Float32 mismatch in advance.
2. Use those values to decide whether a narrow exact representation contract is justified. If so, review and accept that contract before implementation. Keep raw native dimensions, strict exact equality to the approved projection, and all other checks unchanged. The dynamic-cylinder projection and apron-Y projection are already in the current source; this blocker is the static goal frame.
3. Use one successor source/test change for the evidence-backed goal-frame rule, then one exact-head hosted run through the existing full 24-case matrix test. Require all 24 tuples, the complete schema/hash/provenance artifact, zero skips/retries, independent source review and raw artifact/run review. Do not run a second copy of the matrix test. Once the matrix evidence is complete, finish the L01 integration/acceptance card; L01 remains diagnostic evidence, not a playable shot or parent-T02 acceptance.
4. Run `T02-L02`, the single bounded refinement or explicit no-eligible-restart result. A no-candidate result leaves calibration open. The accepted D01 impulse rows and the 480-row calibration probe are measurements only; they do not prove whole-button traversal or all-15-body settling.
5. Complete coordinator calibration handoff `C02` then `C03`. C02 depends on L02, D01 and C01-H, and requires actual collision-free whole-button traversal and all-15 settling before freezing measured material/damping/impulse/support settings. C03 hands that canonical config to the runner. Neither C02 nor C03 is recorded accepted in current task progress. `physicsCalibration` is still `null`; the existing evidence does not set a production power mapping.
6. Implement `T02-W01` from accepted C03 values, then `T02-R01` production runner/host entrypoints. After R01 is accepted, `T02-R02` direct-WASM proof and `T02-R04` lifecycle/cleanup proof have disjoint test files; `T02-E01` browser factory has a separate `browser.ts` path. They can be source-reviewed as bounded packets and verified in one exact-hosted source wave if their exact dependency records remain satisfied. Next, prove restart traversal in `T02-R03`, crossing/stress/cleanup in `T02-R06`, production-path direct-browser shot in `T02-R05`, and browser restart in `T02-R07`, following their explicit dependencies. T02 acceptance still requires the actual pinned-Havok results; diagnostics and a successful compile are insufficient.

## Concrete production exports still missing

The package declares `@korre/counterball/headless`, but `games/counterball/src/headless.ts` currently exports only `scaffoldPackage`; `games/counterball/src/simulation/runner.ts` does not exist. Therefore there is no canonical reusable one-shot/headless executor entry for local or authoritative callers. `T02-R01` owns that shared implementation and its `headless.ts` export. `T02-E01` must then export the real-WASM browser runner factory from `games/counterball/src/browser.ts`.

Current `browser.ts` exports `runBrowserDirectProbe` and `runLoftCoarseMatrix`, plus scene APIs. Those are bounded diagnostics, not a production per-shot runner. Useful shared pieces already exist: `createCounterballWorld`, `initializeHavokRuntime`, `deriveSimulationFacts`, `createPlaybackSampler`, and disposal. Reuse these through R01; do not fork a local gameplay runner beside the diagnostic matrix. The latest real flick belongs to the diagnostic panel and does not submit a normal match command.

## Calibration, local flick and match

D37 gravity, D38 clearance margin and D39 workload limits remain provisional engineering settings. The current observation reports do not establish a user power-to-impulse mapping, chosen damping/restitution feel, or confirmed restart loft. D01 is explicitly a fixed diagnostic impulse, not normalized player power. C02/C03 and subsequent playtest remain the route for evidence-backed settings; no new human rule clarification is required to proceed.

After T02 is accepted, T05 can build the actual pointer/touch/keyboard flick and camera flow; T03 is already accepted. The existing BR02 pointer flick proves that a diagnostic browser shot can move pixels, not that a user can play. T06's source work must also wait for T02 ACCEPTED because its exact dependency record includes T01 and T02. After T02/T03, implement T05 and T06; once both packets are ready and their exact gates allow, their disjoint areas can proceed in parallel. Then complete T07 formations/legal restarts, T08 restart UI/HUD, and T09 local match integration; T07→T08→T09 retain their existing dependencies. A full first-to-three local match requires T09, not just the first flick.

Cloudflare T04 deployment proof is separate from this local path. It remains required before claiming deployed Worker Havok or online authority, but it need not block the local first flick or local match.

## Efficiency guidance

- Finish the already-running goal-frame readback before touching the runner again; no overlapping runner writer.
- Reuse the single existing diagnostic browser spec and its full matrix test. Do not repeat the accepted BR01/BR02 diagnostic or create another 24-case test. The current exact route already proved support and dynamic preflights and then pinpointed the next gate.
- Bundle only dependency-ready, disjoint test/export packets into a hosted wave (not across R01's required W01/C03 gate). One exact-hosted run can cover their common Verify suite; keep the full browser route and all no-skip/artifact checks.
- Keep implementation source-review and run/artifact review separate. Accept each narrow diagnostic for what it proves, then accept T02 only after its production-runner, direct shot, loft/restart, failure/cleanup, bounds and browser gates all pass.

## Status update (2026-10-14)

The independent source review for `T02-L01-GOALFRAME-READBACK-1` passed. Exact-head GitHub run `38624231947` on SHA `d41c04a068543df8e1cc1b0e92dc0330e09a6e9c` is in progress; its runtime result is not yet verified. This updates step 1 above, but does not change the remaining matrix, calibration, production-runner, or local-match gates.
