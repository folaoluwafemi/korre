# Start Counterball implementation

Implementation has started. Use [the continuation prompt](completion/START_HERE.md) for the current reviewed source. The original prompt below is retained for history; do not restart accepted T00/T01 or copy the seed again.

Choose the model you want to implement the plan with, then send the prompt below in this chat. The coordinator uses that model and its available subagents. Do not assume the planning model is the executing model.

```text
Execute the Counterball monorepo plan in this workspace.

Read AGENTS.md and knowledge_base/execution/README.md first.
Read DECISIONS.md, CONTRACTS.md, TASKS.md, and SWARM.md in that directory.
Use current source files and runtime status if work has already started.
The initial status.json is a seed, not proof of implementation.

Use one coordinator and at most three subagents.
Only the coordinator spawns agents and owns shared contracts/config/status.
Workers cannot spawn agents. Give every worker exact disjoint write paths.
Reuse idle workers. Rotate an independent reviewer; never self-review.
If subagent tools are absent, execute packets sequentially and report that limitation.

Build the pnpm TypeScript monorepo defined in the plan.
Start with T00 and T01. Then follow accepted dependencies in TASKS.md.
Split large cards into bounded packets with exact inputs, outputs, and checks.
Do not dispatch a worker until its commands and acceptance conditions are concrete.
Do not implement deferred product features.
Human clarifications outrank files. Proposed cultural defaults remain labelled.

Use the canonical interfaces and same physics/rule package for local and online play.
Make the first real browser flick early. Prove real deployed Cloudflare Havok early.
No mock or Node-only result can satisfy the deployed physics gate.
No automatic two-shot foul rewards. Seven caps per player.
Any owned cap can relocate for a placed restart; other caps stay fixed.
Plastic button must retain visible holes. The pitch is open green concrete.
Unique username is required before public AI or online play; secrets authenticate players.

Save implementation and independent review reports under execution_state/reports.
Update execution_state/tasks.json and ledger only after actual checks/review.
Only ACCEPTED dependencies unblock work. Do not fabricate test results.
On failure, use the bounded repair/escalation procedure in SWARM.md.
On resume, continue the next ready task; do not reset completed work.

Continue independently useful local work while deployment credentials are unavailable.
Use existing authorised sign-in safely; do not print or request secrets in chat.
Ask for external access only when needed, after preparing reviewable artifacts.
Do not change paid plans or publish production without specific authorization.
Report useful progress and ask the user only for a genuine missing requirement.

Persist until the full authorized deliverable and checks are complete.
If an external dependency prevents completion, deliver all completed local work,
state the precise blocked task and needed user action, and preserve resumable status.
Final report: working flows, startup/preview links, checks actually run,
deployment/mobile status, known limitations, and remaining user needs.
```

The current request produced a plan. Implementation tasks remain unstarted. Do not confuse preparing this handoff with completing T00 or the playable game.
