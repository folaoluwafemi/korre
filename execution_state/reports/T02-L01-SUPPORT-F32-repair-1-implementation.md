# T02-L01-SUPPORT-F32 formatting repair 1

Applied the supplied hosted formatting patch verbatim:

`execution_state/reports/T02-L01-SUPPORT-F32-run-38469673506/formatting-repair/formatting-repair.patch`

Patch SHA-256: `6eb84e0321521a963dbcee86424202cc98e0f335671f2884f92d61410d423e0a`.

Only `games/counterball/src/simulation/loftCoarseRunner.ts` changed. The complete source diff matches the patch's single hunk: Prettier's line wrapping for the `nativeShapeDimensionY` predicate. The `matchesExactFloat32Projection` call, inputs, equality behavior, failure diagnostic, and all physics/configuration behavior are unchanged.

The resulting source SHA-256 is `f14a0fdebb883500849339b3bc76f928667631872e0e45d248990811d906ce30`.

Commands and results:

- `git apply execution_state/reports/T02-L01-SUPPORT-F32-run-38469673506/formatting-repair/formatting-repair.patch` — exit 0.
- Read-only diff comparison — exactly one file and one hunk; it matches the supplied patch.
- `git diff --check -- games/counterball/src/simulation/loftCoarseRunner.ts` — exit 0, no output.

No Prettier, typecheck, lint, tests, build, browser, physics, deployment, or Wrangler command was run. Runtime checks remain NOT RUN.
