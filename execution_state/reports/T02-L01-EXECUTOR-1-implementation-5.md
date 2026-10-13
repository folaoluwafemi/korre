# T02-L01-EXECUTOR-1 implementation 5

Addressed the hosted typecheck diagnostics from run 38400680491 in `games/counterball/src/simulation/loftCoarseRunner.ts`.

- Added a triple-slash reference to the web workspace's pinned Vite client declarations. This supplies Vite's `?url` and `?raw` module types for the existing WASM URL and raw fixture imports. The imports, fetched WASM `ArrayBuffer`, fixture text bytes, and SHA-256 checks are unchanged.
- Validate native friction, static friction, restitution, and both combine-mode readbacks before using or serializing them. Missing coefficients or combine modes fail closed with `resourceLimit`.
- Capture the created world in a stable `activeWorld` constant for native setup and the physics callback, while retaining the outer optional reference for cleanup.
- Read `apronClearance`, the actual field returned by `checkDiagnosticSweptEnvelope`.
- Replace the incompatible contact-row casts and JSON-string pair comparisons with a typed helper that recognizes the button/obstacle pair in either endpoint order; retain the per-tick contact check.
- Capture `caseBeginCalls` at `runCase` entry so the final call-delta assertion covers the complete case.
- The existing timing behavior remains aligned with the accepted contract: case metadata records setup-through-cleanup before serialization; independent per-case and matrix deadlines continue through serialization/flush; the matrix envelope sums case metadata durations.

Check run:
- `git diff --check -- games/counterball/src/simulation/loftCoarseRunner.ts` — exit 0. Git emitted only its LF-to-CRLF working-copy warning.

NOT RUN: local typecheck, lint, tests, build, browser, Havok/physics, or deployment checks. The source changes address the reported compiler diagnostics but remain pending exact-head hosted verification.

Changed paths:
- `games/counterball/src/simulation/loftCoarseRunner.ts`
- `execution_state/reports/T02-L01-EXECUTOR-1-implementation-5.md`
