# C01-DIAG-BUILD static-env repair 1 review

**SOURCE: PASS. HOSTED VALIDATION: PENDING.**

The exact `C01-DIAG-BUILD` record is ready; the plan validator returned `PASS` for catalogue consistency only.

The repair diff is limited to the two assigned application source paths: `apps/web/src/App.tsx` changes the flag expression from bracket notation to dot notation, and the new `apps/web/src/vite-env.d.ts` declares the optional readonly flag. `App.tsx` preserves the exact `=== "1"` comparison, conditional lazy import, `/preview` render condition, and `null` branch when unset. No production assertion, workflow, Vite config, contract, or decision was changed by this repair. The implementation report identifies the same two implementation paths and separates its plan/whitespace checks from all unrun application and hosted checks.

The declaration has no imports or exports, so its `ImportMetaEnv` interface remains in global scope and merges with Vite's ambient interface. The existing `apps/web/tsconfig.json` includes `types: ["vite/client"]`, which supplies that interface. The dot-form `import.meta.env.VITE_COUNTERBALL_DEV_HARNESS` is statically replaceable by Vite; the condition itself remains unchanged.

The preceding run `38095656864` passed `pnpm verify` but failed the production absence scan because the diagnostic CSS marker remained in `apps/web/dist`. That run predates this source repair and confirms the failure being addressed. It does not validate the new form.

**RUNTIME: NOT RUN.** No app command was run for this review. A fresh exact-head hosted run must prove the marker is absent from production and present in the separately flagged diagnostic artifact, with inventory provenance and hashes. This source review establishes neither production exclusion nor diagnostic browser behavior, physics, or playability. C01-DIAG-BUILD and C01 remain open pending their other required evidence.

Evidence inspected: the extracted `C01-DIAG-BUILD` record; `execution_state/reports/C01-DIAG-BUILD-static-env-repair-1-implementation.md`; `execution_state/reports/C01-DIAG-BUILD-run-38095656864.md`; current `App.tsx` and `vite-env.d.ts` diff; and the existing web TypeScript configuration.
