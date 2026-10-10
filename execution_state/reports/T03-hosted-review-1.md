# T03 hosted integration re-review

Verdict: **PASS. Recommend T03 ACCEPTED** for the static scene/preview scope. Coordinator owns the status transition. No source, workflow, task status or ledger was edited.

## Direct hosted evidence

Independently queried GitHub through read-only `gh run list`, `gh run view 38038093924 --json ...`, and `gh run view 38038093924 --log`. Commands exited 0. This confirms [run #6](https://github.com/folaoluwafemi/korre/actions/runs/38038093924) completed successfully on commit `80cd26b4029e368f755f21a57e976c6e3f396c37`, with the [verify job](https://github.com/folaoluwafemi/korre/actions/runs/38038093924/job/114172663994) completed at 2026-10-10 08:32:23 UTC.

| Hosted step | Directly observed result |
| --- | --- |
| `pnpm verify` | Step conclusion `success`. The logged command chains typecheck, lint, tests and build with `&&`, so successful completion covers that chain. Visible log output confirms workspace/root typecheck, ESLint/Prettier and passing scene/pieces tests; Prettier reports all matched files formatted. No separate build-summary or whole-unit-suite total is claimed from the filtered log. |
| `pnpm test:integration` | Step conclusion `success`; log reports one file/one test passed. This is the health integration test, not PostgreSQL identity acceptance. |
| `pnpm test:e2e --workers=1` | Step conclusion `success`; log explicitly reports `Running 3 tests using 1 worker` and `3 passed (29.5s)`. |

Inspected the workflow at the exact hosted commit rather than assuming the current workflow applied. The relevant T03 source/test paths have no working-tree diff against that commit, so the hosted result applies to the implementation reviewed here. No local build/test/lint/typecheck/formatter/server was run during this re-review.

## Scope and earlier findings

Read the T03-A/B/C, repair-1 and repair-2 packets; implementation/review reports; and current scene, preview route, component and E2E source. Earlier actual desktop, button-inspection and 390×844 screenshots were inspected in the prior independent reviews; those visual observations remain evidence, not newly downloaded hosted screenshot artifacts.

- **Pitch and pieces pass.** Procedural green concrete remains open at its perimeter, with two open goals and mirrored penalty boxes using canonical geometry. Piece geometry preserves all fifteen stable IDs/fixture positions/quaternions, seven caps per side, original non-colour stripe/rosette team cues and plastic-button material. Geometry tests prove four true openings, and the previously inspected real Chromium inspection screenshot shows all four plainly visible. No downloaded trademark artwork or gameplay behavior was introduced.
- **Inspection, return and narrow viewport pass.** Accessible native inspect/return controls change the existing camera only, preserving fixture scale and restoring the saved full-pitch view. The hosted E2E retains actual WebGL2 checks, piece count/labels, inspection/return state assertions, post-mount resize to 390×844, control visibility and document/body no-horizontal-overflow checks. Both preview specs are part of the three passing hosted tests.
- **Lifecycle pass.** The preview owns the Engine, Scene, render loop, window resize listener and ResizeObserver. Normal cleanup stops/disconnects/disposes these. Hosted E2E navigates home, verifies removal of canvas and tracked animation frames/listeners returning to baseline, then remounts successfully.
- **Prior preview timeout is covered.** The earlier independent laptop run could not resolve the lazy preview heading. The current hosted browser run exercises both home-link navigation and direct `/preview` loading with the same bounded assertions and passes. The observed verification gap is closed for this commit/environment; no unsupported claim is made about the root cause of the earlier laptop failure.
- **Typing and lint findings are closed.** Both Playwright evaluate callbacks now use inferred generics with explicit `string | null` callback return types. Hosted root typecheck and E2E pass. The unused Vector3 import is removed, and hosted root lint/format passes. CSS semantic lint remains unavailable under the repository's JS/TS ESLint configuration; CSS formatting is covered by Prettier, not misrepresented as CSS semantic lint.

No remaining actionable T03 finding was identified. The preview stays explicitly static/non-playable. This PASS does not accept T02, calibration artifact content or coefficient selection, Cloudflare-deployed physics, PostgreSQL-backed identity (hosted identity DB tests are skipped), gameplay, or later dependent features. Narrow Chromium emulation is not physical phone proof. Keep those gates separate.
