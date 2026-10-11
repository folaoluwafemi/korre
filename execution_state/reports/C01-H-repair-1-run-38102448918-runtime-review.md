# C01-H repair 1 exact-head runtime review — run 38102448918

Date: 2026-10-11

## Verdict

**C01-H HOSTED RUNTIME: PASS for the scoped browser configuration, build-mode separation, and current test-routing behavior.** GitHub Actions run [38102448918](https://github.com/folaoluwafemi/korre/actions/runs/38102448918) completed successfully on the requested exact SHA `8cf773d062dd294ba3b784325bfd977626957484`. The repair's Node typecheck passed, `pnpm verify` passed, and the production and diagnostic browser builds were separately produced with matching exact-SHA inventories. Production browser regressions passed. Diagnostic browser collection was empty because no diagnostic browser spec producer existed in this commit; CI recorded that state and did not run an empty test command.

This is a pass for C01-H's harness/routing scope. The empty diagnostic collection is not a gameplay test. This run proves no deployed Havok behavior or playable match.

## Exact run and checks

The GitHub run metadata reports `completed / success`, head SHA `8cf773d062dd294ba3b784325bfd977626957484`, and one completed `verify` job. Frozen dependency installation, Worker smoke, config formatting, PostgreSQL migrations, focused protocol tests, `pnpm verify`, production exclusion scan, Worker dry-run packaging, production browser build, integration tests, browser preview, diagnostic build/package, and browser evidence upload all succeeded. Migrations ran twice; each pass verified one forward-only migration.

The preserved `verify.log` reports **27 test files passed and 141 tests passed, with zero skipped tests**. The `intendedShotProbe.test.ts` test also passed within that Vitest run. Other recorded test runs were: Worker smoke, 1/1; focused protocol, 11/11; integration, 1/1.

The production browser test results report **4 expected, 0 skipped, 0 unexpected, 0 flaky**. All four Chromium results are `passed` with retry index 0. The exact `playwright.config.ts` at this SHA sets `retries: 0`. The run log reports **4 Playwright tests passed** on the built production preview.

The diagnostic collection artifact contains `{ "files": [] }`, and `e2e-diagnostic.log` says: “No produced diagnostic browser specs on this commit.” At this SHA, `tests/e2e` contains only `counterball-preview.spec.ts` and `home.spec.ts`; there is no `counterball-direct-probe.spec.ts`, physics, flick, restart, or match diagnostic browser test. CI therefore had no produced local diagnostic spec to invoke. It did build and package the diagnostic browser artifact. This is the expected empty-producer path described in C01-H, and it leaves diagnostic browser behavior untested.

## Artifact provenance and mode separation

The GitHub artifact records bind the production and diagnostic artifacts to this same run and SHA. The extracted inventories also identify source SHA `8cf773d062dd294ba3b784325bfd977626957484`, run `38102448918`, attempt `1`.

| Artifact | GitHub archive digest | Inventory mode | Harness flag | Emitted entries independently checked |
|---|---|---|---|---:|
| `counterball-web-production-8cf773d062dd294ba3b784325bfd977626957484` | `sha256:686d70b1df11781461ad2c8e8e127594df3aec535bde22d74d825562da49bad0` | `production` | `unset` | 452 |
| `counterball-web-diagnostic-8cf773d062dd294ba3b784325bfd977626957484` | `sha256:c9ed10eba836fb57d3f16ce53b5dd5966c96d3706184fdb4b2589254cff71092` | `renderer-diagnostic` | `set` | 454 |

I recomputed every emitted file's byte count and SHA-256 from both extracted trees against its inventory; no entries were missing or mismatched. The inventory index hashes and referenced main JavaScript bundles differ between modes. The production exclusion scan passed: the `renderer-diagnostic__label` marker was absent from production JavaScript/CSS and present in the separate diagnostic JavaScript and CSS. This supports separate artifact provenance and flag mode; it does not show the diagnostic interaction itself was exercised.

## Incidental real-WASM probe artifact

The same run uploaded `counterball-intended-shot-observations` (artifact ID `11687829879`, GitHub archive digest `sha256:b040358a328cfeb466dbbc851e3df8273c33fd675b091256415f757b5232e172`). GitHub's artifact metadata records the same run and SHA. I parsed the extracted JSON and recomputed its raw-file SHA-256 as `7cdf727cfc238672d92dcf2d6c9ab437a56a64c8f7fae2979af08d5980bc2443` (24,455,019 bytes). The JSON itself does not embed the commit or run ID; its run provenance comes from the GitHub artifact record.

The artifact contains the ordered 40-row diagnostic matrix for pinned Babylon `9.30.0` and Havok `1.3.14`, with candidate impulses `[0.5, 1, 1.5, 2, 3, 4, 6, 8]` and tilts `[0, 15, 30, 45, 60]`. The rows are unique and ordered as expected. The payload labels itself `diagnosticOnly: true`, sources `clearanceEpsilon: 0.005` from `COUNTERBALL_CONFIG_V1.restart.clearanceEpsilon`, and explicitly records `continuousTraversalProven: false`. A separate `directImpulseProbe` property is also present in this merged file. These observations document diagnostic simulation output only; they do not select production coefficients, prove continuous obstacle clearance, accept T02-B2/T02, or establish playability.

## Limits

C01-H's run validates the Node config/type project, explicit production test selection, expected no-producer diagnostic handling, and distinct flag-tagged production/diagnostic artifacts. It does not exercise an actual diagnostic browser spec because none was produced. The four passing browser tests are the existing static production regressions. The downloaded production page still describes Counterball as an initial workspace build and not playable yet. No deployment, online match, real-phone test, diagnostic flick, or gameplay session is proven.
