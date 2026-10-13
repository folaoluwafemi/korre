# T02-L01-TRANSPORT-1 repair 1

## Changes

Changed only `tests/e2e/counterball-direct-probe.spec.ts`.

- Replaced the async Node stream iterator with `FileHandle.read` into one typed
  64 KiB `Uint8Array`. Each read contributes only `bytesRead` to the count and
  hash; the exact maximum remains enforced. Read and close failures are both
  retained if cleanup of the file handle also fails.
- Changed test cleanup so the `finally` block only attempts browser cleanup,
  Playwright download deletion, and host-file removal, collecting each failure.
  After `finally`, the test rethrows the primary error or raises an
  `AggregateError` containing the primary and all cleanup errors, with the
  primary error as `cause`.
- Preserved the transport size, deterministic pattern, browser controls,
  digest comparison, and host-acknowledgement order.

## Validation

- `git diff --check -- tests/e2e/counterball-direct-probe.spec.ts` — exit 0,
  no output.
- Local typecheck, lint, test, build, and browser checks — NOT RUN.
- GitHub verification — NOT RUN; pending independent source review.

The earlier hosted attempt failed at ESLint before unit tests, builds,
integration, or the diagnostic browser suite. This repair does not establish a
successful download or any physics result.
