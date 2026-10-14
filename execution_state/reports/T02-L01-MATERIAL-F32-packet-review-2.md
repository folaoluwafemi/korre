# Independent packet re-review: T02-L01-MATERIAL-F32-1

**Verdict: PASS for the revised contract and packet. Runtime: NOT RUN.** The revised three-file scope now repairs the runner comparison and the raw-metadata validator together, and adds writer tests for the accepted representation. This resolves the contradiction identified in the first review. The packet remains blocked from dispatch until its inherited T01 acceptance requirement is met and the coordinator records this review's contract/packet result.

## Contract and exactness

The exact packet extraction passed the lightweight plan-consistency check and returned the revised record. The proposed contract text now covers both the pre-impulse comparison and the artifact-validator behavior. It requires strict configured setter values, exact finite `Math.fround(setter)` numeric readbacks, strict combine strings, raw getter preservation, and exact equality between each static-body material record and its matching raw shape readback. It disallows tolerance, schema/config/hash changes, and replacing raw values with their projections.

The pinned Babylon 9.30.0 setter places static friction, dynamic friction and restitution in one native material array, and the getter maps the corresponding returned slots back to those same numeric fields. Run 38473828114 observed dynamic friction `0.15` as `0.15000000596046448`, exactly `Math.fround(0.15)`. Static friction is configured to the same value; restitution is configured as zero, whose Float32 projection is exact. The latter fields were not individually measured in that run, so their rule remains a stated inference from the shared native array, not an empirical claim. The inference is appropriately bounded: the hosted pre-impulse guard must check every numeric field on all 22 shapes and abort on any value other than its single exact projection.

Retaining the `readbackPolicy: "exact-setter-value"` literal and config hash is sound under the explicit diagnostic-only clarification now written into the proposed contract. Setters, configured values, schema and intended coefficients remain unchanged. The rule compares to the exact native representation, never a tolerance, and the projected value is not substituted into metadata. The contract and packet both keep this rule scoped to the T02-L01 diagnostic.

## Validator repair and packet scope

The prior blocker was real: the existing `loftCoarseProbe.ts` validator compares setters and readbacks directly with the unprojected guard values, requires setter/readback equality, and checks static-body material facts. The revised packet now assigns that validator file and its focused test file in addition to `loftCoarseRunner.ts`.

The specified split is sufficient to remove the conflict while preserving the artifact contract:

- Setter records remain strict frozen-policy values.
- Raw numeric readbacks must be finite and exactly equal to `Math.fround(the corresponding setter)`; combine strings remain strictly equal.
- Static-body records must equal their corresponding shape's raw readback exactly.
- The fixture and writer tests must accept an exact projected readback, verify the projected raw value remains in serialized JSON, and reject an adjacent Float32 value.

That gives the writer a valid path for the value observed in the hosted diagnostic without weakening adjacent-value rejection or losing the raw evidence. The runner's pre-impulse range/finite checks and fail-closed `resourceFailure` path remain in scope. The packet does not change helpers, schema, hashes, coefficients or physics settings. Its three source paths are concrete and disjoint; it forbids edits outside those paths. Its local check and hosted `pnpm verify`/pinned-WASM Chromium route are concrete. The browser acceptance keeps full matrix artifact validation separate from broader MATRIX-1/T02 acceptance.

The revised packet's `depends_on` list matches the list recorded in the prior exact extraction; it retains the executor, guard contract/schema, packet split, transport, support preflight/F32, and material diagnostic gates. The inherited T01 parent acceptance requirement remains present, so `ready:false` is appropriate and is not itself a packet defect.

## Limits

This is a contract/packet review only. The implementation has not been applied or source-reviewed, and no unit writer test, hosted check, browser run, physics run, or matrix artifact was executed. A future exact-SHA hosted run must establish that all 22 material values pass the pre-impulse rule and that the browser-produced raw metadata passes the revised writer without skips. MATRIX-1 and parent T02 remain separate acceptance gates.
