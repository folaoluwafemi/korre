# C01-DIAG-PANEL — explicit non-playable renderer diagnostic

Status: READY under T02. This is a UI label/component producer only. It does not implement a game harness or satisfy the first-flick gate.

## Inputs

- Accepted parent T03: `execution_state/reports/T03-implementation.md` and `execution_state/reports/T03-hosted-review-1.md`; current scene source is `apps/web/src/CounterballPreview.tsx`.
- Accepted C00 contracts: `knowledge_base/execution/CONTRACTS.md` and `knowledge_base/execution/completion/CONTRACT_WORK.md`.
- Exact remaining-card record: `node scripts/check-completion-plan.mjs --packet C01-DIAG-PANEL`.

## Allowed writes

- `apps/web/src/CounterballRendererDiagnostic.tsx`
- `apps/web/src/CounterballRendererDiagnostic.css`
- `apps/web/src/CounterballRendererDiagnostic.test.tsx`
- `execution_state/reports/C01-DIAG-PANEL-implementation.md`

Only the coordinator changes `execution_state/tasks.json`, ownership, packet/catalogue files, CI, manifests, `App.tsx`, and shared records. The independent reviewer may write only `execution_state/reports/C01-DIAG-PANEL-review.md`.

## Work

Build a semantic, accessible, noninteractive renderer-only panel. It must say visibly that this scene is static and does not run physics/Havok, flick pieces, or provide a match. It may accept child content. Import its CSS from the component so a later compile-time guarded dynamic import can include it. Do not alter the accepted preview or production route.

Add a `renderToStaticMarkup` test following the existing App test pattern. The test checks the visible diagnostic marker, explicit non-playable statement, and child content without initializing Babylon/WebGL.

## Checks and evidence

1. `node scripts/check-completion-plan.mjs --packet C01-DIAG-PANEL` — exact record ready; document-only.
2. `git diff --check` — only the three allowed source/test files and no whitespace errors.
3. Save implementation report with paths, source consulted, actual checks, NOT RUN checks, limitations, and stop point.
4. Stop for independent review. No local install, build, unit test, browser, physics simulation, deploy, or CI claim. After source review, the coordinator runs existing hosted CI on this exact source SHA before any diagnostic wiring; the new unit test is already part of `pnpm verify`.

## Acceptance and stop conditions

- Source diff is limited to the three assigned files and reviewed independently.
- An exact-head GitHub run after independent source review must discover/pass the component unit test and preserve production preview E2E counts before this card is accepted.
- Separate diagnostic build metadata, browser proof and production exclusion remain open under C01; this card alone does not close them.
- No physics/gameplay behavior, identity controls, or route wiring is added.
- Stop and report if a shared config/export or an extra source path is required.
