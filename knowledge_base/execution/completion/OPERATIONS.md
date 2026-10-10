# Execute with small agents and preserve evidence

## Before dispatch

The coordinator reads the live task state and packet graph, then chooses the next ready card. A card is ready only if every explicit packet dependency and original parent dependency is ACCEPTED. Existing baseline parents are T00/T01/T03/T11; accepted T02 children are reused, but T02 itself is not accepted. Do not treat the previous green CI as proof of new files.

For each new packet, append a record under its existing parent in `execution_state/tasks.json`: id, status, depends_on, exact writes, owner, author identity, reviewer identity, attempt count, implementation/review paths, checks and next action. Keep the original parent IDs. Auxiliary C-cards belong under T02 or coordinator preparation records; never create a second task-state file. Planning packet JSON remains immutable input until a reviewed amendment is needed.

Before assigning two cards concurrently, compare their exact write paths and prerequisite interfaces. A shared file is an exclusive lock even when agents plan to edit different lines. Shared manifests, protocol, fixtures, migrations ordering, CI and integration entrypoints are coordinator-only. Role=coordinator cards cannot be dispatched to ordinary workers unchanged.

Card writes exclude its two uniquely named reports. Each implementation writes `execution_state/reports/<id>-implementation.md`; its independent reviewer writes `<id>-review.md`. The coordinator assigns these exact paths too. Implementation/test files must fit the five-path bound. If discovered work needs a sixth path, return the finding, split the card and review the new dependencies before continuing. Never claim an entire feature directory.

Future read files/commands can be named in a card, but they must exist from accepted producers before dispatch. Resolve the actual export/API, exact test filename, test discovery and expected environment. If any is missing, repair the producer/configuration card first. Do not run a nonexistent command and turn that into acceptance.

## Worker prompt

```text
Implement packet <ID> from <exact JSON file>.
Extract only its record with node scripts/check-completion-plan.mjs --packet <ID>.
Read AGENTS.md, execution DECISIONS/CONTRACTS/TASKS/SWARM, completion README,
CONTRACT_WORK, and all card read_paths. Human corrections override files.
Inputs and accepted dependencies: <concrete existing exports and report links>.
Allowed writes: <exact card paths> plus execution_state/reports/<ID>-implementation.md.
All other paths are read-only. No spawning, model switching, status/config edits,
dependency installs, local builds/tests/services or deployment.
Implement only this card. Do not implement dependent features.
Write the implementation report with changed paths, source/docs consulted,
checks requested, NOT RUN where applicable, limits and precise next action.
Stop for conflicting contracts, missing accepted inputs, extra write files,
unapproved tuning/physics substitutions or a new external requirement.
Do not self-review. Release write ownership after saving the report.
```

Send only the card and relevant files to a cheap worker. Do not make every worker ingest the full transcript, all artifacts, or all historical failed reports. Supply a short verified baseline and the exact interfaces it consumes. Reuse completed workers; do not leave a stale worker able to write when its path is reassigned.

## Review prompt

```text
Independently review packet <ID>, authored by <different agent identity>.
Source is read-only. Sole write path: execution_state/reports/<ID>-review.md.
Read the card's acceptance/negative_cases/review_questions, governing contracts,
actual diff, implementation report and remote artifacts for exact commit <SHA>.
Check human rules, canonical interfaces, cleanup/error paths and required proof.
State SOURCE verdict and RUNTIME verdict separately. NOT RUN is not PASS.
List concrete failures with file/line and the smallest repair, or PASS with limits.
Do not repair source, spawn, edit status, install/build/test locally or self-review.
```

Assign a reviewer who did not author the packet. With three workers A/B/C, C can review A while B works; reuse A to review B later. Coordinator-authored source/config also needs an independent reviewer. An agent may review a cross-packet integration only if it did not author the code that integration claims to review; otherwise select another reviewer.

## Hosted checks and laptop load

Use GitHub for installation, formatting, type/lint checks, tests, browser automation, Worker dry-runs, bundle inspection and application builds. Local lightweight file/git/docs operations and this plan validator are allowed. Do not restart expensive local work because it is easier. If a local build becomes genuinely necessary, explain it in a visible progress message before starting and keep it bounded.

The current workflow is `.github/workflows/ci.yml`, triggered by push/PR. Publish one reviewable wave, generally one or two disjoint implemented cards plus their coordinator wiring. Use the existing `codex/` branch unless deliberately changing it. Do not commit half-written shared files while workers own them. Do not push after every small formatting adjustment. Avoid unnecessary reruns once the exact code/config has passed; evidence-only commits may use `[skip ci]`.

Existing hosted acceptance sequence:

```text
pnpm install --frozen-lockfile
pnpm --filter @korre/api db:migrate
pnpm --filter @korre/api db:migrate
pnpm verify
pnpm test:integration
COUNTERBALL_PREBUILT_PREVIEW=1 pnpm test:e2e --workers=1
```

These command lines are Linux CI commands. Windows source operations use PowerShell and `.cmd` shims where needed. Never interpolate secrets into shell commands or print credential-bearing environments. CI's PostgreSQL `korre_test` is disposable; existing opt-in database guards stay enforced.

