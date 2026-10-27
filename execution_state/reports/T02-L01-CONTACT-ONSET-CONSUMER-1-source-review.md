# T02-L01-CONTACT-ONSET-CONSUMER-1 independent source review

Verdict: PASS for source behavior only, subject to hosted formatting/typecheck/tests and real complete 24-case runtime/artifact evidence. This is not card acceptance, native proof, calibration, or playability.

Reviewed exact live packet, implementation report, accepted onset adapter and separation helpers, and the actual three-file diff. SHA-256 at review: runner `3b6b6669e3e7d5f64112e50ba7a37340d2f14a21b1cf712f000fd1679090e648`; writer `3dcdbbc24c75a1ab38058e43b570a88630cb28e73a0036de88c60b1125fc32ce`; test `050fe6a59acabc9d3b24cb9663ef4a2ff94890aa8b85882e4ec8a74b87a26bdd`. If source changes, this review must be reconciled against the revised hashes.

The runner reads the initialized Havok EventType.COLLISION_STARTED wrapper and passes it to the accepted helper. It constructs the contract's dynamic then static body order, adds every observer, and configures and reads all masks before the impulse or step, without later broad callback enable. Each delivered callback is retained in occurrence order after canonicalizing its pair; unknown/self participants, non-Started event types and existing row/byte limits fail the case. The accepted source seam preserves strict initial separation and original eight-corner origin radius; cylinder COM radius and support datum remain in place. Fixture pin matches the frozen raw SHA. The diff retains tuple count and numeric/workload guards.

Writer validation requires exact subscription and body keys, a positive single uint32 bit, canonical 22 body IDs and equal request/readback, and only the Started event while retaining the existing event byte limit. Tests cover missing, malformed, out-of-order and mismatched metadata, Continued and other invalid events, and preservation/order of duplicate callbacks. Observed unit tests do not establish runtime delivery or native mask identity.

The owner wrapped the flagged long test line; the revised diff was reviewed. No formatter was run locally per user instruction; hosted formatter is the authority.

Scoped `git diff --check` passed. No application build, typecheck, lint, formatter, unit or browser test was run locally. Hosted Verify and real native full matrix/download/host validation, plus independent exact-run and artifact review, remain required before acceptance.

