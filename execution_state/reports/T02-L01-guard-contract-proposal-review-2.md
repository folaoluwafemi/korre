# T02-L01 guard contract proposal 2 review

**Verdict: CHANGES_REQUIRED.** The arithmetic and proposed diagnostic-only boundary are mostly coherent, but the proposal still has several concrete contract and provenance gaps. No trial is authorized by this review.

## Findings

1. **Fixture payload digest casing can fail exact verification.** The proposal embeds `6CE26E...B625D` in the strict guard and requires equality with `hashCanonicalJson()` at lines 12 and 25. The canonical hash helper emits lowercase hex. Recomputing the config-hash-omitted fixture payload gives `6ce26e4203017e446687dfd8ad95106ba582f09420f8c623129c7d1bbe6b625d`. Freeze that lowercase literal, or explicitly define a case-normalization step before equality; do not leave exact comparison ambiguous.

2. **Static collider count is wrong.** Proposal line 46 says seven goal-frame colliders. `worldFactory.ts` creates six frame colliders (two posts and one crossbar at each end); the seventh static body is the separate support slab. Correct the wording. The proposal’s total of seven static bodies and `shapeCount: 22` otherwise match the inspected factory layout.

3. **The 64-KiB case metadata has no required field inventory.** Lines 12, 68–72 require identity checks, native-property/material preflight, endpoint/sweep observations and settling, but line 70 only defines a size cap. It does not require each case’s serialized metadata to preserve the full-precision tuple; config/schema, fixture-file, and WASM hashes; the actual native property/material readbacks for all 15 dynamic bodies (and the static-body material/filter facts used by the trial); and explicit final settling evidence. Add those fields to the case/matrix artifact contract and include their actual UTF-8 bytes under the existing metadata limits. Validation performed only in memory is not enough to audit a later artifact.

4. **The proposed coordinator card exceeds the bounded write-set limit.** Line 76 names `CONTRACTS.md`, `CONTRACT_WORK.md`, coordinator and local packet records, generated `PACKETS.md`, and `tasks.json`—six distinct files. Split this into cards with at most five exact write paths each, keeping generated-index ownership explicit. Also replace “T02-L01’s already-accepted prerequisite set” with a deduplicated, exact dependency list so the checker can validate the graph and no self-dependency is implied.

## Checks and supporting review

- `node scripts/check-completion-plan.mjs --packet T02-L01`: PASS; extracted the current packet and its accepted dependency set.
- `git diff --check -- execution_state/reports/T02-L01-guard-contract-proposal-2.md`: PASS; no whitespace errors.
- Recomputed the config-hash-omitted fixture payload digest using the repository’s canonicalization behavior; the digest matches numerically apart from the case-sensitive hex representation noted above.
- The shifted-energy equation, separate per-body drop guard, pre-impulse energy calculation, 24-tuple ordering, 48-call subdivision cap, and stated row-byte arithmetic are internally consistent with the cited accepted guard and math/workload reviews. The proposal correctly labels the workload ceilings as unbenchmarked, requires an exact hosted run, and makes no physics/runtime or playability claim. The seven-static-body geometry is supported by the factory, with the collider-label correction above.
- No application tests, build, browser, Havok trial, deployment, or runtime check was run. This is a document/source-contract review only.
