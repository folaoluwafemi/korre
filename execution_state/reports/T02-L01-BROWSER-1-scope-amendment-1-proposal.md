# T02-L01-BROWSER-1 scope amendment 1 proposal

## Reason

Repair attempt 1 fixed the ten TypeScript diagnostics reported by GitHub run
38414094519. The exact-head rerun, commit
`275cd4b74782cb050dd6454aa3ed30b1f5836900` in run `38415702575`, then reached
`games/counterball` typecheck and reported two TS2307 errors for the browser
runner's `?url` and `?raw` imports. The existing package declaration file
`games/counterball/src/viteAssetModules.d.ts` already contains wildcard
declarations for both asset queries and is included by the package tsconfig,
but the hosted compiler did not resolve them. Repair attempt 2 correctly
stopped because that existing declaration file is outside its assigned write
paths.

## Proposed amendment

Amend only the `T02-L01-BROWSER-1` packet's write-path list to add the existing
file `games/counterball/src/viteAssetModules.d.ts`. The source worker may then
diagnose and, if appropriate, repair only those two ambient module declarations
in that file. The existing
`games/counterball/src/browser.ts` and `apps/web/src/CounterballDirectProbe.tsx`
remain assigned paths. No new file, route, config, workflow, package
dependency, or runtime Vite dependency is authorized.

The declarations must describe the actual imported asset values as strings:
the resolved Wasm URL and the raw fixture JSON text. No `any`, suppression,
looser assertion, missing-file fallback, or change to matrix/fixture semantics
is allowed. The browser action must retain the exact 504,365,056-byte maximum,
awaited writes no larger than 256 KiB, OPFS finalization, host acknowledgement
validation, failure/unmount/ack cleanup, production development-only gate, and
unchanged direct-shot/retry behavior.

## Checks and acceptance

- Independent review approves this exact scope change before the new path is
  edited.
- After approval, only `git diff --check` on the three assigned paths may run
  locally. No application typecheck, build, test, or browser run is permitted.
- The implementation report must name the two imports, explain why the
  declarations now match, list exact changed paths, and record the scoped diff
  check and limits.
- After independent source review, run the full workflow on the exact reviewed
  commit and inspect the production output. The browser packet remains
  unaccepted until every original acceptance gate passes.
- This is still repair attempt 2. If its exact-head hosted verification fails
  again for an implementation defect, stop and follow the bounded escalation
  procedure; do not create repair attempt 3.

## Dependency and status effect

This amendment changes no dependency and does not unblock
`T02-L01-TRANSPORT-1`. The original parent and child dependencies remain
unchanged. It authorizes one additional existing source path only after its
independent review passes.
