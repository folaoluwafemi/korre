# T02-BR02-OBSERVED-MASS-PROJECTION-1 source review

**SOURCE: PASS. RUNTIME: NOT RUN / still pending exact-head GitHub checks.** The implementation delta against the accepted readback base (`bf80bfb`) is confined to the three packet-assigned files. No application command was run for this review.

## Reviewed diff

The scoped diff is 79 insertions and 8 deletions across exactly:

- `games/counterball/src/simulation/browserDirectProbe.ts`
- `games/counterball/src/simulation/browserDirectProbe.test.ts`
- `tests/e2e/counterball-direct-probe.spec.ts`

`packages/game-protocol/src/config.ts` and `games/counterball/src/simulation/worldFactory.ts` have no diff against the accepted readback base. The canonical config still specifies cap mass `1` and button mass `0.15`; the world factory still passes its existing `mass` value directly to `body.setMassProperties({ mass })`.

The report's three source hashes match the current files:

- `browserDirectProbe.ts`: `B878ACE01834218FAE02E7D306B41C3B7DDAFFC9C9125C0DDD58A30F4E96D989`
- `browserDirectProbe.test.ts`: `29B9C4699017FFFD94355E7CD8B393E386947077AF1690E6771CC864FC83779F`
- `counterball-direct-probe.spec.ts`: `59ECC299F07DA34FFB74BD8F1E33D600E6CD3B3FFA7B8EB324FFD9BE9701866A`

## Findings

At `browserDirectProbe.ts:820`, the implementation computes only `Math.fround(definition.expectedMass)` as the projected native expectation. `definition.expectedMass` and the existing `setMassProperties` request are not modified. The source comment/report treats the projection as a candidate based on the observed button readback, not a Babylon/Havok API guarantee.

The guard remains fail-closed. Its tolerance expression at lines 821–822 is unchanged: `Number.EPSILON * Math.max(1, definition.expectedMass) * 64`. The new `isNativeMassMismatch` predicate rejects only when the absolute projected/native difference is strictly greater than that bound. Existing invalid/non-finite mass validation remains before this comparison. `formatNativeMassMismatch` now reports the body ID, canonical mass, projected mass, native mass, projected/native absolute delta, and tolerance with `String(number)` round-trip values.

The added pure tests assert `Math.fround(0.15) === 0.15000000596046448`, verify the full-precision diagnostic fields, and check exact-boundary acceptance plus rejection just beyond the unchanged strict limit and for a larger mismatch. These tests do not claim native physics behavior.

The E2E helper now polls for either `probe-result` or `probe-error` with a 30-second timeout. On error it attaches the exact visible text and pre-cleanup lifecycle, calls the existing unmount/disposal assertion, checks engine/listener/observer baselines, attaches post-cleanup lifecycle, and then fails with the captured error. The success-path assertions after that branch are unchanged. The separate blocked-WASM flow remains in the spec: it blocks the initial request, checks cleanup, removes the route, retries, and then invokes the same helper. No shot, retry-cleanup, or native cap result is established by this source review.

The scoped source diff does not alter tolerances, canonical masses, setter input, impulse, physics guards, browser retry assertions, skip configuration, or any other file. The implementation report says only `git diff --check` ran locally and that all application checks were NOT RUN. I did not run an application check; the required `pnpm verify` and focused Chromium diagnostic run still need to execute on the exact reviewed SHA. A failing body must stop the probe before impulse and leaves that body's and subsequent bodies' results unclaimed.
