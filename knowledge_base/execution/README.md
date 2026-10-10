# Counterball execution plan

Prepared 10 October 2026. This is an implementation handoff, not a claim that the game is implemented. The repository currently contains the knowledge base and original screenshot. No application, package workspace, CI, infrastructure, or deployed service has been created.

## Start here

1. Read root `AGENTS.md`.
2. Read [decisions](DECISIONS.md), [contracts](CONTRACTS.md), and [task catalogue](TASKS.md).
3. Read [swarm runbook](SWARM.md). Use its coordinator prompt for the implementing model.
4. Read [gameplay specification](GAMEPLAY.md) and [platform specification](PLATFORM.md) only for the assigned task.
5. T00 copies [status.json](status.json), the immutable initial seed, to `execution_state/tasks.json`. Claim the first ready task there. Complete its checks and independent review before its dependents start.

The current human asked for a detailed plan that a less capable model can execute with subagents. Do not silently switch models, create user-owned chats, or launch the entire implementation while preparing this handoff. During implementation, use the configured model and its subagents. The user can choose a less capable model before starting the handoff prompt.

## Source precedence

Human corrections in the current chat outrank every file. Then use `DECISIONS.md`, `CONTRACTS.md`, and `TASKS.md`, followed by the specialist plans. `COUNTERBALL_RULES.md` and `CONTEXT.md` provide context. The imported `README.md` transcript is historical; its two-shot foul awards, wooden walls, guest play, three AI difficulties, and obsolete backend proposals are superseded.

When specialist prose conflicts with a canonical contract, stop that task, log the conflict, and ask the coordinator to reconcile the files. Do not create a second interface or copy rules into another package.

## Deliverable and completion definition

A player chooses a unique username, starts Counterball, and plays a full first-to-three match against one basic AI or another online player. Seven caps per player flick a plastic button on open green concrete. Fouls and out-of-bounds award placed restarts. Penalties use the penalty-box edge. Players can invite friends, spectate, queue, and reconnect. Presentation feels vibrant and tactile and supports mobile touch. Email is optional. Video streaming and competitive rankings are deferred.

Local prototype gates do not equal launch completion. Launch also requires real two-browser online tests, deployed Havok proof, PostgreSQL persistence, recovery tests, spectator tests, real Android Chrome and iOS Safari checks, and user review of game feel. Missing phones block mobile release evidence, not independent local work.

## Work layout

```text
apps/
  web/                  React + Vite shell, menus, identity, HUD
  api/                  Railway Node/Hono API, identity and Postgres
  realtime/             Cloudflare Worker: edge proxy, MatchRoom/Matchmaker DOs
games/
  counterball/
    src/
      features/
        match/ referee/ restarts/ formations/ flick/ ai/ camera/ cinematics/
      simulation/       Havok adapter, headless runner, serializable snapshots
      scene/            Babylon scene, procedural geometry/materials
      index.ts          Public lazy-loaded integration entry
packages/
  game-protocol/        Serializable contracts and runtime validation; no engine imports
  game-sdk/             Lifecycle and transport interfaces; no Counterball rules
  identity-client/      Typed browser identity requests
  ui/                   Small shared HTML/React controls and copy
infrastructure/
  database/             Ordered migrations
  cloudflare/           Binding and environment documentation
tests/
  fixtures/ integration/ e2e/
knowledge_base/
  execution/            Plan, status, decisions, evidence
```

Feature internals use domain/application/infrastructure/presentation folders only where needed. Pure rules must not import Babylon, React, Cloudflare, or database clients. Shared platform code must not import Counterball rules. No universal rendering engine abstraction.

## Toolchain and dependency policy

The user explicitly confirmed a monorepo. Use pnpm workspaces, TypeScript strict mode, React/Vite, Hono for the Node API, PostgreSQL with `pg`, a small schema validator such as Zod, Vitest, and Playwright. Use native CSS, not a large component framework. The coordinator creates root scripts and installs dependencies once. Workers do not edit the lockfile.

Workspace dependency direction: web imports SDK/identity-client/UI and lazy-loads `@korre/counterball/browser`; realtime imports protocol and `@korre/counterball/headless`; API imports protocol and its own database features. Counterball imports protocol/SDK, never web/API/realtime. Protocol imports no app/game implementation. Give Counterball explicit `./browser` and `./headless` exports so bundlers never pull scene/DOM/React into the Worker. Check server bundle imports in T04. Share the same adapter and config through the headless export, not copied physics code.

