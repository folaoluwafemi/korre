# C00-B independent review

SOURCE verdict: PASS

This verdict covers the finalized contract/schema source and documentation only. Hosted protocol tests and `pnpm verify` are pending. It does not accept T02, certify a calibrated runner, or prove physical traversal or deployed WASM behavior.

## Reviewed scope and evidence

I read the exact C00-B record using `node scripts/check-completion-plan.mjs --packet C00-B`, its implementation report, the coordinator ownership entry, and the current diffs in all six coordinator-owned source/document paths. The ownership entry explicitly includes the shared `knowledge_base/execution/completion/CONTRACT_WORK.md` clarification in addition to the packet's five paths. I also read the T02-P01, T06-R01 and T09-R01 records through the same plan checker. Each read-only plan command exited 0 and reported plan consistency PASS; this is not an application check.

No source defect requiring repair was found in this bounded review.

## Schema, fixture and hashing

- `packages/game-protocol/src/types.ts:332–368` defines the material/damping/calibration types; `types.ts:417` admits `PhysicsCalibration | null`. `schemas.ts:23–64` mirrors every field and literal version, uses strict nested objects, finite numeric bounds, and integer workload/substep budgets. The public index already re-exports types and schemas.
- `schemas.ts:754–789` preserves null and checks calibration in geometry context: absolute application offset is at most half cap height, and translation must be strictly below the minimum cap height, button thickness, surface thickness and goal-frame diameter. Equality fails the translation guard. The bounds agree with `CONTRACTS.md:129–135` and CONTRACT_WORK. Zero, negative, nonfinite and excessive calibration inputs are rejected by the inspected schema paths; this conclusion is source inspection, not an executed parse result.
- `config.ts` retains the initial null calibration and adapter-1 physics stamp. Neither config nor fixture content is changed by this diff. Existing canonical hashing serializes the full object recursively, so a selected calibration participates in the hash. `protocol.test.ts:320–355` retains the null and historical fixture-hash assertions; `protocol.test.ts:358–461` adds valid/full-config parsing, null preservation, changed hash, wrong version/mode, unknown field, numeric and geometry rejection cases. These assertions have not been run by this reviewer.
- `CONTRACTS.md:133` requires C02/C03 to publish the adapter-2 physics stamp and config hash together when a non-null calibration is accepted. The schema itself establishes shape/bounds, not correspondence with a live runtime version stamp; that correspondence remains a consumer/config-release obligation.

## Pinned API and open pavement

The lockfile pins Babylon core 9.30.0 and Havok 1.3.14. I independently inspected the installed pinned sources read-only:

- `node_modules/.pnpm/@babylonjs+core@9.30.0/node_modules/@babylonjs/core/Physics/v2/Plugins/havokPlugin.js:578–604` performs one `HP_World_SetIdealStepTime` and one `HP_World_Step` per world region. At line 600, the duration depends on `_useDeltaForWorldStep`; the future runner must configure that option or the fixed step so each recorded actual duration matches its requested explicit substep.
- `node_modules/.pnpm/@babylonjs+havok@1.3.14/node_modules/@babylonjs/havok/HavokPhysics.d.ts:522–528` declares the step duration in seconds and describes ideal-step time as solver-parameter adjustment. It does not promise internal subdivision. This supports the documented explicit-call requirement.

`CONTRACTS.md:131–135` and `CONTRACT_WORK.md:9–13` give an explicit conservative energy/inertia/radius bound, a required subdivision count and apron reach bound. Unestablished bounds or unsupported/over-budget subdivisions fail `resourceLimit`. These are engineering requirements awaiting implementation and measured validation; the current schema's upper limits are not proof that any candidate is physically supported. Painted crossing planes and rules remain unchanged; the invisible support has no walls. Exited entities may not be frozen, teleported, deleted or respawned during simulation. Wall/workload exhaustion maps to `resourceLimit`, simulated-duration non-settlement to `timeout`, and cancellation to `cancelled`, matching T02-R01.

I reviewed the final equation clarification: taking the maximum of the translation and angular ceilings makes each `dt/Nrequired` call satisfy both bounds, provided the conservative energy/inertia/radius assumptions have been established. The translation term includes rotational sweep through `omegaBound*rMax`; the apron term includes the full collider radius beyond its centre's travel. This is consistent with explicit calls to the pinned single-step API. It does not establish the energy bound for any measured candidate or certify the numerical solver; those checks remain mandatory. The latest request names C00-R01, but that ID is absent from the catalogue (`--packet C00-R01` reports `Unknown --packet id`). The existing runner record is T02-R01; its documented error mapping matches this change. This lookup failure is a record-name clarification, not an application test failure.

## Future signatures

`CONTRACTS.md:143–219` explicitly separates current exports from future APIs and freezes concrete producer signatures:

- T02-P01: create/update/pick functions use the stable `EntityId` → existing `PieceAssembly` registry, canonical body/pose types and Babylon pick information. Updates require all 15 IDs and change presentation only. Mesh identity is the authority for a pick; no transient name/index enters protocol state.
- T06-R01: `resolveShot(before, command, simulation, config): Resolution` carries canonical state/events, optional consistent restart/outcome and explicit cap returns. The location, purity and unchanged-unrelated-body requirements match its packet.
- T09-R01: `createLocalMatchController(options): GameTransport` uses the existing SDK transport and a player/team session. The adjacent validator consumes canonical state/action plus trusted actor context and config; it does not derive identity from the action. Checkpoint restoration, cancellation and disposal remain application responsibilities.

The named underlying protocol types, SDK `GameTransport`/`GameSession`, and scene `PieceAssembly` exist. The producer implementations above do not exist yet; neither the docs nor this review claims otherwise.

## Acceptance limits and required follow-up

The acceptance bullet “Calibrated runner must reject null; diagnostics label candidate inputs explicitly” is **contract-only** here. The docs require `initialization` for null and a visible candidate label, but C00-B does not implement or run the runner or diagnostic producer. Future runner/probe checks must demonstrate both behaviors. Likewise shared bounded subdivision, native duration/contact evidence, fail-closed support coverage and all-15-body settling are contract requirements, not completed runtime acceptance.

The strict finite/range/geometry schema, nullable fixture preservation, hash participation and explicit no-wall/open-pavement policy are present in source. Their added regression cases and workspace compatibility still require hosted execution. Run the packet's `pnpm exec vitest run packages/game-protocol/src/protocol.test.ts` and `pnpm verify` on GitHub with preserved logs. Local application tests, builds, typechecks, lint, formatter, installations, servers and deployments were NOT RUN. No shared status or implementation file was edited.
