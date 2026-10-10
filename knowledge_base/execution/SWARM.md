# Counterball execution: coordinator and workers

This file tells a smaller model how to execute the Counterball plan with subagents.
The user explicitly requested subagents on 10 October 2026.
This runbook does not promise error-free work from any model.
Small tasks, tests, independent review, and visible evidence reduce mistakes.

## Read before starting

Read `README.md`, `DECISIONS.md`, `CONTRACTS.md`, and `TASKS.md` in this directory first.
Read `../CONTEXT.md` and `../COUNTERBALL_RULES.md` before assigning gameplay tasks.
The latest user instructions override historical assistant proposals.
Read repository `AGENTS.md` files when present.
Read relevant installed skills before framework, Cloudflare, or frontend work.

The initial repository contains a knowledge archive and reference assets.
Do not assume that a runnable application, dependencies, or deployment credentials already exist.
Inventory the current repository before every resumed run.

## Team limits

Use one coordinator and at most three active child agents.
The coordinator owns scheduling, shared contracts, integration, and the task ledger.
Workers own assigned implementation files.
A worker reviews another worker's completed task when an implementation slot becomes free.
Reviewers must not review their own task.
The coordinator resolves conflicting reviews and accepts work.

Only the coordinator can spawn workers.
Workers must never spawn agents or create separate user chats.
Reuse idle workers with follow-up tasks.
Do not create a new worker after every completed packet.
Do not reserve all three slots for unfinished implementation when review is waiting.
Use two workers for implementation and one for review during most waves.
Use three implementers only when all packets are independent and review can follow immediately.

The available collaboration tools include `spawn_agent`, `followup_task`, `send_message`, and `list_agents`.
They also include `interrupt_agent` and `wait_agent`.
Use those tools directly when available.
Do not invent tool names or assume an API from a previous environment.
If collaboration tools are absent, execute the same packets sequentially and record that limitation.

## Durable records

Create `execution_state/` at the repository root during T00 implementation.
`knowledge_base/execution/status.json` is the immutable initial task seed.
During T00, copy that seed to `execution_state/tasks.json` exactly once.
If runtime records already exist, reconcile them instead of replacing them with the seed.
The coordinator alone updates `execution_state/tasks.json` during execution.
Each task retains the catalogue ID from T00 through T24.
Do not create a competing status file inside the knowledge base.
The coordinator alone edits these shared records:

- `execution_state/tasks.json`: authoritative task status, owner, dependencies, evidence, and next action.
- `execution_state/LEDGER.md`: readable summary derived from `tasks.json`; never an independent status source.
- `execution_state/DECISIONS.md`: provisional defaults, technical choices, and later changes.
- `execution_state/OWNERSHIP.md`: active write permissions for exact paths.
- `execution_state/INTEGRATION.md`: checks, failures, accepted milestones, and deployment status.

Workers write only their assigned report at `execution_state/reports/Txx-implementation.md`.
Reviewers write only their assigned report at `execution_state/reports/Txx-review.md`.
Replace Txx with the exact task ID, such as T02.
These report paths are canonical. Do not create a second `evidence/Txx.md` report convention.
Write reports to files before sending completion messages.
Messages alone are not a durable task record.
Never place secrets, credentials, authentication cookies, or private recovery codes in these records.

Use one readable ledger row per catalogue task, derived from the runtime task record:

| ID | Milestone | Status | Owner | Dependencies | Owned files | Evidence | Next action |
|---|---|---|---|---|---|---|---|
| EXAMPLE-01 | Local flick | READY | Unassigned | Contract accepted | Exact paths | None | Assign worker |

The example row is a format example, not an active assignment.

## Task states

Use only these states:

| State | Meaning | Who changes the ledger |
|---|---|---|
| PLANNED | Packet exists, dependencies incomplete | Coordinator |
| READY | Dependencies accepted, ownership clear, checks specified | Coordinator |
| RUNNING | Worker has acknowledged the packet | Coordinator |
| IMPLEMENTED | Worker saved changes and implementation report | Coordinator |
| REVIEWING | Independent reviewer has the task | Coordinator |
| CHANGES_REQUIRED | Review found a concrete defect or missing evidence | Coordinator |
| VERIFIED | Review passed and required isolated checks passed | Coordinator |
| ACCEPTED | Integrated checks passed; dependent tasks can start | Coordinator |
| BLOCKED | A specific external requirement prevents this packet | Coordinator |
| SUPERSEDED | Coordinator replaced the packet with documented smaller work | Coordinator |

