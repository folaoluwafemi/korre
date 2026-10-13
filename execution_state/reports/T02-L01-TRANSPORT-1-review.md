# Independent source review — T02-L01-TRANSPORT-1

**SOURCE: PASS. RUNTIME: NOT RUN.** This review checks the transport test source and its existing page/CI path only. It does not claim a real browser transfer, OPFS runtime success, a physics result, or matrix acceptance.

## Scope and source change

The amended packet's sole product write path is `tests/e2e/counterball-direct-probe.spec.ts`. The current product diff is exactly that one file; the relevant UI, route, shared config, browser entry, and workflow files have no diff. The test is appended to the existing `counterball-direct-probe.spec.ts` Playwright spec. The implementation report correctly says no local app command ran and leaves hosted E2E and exact-run review pending.

The test preserves the accepted exact size: `504_365_056` bytes, `256 * 1024` bytes per chunk, and `1_924` chunks (`tests/e2e/counterball-direct-probe.spec.ts:35-37`). The size matches `maximumMatrixBytes: 504365056` in `packages/game-protocol/src/config.ts:170`. The component's synthetic writer creates one bounded 256-KiB block using `index % 251`, awaits each write through the shared OPFS writer, and rejects any unexpected total chunk count (`apps/web/src/CounterballDirectProbe.tsx:330-398`). The test independently constructs the same one-block deterministic pattern and hashes it repeatedly; it does not allocate the full 504-MB reference payload (`tests/e2e/counterball-direct-probe.spec.ts:45-54`).

## Existing page flow and host verification

The test exercises the existing page controls by accessible role and name: click “Write transport test file”, wait for the exact live ready or failure status, and then click “Download transport file” (`tests/e2e/counterball-direct-probe.spec.ts:352-424`). The component opens its existing OPFS writer only after `navigator.storage.estimate()` returns finite quota/usage with enough headroom; writes are awaited and bounded, and finalization verifies the exact byte count before creating the download file (`apps/web/src/CounterballDirectProbe.tsx:239-369`). Its ready status and conditional download control are the existing UI (`:1231-1266`); no UI control, route, config, or cap was added or changed.

The Playwright download waiter is registered before the button click, and the downloaded file is saved to `testInfo.outputPath` (`tests/e2e/counterball-direct-probe.spec.ts:424-434`). The host hashes it through a `createReadStream` with a 64-KiB high-water mark, counts bytes incrementally, rejects an over-cap file, and checks both exact length and the deterministic-pattern SHA-256 (`:45-70, 434-438`). The test sends only run ID, file name, byte length, and digest as the acknowledgement; it does so only after both host assertions pass. The page acknowledgement validates the matching pending run/file, expected length, digest format, completed writer, and started download before deleting the OPFS temporary file (`apps/web/src/CounterballDirectProbe.tsx:615-646, 694-705`). No file bytes pass through page evaluation, the DOM, or an attachment; there is no full-size in-memory buffer.

## Cleanup and collection

The test's `finally` block cancels an in-progress browser export or discards a pending export, deletes the Playwright download, and removes the host temporary file. It aggregates cleanup errors and preserves the original test error when cleanup also fails (`tests/e2e/counterball-direct-probe.spec.ts:72-84, 452-489`). On success, the checked acknowledgement performs OPFS cleanup and the test confirms the page's “host saved and verified” status. On a pre-ack failure, the pending download remains discardable; an in-progress write remains cancellable. The app's existing catch path also attempts OPFS cleanup and reports incomplete cleanup as failure (`apps/web/src/CounterballDirectProbe.tsx:795-815`).

The existing CI diagnostic candidate list already names this spec, and the diagnostic step runs the collected file with the development E2E flags (`.github/workflows/ci.yml:392-431`). Adding the transport test to that existing spec therefore requires no workflow change. `git diff --check -- tests/e2e/counterball-direct-probe.spec.ts` passes.

No local typecheck, build, lint, Playwright, browser, OPFS, or physics command was run. Exact-head hosted execution and independent run-evidence review remain required before the transport card is accepted.
