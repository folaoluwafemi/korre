# Review and improve the existing build

Human request: review everything implemented and improve it before the user tests it. This packet audits current source, not a fresh implementation of every deferred catalogue task. Keep T02/T04/T05 and full-match gates honest.

## Browser packet

Worker `/root/foundation_review`. Inputs: accepted T03, its audit, current fixture/scene/browser consumer. Exact writes: `apps/web/src/CounterballPreview.tsx`, `apps/web/src/styles.css`, `tests/e2e/counterball-preview.spec.ts`, report `execution_state/reports/current-browser-improvement.md`.

Output: usable pointer/touch/keyboard camera inspection, idle/background rendering savings, safe startup/context-failure retry, semantic navigation/description. Preserve all body transforms and geometry, static-only label, visible button holes, seven caps per side. No gameplay/identity redesign. Browser consumer owns DOM controls; scene factory still registers none.

Acceptance: real WebGL2 pixels; camera movement with pointer and HTML controls; mobile controls reachable with no horizontal overflow; no endless idle render loop; resize/view changes redraw; unmount/retry remove resources; context/startup failure disables scene controls with recovery. No screenshot or attribute alone proves physical gameplay.

## Identity packet

Worker `/root/swarm_review`. Inputs: accepted T01, existing T11 code/migration, identity audit, opted-in GitHub loopback `_test` database. Exact writes: `apps/api/scripts/migrate.mjs`, `apps/api/src/features/identity/identity.http-postgres.test.ts`, `apps/api/src/migrations.test.ts`, report `execution_state/reports/current-identity-improvement.md`.

Output: bounded migration locks/statements and newline-canonical checksums retaining equivalent legacy histories; real PostgreSQL tests of HTTP/service/repository composition and actual migration runner. No new readiness endpoint under this packet; `/health` is liveness only.

Acceptance: claim/conflict/restore/CSRF/logout/recovery and invalid credentials use real isolated PostgreSQL; replayed recovery fails and old sessions revoke; no secrets in JSON/records; migrations idempotent, incorrect checksum rejected, held lock fails within bounded deadline. No silent database skip when CI requires these checks. Tests never access Railway or a non-test host and clean only their own random schemas.

## Physics diagnostic packet

Worker `/root/toolchain_audit`. Inputs: accepted T01/T02-A/C0/C2 and real diagnostic run-18 artifact, D38 canonical positive margin 0.005 game units. Exact writes: `games/counterball/src/simulation/intendedShotProbe.test.ts`, report `execution_state/reports/current-physics-improvement.md`.

Output: consume canonical epsilon, retain raw clearance, report peak/min/sample-wide threshold and actual obstacle contact separately. Explicitly say continuous traversal is not proven by samples. Correct final-step settle boundary. No production coefficient selection or fake runner/loft/deployed result.

Acceptance: all 40 unique real-WASM trials, finite metrics, same canonical epsilon, optional classifications null only without samples, truthful peak/traversal limits; settled on final allowed step counts as settled if the entire quiet window is satisfied. T02 parent remains unfinished.

## Coordinator and checks

Coordinator alone owns canonical config/types/schema/hash fixtures, D38, `.gitattributes`, homepage status, CI, prebuilt preview server, root instructions/README and runtime records. No worker spawns or writes unowned paths. No local builds/tests/servers during implementation. Save reports with NOT RUN until GitHub supplies evidence. Rotate reviewers; no author reviews their own implementation.

GitHub checks: `pnpm install --frozen-lockfile`; migration `pnpm --filter @korre/api db:migrate` twice on disposable PostgreSQL; `pnpm verify`; `pnpm test:integration`; `COUNTERBALL_PREBUILT_PREVIEW=1 pnpm test:e2e --workers=1`. Upload real diagnostic JSON, built web files and browser evidence. Review source and actual passing run/SHA before accepting repairs or parent T11.

Failure: two focused repairs per worker/failure then evidence to coordinator; never weaken required checks. User testing serves the remotely built artifact via `node scripts/serve-preview.mjs`, loopback only, after explicit progress notice; it performs no build. No production publication, paid-plan change or unrelated external service use.