Normal transition: PLANNED → READY → RUNNING → IMPLEMENTED → REVIEWING → VERIFIED → ACCEPTED.
Repair transition: REVIEWING → CHANGES_REQUIRED → RUNNING → IMPLEMENTED → REVIEWING.
A blocked packet returns to READY only after its blocker is resolved.
VERIFIED is not ACCEPTED until integration passes.
Workers report their proposed state; workers do not edit the shared ledger.

## Packet size and template

Each packet must have one behavior or one infrastructure result.
Prefer one to five implementation files and a small set of focused checks.
Split work that requires changing multiple contracts or more than one feature boundary.
Keep whole-match integration, package setup, and deployment integration as coordinator tasks.
Do not split a simple reversible edit only to fill agent slots.

Copy this template for each task:

```text
Task ID:
Milestone:
Objective: one observable result.
Read first: exact plan sections and existing source paths.
Authority: confirmed rule or named provisional decision.
Depends on: accepted task IDs and contract versions.
Inputs: explicit types, values, and fixtures.
Output: exact exported API or user-visible behavior.
Allowed writes: exact paths. Include the task report path.
Read-only paths: shared contracts and dependencies.
Do not change: explicit exclusions.
Acceptance:
1. Observable condition.
2. Error or edge condition.
3. Relevant invariants.
Required checks: exact current commands after package setup; manual steps if relevant.
Evidence required: commands, results, changed paths, reviewable screenshots when relevant.
Failure handling: bounded retry, escalation target, and restore behavior.
Definition of implemented: changes saved, required checks attempted, report saved.
```

Do not write placeholder commands into a dispatched packet.
First create the package scripts and confirm that each command exists.
Use exact file names after the coordinator creates the scaffold.
A packet without inputs, allowed writes, or acceptance conditions is not READY.

## Ownership prevents conflicts

All agents share the same working directory.
Concurrent agents must never edit the same file.
The coordinator locks package manifests, lockfiles, shared schemas, root configuration, and migration ordering.
The coordinator also locks this plan and the imported knowledge archive.
Workers can request shared changes in their reports or messages.
The coordinator applies those changes, then redispatches the dependent packet.

Before assignment, list exact owned paths in `OWNERSHIP.md`.
Directory ownership is allowed only when no other packet owns any descendant.
Never allow a root wildcard such as `**/*`.
List new paths before creating them.
Release ownership only after the worker saves the report and stops writing.
Review is read-only except for the reviewer's own report.

Shared directories need separate files for separate workers.
For example, a physics worker and a rules worker may share a feature directory.
They must still receive disjoint file lists and read-only contract files.
If ownership changes, stop the affected worker before reassignment.
Do not discard another agent's changes to obtain a clean working tree.
Only the coordinator makes repository-wide commits or branch changes.

## Dependency waves

`TASKS.md` defines executable tasks T00–T24 and their dependencies.
That catalogue supersedes the generic waves below for ordering, ownership, and acceptance.
Use the waves only to explain milestone purpose.
Never dispatch a generic wave as a substitute for a complete Txx task packet.
Record catalogue task status in `execution_state/tasks.json` before dispatch.

| Wave | Coordinator gate | Independent worker work | Required acceptance before next wave |
|---|---|---|---|
| 0: inventory | Record repository state and baseline | Read-only source/rules audit if useful | Existing changes known; no false implementation assumptions |
| 1: foundation | Create workspace, scripts, contracts, versions, decisions | Small scaffold modules after contracts freeze | Application starts; imports, build, type checks pass |
| 2: first flick | Freeze simulation/input boundary | Pitch/pieces rendering; isolated local physics; pure rule fixtures | Button and cap behave; input works; physics results are serializable |
| 3: platform proof | Prepare actual deployment and WASM gate | Rules implementation and mobile interaction can continue independently | Real Cloudflare shot result, or explicit runtime blocker and approved runner fallback |
| 4: local match | Freeze events and restart state | Rules/restart logic; placement UI; basic AI after rule acceptance | Complete local match to target score with seven caps per side |
| 5: identity | Freeze identity/session API and database migration | Identity service; username/session UX; security review | Stable account/session works; username alone cannot authenticate |
| 6: online | Freeze intent/result protocol and room state | Authoritative room; online client playback; reconnect/idempotency checks | Two clients finish a match; duplicates and stale actions do not advance state |
| 7: social | Accept online state synchronization | Private links/invitations; spectator UX; waiting-player flow | Spectators have no action authority; late join and next challenger work |
| 8: launch checks | Integrate and inspect release candidate | Mobile/visual QA; rules/regression review; deployment smoke review | Required release checks pass with evidence; limits and blockers recorded |

