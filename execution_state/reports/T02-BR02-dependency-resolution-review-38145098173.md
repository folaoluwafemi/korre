# T02-BR02 dependency resolution review — run 38145098173

**Verdict: PASS for the proposed coordinator resolution, with the status and provenance updates below.** It repairs the stale dependency without treating supersession as acceptance. It is a plan/status change only; it does not add runtime evidence beyond the already reviewed exact run.

## Evidence checked

- Extracted the current `T02-BR02`, `T02-BR02-FORMAT-REPAIR-1`, and `T02-BR02-OBSERVED-MASS-PROJECTION-1` catalogue records with `node scripts/check-completion-plan.mjs --packet ...`. The whole plan validator reports consistency PASS. The formatter is currently `SUPERSEDED` in `execution_state/tasks.json`; the observed-mass successor is `ACCEPTED`, and its runtime record still lists `T02-BR02-FORMAT-REPAIR-1` under `supersedes`.
- Independently recomputed the patch file as 4,674 bytes and SHA-256 `442bf7fbfd79a61e1b9982e55cd20a5701801379354ffcc80fb94a171ccfa0d5`. It has eight hunks across the two authorized paths. I checked each hunk's complete new-side postimage against the files at accepted successor SHA `88c8302c8ce4b0d0217de33419efcb8145c11188`; all eight are still present unchanged.
- The formatter's independent source review is PASS. The accepted successor's independent source and exact-run reviews are PASS for SHA `88c8302c8ce4b0d0217de33419efcb8145c11188`, GitHub run `38145098173`. The run passed verification, integration, production preview, diagnostic Chromium 2/2, retry/cleanup, and production diagnostic exclusion, with zero application skips/retries/flakes. The observed-mass acceptance report properly limits this to the diagnostic browser flick/retry; it does not accept T02 or a playable match.
- In `scripts/check-completion-plan.mjs:81–82`, `depends_on` creates both a graph edge and an accepted-packet gate. At lines 85–94, `supersedes` only orders writers and closes the old card; it is not an acceptance gate. Lines 117–123 reject unordered worker write overlaps.

## Resolution and graph result

The proposed metadata should make these exact changes:

```diff
# LOCAL_PACKETS.json, T02-BR02-OBSERVED-MASS-PROJECTION-1
 "depends_on": [
-  "T02-BR02-MASS-READBACK-1"
+  "T02-BR02-MASS-READBACK-1",
+  "T02-BR02-FORMAT-REPAIR-1"
 ],
-"supersedes": ["T02-BR02-FORMAT-REPAIR-1"]
```

Apply the same `depends_on` replacement and remove `supersedes` from the observed-mass successor's `packet_progress` entry in `execution_state/tasks.json`. Then record the formatter's existing ID as `ACCEPTED` in its `packet_progress` entry and link an acceptance report that cites its implementation report and source review plus the successor's exact SHA/run, source review, run review, and acceptance report. Leave the formatter's catalogue dependencies unchanged. Leave the `T02-BR02` `depends_on` array byte-for-byte unchanged.

This is acyclic: the formatter depends on its already accepted prerequisites, while the successor depends on the accepted readback and formatter. It also restores the shared-file write order: the two worker cards overlap on `tests/e2e/counterball-direct-probe.spec.ts`, and the successor now depends on the formatter. No new unordered worker write conflict results. Once the formatter status is actually `ACCEPTED`, BR02's existing direct dependency on that ID is satisfied under the checker's accepted-only rule. The existing exact-run/source evidence then supports coordinator acceptance of BR02; the dependency edit alone does not mark BR02 accepted.

The successor was implemented after the exact patch had been applied and reviewed. Its accepted source/run therefore verifies the final combined files that still contain every patch postimage, including the overlapping E2E file. This supports accepting the formatter card on its own criteria after the successor's successful run; it does not rely on `supersedes` as a substitute for acceptance.

The current plan check is only consistency evidence. I did not edit shared records or run a hypothetical modified-state checker. After applying the resolution, the coordinator should rerun exact extraction for the formatter, successor, and BR02; the formatter and successor should be non-dispatchable because they are accepted/completed, and BR02 should proceed only once its status is advanced for integration acceptance. No application checks or runtime commands were run for this review.
