# T02-L01-START-SEPARATION-SEAM-1 implementation

Implemented only the two assigned internal pure helpers and their focused
tests. `nativeAabbOriginRadius` preserves the runner's x/y/z eight-corner
iteration, `Math.hypot`, and `Math.max` calculation while rejecting non-finite,
zero-span, reversed, overflowing, and nonpositive results. `isLoftStartSeparated`
preserves the strict `buttonZ + buttonRadius < obstacleZ - obstacleRadius`
predicate and rejects invalid inputs or non-finite endpoint arithmetic.

The module imports only the canonical protocol `Vec3` type. No runner, probe,
config, public barrel, physics behavior, or matrix source was changed.

## Source hashes

- `games/counterball/src/simulation/loftStartSeparation.ts`: `7D7FECA42F789A554862107315157A560F0F73075610AEF42F8DAFB65E9D6F79`
- `games/counterball/src/simulation/loftStartSeparation.test.ts`: `448B8F12D584F09B2E6020A75A0E65FF9034060C281B97BBFD5CD9102FE90886`

## Verification

The focused tests cover centered and asymmetric AABBs, invalid bounds, span and
radius overflow, strict-before, touching, overlap, invalid radii/positions, and
endpoint overflow. No application test, build, typecheck, lint, browser, or
physics command was run. After the coordinator intent-added the two new files,
the packet-scoped `git diff --check` exited 0; Git emitted only its expected LF
to CRLF working-copy warnings. Hosted verification and independent source
review remain pending. This helper implementation alone does not prove that
production or the native browser probe consumes the seam.
