# T02-L01-TRANSPORT-1 repair 2

## Change

Changed only `tests/e2e/counterball-direct-probe.spec.ts`. The file-read error
path now records a nested file-close failure in a typed `unknown` slot and a
separate boolean. The nested close catch exits before any throw; the outer read
catch then raises an `AggregateError` containing both the original read error
and close error, with the original read error as `cause`. If close succeeds, the
original read error is rethrown unchanged.

This preserves the prior typed 64 KiB read buffer, byte cap, digest computation,
transport flow, acknowledgement order, and deferred cleanup aggregation.

## Validation

- Inspected the hosted `verify.log` and GitHub log under
  `execution_state/reports/T02-L01-TRANSPORT-1-run-38436788486-evidence/`; the
  sole reported lint failure was `preserve-caught-error` at the nested
  close-error handling site. Hosted verification stopped before later checks.
- `git diff --check -- tests/e2e/counterball-direct-probe.spec.ts` — exit 0,
  no output.
- Local application checks and another hosted run — NOT RUN.

No browser transfer, full-cap transport result, physics result, or L01
acceptance is claimed.
