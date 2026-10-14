# T02-L01-GEOMETRY-READBACK-1 packet review

**Verdict: PASS.** The bounded packet is coherent for diagnostic disclosure and has one feasible source path. This review does not authorize implementation or establish a runtime result.

## Scope and graph

The exact packet extraction preserves one source write path: `games/counterball/src/simulation/loftCoarseRunner.ts`. Its 14 explicit dependencies are `C00-B`, `C01`, `T02-B0`, `T02-C0`, `T02-C2`, `C00`, `T02-L01-EXECUTOR-1`, `T02-L01-GUARD-CONTRACT-1`, `T02-L01-GUARD-SCHEMA-1`, `T02-L01-PACKET-SPLIT-1`, `T02-L01-TRANSPORT-1`, `T02-L01-SUPPORT-PREFLIGHT-1`, `T02-L01-SUPPORT-F32-1`, and `T02-L01-MATERIAL-DIAGNOSTIC-1`. All 14 are recorded `ACCEPTED` in the T02 `packet_progress`; the inherited parent gate is also satisfied (`T01=ACCEPTED`). The superseded `T02-L01-MATERIAL-F32-1` is `CHANGES_REQUIRED`, not accepted. The checker’s `supersedes` edge closes/orders that failed overlapping-write card; it is not an acceptance dependency and does not accept its behavior.

The exact plan checker exited successfully with `verdict: PASS` for plan consistency. It reports this card `ready:false`, matching its current `REVIEWING` state in T02 `packet_progress`; that is the expected state while this independent packet review is pending, not an unmet dependency. The revised step requires the coordinator, after a PASS, to set the card to READY, run and record an exact extraction with `ready:true` while it is still READY, and only then dispatch. If that pre-dispatch evidence is missing, implementation must stop. Once status changes to RUNNING, the extractor’s `ready:false` is expected and must not be treated as a new dependency failure.

## Feasibility and preserved behavior

The current `shapeDimensions` helper reads `shape.getBoundingBox()` once and computes each dimension from that result ([loftCoarseRunner.ts](/C:/Users/USER/StudioProjects/korre/games/counterball/src/simulation/loftCoarseRunner.ts:429)). In `readNativeBodies`, the button’s configured radius/thickness and strict equality checks are already available at the comparison site ([loftCoarseRunner.ts](/C:/Users/USER/StudioProjects/korre/games/counterball/src/simulation/loftCoarseRunner.ts:948)). A small return-shape refactor can carry that same AABB’s min/max and computed dimensions to the existing failure detail without requiring another source path or another native read.

The requested detail is bounded to fixed primitive facts: body ID, native shape type, configured radius/thickness, expected dimensions, the same AABB’s local minimum/maximum, and computed dimensions. The existing exact comparisons at lines 958–962 can remain textually/semantically unchanged; only the existing failure message needs to consume the captured readback. The `resourceFailure` path remains in `readNativeBodies`, which runs before the impulse at line 1673 and before any `executeStep` call at line 1931. The source-review diagnosis records that the pinned Babylon getter returns a local AABB; therefore button rotation alone should not be presented as the explanation. The mismatch remains unresolved until real browser Havok exposes min, max, and dimensions.

I also confirmed that the browser panel forwards `Error.message` into the matrix alert (`CounterballDirectProbe.tsx:169–172, 814–816, 1278–1281`) and the existing E2E captures the matrix error when download does not occur (`counterball-direct-probe.spec.ts:2808–2812`). That gives the hosted route a concrete way to retain the new bounded detail without expanding this packet’s write ownership.

## Hosted evidence boundary

The requested exact-SHA hosted `pnpm verify` and one-worker real pinned-WASM Chromium route are concrete. The route is diagnostic: it is expected to stop at the strict preflight, expose the raw AABB values in the captured failure context, execute no physics case, and produce no successful matrix download/artifact. The packet explicitly requires zero skips/retries/flakes and independent source/run reviews, while not claiming the E2E route itself will be green: the expected preflight error is the result being diagnosed. No source, runtime, matrix, material-semantics, parent-T02, or playability check was run by this reviewer.

The hosted route must compare the exposed configured/expected dimensions with the native local AABB and computed dimensions from that single read, tie evidence to the exact source SHA, and preserve the no-impulse/no-step/no-success-artifact outcome. It must not infer the mismatch cause, introduce a tolerance/projection, alter geometry/material/physics, accept `MATERIAL-F32-1`, or accept MATRIX-1/T02.

## Checks performed

- `node scripts/check-completion-plan.mjs --packet T02-L01-GEOMETRY-READBACK-1` — exit 0; plan consistency PASS; packet `ready:false` because it is currently REVIEWING.
- Read-only inspection of the exact packet and listed proposal, source/review/run/diagnosis inputs; task-state check for all 14 accepted dependencies and inherited T01; targeted source inspection of the runner and error display path.
- No local application checks, builds, tests, browser runs, or physics runs.

## Re-review of revised dispatch-readiness step

**Re-review verdict: PASS.** I re-extracted the card after the step-1 revision and rechecked its task-state dependencies. The revised wording closes the only ambiguity: it distinguishes a recorded pre-dispatch READY extraction from the expected later RUNNING-state `ready:false`, and makes the former a hard stop condition when absent. The current card remains `REVIEWING`, so this re-review does not authorize dispatch.

- Current T02 state: `RUNNING`; packet state: `REVIEWING`, `ready:false`; `T01=ACCEPTED`.
- All 14 explicit dependencies remain `ACCEPTED`.
- Exact write path remains `games/counterball/src/simulation/loftCoarseRunner.ts`; `supersedes` remains only `T02-L01-MATERIAL-F32-1`.
- Plan checker: `verdict: PASS`; its selected packet output is `ready:false` because the card is REVIEWING.
- Packet record digest: SHA-256 `4ef8a9e42234e8f9a6a8a1f0d516ce580d37e7e0fad6c6024cb05e6c41bcfae9` over `JSON.stringify` of the parsed packet record. Catalogue snapshot SHA-256: `F8E99565DBCB3D8203996A5D6F2B6A0CCD061513AF57A87E60CD6CD2E9593D34`.
- No source or shared status was edited, and no implementation was dispatched. Before dispatch, the coordinator must record the exact `ready:true` extraction while the packet status is READY; absence of that record remains a stop condition.
