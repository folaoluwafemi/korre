# T02-L01-MATERIAL-DIAGNOSTIC-1 implementation

Added exact mismatch values to the existing native material failure disclosure in `games/counterball/src/simulation/loftCoarseRunner.ts`.

The error retains its existing `Native ${key} material readback differs from its setter.` prefix and `resourceFailure` path. It now appends compact JSON with the failing `field`, `setter[key]`, and `readback[key]`. The values are serialized directly, without rounding, conversion, or tolerance. The strict `readback[key] !== setter[key]` comparison, validation, setters/getters, configured values, geometry, filters, solver and matrix behavior are unchanged.

The exact packet extraction reported plan verdict `PASS`, `ready:true`, and `T02-L01-MATERIAL-DIAGNOSTIC-1` as the initial ready card. The accepted F32 run on source commit `9977d984ee91dae726baff56d49e23cfe1d5f53d` passed the support AABB-Y preflight, then failed at the unchanged material comparison. It completed no matrix case and produced no matrix artifact.

Only source path changed: `games/counterball/src/simulation/loftCoarseRunner.ts`.

Source SHA-256: `672b85bd411ca48142917e53c45fdc7e72608699723c652799d33b72f2532f87`.

Checks actually run:

- `node scripts/check-completion-plan.mjs --packet T02-L01-MATERIAL-DIAGNOSTIC-1` — exit 0; plan verdict `PASS`, `ready:true`.
- `git diff --check -- games/counterball/src/simulation/loftCoarseRunner.ts` — exit 0, no output.
- Read-only diff inspection — one source hunk changes only the failure message detail.

No install, application typecheck, lint, tests, build, browser, physics, deployment, or Wrangler command was run. The mismatch values are not yet known from this source change; no matrix or runtime result is claimed. Source is released for independent review.
