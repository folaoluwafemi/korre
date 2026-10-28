# T02-L01 runtime-runner feasibility audit

**Verdict: the real 24-case matrix is feasible in the existing Chromium diagnostic harness, but the current `pnpm verify` acceptance command cannot prove it.** Keep Node Vitest for pure matrix/guard/serialization tests, and run the actual pinned browser-Havok matrix from a Playwright diagnostic test using the existing direct-probe page and route. No runtime experiment was run for this audit.

## Packet and runner findings

`node scripts/check-completion-plan.mjs --packet T02-L01` reports plan-consistency PASS (87 packets, 21 remaining parents), but `ready: false` because parent T01 is not ACCEPTED. The packet currently writes only `games/counterball/src/simulation/loftCoarseProbe.test.ts` and expects `pnpm verify` to execute 24 real pinned-Havok trials. Its acceptance also forbids a NullEngine substitution and requires actual fixed-step contacts, swept bounds and all-15-body settling.

The current root `pnpm verify` script expands to `pnpm typecheck && pnpm lint && pnpm test && pnpm build`; `pnpm test` is `vitest run`. `vitest.config.ts` collects `games/**/src/**/*.test.{ts,tsx}` in its default Node environment and sets a 10-second test timeout. It does not configure a browser environment or call Playwright. Therefore a `.test.ts` file may test pure probe math and data rules there, but that invocation does not create the supported canvas/WebGL `Engine` required for browser Havok. Substituting `NullEngine` would violate the packet and would not satisfy its evidence. Raising Vitest’s timeout or passing real WASM bytes to Node would not turn the runner into the required browser execution.

The pinned browser path already exists. `@korre/counterball/browser` exports Babylon `Engine`, scene/presentation APIs and `runBrowserDirectProbe` through `games/counterball/src/browser.ts`. `initializeHavokRuntime()` in `games/counterball/src/simulation/havokRuntime.ts` calls the pinned `@babylonjs/havok` package (workspace pins Babylon.js 9.30.0 and Havok 1.3.14). `createCounterballWorld()` accepts a caller-owned `AbstractEngine`, creates a real Physics V2 scene/world and the canonical 15 bodies in `games/counterball/src/simulation/worldFactory.ts`.

The accepted `apps/web/src/CounterballDirectProbe.tsx` page already constructs a real browser `Engine`, calls `runBrowserDirectProbe` after a pointer gesture, and exposes diagnostic results. `tests/e2e/counterball-direct-probe.spec.ts` exercises this page in Chromium, asserts the actual D01 shot evidence, and attaches JSON trace/teardown records. It is the smallest existing place to add a separate, explicit loft-matrix control and test without using the single-shot assertions as loft evidence.

## Minimal browser-backed split

Keep each source card within the five-path limit. These paths assume the coordinator first amends the packet to move physical execution from Vitest to the diagnostic browser suite and leaves the Node test focused on pure checks.

1. **`T02-L01-BROWSER-RUNNER` — five paths:** `games/counterball/src/simulation/loftCoarseProbe.ts`; `games/counterball/src/simulation/loftCoarseProbe.test.ts` (pure helper/matrix/guard/output tests only, no physics); `games/counterball/src/browser.ts` (export the browser runner); `apps/web/src/CounterballDirectProbe.tsx` (a separate diagnostic action and serialized matrix result); `tests/e2e/counterball-direct-probe.spec.ts` (a distinct matrix test, not an extension of the D01 pass criteria). The component supplies its actual browser `Engine`; the runner uses `initializeHavokRuntime()` and the accepted world/placement/sampling APIs.

2. **Routing and CI configuration need no new path.** `playwright.config.ts` already maps `counterball-direct-probe.spec.ts` as a diagnostic spec. `.github/workflows/ci.yml` already has a dynamic `T02-BR02` candidate for that exact file; when present, CI includes it in the diagnostic command. Therefore extending that accepted spec avoids a new spec allowlist or workflow candidate. Keep this packet’s new test separate inside the existing spec and make sure its prerequisites are accepted before dispatch; the workflow’s existing file-presence behavior means any added test in this file runs whenever the diagnostic suite runs.

3. **Use existing evidence transport.** The Playwright test should attach the complete, integrity-checked 24-row JSON via `testInfo.attach("counterball-l01-observations.json", ...)`. The existing `counterball-browser-evidence` upload includes `test-results/`, where Playwright stores attachments. If the coordinator requires a standalone environment-selected JSON file instead of a Playwright attachment, that is an additional explicit workflow-output change and must be included in the packet; it is not provided by `pnpm verify` today. The diagnostic build itself is separately uploaded as `counterball-web-diagnostic-${github.sha}` and is provenance for the page, not proof the matrix ran.

The existing CI build and route are concrete: build the diagnostic bundle with `VITE_COUNTERBALL_DEV_HARNESS=1 pnpm --filter @korre/web exec vite build --outDir dist-dev`, then run the spec with `COUNTERBALL_DEV_E2E=1 COUNTERBALL_PREBUILT_PREVIEW=1 pnpm test:e2e tests/e2e/counterball-direct-probe.spec.ts --workers=1`. In the workflow, the equivalent diagnostic step expands its produced-spec list and runs `COUNTERBALL_DEV_E2E=1 COUNTERBALL_PREBUILT_PREVIEW=1 pnpm test:e2e $diagnostic_specs --workers=1`. `COUNTERBALL_DEV_E2E=1` selects `apps/web/dist-dev`; it takes precedence over `COUNTERBALL_PREBUILT_PREVIEW=1`, so this cannot silently serve the production build. The verify job has a 20-minute total timeout, including `pnpm verify`, integration, production browser checks, diagnostic build and diagnostic browser tests; the matrix runtime must be measured within that hosted budget.

## Dependencies and limits

The packet checker blocks dispatch until parent T01 is ACCEPTED. The original C00-B/C01/T02-B0/T02-C0/T02-C2/C00 dependencies must also remain ACCEPTED. The packet additionally requires a frozen, config-hashed per-substep guard or an instrumentable accepted guard; the current direct-shot browser API and its diagnostic guard do not themselves establish that L01’s swept/traversal requirements are bounded. Do not start the matrix until the relevant guard contract/config and its source are accepted. C01-H routing is already wired, but its earlier accepted run’s empty diagnostic collection was only harness evidence; it is not evidence of this 24-case matrix.

The exact browser command, live runner and artifact transport have not been tried for L01. This report does not claim any Havok trial, candidate traversal, browser result, no-tunnelling result or gameplay calibration. A fresh exact-SHA hosted run must collect the matrix test, run the full fixed 24 tuples without skips/truncation, preserve all rows and prove the source/build/artifact provenance before review can accept it.

## Commands and checks performed

- Ran `node scripts/check-completion-plan.mjs --packet T02-L01`; plan consistency passed, readiness remained false due to T01.
- Read the packet extraction, `vitest.config.ts`, `playwright.config.ts`, root `package.json`, `games/counterball/package.json`, the browser runner/runtime/world factory, the accepted direct-probe component and spec, `.github/workflows/ci.yml`, and completion `OPERATIONS.md`.
- Used read-only PowerShell/`rg` inspection for the source and routing lines cited above.
- No install, application test, typecheck, lint, build, browser run, Havok call or deployment was performed.
