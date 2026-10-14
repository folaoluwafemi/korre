# Independent packet review: T02-L01-MATERIAL-F32-1

**Verdict: CHANGES_REQUIRED.** The proposed comparison rule is narrowly supportable, and the packet's runner-only code change is clear. However, a second validator still enforces the old exact-JavaScript-value rule on the raw metadata. The packet explicitly forbids changing that validator, so the advertised success path cannot produce an acceptable case artifact.

## Evidence reviewed

The exact packet extraction passed the lightweight plan-consistency check and returned the full record. No application command or runtime check was run for this review. The packet has one source write path, `games/counterball/src/simulation/loftCoarseRunner.ts`; its hosted `pnpm verify` and diagnostic Chromium commands are concrete. `ready:false` is consistent with the packet's inherited requirement for T01 acceptance.

Pinned Babylon 9.30.0 source at [`havokPlugin.ts` lines 1916–1939](https://github.com/BabylonJS/Babylon.js/blob/9.30.0/packages/dev/core/src/Physics/v2/Plugins/havokPlugin.ts#L1916-L1939) places `staticFriction`, `friction`, and `restitution` in one native material array, then reconstructs all three from the corresponding slots returned by the native getter. The hosted diagnostic observed dynamic friction `0.15` as `0.15000000596046448`, which is exactly `Math.fround(0.15)`. Static friction is configured to the same `0.15`; restitution is `0`, whose Float32 projection is exactly itself. The other two fields were not separately measured in that run, so applying the same rule to them is an inference from the shared numeric array and pinned adapter, not an observed result. It is a bounded inference: the runner must verify every numeric field on every shape and abort on anything other than exact projection; no tolerance or alternate encoding is allowed.

The existing `matchesExactFloat32Projection` helper checks finite configured and observed values, finite projection, and strict equality with `Math.fround(configured)`. Its focused tests cover the exact projection, the unprojected decimal, an adjacent Float32 value, non-finite inputs, and projection overflow. The runner's `materialValues` also rejects missing/non-finite/out-of-range getter values and unsupported combine modes before the comparison. The proposed runner change can therefore use the helper without mutating setters or substituting projected getter values. `materialRow` retains the raw setter and readback objects for metadata.

Retaining the `readbackPolicy: "exact-setter-value"` literal and config hash is sound **only under the proposed, accepted contract clarification**: exactness means equality to the pinned native representation of the configured setter for this diagnostic preflight. The setter values and canonical config are unchanged; the projected value is only the expected native representation, not a rounded setter or tolerance. The amendment scopes this interpretation to the L01 diagnostic and keeps combine strings strict. It should not be dispatched until the amendment is recorded as accepted; no config/hash edit is otherwise needed.

## Blocking artifact-validator conflict

`games/counterball/src/simulation/loftCoarseProbe.ts` still requires raw metadata to equal the unprojected guard values:

- `assertMaterial` at lines 591–620 compares all three numeric values directly to `guard.materials`.
- `validateCaseMetadata` calls it for both `material.setter` and `material.readback` at lines 836–837, then requires every setter field to equal its readback exactly at lines 838–846.
- It also calls the same strict validator for each static body's raw `body.material` at line 886.
- The matrix writer reaches `validateCaseMetadata` at line 1643 before accepting/writing each yielded case.

After the requested runner change, a native friction readback of `0.15000000596046448` would pass the pre-impulse runner comparison and remain correctly preserved as raw metadata, but these strict validators would reject it against configured `0.15` (and the setter/readback equality check would reject it too). The failure would occur during case validation after the trial has run, rather than at the material preflight before impulse. Thus the packet cannot meet its raw-metadata, exact-projection, and no-artifact acceptance conditions as written.

## Smallest repair

Before dispatch, the coordinator should amend or split the packet to allow the metadata validator to distinguish configured setters from native readbacks. Keep setter fields equal to the frozen config; validate raw numeric readbacks as exactly `Math.fround(setter)`; keep combine modes strict; keep static-body/material-record cross-checks exactly equal to the same raw readback. Add focused validator tests for an exact projected readback and an adjacent value, without changing the artifact schema or storing projected values in place of native reads. Update the assigned write paths and hosted checks to include that validator/test work. If the required changes must remain restricted to the current runner-only packet, stop rather than dispatch it.

The extracted packet retains the visible L01 prerequisites, including the executor, guard contract/schema, packet split, transport, support preflight/F32, and material diagnostic gates; the inherited T01 acceptance block remains explicit. I did not read the original MATRIX-1 packet because this review was bounded to the assigned exact packet and listed supporting inputs, so this report does not claim a byte-for-byte dependency-list comparison against that source card.

**Runtime verdict: NOT RUN.** The diagnostic run reviewed as evidence for the proposal is not proof that the new rule passes all 22 shapes or that a matrix artifact validates. No matrix, physics, browser, or build check was run here.
