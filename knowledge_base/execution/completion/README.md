# Counterball: from the current preview to a playable release

This is a continuation plan, prepared on 10 October 2026. It authorizes no new production publication or paid-plan change. Planning is not implementation evidence. No application build, test, migration or deployment is part of preparing these files.

## Read and resume

1. Read root `AGENTS.md`, the parent execution `README.md`, `DECISIONS.md`, `CONTRACTS.md`, `TASKS.md`, and `SWARM.md`.
2. Read this file, [operations](OPERATIONS.md), [contract work](CONTRACT_WORK.md), and [acceptance matrix](ACCEPTANCE.md).
3. Read `execution_state/tasks.json`, current source, and the last implementation/review reports. Never recopy the seed or reset accepted tasks.
4. Select a ready packet from `COORDINATOR_PACKETS.json`, `LOCAL_PACKETS.json`, or `ONLINE_PACKETS.json`. Read its entire record and the relevant notes file.
5. Use [the start prompt](START_HERE.md) after selecting the execution model in the app. This planning pass does not switch models.

The original canonical contracts and human corrections still govern. This directory refines remaining tasks; it does not create another ruleset or a second status authority. Proposed interface amendments in CONTRACT_WORK must be implemented, independently reviewed and accepted by the coordinator before workers depend on them.

## Evidence-backed starting point

Baseline source: `22a7375e1b57a01d1bd91e23f18749ed7096d4a8`. Evidence/documentation commit: `7429f5b`. Live files and later accepted reports outrank these snapshots.

GitHub [run 38057543954](https://github.com/folaoluwafemi/korre/actions/runs/38057543954) passed all workspace checks/builds, 98 tests in 24 files without skips, migration application/recheck on disposable PostgreSQL, one health integration test, and four static browser tests. Independent source/runtime reviews passed. It proves no playable match or deployed physics.

| Existing work | Resume treatment |
|---|---|
| T00 workspace and T01 protocol/SDK | ACCEPTED. Extend only through coordinator-owned packets; do not rebuild the scaffold. |
| T03 scene and current browser improvements | ACCEPTED static preview with camera controls, button holes, seven caps per side and graphics recovery. Preserve its regression tests. |
| T11 identity API/database | ACCEPTED API/real-PostgreSQL scope. Reuse service, migration 001 and tests. Identity UI and deployed proxy/cookies are still missing. |
| T02 world, restart pose helper and playback sampler | Accepted child work; reuse actual exports. Parent T02 remains RUNNING. |
| T02 diagnostic observations | Accepted diagnostics only. `physicsCalibration` is null; none of the tested candidates proves loft over a cap. |
| T04/T05 and remaining game/platform tasks | Unimplemented/unaccepted. Follow parent dependencies and new packet gates. |

The previous request to supply a numerical epsilon is closed. D38 is a provisional engineering margin of 0.005 game units. It is neither a traditional rule nor proof of obstacle traversal.

## Deliver in visible milestones

| Milestone | Required accepted parents | What the user can actually do |
|---|---|---|
| M0 early physics demo | Accepted T02-BR01/BR02 children and T03; not parent T02 | Make a pointer flick and see actual browser Havok motion using explicitly labelled diagnostic inputs while loft work continues. This is no playable-match acceptance. |
| M1 first flick | T02, T03, T05 | Select a cap, aim, fire a real shot and watch the button move in a development harness. |
| Early infrastructure gate after T02, alongside T05 | T02, T04 | Inspect real deployed pinned Havok result and isolation/recovery evidence. Prepare source/artifacts earlier; actual T04 waits for accepted T02 and does not delay independent local work. |
| M2 local match | T06, T07, T08, T09 | Complete a first-to-three development hotseat match, including placed restarts and rematch. |
| M3 playable AI | T10, T11, T12 | Choose a unique username and complete a match against one basic AI. No shipped guest bypass. |
| M4 online duel | T13, T14, T15, T16, T17 | Two authenticated browsers finish a server-authoritative match and reconnect safely. |
| M5 social play | T18, T19, T20 | Invite players/spectators, use a private queue and find a casual opponent. |
| M6 staging handoff | T21, T22, T23 | Review a tested staging build with deployment/runbook and honest device evidence. |
| M7 user/production decision | T24 | Approve feel and any remaining provisional rules; publish only after specific production authorization. |

Present each working milestone promptly using remotely built files. Do not spend several waves polishing static geometry before M1. Conversely, do not call a raw impulse button a complete game.

## Team and cost controls

Use one coordinator and at most three children. Use two implementers plus an independent reviewer where dependencies permit. Reuse idle workers. No worker may spawn. Every dispatch names exact write files and a unique report. Root configuration, protocol, lockfile, migrations ordering, integration points and runtime status have one coordinator writer.

Packet JSON is a proposed work catalogue, not runtime state. `execution_state/tasks.json` remains the only status authority. Materialize packets there without changing already accepted entries. Parent dependencies in the original task catalogue remain mandatory even when a packet has only internal dependencies listed.

Read [OPERATIONS.md](OPERATIONS.md) for ready selection, shared-path locks, hosted checks, repair limits, evidence and handoff. Run `node scripts/check-completion-plan.mjs` for document graph/ownership checks. That lightweight command validates this plan; it does not build or test Counterball.

## User needs at real boundaries

Source work needs no new gameplay answer. Existing GitHub and staging Wrangler sign-ins have been authorized; verify access safely when needed. Railway still needs an explicitly designated nonproduction target before deployment. Never touch the unrelated project or infer a staging database from its name. Do not request secrets in chat.

Physical Android/iOS devices, user feel feedback and a production target/authorization are later release requirements. Mark those exact checks BLOCKED when unavailable; continue independent work and deliver completed local/staging flows. An external check not run is never PASS.
