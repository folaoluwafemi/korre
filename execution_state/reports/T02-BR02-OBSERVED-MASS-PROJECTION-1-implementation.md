# T02-BR02-OBSERVED-MASS-PROJECTION-1 implementation

## Inputs and changes

The exact catalogue record was ready and names only `T02-BR02-MASS-READBACK-1` as a dependency; the coordinator confirmed that dependency is accepted. I read the packet's listed sources and evidence, including the reviewed real-browser readback (`0.15000000596046448`), the mass API audit and review, protocol config, contracts, acceptance notes, operations, and swarm instructions. The captured button value equals `Math.fround(0.15)` exactly. This is an observed match used as the packet's candidate, not a Babylon/Havok guarantee.

Changed exactly these assigned files:

- `games/counterball/src/simulation/browserDirectProbe.ts` — keeps canonical configured mass and setter input intact. The native readback comparison now uses `Math.fround(definition.expectedMass)`. The existing strict tolerance formula remains `Number.EPSILON * Math.max(1, definition.expectedMass) * 64`. Mismatches still fail closed before impulse. Diagnostic output includes body ID, canonical mass, projected expected mass, actual native value, absolute difference from the projected expectation, and tolerance, using round-trip-safe number strings.
- `games/counterball/src/simulation/browserDirectProbe.test.ts` — tests the exact `Math.fround(0.15)` mapping, exact full-precision diagnostic fields, and mismatch behavior at the unchanged tolerance boundary and beyond it.
- `tests/e2e/counterball-direct-probe.spec.ts` — waits at most 30 seconds for either a result or a visible diagnostic error. On error, it attaches the exact error and pre-cleanup lifecycle state, navigates through the existing Back-to-Counterball disposal path, checks the engine/listener/observer baseline, attaches post-cleanup lifecycle state, then fails with the visible diagnostic message. The existing blocked-WASM retry and successful-shot assertions remain in place.

SHA-256 hashes of the changed source files:

- `games/counterball/src/simulation/browserDirectProbe.ts`: `B878ACE01834218FAE02E7D306B41C3B7DDAFFC9C9125C0DDD58A30F4E96D989`
- `games/counterball/src/simulation/browserDirectProbe.test.ts`: `29B9C4699017FFFD94355E7CD8B393E386947077AF1690E6771CC864FC83779F`
- `tests/e2e/counterball-direct-probe.spec.ts`: `59ECC299F07DA34FFB74BD8F1E33D600E6CD3B3FFA7B8EB324FFD9BE9701866A`

## Checks and limits

- `git diff --check -- games/counterball/src/simulation/browserDirectProbe.ts games/counterball/src/simulation/browserDirectProbe.test.ts tests/e2e/counterball-direct-probe.spec.ts`: exit 0, no output.
- Application unit tests, typecheck, lint, formatting, build, browser, physics, and deployment checks: NOT RUN, as required.

The pure tests are not Havok evidence. The browser suite still must verify all body masses, actual WASM, both real pointer flicks, settled bodies, contacts, movement, changed pixels, retry, and teardown. If any later body fails the projected comparison, the probe must stop at that body before impulse and leave that body and subsequent outcomes unclaimed. Release the three source paths for independent review; no T02/BR02 or gameplay acceptance is claimed here.
