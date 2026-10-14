# Superseded dependency audit — 2026-10-14

**Finding: one catalogue dependency is blocked by a SUPERSEDED producer; one runtime status record still mirrors an obsolete edge that the coordinator catalogue has already corrected. No source, catalogue, or status edits were made for this audit.**

## Scan

I scanned all three packet catalogues: LOCAL_PACKETS.json (58 records), COORDINATOR_PACKETS.json (28), and ONLINE_PACKETS.json (30), plus execution_state/tasks.json. The task state contains 12 SUPERSEDED child/repair records.

Among catalogue depends_on fields, the only consumer of a SUPERSEDED producer is LOCAL_PACKETS.json#T02-R01 → T02-F01. The T02-L01 runtime progress row also names a SUPERSEDED child, but this is a stale mirror: COORDINATOR_PACKETS.json#T02-L01 already uses its accepted successor. The checker builds packet dependency gates from catalogue depends_on (scripts/check-completion-plan.mjs lines 79–83) and readiness requires each such dependency to be ACCEPTED (lines 135–140). Thus T02-R01 is the actual catalogue graph blocker; T02-L01 needs runtime-status reconciliation for consistency.

## Catalogue blocker: T02-R01 → T02-F01

LOCAL_PACKETS.json#T02-R01 still lists T02-F01 first in depends_on (around lines 645–660). Runtime status marks T02-F01 SUPERSEDED (tasks.json around line 1601), while T02-F01-ROTATION-1 is ACCEPTED (around line 1837). The replacement writes the same two producer files, facts.ts and facts.test.ts, and preserves the existing deriveSimulationFacts export and fact output contract; the accepted implementation/review records establish the scope continuity.

Acceptance evidence is recorded in tasks.json for T02-F01-ROTATION-1: final exact-SHA GitHub run 38091279565 on ec6c35cb3b8e62c70c94d4fd6b26ed577f0088cf passed 25 test files / 139 tests with zero skips, integration 1/1, and Chromium 4/4. Independent source and artifact review passed. See execution_state/reports/T02-F01-ROTATION-1-review.md and execution_state/reports/T02-F01-ROTATION-1-run-38091279565-independent-review.md. The accepted producer is pure fact generation only; it does not accept parent T02, deployed Havok, or playability.

**Recommended reconciliation:** after independent review of the exact amendment, change only T02-R01's dependency from T02-F01 to T02-F01-ROTATION-1 in LOCAL_PACKETS.json and regenerate PACKETS.md. Preserve T02-R01's other listed dependencies and its inherited T01 parent gate. Do not change either task's status.

## Stale runtime mirror: T02-L01 → T02-L01-BROWSER-1

The T02-L01 packet-progress record in tasks.json (around lines 2926–2945) still lists T02-L01-BROWSER-1, which is SUPERSEDED (around line 5877). The coordinator catalogue is already amended: COORDINATOR_PACKETS.json#T02-L01 lists T02-L01-BROWSER-1-SUCCESSOR-3 (around lines 1369–1384), and tasks.json records that successor ACCEPTED (around line 8418). This mismatch is a stale runtime-status dependency mirror, not a remaining catalogue dependency edge.

The replacement evidence is execution_state/reports/T02-L01-BROWSER-1-SUCCESSOR-3-acceptance.md and its independent exact-run report. They record GitHub run 38430577910 on af5f499a06df4a3cf472ecf0d3991ee330a70bd8, successful hosted gates, a real browser Havok flick, and independent source/run PASS. The accepted scope is the first browser-flick milestone only. It does not prove the 24-case matrix or full-cap transport. The coordinator catalogue keeps T02-L01-TRANSPORT-1 and T02-L01-MATRIX-1 as separate gates, so they must stay in place.

**Recommended reconciliation:** after independent review, update only the T02-L01 dependency mirror in tasks.json from T02-L01-BROWSER-1 to T02-L01-BROWSER-1-SUCCESSOR-3, matching the already-amended coordinator catalogue. Preserve every other original L01 dependency and required_parent_acceptance [T01]. Do not mark T02-L01 accepted or ready as part of this repair.

## Keep the failed matrix gate pending

T02-L01-MATRIX-1 remains CHANGES_REQUIRED in tasks.json. The exact run review for run 38595010780 records a strict native button-dimension preflight failure before case one, no matrix download/artifact, and explicitly says MATRIX-1 acceptance was not met; see execution_state/reports/T02-L01-MATERIAL-F32-run-38595010780-review.md. The current goal-frame readback card is diagnostic-only and cannot replace that matrix evidence. Keep T02-L01-MATRIX-1 and all its other original dependencies unchanged until a complete 24-case hosted artifact and independent review pass.

## Bounded coordinator follow-up

Reconcile the two recorded edges in their owning control files only: LOCAL_PACKETS.json plus generated PACKETS.md for T02-R01, and the T02-L01 dependency mirror in tasks.json. Keep all other dependency IDs, parent/T01 acceptance gates, pending matrix status, and historical superseded records intact. Have an independent reviewer inspect the diff, then run the documentation checker and compare the extracted dependency lists. This audit itself changed only this report; it accepted no packet and ran no application command.