Registry observations on 10 October 2026: pnpm 10.33.0 is installed; local Node is 25.2.0; Vite 8.3.4 declares Node `^20.19.0 || >=22.12.0`; Babylon core 9.30.0; Havok 1.3.14; Wrangler 4.149.0 declares Node >=22. These observations are starting pins, not proof of compatibility. T00 verifies peer dependencies and selects an active supported Node LTS for CI. Record exact versions in `VERSIONS.md` and commit one lockfile. Keep Babylon core/loaders packages at the same version. Never switch versions halfway through a task to hide an integration failure.

The repository root should offer these stable scripts after T00:

| Command | Required behaviour |
|---|---|
| `pnpm install --frozen-lockfile` | Reproduce dependencies from the lockfile |
| `pnpm dev` | Start local web and API, with documented local realtime startup |
| `pnpm typecheck` | Check all workspace packages |
| `pnpm lint` | Enforce imports, promise handling, and format conventions |
| `pnpm test` | Run deterministic unit/domain tests |
| `pnpm test:integration` | Run integration tests; report required services clearly |
| `pnpm test:e2e` | Run browser tests against documented local services |
| `pnpm build` | Build web, Node API, and Worker bundle |
| `pnpm verify` | Typecheck + lint + unit tests + builds; do not silently skip failures |

On Windows, use `pnpm.cmd`, `npm.cmd`, and `npx.cmd` when PowerShell execution policy blocks shim scripts. Do not use shell-specific command chaining in task packets.

## Milestones and safe parallelism

| Gate | Result | Ready tasks / dependencies |
|---|---|---|
| G0 | Reproducible workspace and contracts | T00, then T01 |
| G1 | Browser flick and actual deployed Havok feasibility | T02/T03 after T01; T04 after T02; T05 after T02+T03 |
| G2 | Complete local rules and placed restarts | T06/T07/T08 after their listed dependencies; T09 integrates |
| G3 | One basic AI and verified username identity | T10 and T11/T12 can proceed independently |
| G4 | Two authenticated online players complete a match | T13–T17 |
| G5 | Invites, spectators, queue, public casual matching | T18–T20 |
| G6 | Mobile polish, recovery, deployment, handoff | T21–T24 |

The coordinator occupies one slot; use at most three worker/reviewer slots. A wave is not permission to ignore task dependencies. Put one reviewer in a freed slot as work completes. One agent owns each write path at a time. Shared contracts, root configuration, lockfiles, deployment config, and evidence status have one coordinator writer.

## Early infrastructure proof

T04 must resolve one real Havok shot in a deployed staging Durable Object, using the actual pinned WASM and bundle. A Node success or fake simulator is insufficient. It is a compatibility integration, not a benchmarking project. Until credentials are available, finish local tests and dry-run bundling; mark only the deployed proof as external-blocked. Keep independent browser/domain work moving.

If Cloudflare genuinely cannot host the pinned integration after bounded investigation, retain the DO room coordinator and use the specified Railway simulation fallback. Do not silently replace Havok with another engine. Record evidence and resource impact before changing the runner.

## What requires the user later

No gameplay answer is needed to start. Provisional decisions are explicit in `DECISIONS.md`. User input will be needed for:

- A Cloudflare account and staging deployment access, if not already available.
- Railway project/database access and a deployment target.
- The desired public domain and final production publication.
- Playing the prototype to confirm friction, force, placement tolerances, and the Nigerian feel.
- An email provider only if actual email delivery is included at launch. Username invites and links must already work.

Inspect existing authorised credentials through official CLIs without printing secrets. Prefer normal sign-in or secret managers. Do not ask the user to paste secrets into chat. Finish reviewable local artifacts before requesting deployment input. A staging deployment authorised during implementation does not by itself authorise a paid-plan change or a production rollout.

## Completion evidence

Each task has implementation and review reports in `execution_state/reports/Txx-implementation.md` and `Txx-review.md`. Include changed paths, checks, results, remaining limits, screenshots where relevant, and independent review. The coordinator maintains runtime status. No green gate from a mock, skipped test, unrun command, or merely compiling code. Browser emulation does not prove real-phone performance. Record that test separately.

The final delivery includes local startup instructions, staging/production URLs where actually deployed, migration and rollback procedures, version manifest, known limitations, and a user playtest list. Keep the historical chat and source images intact.