Launch the platform proof early after one shared shot runner exists.
Do not wait for polished local play before discovering WASM runtime incompatibility.
Do not invent a simulated Cloudflare success from a local Node result.
Credential absence blocks the deployment packet, not all local development.
Continue work whose assumptions do not depend on the blocked deployment result.
Mark online launch readiness unverified until the actual deployment gate passes.

Keep culture additions small during all waves.
Preserve seven caps, metal cap shapes, smooth green concrete, and a clothing button with visible holes.
Do not introduce unconfirmed football rules, branding redesign, or later ecosystem features.

## Evidence and review gates

Every implementation report must contain:

1. Task ID and exact changed paths.
2. Behavior implemented and relevant rule source.
3. Each required command, working directory, exit code, and concise output.
4. Checks not run, with their reason.
5. Manual test steps and observed outcomes when relevant.
6. Known limitations and proposed shared changes.
7. The next dependency that the result enables.

Never report a check as passed unless the command ran and returned a passing result.
A screenshot proves visual state, not turn legality or server authority.
A successful build proves compilation, not correct match behavior.
A mocked test proves its fixture behavior, not deployed WASM compatibility.
No reviewer can turn NOT RUN into PASS through inspection.

The reviewer checks the actual changes, source contracts, and acceptance conditions.
The reviewer reruns targeted checks when practical.
Review changed behavior and meaningful failure cases.
Avoid tests that only repeat private implementation details.
Flag missing evidence, undocumented defaults, hidden scope changes, and unused contracts.
Use verdicts PASS or CHANGES_REQUIRED with concrete file references.
Use BLOCKED only when the reviewer needs an external fact or unavailable runtime.

The coordinator performs integration checks after review passes.
Run relevant build/type/lint checks and affected meaningful tests.
For a milestone, exercise its full user flow.
Capture actual mobile or browser results for interaction milestones.
Rerun checks after any shared contract or integration fix.
Do not repeat broad checks without changes or unresolved concerns.

## Bounded failure handling

A worker may make two focused repair attempts for the same failure.
After two unsuccessful attempts, stop edits and send the coordinator evidence.
Send the failing command, error, hypothesis, and smallest proposed next step.
Never disable required tests, weaken validation, or add broad ignore rules to obtain PASS.
Never replace Havok with different physics silently.
Never replace server authority with client authority silently.

The coordinator first checks the packet's contract and assumptions.
The coordinator may split the task, correct the contract, assign another worker, or perform the difficult fix.
Record the decision and release or revise ownership before new work starts.
If a runtime rejects WASM, first verify bundling and documented runtime requirements.
If the real integration still fails, record the error and activate the planned runner fallback only through a documented decision.
Do not build a second complete backend while the first backend is merely untested.

When user input is needed, state the exact missing item and its dependent milestone.
Examples include unavailable Cloudflare/Railway access, deployment target, or spending authorization.
Do not ask the user to reconfirm seven caps or restart movement.
These gameplay choices are settled.
Keep remaining tuning decisions provisional and adjustable.

## Resume after interruption

The coordinator reads the ledger, decisions, ownership, reports, and current repository changes.
Inspect live agents before spawning replacements.
Ask active workers for current paths and last check results.
Do not redispatch an active task because its report is temporarily missing.
Reconcile ledger status with actual saved files.
Treat unsupported PASS claims as missing evidence and rerun the check.
Preserve partial work and assign a small repair packet if necessary.
Resume from the first unaccepted dependency, not from repository setup.

