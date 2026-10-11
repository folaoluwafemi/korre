# T02-BR01 attempt 3 implementation report

## Scope and source changes

Implemented the browser-only diagnostic entry point in `games/counterball/src/simulation/browserDirectProbe.ts`, exported it from `games/counterball/src/browser.ts`, and added focused pure guard/cleanup tests in `games/counterball/src/simulation/browserDirectProbe.test.ts`.

The entry point uses the pinned Havok runtime and the canonical fixture/world factory, retains the caller-owned browser Engine, validates the canonical 15-body fixture and native mass, inertia, material, filter, and transform data, and applies only the accepted `home-6` raw impulse `{x:0,y:0,z:8}` at `{x:0,y:0.06,z:-4}`. It returns diagnostic observations only; it does not map the impulse to player power, add a production runner, or populate `physicsCalibration`.

For this isolated trial, the code replaces the existing support shape with one 662 × 0.2 × 670 box at the existing body transform, preserving and checking its native material, collision filters, density, and trigger state. It restores the original shape during cleanup. If restoration fails, the replacement remains alive until world teardown succeeds; a failed teardown is reported and cannot produce a successful result.

The guard uses the shifted energy reference `ΣKi + Σ[mi*g*(COM_y_i - (restY_i - 0.01125))]`, with a separate per-body drop check. It derives full-precision substeps from actual native properties and the hashed limits, rejects requirements above 48 calls per fixed tick before applying the impulse, and checks a conservative swept collider envelope before each explicit Havok step. It also checks actual observed states, bounded batching/yields, cancellation, wall time, simulated duration, contacts, serialized output size, and protocol frame/fact limits. Wall-time and total-work exhaustion report `resourceLimit`; unsettled maximum simulated duration reports `timeout`.

## Verification

- Local scoped `git diff --check` — **exit 0** for the tracked browser export; Git emitted only its LF-to-CRLF working-copy warning. The same whitespace check against the three new untracked files produced no whitespace diagnostics; `git diff --no-index` returned exit 1 because those files differ from `/dev/null`, as expected.
- Local install, typecheck, lint, unit/integration tests, build, browser, Havok simulation, and deployment checks — **NOT RUN**, as required by the packet.
- Required hosted checks after independent source review: `pnpm --filter @korre/counterball test && pnpm --filter @korre/counterball typecheck && pnpm verify`.

No runtime result, successful physics measurement, flick traversal, playable match, deployed Havok proof, or T02 acceptance is claimed by this source implementation.
