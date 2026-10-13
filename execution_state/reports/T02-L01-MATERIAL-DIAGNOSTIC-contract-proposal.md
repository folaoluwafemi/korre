# T02-L01-MATERIAL-DIAGNOSTIC-1 packet proposal

## Purpose

Run 38470988448 on exact source SHA `9977d984ee91dae726baff56d49e23cfe1d5f53d` passed the support AABB-Y preflight, then failed in `setAndReadMaterial(activeWorld, originalShape)` with `Native friction material readback differs from its setter.` The current error names the field but omits the exact setter/readback pair. Capture that pair before choosing any material-specific fix.

## Narrow diagnostic contract

This is a diagnostic-only card. For the first exact material-field inequality, preserve the existing `resourceFailure` result and exact-equality check, and include the field name plus that field's exact setter and native readback values in the error message. Use a round-trip representation that preserves the actual finite JavaScript number; do not round, project, tolerate, clamp, or replace either value. The current `materialValues` validation remains unchanged.

Do not change configured material values, native setters, getter source, combine modes, shapes, support geometry, filters, body construction, physics steps, artifacts, or matrix tuples. Do not treat reported values as approval to change the guard. A later card must review the measured values and the pinned Havok behavior before any comparison or material semantics change.

## Proposed exact worker packet

- ID: `T02-L01-MATERIAL-DIAGNOSTIC-1`
- Parent: `T02`
- Role: worker
- Exact write path: `games/counterball/src/simulation/loftCoarseRunner.ts`
- Dependencies: every explicit dependency on `T02-L01-MATRIX-1`, plus `T02-L01-EXECUTOR-1` and accepted `T02-L01-SUPPORT-F32-1`. Parent T02's original T01 gate remains inherited by the checker.
- Worker: `/root/toolchain_audit`
- Independent packet/source reviewer: `/root/executor_type_review`
- Coordinator retains shared catalogues, tasks/status, commits, CI, and evidence.

The packet accepts only the exact setter/readback disclosure. It does not accept or complete MATRIX-1. Its hosted browser check is expected to retain the same later material failure while exposing the exact mismatch. No matrix case, download, or artifact is expected from this diagnostic card.

## Commands and evidence

Local worker command: `git diff --check -- games/counterball/src/simulation/loftCoarseRunner.ts`. No local install, build, typecheck, lint, test, browser, physics, deploy, or Cloudflare/Wrangler command.

After independent source review, the coordinator runs the packet's exact reviewed SHA on GitHub through Verify and the routed real pinned-WASM Chromium suite. Retain the complete logs, result JSON, failure context/trace, artifact API metadata and hashes. Independent exact-source and exact-run review are required before acceptance.

## Acceptance boundary

Accept only if (1) the exact source diff changes failure disclosure and nothing about the guard or physics; (2) Verify passes on that exact reviewed SHA; (3) real Chromium reproduces the same native field mismatch and records the exact setter/readback pair, with no matrix success artifact; (4) ordinary browser checks and other diagnostic checks have exact counts and no skips/retries/flakes; and (5) independent source and run reviews pass. Any earlier/different error, changed material semantics, skipped gate, missing values, or changed source hash leaves this packet unaccepted. MATRIX-1 and T02 remain open.
