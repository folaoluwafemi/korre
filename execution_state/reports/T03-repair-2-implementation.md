# T03 repair 2 implementation

GitHub run #2 reported a TypeScript error at both WebGL assertions in `tests/e2e/counterball-preview.spec.ts` (lines 100 and 171): this Playwright version requires two or three type arguments for `Locator.evaluate`, but the test supplied one.

Removed the explicit `evaluate<string | null>` generic at both call sites and annotated each callback return type as `string | null`, allowing Playwright to infer the element and result types. The WebGL2 assertions, button inspection/return flow, responsive viewport checks, and screenshot paths are unchanged.

**Verification: NOT RUN locally.** The coordinator imposed a laptop restriction against local build, test, lint, typecheck, or server commands. The reported GitHub run is the failure that prompted this repair; a hosted rerun has not yet verified it. Independent review and hosted verification remain pending. No other paths or shared status records were changed.
