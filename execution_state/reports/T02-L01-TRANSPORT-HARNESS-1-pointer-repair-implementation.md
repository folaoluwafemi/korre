# T02-L01-TRANSPORT-HARNESS-1 pointer repair implementation

## Change

Updated `tests/e2e/counterball-direct-probe.spec.ts` only. Both pointer gestures
now scroll the canvas into view, obtain fresh canvas bounds, and fail unless the
full canvas rectangle is inside `page.viewportSize()`. The direct-shot helper
reads those bounds after the pre-shot screenshot, since the screenshot can
scroll the page. Both gestures calculate the same start point and 64-by-32-pixel
drag as before, then explicitly assert that the start and end points are inside
the current viewport before sending pointer events.

The real-Havok result checks, blocked-WASM expectation, retry and teardown flow,
and full-cap transport assertions were left unchanged.

## Checks

- `node scripts/check-completion-plan.mjs --packet T02-L01-TRANSPORT-HARNESS-1` — exit 0; plan consistency verdict PASS. The packet is already RUNNING, so the extractor reports `ready:false` and `initialReady:[]`; its required parent gate remains T01.
- `git diff --check -- tests/e2e/counterball-direct-probe.spec.ts` — exit 0; no whitespace errors.
- Browser/E2E tests, builds, and runtime checks — NOT RUN, as required by the packet.

This source change fixes the diagnosed stale/off-viewport coordinates. It does
not establish that the real-Havok flick or retry succeeds; exact-head hosted
verification and independent review remain pending.