C01 owns new test/workerd/diagnostic workflow wiring. A narrow test line in a card means a GitHub runner executes it after frozen installation. A local coordinator must not execute it. Additional future commands are not valid until C01 or an exact subsequent coordinator card wires and independently reviews them. Test discovery must collect the named case; use no pass-on-empty escape.

C01-P owns package/type prerequisites. C01-H owns the following browser routing, not the future service implementation. Default `playwright.config.ts` preserves production static regressions. With `COUNTERBALL_DEV_E2E=1`, it instead serves `apps/web/dist-dev` and explicitly selects the diagnostic physics probe, flick, restart, hotseat and local cinematic specs as their producers land, including early `tests/e2e/counterball-direct-probe.spec.ts`. Ordinary identity, AI, online and security specs must be excluded from this default config and selected through dedicated configurations. C01-H must list exact filenames from both catalogues and prove collection; an unrecognized spec is a failure requiring a reviewed wiring followup. New server tests must be included in Vitest, and `*.workers.test.ts` excluded from Node Vitest.

GitHub builds diagnostic files with `VITE_COUNTERBALL_DEV_HARNESS=1 pnpm --filter @korre/web exec vite build --outDir dist-dev`. The normal build leaves that variable unset and writes production `apps/web/dist`. Use distinct artifact names and retained source provenance. Diagnostic builds contain named development player identities and a visible development label; they cannot ship as public guest AI/online play. The flag controls conditional imports that disappear from production. A source-only conditional is insufficient: T05-F02 inspects the built production output for absence and proves the diagnostic mode works separately.

Routing precedence is explicit: `COUNTERBALL_DEV_E2E=1` always selects the compiled `dist-dev` artifact and diagnostic test list, even when `COUNTERBALL_PREBUILT_PREVIEW=1` is also present. Without DEV_E2E, PREBUILT selects production `dist` and static regressions. No DEV_E2E mode starts Vite or falls back to production if its artifact is absent; missing `dist-dev` fails startup. The identity/online dedicated configs ignore these static routing flags and validate their own service mode.

O04 creates `playwright.identity.config.ts`, starts the actual built API plus Vite/proxy, and supplies guarded disposable PostgreSQL, loopback origin and three distinct protected development secrets. C01 migrates/builds; it does not falsely imply those servers are running. O06/O09 and AI identity cases use that config. O19 creates `playwright.online.config.ts`, which uses approved staging origins and actual two-player authority; online/cinematic/security cases use it. O19 must explicitly include future filenames or require a bounded coordinator update before their dispatch. Never force these suites onto the static preview, bypass the trusted proxy headers, or print secrets. A broad `pnpm test:e2e` in a card means the applicable explicitly routed suite, followed by production regressions; it never licenses running API tests against the wrong server. Reports record the expanded commands and collected files.

C01 generates those three ephemeral test secrets cryptographically on the GitHub runner, each at least 32 bytes and distinct, masks them before use and passes them through protected process/environment state. This requires no user-supplied secret or staging database. Never log the raw values or use actual player/service credentials for disposable tests. Staging secrets are separately managed through the approved provider facilities.

## Prebuilt staging upload

O03 prepares a staging-only deployment config and uploads already compiled artifacts. Build the Worker on GitHub with the pinned Wrangler dry-run and retain the emitted entry file, every referenced WASM/module, asset files, deployment configuration and hashes together. The artifact must be self-contained: no TypeScript entry, unresolved workspace imports or custom build hook on the laptop. Staging bindings, migration metadata and compatibility settings must match the source config; exclude production routes/custom domains.

C01 owns the workflow upload: `counterball-realtime-prebuilt-${github.sha}`, retained for 14 days, contains `apps/realtime/dist`, source `apps/realtime/wrangler.toml`, and a generated JSON inventory with source SHA, pinned versions, actual entry path and every file's SHA-256. Inventory generation stays inside the owned workflow. O03 records the successful run/artifact name/id, downloads into a unique ignored `.artifacts/<run-id>/` directory, checks the inventory, and derives its prebuilt config from those files. Missing emitted WASM or unresolved imports require a hosted build repair. Browser artifacts use `counterball-web-production-${github.sha}` and `counterball-web-diagnostic-${github.sha}` with explicit build-mode provenance.

