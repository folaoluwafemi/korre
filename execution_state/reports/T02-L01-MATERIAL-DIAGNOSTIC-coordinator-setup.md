# T02-L01-MATERIAL-DIAGNOSTIC-1 coordinator setup

## Readiness and reviews

- Exact extraction: `node scripts/check-completion-plan.mjs --packet T02-L01-MATERIAL-DIAGNOSTIC-1` returned plan `PASS`, 111 packets, 21 remaining parents, with this packet in `initialReady` and inherited parent acceptance `T01`.
- Independent pre-dispatch packet review: `execution_state/reports/T02-L01-MATERIAL-DIAGNOSTIC-packet-review.md` — PASS. It confirms every original MATRIX-1 dependency is preserved, the accepted F32 dependency is included, the worker owns only the runner path, and the strict guard/material semantics remain unchanged.
- Base source commit: `9977d984ee91dae726baff56d49e23cfe1d5f53d`.

## Assignment

- Worker: `/root/toolchain_audit`.
- Sole worker write path: `games/counterball/src/simulation/loftCoarseRunner.ts`.
- Source reviewer after implementation: `/root/executor_type_review`.
- Exact-run reviewer after hosted evidence: `/root/run_evidence_review`.
- `/root` retains shared status/catalogue/contract files, GitHub publication and run capture.

## Commands and completion boundary

Worker may run only:

`git diff --check -- games/counterball/src/simulation/loftCoarseRunner.ts`

No application build/test/browser/physics command may run on this laptop. After implementation and independent source review, the coordinator will run the exact source SHA through hosted `pnpm verify` and the packet's unchanged routed Playwright command on GitHub, then capture full logs, counts, failure context/trace and all artifact metadata/hashes.

Acceptance is only for disclosure of the exact mismatching field and setter/readback values on the existing strict-failure path. Verify and other browser checks must pass with recorded counts and zero skips/retries/flakes. The diagnostic matrix case is expected to stop at the same material mismatch and expose those exact values; no matrix case, download, or success artifact may be claimed. Any material/equality/physics change requires a separate packet.
