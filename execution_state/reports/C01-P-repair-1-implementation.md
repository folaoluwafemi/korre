# C01-P repair 1 implementation

Date: 2026-10-11

## Change

Added a hosted package-entry bundle boundary check to the existing Counterball typecheck path. The check resolves the public headless export, bundles that entry in memory with the pinned esbuild version under Worker-oriented conditions, verifies that the resolved metafile contains the public headless entry and exactly one emitted output, and fails on browser presentation modules, React/ReactDOM modules and globals, WebGL/WebGPU engine modules, or DOM-only capability globals. It is wired into pnpm verify through the existing recursive typecheck command. The check does not alter the realtime Worker entry or imply that the scaffold currently implements physics.

Added the direct development pin esbuild@0.28.2 to the game package and lock importer; that exact package and snapshot already existed in the single lockfile. The original browser/headless public export-resolution assertions and pinned Cloudflare Worker types remain unchanged.

## Checks and limits

- JSON parse of games/counterball/package.json: PASS.
- Static lockfile importer/snapshot consistency: PASS by exact text inspection; frozen installation is reserved for GitHub.
- git diff --check -- games/counterball/package.json pnpm-lock.yaml: PASS (exit 0).
- Hosted esbuild probe, frozen install, pnpm verify, and runtime/artifact review: NOT RUN for this repair; they must run on the exact committed SHA.
- No local install, bundle, build, test, or browser command ran.

The source entry remains a scaffold; this check proves current package-graph isolation only. The later real Worker consumer must still prove the shared physics runner is reachable through the headless export.