Verify downloaded provenance and safe authorised account/target, then upload with the pinned CLI using `pnpm exec wrangler deploy --config infrastructure/cloudflare/prebuilt-staging.jsonc --env staging --no-bundle`. O03 owns that config and must set its `main`, module rules and asset directory to the downloaded artifact, with no build command. Inspect pinned CLI help/config semantics first; a positional override is not assumed. `--no-bundle` skips Wrangler compilation, as documented in [Cloudflare bundling](https://developers.cloudflare.com/workers/wrangler/bundling/) and [Workers commands](https://developers.cloudflare.com/workers/wrangler/commands/workers/). Uploading is an actual staging change and requires the authorised sign-in and correct target; dry-run output alone does not prove deployed Havok. If extra modules cannot be uploaded safely with this procedure, repair the remote artifact/config first. Only a demonstrably unavoidable local build may use the announced bounded fallback.

Run O03's real staging request script against the returned deployment URL, preserve response/body timings/version/hash and independently review actual execution. Online gating cannot use mocked Havok, Node-only success or a substituted health response. Later staged web/API deployment likewise consumes prebuilt images/assets where supported. Do not infer a Railway target from unrelated account projects.

Preserve complete logs and structured browser JSON rather than truncated console summaries. Every run record includes run URL/id, exact head SHA, command, environment, exit/conclusion, pass/fail/skip/retry counts, artifact name/id/hash where appropriate and reviewer. Uploaded diagnostic data must include configHash, engine/adapter versions, inputs, actual contacts and termination; screenshot labels cannot prove movement or authority.

Download the newly passing browser artifact into a unique folder. Inspect provenance, then serve it with `node scripts/serve-preview.mjs <artifact-directory> [port]`. Announce the small local server. It serves existing files and performs no build. Preserve the current preview until its replacement is ready. Never claim an app panel opened when its tool result only says queued.

## Accepting and unlocking

1. Author saves report and stops writing: IMPLEMENTED.
2. Independent source review passes; failures enter CHANGES_REQUIRED.
3. Hosted checks for the exact integrated commit pass; reviewer checks real artifacts: VERIFIED.
4. Coordinator verifies all card conditions and integrated consumers, then records ACCEPTED and releases locks.
5. Accept a parent only after all required children, original acceptance matrix and integration check pass. Update ledger from tasks.json. A partial dry-run cannot accept deployed T04. A first flick cannot accept full-match T09.

Do not accept a physics card from mocks, a deployed gate from Node, a DB gate from an in-memory repository, an online match from two browser labels, or a real-phone gate from emulation. Source inspection is useful evidence but must remain labelled.

C04-QA belongs to T21 preparation and can write/run the eventual O27 automated files before T21's physical-device report is available. O27 still requires ACCEPTED T21 through its original parent dependency; it consumes these files/evidence for final T22 review. This preserves the release gate while avoiding an idle team waiting for phones. T21-D01's unique implementation report is the single physical-device evidence producer; O28 consumes it and requests a new device run only if a relevant build change invalidates the recorded evidence. An unavailable phone leaves only that gate blocked, never a fabricated PASS.

## Bounded repairs and escalation

Track attempts by the same failure mechanism, not just run number. Give an author at most two focused repair attempts after a concrete failure. Each attempt has exact ownership, unchanged acceptance and fresh relevant checks. Formatter/type errors get narrow fixes; never upgrade the engine, silence lint, widen tolerances, increase retries or skip an assertion to obtain green.

After two failed focused repairs, stop that author, release its paths and assign the independent reviewer/coordinator a diagnosis card. Preserve input, actual error and artifact. The coordinator either splits a smaller packet, corrects a contract with reviewed consumer updates, or marks only a genuine external gate BLOCKED. Do not create repeated open-ended research matrices.

For calibration: one bounded coarse candidate set, one refinement of evidence-backed candidates, then one confirmation set across power/tilt/orientation/obstacle cases. Set candidate counts and budgets before running. Failure to prove physical loft is a real T02 finding; never hide it with a positive apex. Any explicit assisted mapping must receive a reviewed coordinator decision, version/hash update and the same local/deployed runner tests before acceptance. User feel review remains required.

On failure during play, preserve the last authority/checkpoint, cancel transient work and show a recoverable error. On credential failure, preserve ready artifacts and report the exact staging action/account target needed. Do not request raw secrets, move to an unrelated Railway DB, change paid plans, or publish production.

## Resume and handoff

At every completed wave, leave: exact source SHA; tasks/ledger state; released/active ownership; last run and independent report; next ready card; unresolved findings/external blockers; preview/staging URLs and any lightweight server session. A new coordinator reads these instead of reconstructing progress from chat.

Report user-visible progress about once a minute while active. Ask the user only for a genuine missing rule/access/device/production decision. Production approval comes after a concrete staging result and runbook. If unavailable, deliver staging-ready work and leave production blocked; do not mark the full launch complete.

## Documentation verified for this plan

Implementation must recheck current APIs when it reaches them. These primary references were opened while planning on 10 October 2026:

- [Cloudflare Workers WebAssembly](https://developers.cloudflare.com/workers/runtime-apis/webassembly/): verify precompiled module loading rather than assuming the package's Node loader works at the edge.
- [Durable Objects WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/): persist room authority separately from connection attachments and use the supported hibernation API.
- [Pointer capture](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture): handle release/cancellation and retain keyboard controls.
- [Babylon physics documentation](https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine/): inspect pinned Physics V2/Havok source and types before calling stepping/collision APIs.

Modern Web Guidance `drag` and `efficient-background-processing` were retrieved. Apply pointer capture only to the game's input surface, preserve ordinary page scrolling and button focus, and pause expensive presentation when hidden. Do not pause accepted server authority merely because a spectator hides a tab.
