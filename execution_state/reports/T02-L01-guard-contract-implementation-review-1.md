# T02-L01 guard contract implementation 1 review

**Verdict: CHANGES_REQUIRED.** This is a read-only document/source review. Runtime, physics, browser, build, unit, app and Havok checks were **NOT RUN**.

## Checks and material reviewed

- Ran `node scripts/check-completion-plan.mjs --packet T02-L01-GUARD-CONTRACT-1`: plan consistency **PASS**. The exact card has the two assigned document write paths and 11 listed dependencies. The checker reports `ready: false` and explicitly says it ran no implementation/runtime check; the implementation report says independent review is still pending.
- Read the exact coordinator packet, `execution_state/reports/T02-L01-guard-contract-implementation-1.md`, proposal 4 and its independent review, and the assigned sections of `knowledge_base/execution/CONTRACTS.md` and `knowledge_base/execution/completion/CONTRACT_WORK.md`.
- Inspected the current diff for the two assigned documents and existing Playwright attachment calls in `tests/e2e/counterball-direct-probe.spec.ts`.

## Review result

The contract content otherwise matches proposal 4 on source inspection:

- The separate `restartLoftDiagnosticGuard` preserves the accepted `browser-direct-impulse-v1` guard, protocol wire version 1, schema-v2 source behavior and `physicsCalibration: null`. `CONTRACTS.md:367` explicitly defers the outer config/schema v3 change to the later, separately reviewed schema implementation.
- The strict identity inventory, canonical config-hash-independent fixture digest, WASM digest and fixture-byte provenance procedure are present in `CONTRACT_WORK.md:124-150` and match proposal 4. The document requires rejecting mismatch before construction/impulse.
- The 24 tuples and nested axis order, canonical 15-body setup, `home-0`/`home-1`/button identities, derived pose, open support slab with six unchanged goal-frame colliders, and exact zero-velocity state are specified at `CONTRACT_WORK.md:140-162`.
- Native readback and mass projection, 22-shape material exact readback, raw native-property use, shifted energy ceiling 34, per-body drop, full-collider swept checks, 48-call ceiling and fail-closed behavior match at `CONTRACT_WORK.md:160-174`.
- Workload/cancellation limits, per-tick body/contact/sweep evidence, complete case metadata, inclusive byte maxima with `>` rejection, eligibility and abort rules are set at `CONTRACT_WORK.md:178-186`. The numeric arithmetic is consistent with proposal 4 and its review.
- The browser-to-host procedure is materially specified at `CONTRACT_WORK.md:188-192`: bounded page summary, no full matrix in DOM or one page IPC value, browser download, Playwright temporary output path, streaming byte/hash/incremental matrix validation, atomic rename, final-path attachment, and cleanup on failure. `CONTRACTS.md:371` repeats the no-DOM/no-single-IPC constraint and artifact gate. The implementation report claims no runtime or physics result and records the job-capacity uncertainty as unmeasured.

## Required correction

`knowledge_base/execution/completion/CONTRACT_WORK.md:192` specifies attaching the final file with `testInfo.attach({ path })`. That omits the required attachment `name` argument. The pinned declaration for Playwright 1.64.0 is `attach(name: string, options?: { body?: string | Buffer; contentType?: string; path?: string }): Promise<void>` at `node_modules/.pnpm/playwright@1.64.0/node_modules/playwright/types/test.d.ts:2382-2402`; current repository calls also use `testInfo.attach(name, options)` at `tests/e2e/counterball-direct-probe.spec.ts:120,130,164,206,252,276`. Update the normative example to include a stable attachment name and options object, for example `testInfo.attach("counterball-l01-matrix.json", { path: finalPath })`. The generic statement at `CONTRACTS.md:371` is compatible; the concrete invalid call in the canonical procedure must be corrected before acceptance.

No runtime behavior is established by this review. Once the attachment call is corrected, re-review the changed contract line; the remaining reviewed semantics have no source/document blocker found here.
