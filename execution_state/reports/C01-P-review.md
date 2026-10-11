# C01-P independent review

Date: 2026-10-11

## Verdict

**SOURCE: PASS. RUNTIME: NOT RUN.**

The current source/config changes satisfy the preparatory C01-P boundary: the browser and headless subpaths have separate explicit export targets; the web preview uses the browser subpath; the headless entry is an import-free scaffold; and the realtime TypeScript project uses pinned Cloudflare Worker declarations without inheriting DOM or Node libraries. The package-resolution check is now included in the game's `typecheck` script and will run under hosted `pnpm verify`. No application install, typecheck, build, test, Worker bundle, or browser check was run in this review.

## Evidence

- The extracted C01-P record passes the plan validator. It authorizes the five changed paths: `games/counterball/package.json`, `games/counterball/tsconfig.json`, `apps/realtime/package.json`, `apps/realtime/tsconfig.json`, and `pnpm-lock.yaml`. The current diff is limited to four of those paths; the game tsconfig remains unchanged. The package-script addition is within its authorized manifest path.
- `games/counterball/package.json` defines `./browser` and `./headless` with `types`, `import`, and `default` conditions. Each condition for a subpath points to that subpath's own `src/*.ts` entry. `CounterballPreview.tsx` imports `@korre/counterball/browser`; the headless file presently contains only its scaffold marker and has no imports. No React or DOM dependency was added to the game or realtime workspace.
- The game's `typecheck` script first runs a Node `import.meta.resolve` check for both public subpaths and asserts each resolved URL ends at its corresponding `/src/<entry>.ts` file, then runs the existing TypeScript check. This is a concrete resolution assertion in the hosted check path. It has not yet been executed on the current snapshot.
- `apps/realtime/tsconfig.json` overrides the ES-only base with `lib: ["ES2022"]` and `types: ["@cloudflare/workers-types"]`; it includes only `src`. The web project separately declares `DOM`, `DOM.Iterable`, Vite types, and React JSX. The realtime source currently uses standard `Request`/`Response` and does not import the game headless subpath.
- `apps/realtime/package.json` pins `@cloudflare/workers-types` to `5.20261006.1` as a development dependency. The lockfile adds only that realtime importer dependency and the corresponding package resolution/snapshot. The recorded registry integrity is `sha512-5OclwQK1d8f5LCPvOlyldC3ryKLUa4nLXegcgPZeUxAPudczQ9xujJDdpS2Tenp7JqbBLW3OgGciHJmuc7QShg==`, matching the package record reported by the implementation author. No unrelated active dependency version was changed in the reviewed diff.
- The official [Cloudflare TypeScript guidance](https://developers.cloudflare.com/workers/languages/typescript/) describes generated `wrangler types` as the way to match a Worker to its exact compatibility date, bindings, and flags, and documents `@cloudflare/workers-types` as a package option. The current realtime app has no bindings and uses only standard fetch types, so the pinned package is adequate for this preparation card. When compatibility-specific APIs or bindings are introduced, add generated configuration-specific types and verify them in that consumer card.
- The official [Workers Vitest configuration guide](https://developers.cloudflare.com/workers/testing/vitest-integration/configuration/) supports using the Cloudflare Vitest plugin with the Wrangler config. The root pins remain `@cloudflare/vitest-plugin` 1.4.0 and Vitest 4.1.2; the implementation report records the compatible peer range. No test-pool change is part of this diff.

## Limits and follow-up

This is source/config review only. The current Worker does not consume `@korre/counterball/headless`, and the headless entry does not yet export or import a physics runner. Thus this card proves neither a built Worker bundle containing the headless entry nor shared runner reachability; that bundling proof belongs to the later runner consumer. The hosted exact-head `pnpm verify` must still execute the two-subpath resolution check and the existing checks. This review does not prove Havok runtime behavior, a playable game, or browser movement.
