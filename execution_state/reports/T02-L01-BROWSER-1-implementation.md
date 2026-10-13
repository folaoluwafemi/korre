# T02-L01-BROWSER-1 implementation

## Result

PASS for the bounded source implementation. The existing page-owned Babylon Engine now has a separate development-only L01 matrix action and a deterministic transport action. Both write to an OPFS-backed file in awaited chunks no larger than 256 KiB and expose only compact progress/export metadata in the page. The existing direct-shot and retry implementation remains intact; pointer shots are paused only while the matrix action is using the page Engine.

## Changes

- `games/counterball/src/browser.ts` re-exports `runLoftCoarseMatrix`, `LoftCoarseRunOptions`, `LoftCoarseProgress`, `LoftCoarseRunSummary`, and `LoftCoarseByteSink`, and exposes the canonical `COUNTERBALL_CONFIG_V1` value to the web component.
- `apps/web/src/CounterballDirectProbe.tsx` adds a dev-only matrix panel and a synthetic transport button. The matrix calls the accepted runner with the current page-owned Engine, AbortSignal, awaited OPFS byte sink, and compact progress callback. The runner's matrix cap is read from `COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.artifact.maximumMatrixBytes`.
- OPFS space is checked with `navigator.storage.estimate()` before file creation, including 16 MiB headroom. The estimate is treated as approximate; every write and close is still awaited, and quota/write/finalize errors enter the failure cleanup path.
- The transport action writes exactly 504,365,056 deterministic bytes as 1,924 awaited 256 KiB chunks. Each chunk repeats the byte pattern `byte[index] = index mod 251`. It shares the matrix export's OPFS finalization, download, host acknowledgement, timeout, and cleanup path.
- A completed export becomes downloadable only after exact byte-count validation and successful stream close. The browser uses a browser-managed `File` reference to the OPFS entry and an object URL; it does not build a full JSON string, read a full ArrayBuffer, construct a Blob from the matrix, or use a data URL. No case rows or full artifact data enter React state, DOM text, or page-to-host evaluation results.
- The development-only `window.__counterballLoftMatrixHostAck({ runId, fileName, byteLength, sha256 })` hook accepts only a strict four-field acknowledgement for the current run, exact byte count, a lowercase 64-character SHA-256, and an export for which download was initiated. The host test contract is to call it only after saving and independently hashing the download. Successful acknowledgement revokes the object URL and removes the OPFS entry. Failure, cancellation (including an abort during a pending write), quota/finalize errors, explicit discard, acknowledgement expiry, and component unmount also attempt idempotent abort/delete cleanup. The caller-owned Engine is kept alive until an active matrix run has aborted and settled.

## Browser API references reviewed

- [Origin private file system](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) for `navigator.storage.getDirectory()`, OPFS file handles, and asynchronous main-thread access.
- [FileSystemFileHandle.createWritable()](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle/createWritable) and [FileSystemWritableFileStream.write()](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream/write) for awaited writes and close-before-commit behavior.
- [StorageManager.estimate()](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate) for approximate quota and usage preflight.
- [FileSystemDirectoryHandle.removeEntry()](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryHandle/removeEntry) for temporary-file cleanup.

## Checks and limits

- `git diff --check -- games/counterball/src/browser.ts apps/web/src/CounterballDirectProbe.tsx` — exit 0. Git emitted only its LF-to-CRLF working-copy advisory for `browser.ts`.
- Typecheck, lint, unit tests, browser/E2E, OPFS runtime, real Havok matrix, build, and deployment checks — NOT RUN as required. Hosted validation remains pending.
- `StorageManager.estimate()` is approximate and cannot guarantee the quota will remain available; actual asynchronous writes and final close remain guarded by failure cleanup.
- The component reports only a compact summary. The future host transport test must save and hash the downloaded file itself before calling the dev-only acknowledgement. The page validates the acknowledgement's exact run/name/size and SHA-256 format; it does not independently hash the downloaded file.

## Changed paths

- `games/counterball/src/browser.ts`
- `apps/web/src/CounterballDirectProbe.tsx`
- `execution_state/reports/T02-L01-BROWSER-1-implementation.md`

No runtime or T02-L01 acceptance claim is made.
