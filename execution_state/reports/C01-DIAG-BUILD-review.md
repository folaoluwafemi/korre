# C01-DIAG-BUILD independent review

**SOURCE: PASS. RUNTIME: NOT RUN.**

## Source findings

- The extracted `C01-DIAG-BUILD` record is ready and limits this review to the diagnostic import, production exclusion check, and separate hosted artifact. `node scripts/check-completion-plan.mjs --packet C01-DIAG-BUILD` returned `verdict: PASS`; this validates the catalogue only and is not implementation or runtime evidence.
- In `apps/web/src/App.tsx`, `CounterballRendererDiagnostic` is lazily imported only in the branch where `import.meta.env.VITE_COUNTERBALL_DEV_HARNESS === "1"`. The normal production build has this flag unset. The panel is rendered only on `/preview`, next to the existing preview, and its accepted source explicitly says that no physics, Havok, flicking, or match is available. This is a Vite compile-time constant suitable for eliminating the unused dynamic-import branch; the hosted production marker scan is the required proof that bundling actually removed it.
- `tests/production/counterball-dev-match-absent.mjs` checks that the flag is unset, requires a non-empty `apps/web/dist` with `index.html`, then scans every emitted file for both the diagnostic label and class marker. The Node built-in imports for `Buffer` and `process` avoid reliance on undeclared globals under the repository's lint rules. The script is scheduled immediately after `pnpm verify`, whose `build` script builds the web workspace, so it inspects the normal production output.
- The workflow additions preserve the existing production build, Worker artifact, production browser preview, Chromium run, integration run, and evidence/log uploads. The production absence check is after `Verify`. The separately flagged `dist-dev` build, inventory, and upload are after the production Chromium run and production preview upload. The diagnostic inventory hashes every emitted build file's relative path, byte size, and SHA-256, and records source SHA, run ID, attempt, build mode, flag, marker, and pinned Node/pnpm/Vite versions. It fails if the build or marker is absent. The artifact name includes the source SHA, is distinct from production, and has 14-day retention. The generated inventory itself is written after hashing the build output, so it is not self-hashed; the inventory hashes all emitted bundle files.
- No workflow step or Playwright route was removed or weakened. The updated plan correctly leaves diagnostic browser routing and interaction to C01-H and does not claim physics, Havok, flick, or playability.

## Runtime and limits

Runtime is **NOT RUN** in this review. I did not build, test, run Chromium, or inspect hosted artifacts. In particular, production tree-shaking, diagnostic marker presence, exact-run provenance, and recomputed artifact hashes still require the card's hosted exact-head run and independent artifact audit. This source review does not accept C01 or T02.

## Evidence inspected

- Exact extracted plan record from `node scripts/check-completion-plan.mjs --packet C01-DIAG-BUILD`.
- `execution_state/reports/C01-DIAG-BUILD-implementation.md`.
- Current diffs and source: `apps/web/src/App.tsx`, `.github/workflows/ci.yml`, `tests/production/counterball-dev-match-absent.mjs`, and accepted `apps/web/src/CounterballRendererDiagnostic.tsx`.
- `knowledge_base/execution/completion/OPERATIONS.md` and `knowledge_base/execution/completion/ACCEPTANCE.md`.
