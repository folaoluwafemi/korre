# Browser synchronization repair

## Scope and evidence

Run 38057030306 (`3ef3e784151ac68fee293f1001346f0d71496725`) is the source of the two failures addressed here. Its downloaded Playwright result JSON and failure context are under `.artifacts/run25-browser/`. The mobile resize assertion expected a canvas backing width no greater than 524 pixels but observed 1821 immediately after returning to the 390-pixel viewport. The retry passed. The context-loss test reported `WEBGL_lose_context` support, then timed out waiting for restoration on both attempts; its post-loss lookup was asking the lost WebGL context for a fresh extension handle.

## Bounded changes

In `tests/e2e/counterball-preview.spec.ts`, the mobile flow now waits for a resize-triggered render and polls until the positive canvas backing dimensions satisfy the same 1.5 device-pixel-ratio cap already asserted by the test. It then runs the original exact viewport, overflow, and pixel-cap assertions. This synchronizes the check with the browser's resize/render lifecycle; it does not relax the cap or alter the overflow limits.

The context-loss flow now obtains a `WEBGL_lose_context` extension handle before losing the context, invokes both `loseContext()` and `restoreContext()` through that retained browser handle, and disposes it in `finally`. It does not synthesize context events. The unsupported-extension branch, real loss/restoration assertions, retry, rendered WebGL 2 proof, and the existing unsupported-startup, partial-constructor cleanup, engine/listener baseline, and retry checks remain in place.

## Verification

No local build, test, formatter, or server command was run, as required by the packet. Hosted verification of this change is pending. The previous run's failures and retry are evidence for the diagnosed races, not a pass for this repair.
