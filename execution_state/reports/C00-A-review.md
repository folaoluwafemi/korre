# C00-A independent source review

**SOURCE verdict: PASS.** **RUNTIME verdict: NOT RUN.** Review covers only the bounded C00-A protocol cancellation contract and its current consumers. No source, shared status, or configuration was changed.

## Findings

The optional second parameter is correctly outside `SimulationInput`: `SimulationRunOptions` is a process-local type with only `signal?: { readonly aborted: boolean }`, and the runner interface accepts it as optional. This keeps existing one-argument calls compatible and lets a native `AbortSignal` satisfy the shape without adding a DOM type to the protocol package. The package barrel exports the type. No other current implementation or consumer of `SimulationRunner`, `SimulationErrorCode`, or `game.shot.aborted` appears under `apps/`, `games/`, or `packages/`; T02 will provide the first runner behavior.

The local `SimulationErrorCode` union contains exactly `initialization`, `timeout`, `cancelled`, `invalidBody`, and `resourceLimit`. `GameShotAbortedEvent.reason` uses that union. The strict Zod event schema enumerates the same five values; the new protocol case accepts `cancelled` and each existing reason, rejects `settled`, and rejects an extra `transientSignal` field. The test also includes a compile-time structural compatibility assertion for the native `AbortSignal`. Existing reason values are preserved, and cancellation is distinct from both timeout and resource exhaustion.

The change leaves the simulation input, command/event envelope fields, and persisted state unchanged. The signal is not added to a serializable schema. The source diff is confined to the three protocol paths plus the assigned canonical contract and runtime decision record. The contract describes bounded-yield observation, no partial success, checkpoint restoration, and preserving newer pause/terminal state; it also requires a protocol version/compatibility update if an active strict consumer is discovered.

Compatibility wording is appropriately conditional. `execution_state/INTEGRATION.md` says no deployed Counterball gameplay consumer is recorded and Cloudflare staging has not been deployed; it still requires checking any staged/versioned consumer before launch. `execution_state/tasks.json` marks T01 ACCEPTED, C00-A IMPLEMENTED, T02 RUNNING, and T04 PLANNED. This review does not treat implementation as runtime verification or parent acceptance.

## Checks and limits

- `node scripts/check-completion-plan.mjs --packet C00-A` — PASS; packet is ready because T01 is ACCEPTED. This is a documentation/plan check only.
- Source and consumer inspection — PASS for this packet's bounded scope.
- Protocol Vitest and `pnpm verify` — NOT RUN, as required by the packet's GitHub-only verification boundary. Runtime cancellation timing, cleanup, checkpoint behavior, and any staged compatibility remain unverified.

No repair is required for C00-A source. Run the named protocol test and full verification on GitHub for the exact reviewed commit. Before any launch or protocol-v1 deployment, recheck the active consumer inventory; if a strict consumer exists, version and migrate it before sending `cancelled` events.
