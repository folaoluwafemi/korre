# T02-L01-TRANSPORT-HARNESS-1 pointer repair source review

**SOURCE: PASS. RUNTIME: NOT VERIFIED.**

The exact diff is limited to `tests/e2e/counterball-direct-probe.spec.ts`, an existing authorized write path. The helper `canvasBoundsInsideViewport` scrolls the canvas before reading `boundingBox()` and asserts all four canvas edges are within `page.viewportSize()` (`:156–171`). In `flickAndReadTrace`, the existing baseline screenshot completes before the fresh helper call and final bounds read (`:219–245`), so screenshot scrolling cannot leave the measured box stale. The blocked-WASM test calls the same scroll-then-measure helper immediately before its pointer calculation (`:366`).

Both tests compute the same start and end coordinates as before: start at 20% width/78% height and drag 64px right and 32px up. `assertPointerPointsInsideViewport` checks both endpoints against the current viewport before any `page.mouse` call (`:174–188`, `:233–245`, `:366–378`). Thus the change addresses both recorded off-screen gestures without changing their relative movement.

The diff adds no conditionals, skips, or weakened expectations. The direct-flick assertions for the fixed impulse, settling, contact, body movement, changed WebGL pixels, and teardown remain unchanged (`:275–305`, `:318–350`). The blocked-WASM failure, request observation, cleanup, retry, second real flick, and teardown checks remain unchanged (`:380–422`). The full-cap transport test has no diff. This matches the approved bounded-repair review and the exact run 38443895020 trace diagnosis.

No local app checks, browser tests, builds, or runtime checks were run for this source review. The implementation report records its scoped whitespace check, but the two pointer tests and complete hosted diagnostic suite still require exact-head GitHub verification; the prior run remains failed evidence.
