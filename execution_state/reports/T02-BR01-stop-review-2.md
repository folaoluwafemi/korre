# T02-BR01 attempt 2 stop-decision review

**Verdict: PASS for stopping before implementation.** The accepted diagnostic guard requires a 325-unit open support apron and an enforceable full-collider bound across every actual Havok substep. The current factory supplies only the 12-by-20 pitch slab, and the available pinned APIs do not provide a continuously rotating sweep or intermediate within-step transforms. More importantly, the accepted guard audit has not established the energy/speed invariant needed to replace that missing trajectory evidence with a conservative analytic envelope. Proceeding to apply the impulse would therefore claim a safety premise that is neither implemented nor proven.

## Evidence

- The exact `T02-BR01` record is plan-consistent and ready, but requires the C00-frozen bounded policy and says to stop rather than invent a limit. Its exact source paths are `browserDirectProbe.ts`, `browserDirectProbe.test.ts`, and `browser.ts`; it does not authorize changing the shared factory or config.
- The attempt-2 implementation report correctly distinguishes the resolved attempt-1 issue from the remaining blockers: the D01 impulse-8 row is accepted as a diagnostic input, and GC01 now selects hashed values. `physicsCalibration` remains null. The report says it stopped before source changes, before applying input, and before creating a Havok world.
- The guard specifies a 325-unit margin beyond each painted edge. With the current centered pitch slab extents of 12 by 20, a slab covering the selected margin would need extents of 662 by 670. The existing `worldFactory.ts` surface is therefore insufficient as the required apron.
- The pinned Babylon/Havok shape-cast query uses one fixed rotation with linear start/end positions; `executeStep` makes one world-step call and does not expose intermediate transforms. The pinned API audit confirms these limits. A geometric enclosing-sphere bound is mathematically possible only if its whole-interval COM speed/energy premises are valid. The accepted guard-feasibility audit says those premises, actual mass/inertia behavior, solver energy behavior, per-substep support enforcement, and wall-time feasibility remain unproven. Endpoint samples and the nominal-rate D01 data do not close that gap.
- Read-only path check found no `browserDirectProbe.ts` or `browserDirectProbe.test.ts`, and no working-tree change to `games/counterball/src/browser.ts`. This is consistent with the report's statement that no probe source, input application, or world creation occurred.

## Scope caveat and next boundary

The apron mismatch is real, but the report's implication that adding support necessarily requires changing the canonical factory is stronger than the packet proves. The exact packet permits work in `browserDirectProbe.ts`, and does not expressly forbid a diagnostic-owned static apron body in the same factory-created world. Such an approach would still need coordinator approval that it satisfies the configured physical-support contract, explicit ownership/disposal, and source/runtime tests; it must not create a second world or alter ordinary gameplay. A separate factory packet is another valid option.

This caveat does not change the stop verdict: an apron alone cannot establish safe motion through a Havok step. Before BR01 resumes, a coordinator-owned contract decision must provide an enforceable, fail-closed whole-substep support proof (either a valid conservative bound with its energy/speed premises established, or another accepted method), then specify how the physical apron is supplied and tested. The probe must not infer that proof from fixed-orientation casts, endpoint positions, or D01's 291 nominal steps.

## Limits

This was a source/document review only. The completion-plan checker returned PASS for plan consistency; no application install, test, typecheck, build, browser, physics, server, or deployment command was run. No runtime result, traversal, playable match, or T02/T05 acceptance is established.
