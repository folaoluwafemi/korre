# T02-L01-GEOMETRY-F32-1 packet review

**Verdict: PASS — ready for bounded implementation.**  
**Runtime: NOT RUN.** This is a packet/contract review, not implementation or matrix acceptance.

## Record and dependencies

The exact extraction command `node scripts/check-completion-plan.mjs --packet T02-L01-GEOMETRY-F32-1` returned `verdict: PASS`, `ready: true`, and named this packet as the sole `initialReady` card. The task's inherited `required_parent_acceptance` remains `T01`, which is ACCEPTED in `execution_state/tasks.json`.

The packet retains every dependency of the failed `T02-L01-MATRIX-1` attempt: `C00-B`, `C01`, `T02-B0`, `T02-C0`, `T02-C2`, `C00`, `T02-L01-GUARD-CONTRACT-1`, `T02-L01-GUARD-SCHEMA-1`, `T02-L01-PACKET-SPLIT-1`, `T02-L01-TRANSPORT-1`, `T02-L01-SUPPORT-PREFLIGHT-1`, and `T02-L01-SUPPORT-F32-1`. It adds `T02-L01-GEOMETRY-READBACK-1`, the accepted predecessor that captures and independently reviews the native dimension failure. The only superseded card is `T02-L01-MATRIX-1`; no parent task or unrelated card is superseded.

## Scope and contract

The only source write paths are `games/counterball/src/simulation/loftCoarseRunner.ts` and `games/counterball/src/simulation/loftCoarseProbe.test.ts`. The runner change is limited to the existing pre-impulse dynamic-cylinder dimension comparison; the test change adds a focused canonical projection assertion. The packet leaves browser UI, E2E transport, workflow, schema, configuration, fixture, world geometry, task state, and shared contract paths read-only.

The accepted amendment at `knowledge_base/execution/completion/CONTRACT_WORK.md:168` matches the packet: for the button and 14 caps, compare each finite native local-AABB dimension exactly to `Math.fround(expected)` (X/Z are twice the configured radius; Y is configured height), with no epsilon or adjacent-value allowance. Keep all existing type, positive/finite bounds, transform, filter, and other guards. Preserve raw extrema in existing failures, raw dimensions in serialized facts, and raw dimensions in downstream calculations. Static colliders retain their existing checks. The amendment and its acceptance report state plainly that only the button was measured in the predecessor run; cap readbacks and a successful matrix are still pending.

The implementation instructions correctly use the already-tested projection helper and prohibit projected-value substitution or broader changes. The accepted full 24-case matrix test is the runtime proof for every cap; the focused unit assertion cannot establish native Havok readbacks.

## Hosted gates and acceptance boundary

The packet names exact GitHub gates: `pnpm verify`, `pnpm test:integration`, the built-preview Chromium suite, and the existing dynamically selected diagnostic Chromium suite. The diagnostic command matches the current CI workflow (`COUNTERBALL_DEV_E2E=1 COUNTERBALL_PREBUILT_PREVIEW=1 pnpm test:e2e $diagnostic_specs --workers=1`), and the checked workflow discovers produced diagnostics, including the existing direct-probe spec. The packet requires the real pinned-WASM browser path, all 24 ordered tuples, a complete validated matrix artifact, independent exact-source and exact-run/artifact reviews, and zero diagnostic skips, retries, or flaky tests. It also requires the matrix to fit the existing 20-minute job; it does not represent that fit as already measured.

The artifact requirement is concrete: retain run/job URLs and logs, host-validate the actual complete download and its tuples, rows, caps, counts, provenance, and SHA-256, and attach only after all assertions pass. Failures remain closed and yield no successful matrix artifact. The acceptance clause limits the result to the L01 matrix successor and explicitly excludes T02, calibration, deployed Havok, and playability.

No contract/source/status scope leak or dependency omission was found. No source edits or application commands were performed; only the exact packet extraction and read-only file inspection were performed.
