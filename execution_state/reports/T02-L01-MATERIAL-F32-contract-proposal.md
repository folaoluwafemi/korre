# T02-L01-MATERIAL-F32-1 contract proposal

**Status: diagnostic contract accepted after independent review; implementation source review passed, hosted/runtime validation remains pending.**

## Evidence and scope

The exact real-browser run on commit `a20c96a4c7a097b19b867e164cac89141b84036` read dynamic friction setter `0.15` back from pinned Havok as `0.15000000596046448`, exactly `Math.fround(0.15)`. The observed mismatch and independent run review are recorded in `execution_state/reports/T02-L01-MATERIAL-DIAGNOSTIC-run-38473828114.md` and `execution_state/reports/T02-L01-MATERIAL-DIAGNOSTIC-run-38473828114-independent-review.md`.

Pinned Babylon core 9.30.0 maps the JavaScript numeric material fields into one native material array and reconstructs those fields from the native readback array. The setter/getter implementation is at [the pinned Babylon Havok plugin](https://github.com/BabylonJS/Babylon.js/blob/9.30.0/packages/dev/core/src/Physics/v2/Plugins/havokPlugin.ts#L1916-L1939). The browser observation shows float32 projection for `friction`; applying the same exact representation rule to `staticFriction` and `restitution` is a proposal about their shared native material boundary, not yet a separately observed fact. The existing pre-impulse runner check will test each of all three fields on each of all 22 shapes and fail closed on any value that is not the exact finite projection.

The existing exported `matchesExactFloat32Projection(configured, observed)` already implements the required rule and has focused tests: finite configured and observed values, finite `Math.fround(configured)`, and strict equality to that projection. It rejects raw nonrepresentable decimals, adjacent float32 values, non-finite values, and finite inputs that project to infinity. The runner already imports this helper for the accepted support check.

## Accepted narrow diagnostic amendment

For the T02-L01 diagnostic native material guard only, interpret the existing `readbackPolicy: "exact-setter-value"` as exact equality in the pinned native representation: for numeric `friction`, `staticFriction`, and `restitution`, require the getter value to equal exactly `Math.fround(setterValue)`, with finite setter, projection, and observed values. This is exact representation matching, not tolerance. Continue to compare `frictionCombine` and `restitutionCombine` by strict string equality.

Keep every configured setter and native getter value unchanged. Continue storing and reporting the raw observed native readbacks in the result metadata; use the projected value only as the expected comparison value. If any projection/readback is missing, non-finite, out of range, overflowed, or differs by even one adjacent float32 value, abort before impulse with the existing `resourceFailure` path and no success artifact. Do not change geometry, filters, body properties, solver, impulse, matrix tuples, artifact schema, public config/hash, protocol, fixtures, or product physics defaults.

The artifact validator is part of this rule. Validate each `setter` against the frozen configured values with strict equality. Validate each raw `readback` against that record's setter: exact finite `Math.fround(setter)` for the three numeric fields and strict equality for both combine strings. Validate each static body's material record by requiring it to equal exactly the matching shape's raw readback. Do not replace raw values with projected values in serialized metadata. Add focused writer tests proving that exact projected readbacks are accepted and preserved, while an adjacent float32 value is rejected.

This keeps the exact-setter policy and config hash because the intended native coefficient value is unchanged; it clarifies how that exact value is represented across the pinned JavaScript/native boundary. The rule applies only to this diagnostic preflight and does not select gameplay friction/restitution tuning.

## Required independent decision

Review whether the measured `friction` value and pinned adapter mapping support a narrowly exact `Math.fround` comparison for all three numeric material fields, whether keeping the policy/hash/schema unchanged is semantically sound, and whether the runner, artifact validator and focused writer tests preserve exactness and raw metadata. If any answer is no, return `CHANGES_REQUIRED` with the smallest additional diagnostic or contract change. No worker may change source until the coordinator records a contract/packet `PASS` and the exact packet is materialized in runtime task state.