## Ready-to-use coordinator prompt

```text
Execute the Counterball plan in knowledge_base/execution.
First read the plan, SWARM.md, CONTEXT.md, COUNTERBALL_RULES.md, and applicable AGENTS.md files.
Use relevant installed skills and current primary documentation where required.
The user authorized subagents. Use at most three workers plus yourself.
Do not let workers spawn agents or create user chats.
Inventory existing files and changes before editing.
Create execution_state records and record exact file ownership.
Freeze the smallest shared contracts before dispatching dependent work.
Dispatch one small packet per worker with exact paths, inputs, output, checks, and acceptance conditions.
Workers share your working directory. No two writers may own the same file.
You alone edit package manifests, lockfiles, shared contracts, and the ledger.
Use one available worker for independent review; never allow self-review.
Accept a packet only after its report, review, and integration checks pass.
Do not fabricate test results or runtime proof.
Keep provisional rule defaults visible in DECISIONS.md.
Seven caps and any owned restart cap movement are confirmed.
Only the selected restart cap moves; other caps stay, provisionally.
Run the actual Cloudflare Havok shot proof early.
If credentials block deployment, continue independent local tasks and report the precise blocker.
Persist until the authorized deliverable works and checks pass, or a concrete external blocker prevents progress.
Keep user updates brief. Report completed behavior, meaningful evidence, and any required user action.
```

## Ready-to-use worker prompt

```text
Execute only the task packet below.
Read its sources and frozen contracts first.
Do not spawn agents, create chats, edit shared records, or change unowned files.
All agents share this working directory.
If a required path is unowned, request ownership before editing.
If a contract is wrong or incomplete, report the smallest required change to the coordinator.
Do not silently invent gameplay rules or bypass server validation.
Implement the packet's single result and meaningful failure behavior.
Run the specified checks. Record actual exit codes and observations.
If a check cannot run, write NOT RUN and explain why.
After two unsuccessful repairs of the same failure, stop and send exact evidence.
Save execution_state/reports/Txx-implementation.md before reporting completion.
Report changed paths, check results, unresolved defects, and requested shared changes.
Stop writing after completion until the coordinator assigns another packet.

TASK PACKET:
<Coordinator inserts the complete packet here.>
```

## Ready-to-use reviewer prompt

```text
Review the assigned task against its packet and current source contracts.
You must not review your own implementation.
Do not edit implementation files or shared records.
Your only write permission is execution_state/reports/Txx-review.md.
Read actual changed files and implementation evidence.
Verify confirmed rules and explicitly named provisional defaults.
Check acceptance behavior, meaningful failure paths, ownership, and dependency compatibility.
Rerun targeted checks where practical; record results and NOT RUN checks exactly.
Never infer deployed compatibility from a local or mocked result.
Report PASS only when all required acceptance conditions have evidence.
Otherwise report CHANGES_REQUIRED with concrete defects and file references.
Use BLOCKED for a specific unavailable external requirement.
Save the review report and send the verdict to the coordinator.
Do not fix defects during review. The coordinator assigns any repair.

TASK PACKET AND IMPLEMENTATION REPORT:
<Coordinator inserts paths and the complete packet here.>
```

## Milestone completion checklist

The coordinator applies this checklist to every milestone:

- [ ] All dependencies are ACCEPTED.
- [ ] Confirmed requirements and provisional defaults remain distinguishable.
- [ ] Implementation files have clear ownership and no competing writers.
- [ ] Required checks ran and evidence records their actual results.
- [ ] An independent reviewer accepted the behavior and failure cases.
- [ ] Integrated user flow works at the current milestone boundary.
- [ ] Relevant mobile controls, loading, error recovery, and cancellation work.
- [ ] Shared contract changes have corresponding consumers and checks.
- [ ] No deferred product feature entered the milestone without a recorded scope decision.
- [ ] No secrets appear in source, reports, or user-facing output.
- [ ] Remaining external blockers and unverified deployment behavior are explicit.
- [ ] Ledger and decisions match the saved repository.

Local prototype completion and online release completion are different milestones.
Call the release complete only after real identity, online authority, social flows, and deployment checks pass.
Never call planning artifacts an implemented game.
