# C01-P implementation report

## Scope and changes

Prepared explicit TypeScript and ESM/default export conditions for the existing
`@korre/counterball/browser` and `@korre/counterball/headless` source entries in
`games/counterball/package.json`. Each condition resolves only to its own source
entry. The headless entry currently has no browser, React, or DOM imports. The
browser entry remains the Babylon presentation entry.

Pinned `@cloudflare/workers-types` to `5.20261006.1` in the realtime workspace
and its sole `pnpm-lock.yaml`. `apps/realtime/tsconfig.json` now loads those
Cloudflare declarations with only the ES language library; it no longer inherits
generic WebWorker declarations. The web app's existing React 19.3.0 and matching
React type pins and `react-jsx` configuration remain in the web workspace. No
React dependency or DOM library was added to the game or realtime packages.

The game's existing `tsconfig.json` remains unchanged: its simulation and
scene source is already checked by the accepted workspace project; the web
app owns JSX and browser DOM typing. No rules, physics, simulation runner,
Worker runtime, or shared protocol source changed.

## Inputs and documentation

- Read `AGENTS.md`, the original execution decisions/contracts/tasks/swarm
  records, and completion README/operations/contracts/acceptance/packet index.
- Extracted C01-P with `node scripts/check-completion-plan.mjs --packet C01-P`.
- Inspected the web React/type pins, current game entry files, realtime
  Wrangler config and entry, workspace lock importers, test-pool versions, and
  the current headless entry imports.
- Verified the exact Cloudflare types package version and registry integrity
  using `pnpm view`; did not install it locally.
- Reviewed Cloudflare's current official guidance for
  [Worker TypeScript types](https://developers.cloudflare.com/workers/languages/typescript/)
  and [Workers Vitest configuration](https://developers.cloudflare.com/workers/testing/vitest-integration/configuration/).
  The existing Vitest 4.1.2 and `@cloudflare/vitest-plugin` 1.4.0 pins remain
  unchanged.

## Checks

- Packet extraction: PASS; C01-P and its original parent prerequisites report
  ready.
- `git diff --check` on the five owned paths: PASS.
- JSON parse: PASS for the two package manifests and realtime TypeScript
  config.
- Package export resolution: PASS; the lightweight Node resolution check
  resolves `/browser` and `/headless` to their distinct source entry files.
- Full YAML parse/frozen-lockfile validation: NOT RUN locally. The lightweight
  parser is not installed, and dependency installation belongs on GitHub. The
  exact-head hosted `pnpm verify` must validate the lockfile.
- `pnpm verify`, typecheck, lint, tests, package resolution and Worker bundle:
  NOT RUN locally; these are assigned to the exact-head GitHub run.

## Limits

Realtime currently does not import `@korre/counterball/headless`; its current
Worker bundle therefore has no gameplay or physics proof. Package export maps
make the browser/headless boundary explicit, and the existing web consumer
continues to resolve the browser entry. The hosted run and independent reviewer
must verify the concrete resolution/build evidence before C01-P can be accepted.
The headless entry remains a scaffold until its separately gated runner card is
implemented. This work does not establish a browser flick, playable runner,
deployed Havok, or game feel.

## Next action

Independent source/config review, then exact-head GitHub `pnpm verify` with lock,
package-resolution and Worker-bundle evidence. Repair or split the card if the
review or hosted check finds that proving the headless subpath needs an
additional owned path.
