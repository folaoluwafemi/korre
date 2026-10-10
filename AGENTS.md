# Counterball implementation instructions

## Read first

Use `knowledge_base/execution/README.md` as the implementation entry point. Read `DECISIONS.md`, `CONTRACTS.md`, and the assigned section of `TASKS.md` before editing code. Human instructions override the files. The imported chat is historical and contains superseded rules.

## Scope

Build Counterball for Korre. Seven caps per side, plastic button with visible holes, open green concrete, one basic AI, online duels, required unique username, placed restarts, spectators and invitations. No automatic two-shot foul rewards. No guest matches. No walls, three AI difficulties, ranking, video streaming, creator harness, or extra features unless the human changes scope.

The human explicitly requires a monorepo: pnpm workspace with apps/, games/counterball/, packages/, one lockfile, and controlled dependency direction. Do not split services into separate repositories.

Current repository state is documentation only. Do not claim an application exists. The plan's task catalogue describes future work. If the human asks only for planning, update the plan and do not launch implementation.

## Team

The user explicitly requested subagents for execution. Use one coordinator plus at most three active child agents when tools are available. Only the coordinator spawns. Workers must not spawn agents, create chats, change models, or edit another worker's files. Reuse workers. Independent review is mandatory for a task before acceptance.

All agents share this checkout. Assign exact write paths before dispatch. Root manifests, lockfile, shared contracts, migration ordering, environment configuration, decisions, and shared status have one coordinator writer. Workers may request edits but must not apply them without ownership. Reviewers are read-only except for their assigned report.

## Rules and boundaries

Pure game rules must not import Babylon, React, Cloudflare, or database libraries. Rules run on serializable state and simulation facts. Havok adapters own physics. Babylon presentation renders authority; it does not invent online results. No cap/scene handles in network messages or persisted state.

Follow the plan's versioned contract. Do not invent a competing type, coordinate axis, event name, default, or folder layout. Document any necessary contract change and have the coordinator update every consumer. Keep uncertain cultural rules labelled as defaults.

## Verification and progress

Claim one bounded task. Read its acceptance conditions. Save implementation evidence before reporting completion. Reviewers check actual files and run relevant tests. A test not run is not passed. Mocks do not prove real WASM, database, WebSocket, deployed Cloudflare, or real-phone compatibility.

The coordinator maintains `execution_state/` using the SWARM runbook. Dependencies require ACCEPTED status, not merely an agent's completion message. On resume, inspect files/status and continue the next ready task. Do not restart completed work or rederive settled rules.

Use pinned workspace dependencies. Only coordinator updates package manifests and pnpm lockfile. Read applicable installed skills. Verify current official APIs before framework/Cloudflare work; record documentation used. Use `rg` for searches. On Windows use native PowerShell file operations and explicit checked paths for removal.

## External services

Local work continues without cloud credentials. Mark only credential-dependent work BLOCKED. Do not log secrets or put session tokens in URLs. Do not change paid plans or production services without the user's specific authorization. Complete reviewable local artifacts before asking for deployment access. Use actual staged proof for the online physics gate.

## Completion report

Report what works, required checks, staging status, real-phone status, known limits, and remaining user needs. Include useful artifact links. Do not call the full MVP complete after the local flick prototype or after a build alone.
