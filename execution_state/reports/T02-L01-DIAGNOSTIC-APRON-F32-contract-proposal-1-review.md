# T02-L01-DIAGNOSTIC-APRON-F32 contract proposal review

**Verdict: PASS — proposal wording and scope.**  
**Runtime: NOT RUN; no contract or source change approved by this review.**

## Evidence checked

The proposal identifies run `38613508970` at exact SHA `533df8426d8187875565a74b2997987886a1ca71`, matching the retained run snapshot. The hosted Verify log reports 30/30 test files and 184/184 tests; integration reports 1/1; ordinary preview reports 4/4. The diagnostic browser log reports four cases: three passed and the full-Havok matrix test failed before download with the generic message, “The diagnostic support apron does not match the exact hashed slab geometry.” It does not expose the failing apron axis or measured apron bounds.

The referenced support run `38466161040` independently records the canonical slab readback `(12, 0.20000000298023224, 20)`, with x/z exact and Y equal to `Math.fround(0.2)`. The proposal correctly labels applying that Y result to the larger apron as an inference, not an observed apron measurement. Run `38613508970` emitted no complete matrix result; the failure occurred before download or matrix acceptance.

## Scope and contract fit

The proposed clause is bounded to the temporary diagnostic `support-apron`. It retains strict box type and exact x/z dimensions `662` and `670`, and requires exact equality to the finite `Math.fround(0.2)` value for Y. It rejects non-finite values, epsilon bands, neighboring Float32 values, and alternate dimensions. It retains raw observed dimensions and keeps the configured/constructed apron geometry unchanged.

This is separate from the accepted canonical-support clause in `CONTRACT_WORK.md` §162, which changes only the canonical slab Y readback comparison, and the dynamic-cylinder clause in §168, which applies to the 15 dynamic cylinders. The proposal leaves those rules intact. It also explicitly preserves all other static-collider checks, the canonical pitch slab and transform, goal-frame geometry, configuration/hash, physics behavior, and product defaults. That scope is consistent with the accepted contracts.

The required validation remains appropriately strict: implementation needs independent review, and acceptance still requires a fresh exact-head hosted run through verification, integration, ordinary preview, and diagnostic Chromium gates; the complete 24-case real pinned-Havok artifact must download and pass host validation with zero skips, retries, or flakes, followed by independent run/artifact review. A preflight pass alone is not represented as matrix acceptance.

## Limits

The apron’s own AABB values remain unobserved in the cited failure. This proposal does not prove the inferred Y mismatch, any apron runtime behavior, completion of the 24-case matrix, deployed Cloudflare Havok, T02 acceptance, or playability. If the proposed clause is accepted, the exact hosted matrix must still falsify or confirm the inference and pass every existing guard.
