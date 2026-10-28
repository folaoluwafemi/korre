# T02-BR02-FORMAT-REPAIR-1 acceptance

Date: 2026-10-11

## Result

**ACCEPTED for the exact hosted formatting repair and its final integrated source.** The pinned 4,674-byte patch was applied verbatim to its two authorized files and independently source-reviewed PASS. Its first full browser run stopped at the pre-existing native button-mass guard, so that run alone did not meet the packet's hosted gate. The later accepted observed-mass successor retains all eight formatter-patch postimages unchanged on exact SHA `88c8302c8ce4b0d0217de33419efcb8145c11188`; that exact source then passed the required GitHub verification and real Chromium diagnostic flick/retry checks, with independent source and run reviews PASS.

## Evidence

- The patch is exactly 4,674 bytes with SHA-256 `442bf7fbfd79a61e1b9982e55cd20a5701801379354ffcc80fb94a171ccfa0d5`. Its eight formatting-only hunks are limited to `apps/web/src/CounterballDirectProbe.tsx` and `tests/e2e/counterball-direct-probe.spec.ts`.
- The implementation report records the required base, exact patch application, and scoped `git diff --check`: `T02-BR02-FORMAT-REPAIR-1-implementation.md`. Independent review confirmed exact identity, two-path scope, and unchanged assertions: `T02-BR02-FORMAT-REPAIR-1-review.md`.
- Run 38139294487 on the patch-only source exposed the existing native mass-readback mismatch. It is retained as a failed attempt and is not represented as a formatter defect or a pass.
- The accepted successor's independent dependency review compared all eight new-side patch postimages with the files at the accepted final SHA and confirmed every one is unchanged: `T02-BR02-dependency-resolution-review-38145098173.md`.
- GitHub run [38145098173](https://github.com/folaoluwafemi/korre/actions/runs/38145098173), exact SHA `88c8302c8ce4b0d0217de33419efcb8145c11188`, passed full verification, integration, production preview, focused diagnostic Chromium (2/2, zero application skips/retries/flakes), retry/cleanup, and production diagnostic exclusion. Independent source and exact-run reviews are `T02-BR02-OBSERVED-MASS-PROJECTION-1-source-review.md` and `T02-BR02-OBSERVED-MASS-PROJECTION-1-run-review.md`.

This acceptance applies only to the formatting-repair card. BR02 requires its own evidence integration acceptance; T02, deployed Havok, a complete playable match, AI, online, social, and device gates remain open.
