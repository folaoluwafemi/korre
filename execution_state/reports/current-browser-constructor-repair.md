# Run 23 partial Babylon constructor repair

## Failure evidence and cause

Run 38056114718 (`fadb7a3`) passed the 98 unit tests, build, integration checks, and mobile browser test. The WebGL failure/recovery browser test failed at `tests/e2e/counterball-preview.spec.ts:412`: it expected zero window resize listeners after startup failure and observed one.

The pinned Babylon 9.30.0 source explains the leak. `AbstractEngine` adds the new instance to `EngineStore.Instances` at `abstractEngine.pure.js:1165`. The canvas path in `ThinEngine` calls `_setupMobileChecks()` at `thinEngine.pure.js:145`; that adds a `window` resize listener at `abstractEngine.pure.js:1361`. ThinEngine also adds canvas context listeners before it requests WebGL at `thinEngine.pure.js:195–230`. When the constructor throws because no context is available, `engine = new Engine(...)` never assigns the partially initialized object, so the component's normal `dispose()` cannot reach it. The run 23 error context confirms the resize listener remains after the failure.

## Repair

`apps/web/src/CounterballPreview.tsx` now checks that the preview canvas can acquire one of Babylon's supported WebGL context names before creating an Engine. For a failure after that preflight, `createPreviewEngine` temporarily journals listener registrations made synchronously by the Babylon constructor. If construction throws, it removes only those exact target/type/listener/capture registrations, then removes only `EngineStore.Instances` entries absent from the identity snapshot taken before construction. Existing engine entries are retained. The temporary `EventTarget.prototype.addEventListener` wrapper is restored in `finally`; successful construction keeps its registrations for the normal engine disposal path. The existing `doNotHandleContextLost: true` option and app-owned context recovery flow remain in place.

The browser test retains the case where all four WebGL context names are blocked before preflight. It adds a separate case where preflight obtains a real context, then the test hook rejects Babylon's later constructor requests. After this partial-constructor failure, the test checks the listener count and EngineStore instance count both return to zero, then allows a retry on the same canvas and checks a real WebGL2 engine is registered. The EngineStore count is exposed only through the lifecycle object injected by the E2E test harness. The test does not create a second simultaneous preview engine, so preservation of an already-live engine is protected by the identity-snapshot cleanup and source-reviewed rather than separately exercised in-browser.

## Verification status

No local build, test, formatter, install, or server command was run, as required. The run 23 hosted checks are the failure evidence above. Verification of this repair is pending the coordinator's hosted run, including `pnpm verify`, `pnpm test:integration`, and all four E2E tests with one worker. In particular, the new post-preflight constructor-failure path and retry have not yet run in a browser.

## Review follow-up

The independent review identified that the local wrapper needs an explicit `this: EventTarget` parameter under `noImplicitThis`. That annotation was added. The context preflight does not promise to avoid WebGL allocation when supported: it requests a native context first. It avoids constructing a Babylon Engine when no supported context can be obtained; the separately injected late-failure E2E path is intended to exercise cleanup after successful preflight.
