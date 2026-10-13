# Integration record

## T00

Workspace packages and entrypoints are under the `@korre/*` naming rule. Browser and headless Counterball exports are separate. Browser, Node, and Worker TypeScript configs use distinct ambient libraries; the API build emits only runtime JS/declarations and source maps. After repair 2, `pnpm install --frozen-lockfile`, `pnpm verify`, `pnpm test:integration`, `pnpm test:e2e`, and a five-path backend import probe passed. The domain lint rule rejects shared and relative UI/presentation imports and app/backend imports. Wrangler remains a 0.36 KiB local health-route dry run with no bindings; it is not deployed Havok evidence. Final independent repair-2 review passed at `execution_state/reports/T00-review-repair-2.md`.

## T01 — accepted after independent review

The first independent review at `execution_state/reports/T01-review.md` reproduced an own `__proto__` canonicalization collision and accepted a 606,802-byte playback chunk with an invalid index. Coordinator repair 1 adds a null-prototype canonical accumulator and fixed protocol-v1 bounds with negative tests, including snapshot metadata/index consistency and aggregate bytes. After the final test addition, frozen install, protocol/SDK package tests (9 and 3), full `pnpm verify` (22 tests/builds), integration, and Chromium E2E passed. The final independent re-review passed and the coordinator reran the frozen install successfully; T01 is `ACCEPTED`. The config carries `physicsCalibration: null` pending T02's pinned calibration; no simulation or deployed Cloudflare result is claimed.

## External services — historical baseline before this review

- Git remote `origin` is `https://github.com/folaoluwafemi/korre.git`; the user has authenticated GitHub CLI access. Hosted CI runs against the `codex/remote-ci-bootstrap` branch. Run 18 is linked below; credentials and temporary artifact URLs are not recorded.
- As of 2026-10-10, read-only `wrangler whoami` and `railway whoami` checks both succeeded through existing sign-ins; identity/account details were withheld. Cloudflare staging has not yet been deployed; its concrete smoke artifact depends on accepted T02.
- The workspace is not linked to a Railway project. One account project is visible, but its name does not match Counterball and its only environment is not labeled staging/development/test; it contains a PostgreSQL-named service. It was not linked, read for variables, migrated, deployed to, or otherwise changed.
- Docker Engine is unavailable and `127.0.0.1:5432` is not accepting connections. T11's real-PostgreSQL acceptance remains unverified. Use a disposable local PostgreSQL service or an explicitly designated nonproduction Railway environment; do not use the unrelated project or production environment for tests.

## Earlier packet wave — historical evidence

- T03 is `ACCEPTED`. The hosted independent review at `execution_state/reports/T03-hosted-review-1.md` confirmed the pitch/goals/caps, canonical fixture geometry, four real button openings, unmount/remount cleanup, and all three one-worker Chromium tests in GitHub run #6. No physical-phone or full gameplay proof is claimed.
- T11-A/B and coordinator API composition/migration runner are locally implemented. The API edge-auth/trusted-client repair passed recorded API typecheck/tests (22 passed, 8 PostgreSQL cases skipped), formatter, scoped lint, migration syntax check, and in-memory boundary integration. Independent T11 parent repair re-review passed in `execution_state/reports/T11-parent-review-repair-1.md`. The migration has not been applied. Real PostgreSQL acceptance remains NOT RUN because no authorized disposable database is available; the unrelated Railway project was not touched.
- T02-A is `ACCEPTED`. The constructor cleanup repair passed independent review, and GitHub run #8 passed the full workspace checks, real-Havok 480-trial calibration probe, integration, and browser E2E. Calibration observations and their limitations are recorded under `execution_state/reports/T02-calibration-observations-*`; no production physics coefficients were selected from them.
- T02-B2's intended-shot diagnostic passed the full hosted pipeline in GitHub run [#18](https://github.com/folaoluwafemi/korre/actions/runs/38042497937), including 40 real pinned-Havok-WASM trials, integration, and three Chromium tests. Artifact `11665948583` is preserved and its provenance/data review passed. Eight trials show positive raw signed clearance, but the canonical clearance epsilon and all configured-threshold classifications remain null. T02-B2 and parent T02 remain open; this is not deployed Cloudflare evidence or a production physics selection.
- The user reports being logged into Wrangler and earlier authorized the requested staging deployment. Use that session only for the plan's T04 staging proof after accepted T02 and a real runner exist. No production deployment or plan change is authorized.

