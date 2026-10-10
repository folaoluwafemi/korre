# T03 Repair 2: Preview E2E type annotations

## Purpose

Repair the two Playwright TypeScript errors reported by hosted GitHub Actions run #2, so the repository verification can proceed to lint, runtime tests, build, integration, and browser E2E.

## Evidence and scope

Run #2 failed during root test-project typecheck at `tests/e2e/counterball-preview.spec.ts` lines 100 and 171. Both failures report that `canvas.evaluate<string | null>(...)` supplies an invalid number of generic type arguments for the pinned Playwright API. All `games/counterball` package typechecks passed. The current implementation removes the explicit `evaluate` generic and annotates each callback return as `string | null`.

## Exact implementation write paths

- `tests/e2e/counterball-preview.spec.ts`
- `execution_state/reports/T03-repair-2-implementation.md`

Do not edit shared config, contracts, lockfiles, or task/status records in this packet.

## Independent review packet

Reviewer: `/root/toolchain_audit`.

Reviewer write path only:

- `execution_state/reports/T03-review-repair-2.md`

Inspect the pinned Playwright API/type usage and both callback edits. Confirm the WebGL2 preview assertions and test intent remain intact. Return `PASS` or `CHANGES_REQUIRED`, with concrete evidence and any required repair. Do not run local build, test, lint, typecheck, formatter, or development server commands. Do not edit implementation files.

## Acceptance

1. Both invalid generic invocations are corrected using the pinned API's supported typing.
2. Preview assertions and test intent are preserved.
3. Independent source review passes.
4. The hosted GitHub Actions run on the reviewed commit passes root typecheck, lint, tests/build, integration, and E2E. A source review alone does not accept parent task T03.

## Constraints

- No local builds/tests/lint/typecheck/server because the user asked to run builds away from their laptop.
- Hosted CI is the verification environment.
- Do not claim a test passed until a hosted run records it.
- Do not change deferred product behavior.
