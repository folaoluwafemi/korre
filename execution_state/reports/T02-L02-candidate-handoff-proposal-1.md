# L02 deterministic artifact handoff proposal

Proposal only. No L01/L02 acceptance, source work, or physics result. The full L01 matrix remains the prerequisite for every runtime consumer.

Freeze the handoff used by L02 as follows:

- Input is the entire independently accepted L01 download, its SHA-256 and byte count, exact source commit/run/attempt, artifact name/id and the accepted config/guard/WASM/fixture identities. A compact candidate summary alone never substitutes for full24-case validation.
- Extend the existing streaming host validator to select only after every case, final counts, strict metadata and whole-file digest validate. Retain one bounded case at a time and one compact winner; no full-matrix allocation.
- A case is eligible only if its existing recomputed eligibility passes. Score it by the minimum `minimumWholeButtonObstacleClearance.value` over every row whose `intervalClassification` differs from `no-horizontal-overlap`. An eligible case with no overlapping row or non-finite score is invalid evidence, never a winner.
- Choose highest score. Exact score ties prefer lower impulse, lower tilt, lower absolute azimuth, then lower original tuple index. No tolerance-based tie or peak-only selection.
- No eligible case produces an explicit `{ status: "no-candidate", trialsRun: 0, reason: "No validated L01 tuple satisfies whole-button traversal and settlement." }` plus exact source identity. It must perform zero WASM fetches, world creations or physics steps. Calibration remains open; this is diagnostic acceptance only.
- A winner produces `{ status: "candidate", sourceTupleIndex, tuple, score }` plus exact source identity. L02 holds gap/azimuth and creates exactly the original specified ordered3x3 tilt/impulse grid; no extra search.
- The grid uses the existing private guarded per-case implementation through a reviewed internal producer. Its serialized envelope must have a distinct diagnostic refinement identity referencing the accepted L01 download digest/index. Keep canonical24 matrix identity/config/guard/fixtures unchanged. A nine-case envelope must never be accepted by the coarse writer or described as a canonical24 matrix.

This proposal freezes candidate aggregation and source provenance only. It does not authorize a missing executor API, change physics or loosen any limit. Positive-branch dispatch still needs exact shared executor/writer exports and a reviewed bounded producer packet; the existing one-test-file L02 card is insufficient. Zero-branch dispatch still needs concrete immutable accepted-artifact inputs and hosted checks with actual no-skip counts.
