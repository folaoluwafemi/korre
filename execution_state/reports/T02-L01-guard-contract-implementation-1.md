# T02-L01 guard contract implementation 1

Date: 2026-10-11
Packet: `T02-L01-GUARD-CONTRACT-1` under T02.
Status: implemented; independent source review pending. The card is not yet ACCEPTED.

## Scope and source

The exact packet was extracted with `node scripts/check-completion-plan.mjs --packet T02-L01-GUARD-CONTRACT-1`. At materialization, its eleven listed prerequisites, including required parent T01, were ACCEPTED. The coordinator changed only the assigned canonical document paths:

- `knowledge_base/execution/CONTRACTS.md`
- `knowledge_base/execution/completion/CONTRACT_WORK.md`

The contract text carries forward the independently reviewed proposal 4 guard inventory, fixture digest method, complete 24-tuple setup, open apron and unchanged seven static bodies, native body/material preflight, shifted-energy ceiling, swept support/clearance, workload, exact encoded-byte ceilings, settling, eligibility, and fail-closed behavior. It adds a separate `restartLoftDiagnosticGuard`; the accepted direct-shot diagnostic guard remains unchanged, the protocol remains version 1, and `physicsCalibration` remains null. Config/schema version 3 is a later schema-card change, not implemented here.

The source review 4 finding about host-file operations is recorded as an explicit operational contract. The browser page must show only a compact summary and offer a complete artifact download after success. Playwright saves to a temporary file under `test-results/`, streams byte/hash and matrix validation, atomically renames after every assertion, and attaches only the validated final path. It must not render the full matrix or return it in one page-evaluation/IPC result. A failed or partial run leaves no successful artifact.

All matrix constants remain provisional diagnostic inputs. This document change authorizes no source implementation, schema change, physics trial, application build/test, browser run, deployment, playable-physics claim, or T02 acceptance.

## Checks actually run

- `node scripts/check-completion-plan.mjs --write-index` — PASS; 88 catalogued packets, 21 remaining parents, and only `T02-L01-GUARD-CONTRACT-1` initially ready. This is plan consistency only.
- `node scripts/check-completion-plan.mjs --packet T02-L01-GUARD-CONTRACT-1` — PASS; exact record ready and required parent T01 reported.
- `git diff --check -- knowledge_base/execution/CONTRACTS.md knowledge_base/execution/completion/CONTRACT_WORK.md` — PASS; no whitespace errors. Git printed only its normal line-ending conversion notice.
- Full app verification/build/tests, browser automation, Havok/physics trials, Cloudflare/Wrangler, Railway, and deployment — NOT RUN.

## Exact-head context and hashes

The working diff is based on HEAD `88c8302c8ce4b0d0217de33419efcb8145c11188`; the document changes are uncommitted. SHA-256 after implementation:

- `CONTRACTS.md`: `F7AC0DCFF4E264E68F3E0599010E4750A7FFCA79B797376BE01866857861EA59`
- `CONTRACT_WORK.md`: `4F1DDEE1D19E518E1B0403046AE7CD071A16AA7A683E575CD96351927AB3FBFC`

The browser-matrix download/storage capacity and 720-second deadline remain unmeasured and are not claimed to fit. Current source inspection found the CI job timeout is 20 minutes and the shared Playwright timeout is 60 seconds; the matrix source packet must explicitly raise the test timeout and verify that matrix execution, download validation and existing job steps fit the exact hosted deadline. It must stop for a separately reviewed workflow amendment if they do not. This source inspection is not a runtime check.

Next: independent exact-source review at `T02-L01-guard-contract-implementation-review-1.md`. Schema and matrix source work stay blocked until this card is accepted.
