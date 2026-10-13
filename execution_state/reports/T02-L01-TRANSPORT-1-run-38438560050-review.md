# T02-L01-TRANSPORT-1 — run 38438560050 evidence review

**Verdict: PASS for the accuracy of the failure evidence and root-cause diagnosis. The GitHub run itself failed; this is not packet acceptance.**

## Exact run and gate results

The saved GitHub job snapshot identifies run `38438560050`, attempt `1`, job `verify` (`115438850775`), branch `codex/remote-ci-bootstrap`, and exact head `d79d049a296d21f6282ef7cbe21c9c56fd2f00bd`. The job concluded `failure`.

The snapshot records **35 successful, 1 failed, and 4 skipped steps** (40 total). Step 31, “Run every produced local diagnostic browser suite,” failed. Steps 14–16, the conditional TypeScript diagnostics after failed verification, and post-action step 67 were skipped. Verify, the production diagnostic exclusion check, Worker and production packaging, integration, built-preview tests, diagnostic build/package, and browser evidence upload steps completed successfully. These preceding passes do not make the failed diagnostic suite pass.

The exact diagnostic Playwright JSON reports **2 expected/passed, 1 unexpected, 0 skipped, and 0 flaky** tests, with no retries. The real pointer-flick/Havok test passed, as did the blocked-WASM cleanup test. The maximum synthetic transport test timed out after `480051 ms` against its `480000 ms` timeout. Its first failing action was waiting for the accessible button named **“Write transport test file”** (`tests/e2e/counterball-direct-probe.spec.ts:390` in the exact run source). The saved page snapshot contains the direct-shot diagnostic heading, instructions, pitch, and scene facts, but no loft-matrix panel, transport write button, ready status, or download control.

The subsequent `AggregateError` reports incomplete cleanup after the page/browser closed; the context records a secondary `isVisible` error during cleanup. These are consequences accompanying the timed-out locator, not evidence that an OPFS write, download, digest comparison, or host acknowledgement began and failed. No transport transfer started, so this run proves neither successful nor unsuccessful transfer integrity or throughput.

## Root-cause assessment

The exact workflow source builds the diagnostic bundle with `VITE_COUNTERBALL_DEV_HARNESS: "1"` using `vite build --outDir dist-dev`, without selecting development mode. `apps/web/vite.config.ts` has no mode override. The custom flag enables the lazy diagnostic route in `apps/web/src/App.tsx`, which is consistent with the route and pitch appearing in the snapshot. However, `apps/web/src/CounterballDirectProbe.tsx` renders the loft-matrix panel only when `import.meta.env.DEV` is true; it also installs the host-acknowledgement callback and accepts acknowledgements only under that same condition.

This combination strongly supports a diagnostic-build mode mismatch: the custom harness flag includes the route, while a normal Vite production build leaves `import.meta.env.DEV` false and removes the panel/host-ack path. The absent controls in the exact browser snapshot match that explanation. The test fails before exercising the file transport itself. This report does not claim a full transfer, playable match, deployed physics, or transport acceptance.

## Evidence inspected

- `execution_state/reports/T02-L01-TRANSPORT-1-run-38438560050-evidence/job-snapshot.json`
- `execution_state/reports/T02-L01-TRANSPORT-1-run-38438560050-evidence/github.log`
- `execution_state/reports/T02-L01-TRANSPORT-1-run-38438560050-evidence/verify-log/verify.log`
- `execution_state/reports/T02-L01-TRANSPORT-1-run-38438560050-evidence/browser-evidence/.artifacts/browser-test-results-diagnostic.json`
- `execution_state/reports/T02-L01-TRANSPORT-1-run-38438560050-evidence/browser-evidence/test-results/counterball-direct-probe-t-c6b20-hrough-the-browser-download-chromium/error-context.md`
- Read-only exact-SHA source inspection of `.github/workflows/ci.yml`, `playwright.config.ts`, `apps/web/vite.config.ts`, `apps/web/src/App.tsx`, and `apps/web/src/CounterballDirectProbe.tsx` at `d79d049a296d21f6282ef7cbe21c9c56fd2f00bd`.
