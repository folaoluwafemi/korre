# T02-L01-TRANSPORT-1 formatting repair

Applied the supplied GitHub Prettier patch verbatim from
`execution_state/reports/T02-L01-TRANSPORT-1-run-38437750598-evidence/formatting-repair/formatting-repair.patch`.
It changes only three line wraps in `tests/e2e/counterball-direct-probe.spec.ts`:
the `FileHandle.read` call, the filename regular-expression assertion, and the
download-button click chain. No values, assertions, or behavior changed.

## Changed paths

- `tests/e2e/counterball-direct-probe.spec.ts`
- `execution_state/reports/T02-L01-TRANSPORT-1-format-repair-implementation.md`

## Checks

- `git apply .../formatting-repair.patch` — exit 0.
- `git diff --check -- tests/e2e/counterball-direct-probe.spec.ts` — exit 0,
  no output.
- Application and browser checks — NOT RUN.
