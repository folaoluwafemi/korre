# T02-L01-EXECUTOR-1 implementation 3

Implemented the two source-review findings assigned for this repair.

In `games/counterball/src/simulation/loftCoarseRunner.ts`, added typed `resourceFailure` and `resourceGuard` helpers. Native body/material/shape preflight and sampling, shifted-energy calculation, support checks, swept-envelope checks, sweep-plan derivation, and strict resource bounds now surface as `resourceLimit` when their failures are otherwise untyped. Unknown static collider identities also fail as `resourceLimit`. Existing typed diagnostic codes are preserved. Engine/Havok startup, fixture identity, and request setup failures remain on the initialization path. The canonical surface shape is captured in a narrowed local before guarded native reads; a redundant duplicate trigger assignment was removed.

Contact-point handling now returns null only when the native point is absent (`null` or `undefined`). A present point with any non-finite coordinate throws a typed `resourceLimit` error from the contact callback, which aborts the case and matrix instead of emitting a null contact row.

Changed paths:
- `games/counterball/src/simulation/loftCoarseRunner.ts`
- `execution_state/reports/T02-L01-EXECUTOR-1-implementation-3.md`

Check run (effective for this untracked source file):
- Scoped PowerShell scan using `[System.IO.File]::ReadAllLines()` and the trailing-whitespace pattern `[\t ]+$`: PASS, no trailing whitespace.

NOT RUN: application typecheck, lint, unit/integration tests, build, browser, Havok/physics, and deployment checks. The separately assigned timing-evidence issue was left unchanged.
