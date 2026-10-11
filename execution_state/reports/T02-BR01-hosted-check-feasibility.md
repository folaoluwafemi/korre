# T02-BR01 hosted-check feasibility

Source-only feasibility: the current GitHub job can host a real Chromium Babylon/Havok diagnostic without a new job or package script. It does **not** already execute BR01. The diagnostic function and direct-probe browser spec are absent; the current renderer diagnostic explicitly says no physics/Havok runs. No probe result is claimed.

## Existing hosted path

I inspected `.github/workflows/ci.yml`, root/web/game scripts, `playwright.config.ts`, `scripts/serve-preview.mjs`, the current app/browser entry/runtime loader, and the BR01/BR02 records. No install, build, test, browser, physics, service or deployment command ran. Only this report was written.

The existing `verify` job uses Ubuntu, frozen pnpm installation and pinned Playwright 1.64.0, and installs Chromium with dependencies. It runs workspace verification and production browser regressions before building `apps/web/dist-dev` with `VITE_COUNTERBALL_DEV_HARNESS=1`. Its diagnostic build artifact already has exact source SHA, run/attempt, build mode and SHA-256 for emitted files.

`playwright.config.ts` recognizes `counterball-direct-probe.spec.ts` in diagnostic mode, serves compiled `dist-dev` through the static preview server, selects real Chromium, disables retries, and writes `.artifacts/browser-test-results-diagnostic.json` on CI. DEV_E2E takes precedence over PREBUILT; there is no Vite/production fallback if the diagnostic bundle is missing.

Workflow lines 334–373 map **T02-BR02**, not BR01, to `tests/e2e/counterball-direct-probe.spec.ts`. The produced-file selector includes that existing filename, and requires it when its packet is implemented/reviewing/verified/accepted. With no producer file it records no diagnostic test invocation; that is not a pass. Adding BR01's function/unit test alone cannot make this selector execute a browser probe.

## Concrete future command and ownership

After the BR01 producer and separately authorized BR02 diagnostic surface/spec exist, the existing command is sufficient on the GitHub runner:

```text
COUNTERBALL_DEV_E2E=1 COUNTERBALL_PREBUILT_PREVIEW=1 pnpm test:e2e tests/e2e/counterball-direct-probe.spec.ts --workers=1
```

It uses the existing `test:e2e` script and default `playwright.config.ts`. A focused explicit equivalent may add `--config playwright.config.ts --project chromium`; neither flag requires a new script. Before invocation, the existing diagnostic build command must succeed:

```text
VITE_COUNTERBALL_DEV_HARNESS=1 pnpm --filter @korre/web exec vite build --outDir dist-dev
```

The normal workflow already performs this build, inventory/upload and produced-spec invocation. No workflow scheduling change is needed to run the future named spec **after it exists**. BR01 currently owns only its producer/unit-test/browser-export paths; the catalogued BR02 coordinator card owns the app diagnostic surface, App wiring and exact Playwright spec. Browser execution cannot be attributed to BR01's Node/Vitest unit suite. If the coordinator needs a browser smoke before BR02, it must separately authorize that producer/bridge/spec; there is no existing callable page bridge to pretend is available.

Use the existing supported `/preview` route for a guarded diagnostic surface, or separately wire another static route. `serve-preview.mjs` only maps `/`, `/preview` and `/preview/` to index.html; directly navigating a new pathname currently returns 404. The server already sends emitted `.wasm` assets as `application/wasm`, but successful bundling/URL resolution/loading must still be proven. `initializeHavokRuntime` forwards to the pinned package's real browser loader; its source comment does not establish that Vite emitted/fetched the required WASM correctly.

## Raw diagnostic evidence and hash retention

The smallest evidence path needs **no workflow edit**: the future Playwright spec writes the actual browser-returned plain result to `testInfo.outputPath("counterball-browser-direct-probe.json")`, and writes a SHA-256/provenance sidecar in the same test output directory. Compute the digest over the exact serialized bytes written, without normalizing/truncating the payload afterward. Node filesystem/crypto use here only persists/hashes evidence; the simulation itself must execute in the Chromium page. Attach these files through testInfo for report discoverability as well.

The existing always-run `counterball-browser-evidence` uploader includes `test-results/`, plus structured browser JSON, with hidden files enabled. Thus raw JSON, sidecar, failure trace and appropriate screenshots placed in test output directories are retained. The hosted-check artifact separately retains logs, diagnostic-suite file inventory and structured browser results for 14 days. Record the actual uploaded artifact ID/archive digest independently of the raw JSON digest.

Alternative explicit root output paths, if preferred, are:

- `.artifacts/counterball-browser-direct-observations.json`
- `.artifacts/counterball-browser-direct-observations-manifest.json`

Those files are **not** selected by the current uploader globs: logs select `.artifacts/*.log`, browser JSON selects only `.artifacts/browser-test-results*.json`. A coordinator-owned workflow update must add the two exact paths to an always-run upload or a dedicated run/SHA-qualified artifact, enable hidden files and set retention. A successful named probe must require both files; missing output is not an empty acceptance. Do not upload the entire artifacts directory or unrelated credential-bearing environment.

The raw result/manifest should carry exact SHA/run/attempt, browser/version, pinned engine/adapter identity, canonical config/guard hash, exact measured D01 input, all 15 canonical IDs, actual durations/call counts, transforms/contacts, typed termination, finite/settling/guard extrema and cleanup evidence. It must say diagnostic-only and preserve the accepted conditional energy-model limits. Preserve a typed failure record where available and make the test fail; a failure payload is not a successful settled result. Write/attach evidence before final assertions when possible so an assertion failure retains the real observations.

## What the browser spec must establish

The spec must invoke BR01 inside the actual Chromium page from the compiled diagnostic bundle, not evaluate physics in the Playwright Node process or substitute mocked/global test values. Check real WASM initialization/loading and expected identity, observable WebGL capability for the BR02 rendered proof, deliberate pointer-trigger invocation, actual changed body transforms and rendered pixels, bounds/settling, forced failure/cancellation and disposal. Capability absence is a failure/blocker with retained evidence, not a skip. Bound the Playwright test's overall budget to accommodate setup, the diagnostic's frozen 30-second trial cap and cleanup without changing that physics cap.

A browser-only diagnostic can establish the observed result for this input in headless hosted Chromium. Software-backed WebGL on CI remains browser execution; it is not a physical Android/iOS test. Successful requests, labels, screenshots alone, generic Worker smoke, Node probes or production static preview tests do not prove browser Havok simulation.

A passing exact-head run can retain actual browser/WASM observations, input/guard provenance, hashes, full logs, zero-skip/retry counts and real rendered proof once BR02 exists. It cannot prove deployed Cloudflare physics, production calibration, arbitrary continuous native trajectories beyond the accepted model, gameplay/referee correctness, full T02/T05 completion, online parity or real-phone compatibility. Earlier job failures correctly skip downstream diagnostic execution; a skipped diagnostic remains NOT RUN.

## Recommendation

Reuse the current diagnostic Chromium selector and prebuilt server. Complete the authorized BR01 API, then the separate BR02 bridge/spec, using test output directories for raw data and manifest to avoid an unnecessary workflow edit. If root-level artifact names are required, separately assign the narrow coordinator uploader change. Preserve production import exclusion and exact-head independent source/runtime review. All future commands above are proposed hosted invocations, not checks performed by this report.
