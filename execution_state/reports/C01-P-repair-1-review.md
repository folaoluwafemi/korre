# C01-P repair 1 independent source review

Date: 2026-10-11

## Verdict

**SOURCE: PASS. RUNTIME: NOT RUN.**

The source repair adds a hosted check for the public headless package boundary and wires it into the existing verification path. I found no source-level blocker in the inspected package script, package entry map, or pinned esbuild lock data. This review does not accept the exact-head runtime evidence; the hosted check and artifact review remain pending.

## Review evidence

- The exact C01-P packet extraction and lightweight plan check passed. The checker explicitly reports that this is plan consistency only and ran no implementation or runtime check.
- games/counterball/package.json keeps separate public ./browser and ./headless entries. The typecheck script resolves each public subpath to its expected source path, then runs check:headless-bundle before TypeScript. The root verify script runs recursive typecheck, lint, tests, and builds, so this probe is in the hosted verify path.
- The new probe resolves @korre/counterball/headless through the public package export, converts the URL to a path, and checks that it is src/headless.ts relative to the package working directory. It bundles that entry with bundle: true, write: false, and metafile: true; it checks both the metafile input graph and its single emitted entry output. The treeShaking: false option avoids silently removing reachable imports merely because the current scaffold does not use them.
- The bundle target uses ESM output, platform: 'browser', and explicit workerd and worker conditions. Esbuild documents that browser platform activates the browser condition even when custom conditions are supplied; Cloudflare documents that Wrangler tries the workerd conditional export when bundling. This is a reasonable source-level Worker-oriented boundary probe, but it is not an execution of Wrangler or a deployed Worker. Sources: [esbuild platform and conditions](https://esbuild.github.io/api/#platform), [Cloudflare Wrangler conditional exports](https://developers.cloudflare.com/workers/wrangler/bundling/#conditional-exports).
- The input graph rejects the browser entry, web app paths, React/ReactDOM package paths, and Babylon engine modules. The emitted-text check now includes React and ReactDOM alongside window, document, DOM constructors/parser, and browser storage globals. Identifier-boundary checks avoid matching those names inside longer identifiers.
- The command is a Node ESM API invocation inside the package script's existing quoted -e form. Its embedded JavaScript uses single-quoted literals and has no embedded double quote, backtick, or shell expansion expression that breaks the outer quoting. Windows path separators are normalized with path.sep for the resolved entry and character code 92 for metafile paths.
- The game importer pins esbuild 0.28.2; the existing lock snapshot is exactly esbuild@0.28.2, with Node >=18 and the recorded integrity sha512-HKVLS8dvII+xoKW9kmqxbRKrnWEXfJJr/FZhhJmiqIB0e053QNYFqOBouTMO/k5sID4MvCiUCvv8b9M4h32wIA==. The implementation report records JSON/static lock checks and scoped diff check as completed.

## Limits

No application install, bundle, typecheck, test, browser check, Wrangler command, or deployment ran for this review. The hosted exact-head pnpm verify and independent artifact review are still required. The present src/headless.ts exports only a scaffold marker; this source check proves neither shared physics-runner wiring nor runtime behavior. It does not prove deployed Havok, a browser flick, playability, or deployment.

The emitted-global guard is an explicit list of forbidden sentinels, not a general browser-global classifier. Its current list covers the reviewed React/DOM cases, while future source additions still require hosted bundle inspection and review.