## Current hosted review

GitHub run [38057543954](https://github.com/folaoluwafemi/korre/actions/runs/38057543954) on `22a7375e1b57a01d1bd91e23f18749ed7096d4a8` passed frozen installation, type/lint/format checks, all workspace builds, 98 tests across 24 files with zero skips, migrations twice on disposable PostgreSQL, one health integration test and four built-browser cases with zero retries/skips. Independent final evidence review is recorded in the current review reports before coordinator acceptance.

Real database acceptance no longer needs Railway: CI ran eight repository, two HTTP/service/repository and five migration-runner PostgreSQL cases. The unrelated Railway project remains untouched. Earlier local skipped-test and unapplied-migration statements above describe the historical baseline only. Identity UI, deployed cookie/proxy behavior and database readiness remain future work; `/health` proves liveness only.

D38 now supplies canonical provisional `restart.clearanceEpsilon=0.005`; it needs no human numeric answer. The independently reviewed 40-trial run-22 artifact reports sampled clearance and contacts separately. No tested candidate demonstrates collision-free loft; calibration remains null. The bounded diagnostic can be accepted without accepting parent T02. T02's runner/facts/loft gates and T04/T05 remain unfinished.

The browser now supports pointer/touch/keyboard camera inspection, capped idle/background rendering, and real native context-loss recovery. Hosted checks exercise unsupported preflight and partial engine construction followed by genuine retry without leaked listeners/registry entries. These are static scene checks, not playable matches. Real phones remain unverified.

## C01-DIAG-PANEL — accepted bounded renderer warning

The accessible, noninteractive diagnostic panel and its static-markup test passed independent source review. GitHub run [38093822035](https://github.com/folaoluwafemi/korre/actions/runs/38093822035) on `6ca75219e68fefc9a7ed73aaeffb25954598b27b` passed full verification (26 files/140 tests, zero skips), integration (1/1), and production Chromium (4/4, zero skips/flaky/unexpected). The independent artifact report rehashed all 926 extracted files and verified the production inventory. This accepted card proves only its component/test under unchanged production checks. The panel was not wired into the app at that SHA; there was no browser interaction, flick, match, Havok deployment, or playability proof.

`C01-DIAG-BUILD` now owns the compile-time diagnostic import, explicit production exclusion script, and a distinct hosted diagnostic artifact/inventory. Its independent source review passed at `execution_state/reports/C01-DIAG-BUILD-review.md`; GitHub build and artifact checks are still NOT RUN. C01 remains CHANGES_REQUIRED until the diagnostic artifact and fresh exact-head evidence are reviewed.

## C00-A — protocol cancellation contract

2026-10-10: C00-A is ACCEPTED as a protocol contract packet after independent source/config/runtime reviews and GitHub run 38078890667 on exact SHA `4bfecb4e6d700f85f89b7d521e168cab9489c6ec`. The focused protocol suite passed 10/10; `pnpm verify` passed with 24 files/99 tests, zero skips, and build; disposable PostgreSQL migration/recheck passed twice; integration passed 1/1; Chromium E2E passed 4/4 with zero skipped/unexpected/flaky. Full logs and artifacts are preserved under `reports/C00-A-run-38078890667*`; provenance/hashes are in `reports/C00-A-runtime-review-run-38078890667.md`. The earlier formatter failure on run 38078311528 remains recorded historically under `reports/C00-A-run-38078311528-*`. No deployed gameplay consumer is recorded; recheck any staged/versioned consumer before launch. T02 remains RUNNING because no runner cancellation timing/cleanup/checkpoint behavior or full physics gates are implemented.

All application builds/tests ran on GitHub. User inspection can use the downloaded passing artifact through the lightweight loopback-only static server, with no local compilation or dependency installation. No Cloudflare/Railway deployment or paid/production change occurred in this review. Runtime authority is `tasks.json` and `reports/current-review-validation.md`; historical entries do not override them.

## Current completion execution — 2026-10-10

- GitHub run [38084305781](https://github.com/folaoluwafemi/korre/actions/runs/38084305781) on `f1e81ebf1b1303cfa7fb1ecfef60769497d77ad7` passed the real Workerd smoke with 1/1 tests and zero skips, then failed the Prettier gate on `vitest.config.ts`; later checks were skipped. The one-file formatting repair received independent source-review PASS. Exact log/artifact hashes are in `reports/C01-run-38084305781.md`.
- GitHub run [38084915701](https://github.com/folaoluwafemi/korre/actions/runs/38084915701) on `fc27a1dbfdba5dab9a03d20d14a77f818b85b5ac` passed the Worker smoke (1/1), root formatting gate, Playwright install, PostgreSQL migration twice, protocol suite (11/11), and all eight package plus root test-project typechecks. `pnpm verify` then failed ESLint at unaccepted `games/counterball/src/simulation/facts.ts:221` (`no-unsafe-assignment`). Unit tests/build, integration and browser checks were skipped. Full log and downloaded artifact hashes are in `reports/C01-run-38084915701.md`. C01 remains CHANGES_REQUIRED and its diagnostic-browser producer is still absent.
- T02-F01 repair 2 received independent CHANGES_REQUIRED review at `reports/T02-F01-repair-2-review.md`. Its vertical-axis endpoint-angle estimate can understate small-circle travel under general quaternion SLERP, making the support-clearance proof unsound. No F01 application checks ran; the hosted C01 run also found a lint error in that patch. The packet's two repair attempts are exhausted. Source edits are stopped while a math-only escalation is independently checked at `packets/T02-F01-math-escalation-1.md`; that packet does not authorize implementation.
- No new playable browser flick, local match, username-gated AI match, online match, deployment, or physical-device test resulted from this run. No Wrangler command was run.

## Current F01 continuation — 2026-10-10

The independent review of `reports/T02-F01-math-escalation-1.md` is PASS. It corrected the distinction between endpoint-to-endpoint axis separation and the angle measured from the interior alignment pose, and independently reproduced the positive midpoint false certificate (`+1.085206995e-6`) despite the hidden negative clearance (`-1e-7`). This accepts design analysis only; no F01 or T02 physics acceptance follows.

The bounded successor `T02-F01-ROTATION-1` is ready under F01. It retains the original accepted dependencies and adds the accepted math analysis. It fixes the unsafe-assignment lint blocker, adds the adversarial small-circle crossing test, preserves all earlier fact regressions, and runs application checks on GitHub. No application check or game flow was added by the math-only report. C01 remains CHANGES_REQUIRED after run 38084915701 stopped at that lint error; full unit tests/build, integration and browser checks did not run. No local game build/test/browser, deployed Havok, Wrangler deployment, playable flick, local match, AI, or online match is claimed.

The implementation for `T02-F01-ROTATION-1` is now saved; independent source review is pending in `reports/T02-F01-ROTATION-1-review.md`. No application tests or builds have run for this revision, so there is no F01 acceptance or playable flow yet.

## T02-F01 rotational-support continuation — 2026-10-10

`T02-F01-ROTATION-1` implementation is complete and the independent source review now passes at `execution_state/reports/T02-F01-ROTATION-1-review.md`. The exact reviewed source has not yet run on GitHub. Coordinator publication and exact-SHA verification are next; the card, F01 and parent T02 remain unaccepted. No local application test/build/browser/physics command or Wrangler command ran. The prior `facts.ts:221` lint blocker is addressed in source, but only hosted verification can establish that. No playable browser flick, match, AI, online flow or deployed Havok result is claimed.

## T02-F01-ROTATION-1 hosted result — run 38087201307

Run [38087201307](https://github.com/folaoluwafemi/korre/actions/runs/38087201307) tested exact SHA `21ab540352c88f11ba15c8a2f4bb883c2ad71c61`. Workerd smoke passed 1/1, protocol passed 11/11, migrations were verified twice, and workspace/root typechecks plus ESLint passed. Prettier failed only on `facts.ts` and `facts.test.ts`; the unit-test phase/build did not run, and integration/Chromium checks were skipped. The full log and extracted hosted artifacts are saved under `execution_state/reports/T02-F01-ROTATION-1-run-38087201307*`; the run report lists hashes. A report-only independent escalation is now underway as required by the source packet's stop condition. No F01/T02 acceptance, playable flow, fresh real-Havok observation, or deployed result is claimed.


## T02-F01 exact formatting repair — 2026-10-10

`T02-F01-ROTATION-1-FORMAT-ESCALATION-1` is accepted only as authorization for one exact-patch repair. Independent review PASS and current patch SHA/applicability checks confirm the saved artifact remains the reviewed two-file formatting patch. New card `T02-F01-ROTATION-1-FORMAT-REPAIR-1` is RUNNING under T02 with the accepted T01/math/C0/C2/C00 prerequisites preserved. `/root/toolchain_audit` owns only `facts.ts` and `facts.test.ts`; `/root/foundation_review` independently reviews the resulting diff. Coordinator owns publication and exact-SHA GitHub verify, integration and Chromium checks. No local application checks ran. F01/T02 remain unaccepted; no gameplay or deployed Havok result is claimed.

Independent review of `T02-F01-ROTATION-1-FORMAT-REPAIR-1` passed at `reports/T02-F01-ROTATION-1-format-repair-1-review.md`: exact pinned digest, exact two-file scope, formatting-only semantics, and no local app checks. Source author/reviewer ownership is released. Coordinator publication and fresh exact-SHA GitHub verification remain pending; F01/T02 are not accepted.


## T02-F01 exact-head test failure — 2026-10-10

Run 38088587482 on exact reviewed SHA `efd6f567a35b29313ceda1c82dcc7b3b73b1298d` passed setup, Worker smoke 1/1, protocol 11/11, migrations twice, all typechecks, ESLint and Prettier. Vitest ran 25 files / 138 tests: 24 files passed and 1 failed; 131 passed, 7 failed, 0 skipped. Build, integration and Chromium steps skipped. Full job log, verify log, artifact IDs, extracted data and hashes are in `reports/T02-F01-ROTATION-1-format-repair-1-run-38088587482.md` and the companion artifacts directory. A report-only exact-failure escalation is running; source retries are stopped until independent PASS. No playable/browser/deployed-Havok claim follows.

## T02-F01 report acceptance and semantic repair 2 — 2026-10-10

The run-38088587482 failure report and independent review are saved at `execution_state/reports/T02-F01-ROTATION-1-ci-fail-escalation-1.md` and `execution_state/reports/T02-F01-ROTATION-1-ci-fail-escalation-1-review.md`. They classify the exact 131/7/0 tests and 23/1/8 workflow steps. Report-only escalation is ACCEPTED; F01/T02 are not.

`T02-F01-ROTATION-1-SEMANTIC-REPAIR-2` is materialized under T02 and its exact packet and full document checks pass. Author: `/root/toolchain_audit`, writing only `games/counterball/src/simulation/facts.ts`, `games/counterball/src/simulation/facts.test.ts`, and its named implementation report. Independent reviewer: `/root/foundation_review`, writing only its named review report. The implementation and source review are complete; coordinator owns publication, hosted checks, artifacts and shared status.

## T02-F01 semantic repair 2 source review — 2026-10-10

Implementation and independent review are saved at `execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-implementation.md` and `execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-review.md`. Source review PASS covers exactly the two assigned source/test files and does not establish test/runtime success.

Coordinator now owns committing/pushing the exact reviewed tree and running the GitHub `ci` workflow with full logs/artifact provenance and no skipped required checks. No local application command ran. F01/T02 stay open.

Exact reviewed SHA `e9d7aee4a3202b2e0a14bfb6a6f62bf967a62669` was pushed to `codex/remote-ci-bootstrap`; GitHub `ci` run 38090063627 failed at Verify. The summary and complete evidence are saved in `execution_state/reports/T02-F01-ROTATION-1-semantic-repair-2-run-38090063627.md` and companion logs/artifacts. Typecheck and ESLint passed; Prettier flagged only `facts.ts`. Unit tests/build/integration/browser checks did not run. A read-only applicability check confirms the hosted formatting patch is one-file/two-hunk and has not been applied. New independent report-only escalation `T02-F01-ROTATION-1-CI-FAIL-ESCALATION-2` is READY; F01/T02 stay unaccepted.

The same hosted run confirms C01 setup: Workerd smoke 1/1, root config formatting, migrations and protocol 11/11 passed. C01 remains CHANGES_REQUIRED because its full hosted verification and required Worker/browser package/build checks did not complete; no diagnostic browser artifact was produced.

## T02-F01 formatting escalation and repair 2 — 2026-10-10

Report-only escalation `T02-F01-ROTATION-1-CI-FAIL-ESCALATION-2` is ACCEPTED strictly as a failure-classification gate. Its author report and independent PASS are at `execution_state/reports/T02-F01-ROTATION-1-ci-fail-escalation-2.md` and `execution_state/reports/T02-F01-ROTATION-1-ci-fail-escalation-2-review.md`. They confirm the exact Prettier-only failure and authorize only the exact two-hunk patch with digest `c1a80ffd8ad4bcf4eb8f566df92dd02ac7b765e791d8612608aace1e65007bfe`.

`T02-F01-ROTATION-1-FORMAT-REPAIR-2` is READY under T02. `/root/toolchain_audit` owns only `games/counterball/src/simulation/facts.ts` and its named implementation report; `/root/foundation_review` is the independent reviewer. No patch has been applied. The author must use the saved artifact only, then stop for source review before coordinator publication and full hosted CI. F01/T02 remain unaccepted.

The exact patch is now applied and independently reviewed PASS. Author and reviewer ownership are released; byte-for-byte diff and whitespace checks pass. Coordinator owns committing/pushing the reviewed diff and running full hosted CI. No local application checks ran; F01/T02 remain unaccepted.
## Resume: exact-head F01 accepted; C01 diagnostic producer remains open — 2026-10-10

GitHub run 38091279565 on `ec6c35cb3b8e62c70c94d4fd6b26ed577f0088cf` passed 139 tests with zero skips, Worker smoke 1/1, protocol 11/11, migrations twice, integration 1/1, and Chromium 4/4. Independent exact-run artifact review passed. It verifies the F01 pure-facts producer and full existing static-preview workflow only. The emitted Worker is a `/health` placeholder; the browser is the static scene preview. No flick, match, deployed Havok or staging result is proved.

The completion graph now validates at 79 packets/21 remaining parents. A first metadata repair review found the old format-repair-1 packet still dispatchable; the coordinator closed that stale state, preserved the exact failed-run history, and the second independent review passed. Reports: `reports/COMPLETION-GRAPH-REPAIR-1-review.md` (CHANGES_REQUIRED finding) and `reports/COMPLETION-GRAPH-REPAIR-2-review.md` (PASS). T02 remains RUNNING. C01 is still CHANGES_REQUIRED because its distinct diagnostic browser artifact and explicit build-mode/production-exclusion evidence are missing.

The next implementation is a narrowly labelled renderer-only diagnostic producer based on accepted T03 scene code. It must not claim or simulate a flick. Once its diagnostic artifact is built and reviewed on GitHub, C01 can complete; then C01-P/C01-H can enable direct-shot evidence and the first actual browser Havok motion. No local application build, test or browser automation ran for this status repair.


## Coordinator checkpoint — 2026-10-13 (run 38438560050: transport did not start)

GitHub run 38438560050 on d79d049a296d21f6282ef7cbe21c9c56fd2f00bd passed Verify, the ordinary production diagnostic-absence check, integration, and production preview. The diagnostic browser suite had 2 passes, 1 failure, zero skips/flakes; its full-cap test timed out waiting for a missing control, and no write/download/digest/host acknowledgement began. The full log, structured run snapshot, ten artifact records, browser JSON, page snapshot and trace are retained in execution_state/reports/T02-L01-TRANSPORT-1-run-38438560050-evidence/. Independent review passed the count/root-cause audit at execution_state/reports/T02-L01-TRANSPORT-1-run-38438560050-review.md.

The confirmed cause is that CI sets VITE_COUNTERBALL_DEV_HARNESS=1 in its production-mode dist-dev build, while the panel and host acknowledgement check only import.meta.env.DEV. The route and CI routing are already correct. The separately reviewed source-only packet T02-L01-TRANSPORT-HARNESS-1 is ready under T02, depends on the same ten accepted prerequisites, and adds no workflow/config changes. The original transport packet now waits on this child. No app build/test ran locally; no Cloudflare session was used.

The harness source implementation is complete on the current working tree: the shared explicit-harness predicate now gates the panel, acknowledgement validation/install and teardown; the existing transport E2E checks panel/control/callback after scene readiness; production markers include the transport label and callback global. Its implementation report records only scoped diff-check PASS; app and browser checks are NOT RUN. Independent source review is in progress.
