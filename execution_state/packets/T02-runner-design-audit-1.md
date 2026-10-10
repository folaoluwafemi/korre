# T02 canonical shot-runner design audit 1

## Trigger and inputs

The accepted T02-A packet constructs/disposes a real Havok world, and the B0 probe measured real WASM behavior. An audit of current `games/counterball/src/simulation` shows no canonical `SimulationRunner`, full-rate facts pipeline, playback sampler, or shot-level tests. Before assigning the remaining runner work, inspect:

- `knowledge_base/execution/TASKS.md` T02 acceptance and T04 dependency.
- `knowledge_base/execution/CONTRACTS.md` simulation boundary, plus `knowledge_base/execution/GAMEPLAY.md` section 6.
- `knowledge_base/execution/DECISIONS.md` physical config decision requirements.
- Existing simulation runtime/world/disposal/calibration sources and `packages/game-protocol/src/types.ts`, `config.ts`, `schemas.ts`.
- The independent measurement review when available: `execution_state/reports/T02-calibration-observations-review-1.md`.

Do not invent a physics coefficient; coordinator selection is a separate step after measurement review.

## Exact reviewer output path

Worker `/root/toolchain_audit` may write only:

- `execution_state/reports/T02-runner-design-audit-1.md`

Do not edit source, shared config/contracts, packets, execution status, or ledger. Do not spawn agents. Run no build, test, typecheck, lint, formatter, or server commands.

## Review questions and acceptance

Give a concise, source-linked gap analysis that:

1. Confirms which T02 checks are already met and which exact checks are still missing. Distinguish real-WASM Node `NullEngine` evidence from future real-browser and deployed Cloudflare evidence.
2. Maps contract inputs/outputs and identifies validation requirements: canonical `SimulationInput`, normal and placed restart commands, body restoration/placement, body ownership, contact/crossing facts, fixed stepping, full-rate facts, 30-Hz frames, settle window, typed timeout/invalid-body/resource-limit/init errors, cancellation/checkpoint behavior, and deterministic cleanup.
3. Proposes the smallest sequential implementation packets of at most five implementation files each, with exact input/output paths and dependency ordering. Keep root-owned protocol/config changes with the coordinator. Identify necessary tests without expanding product scope.
4. Calls out whether the existing calibration probe demonstrates real button-cap contact, vertical lift/loft, and safe settling; don't infer loft from button travel alone. Use the saved data review's exact findings if available.
5. Gives hosted-only acceptance commands already defined in this repository/CI, with no local command execution.

The report must not claim T02 accepted, choose values, change user clarifications, or treat T04 as a prerequisite to T02 when TASKS.md defines T04 as depending on T02.
