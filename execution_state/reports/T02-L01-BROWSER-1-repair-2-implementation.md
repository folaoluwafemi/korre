# T02-L01-BROWSER-1 repair 2 implementation

## Scope and change

Addressed the two hosted TS2307 asset-query errors from run `38415702575` at
commit `275cd4b74782cb050dd6454aa3ed30b1f5836900`. The amended packet added the
package-owned declaration file to the authorized paths.

Changed only `games/counterball/src/viteAssetModules.d.ts`. Its declarations
now use Vite's standard ambient module suffixes, `*?url` and `*?raw`, with
default exports typed as `string`. This covers the pinned Havok WASM URL import
and the fixture's raw-text import without a runtime Vite dependency. Inspection
of `apps/web/node_modules/vite/client.d.ts` (Vite 8.3.4, matching
`apps/web/package.json`) confirmed these same suffix patterns and string
exports. The existing runner import strings and byte/hash behavior are
unchanged.

`games/counterball/src/browser.ts` and
`apps/web/src/CounterballDirectProbe.tsx` were not changed in this repair.
Browser transport, 504,365,056-byte maximum, 256-KiB write bound, awaited OPFS
writes, acknowledgement validation/cleanup, development gating, and the
existing direct-shot/retry flow remain unchanged by this patch.

## Checks and limits

- `node scripts/check-completion-plan.mjs --packet T02-L01-BROWSER-1` — plan
  consistency PASS; `ready: false` reflects the packet's in-progress state.
- `git diff --check -- games/counterball/src/browser.ts apps/web/src/CounterballDirectProbe.tsx games/counterball/src/viteAssetModules.d.ts` — exit 0.
- Local app typecheck, lint, tests, build, and browser/OPFS checks — NOT RUN.
- Hosted verification of these declarations — PENDING; run `pnpm verify` on
  the independently reviewed exact source commit.

This source change addresses the declaration mismatch but does not establish
that TypeScript accepts it or prove browser asset loading, OPFS transport,
production exclusion, physics, or runtime behavior.
