# T02-L01-BROWSER-1 Repair 1 implementation

## Scope

Repaired the ten web TypeScript diagnostics recorded for commit
`eceb041f14035114e841361bf4d1fc26c8acf502` in GitHub run `38414094519`.
The implementation change is limited to
`apps/web/src/CounterballDirectProbe.tsx`. The assigned
`games/counterball/src/browser.ts` was inspected and left unchanged because the
reported diagnostics were all in the component.

## Changes

- Used bracket notation for the four acknowledgement properties read from a
  `Record<string, unknown>`. The exact key-set and type checks are unchanged.
- Added explicit `| undefined` to the four optional mutable cleanup-session
  fields that are reset to `undefined`, preserving the existing cleanup flow
  under `exactOptionalPropertyTypes`.
- Used `window.clearTimeout` and `window.setTimeout` so the browser timer handle
  matches the declared numeric handle type in this browser-only component.
- Copied each already-bounded OPFS chunk into a new `Uint8Array` before writing.
  Its byte length is unchanged and remains subject to the existing 256-KiB
  check; this gives the File System API an `ArrayBuffer`-backed view without
  changing the chunk or matrix limits.

No acknowledgement shape, validation, OPFS lifecycle, byte cap, development
gate, direct-shot behavior, or retry behavior was intentionally changed.

## Checks and limits

- `git diff --check -- games/counterball/src/browser.ts apps/web/src/CounterballDirectProbe.tsx` — exit 0.
- Local app typecheck, lint, tests, build, and browser checks — NOT RUN.
- Hosted verification and browser/runtime checks — NOT RUN for this repair.

This report records a source-level repair only. The exact-head hosted run must
verify the TypeScript diagnostics and the affected browser behavior.
