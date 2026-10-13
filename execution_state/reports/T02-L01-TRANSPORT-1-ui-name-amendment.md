# Coordinator packet amendment — T02-L01-TRANSPORT-1

**Purpose:** Correct the transport card's accessible-control names to match the accepted diagnostic page, without changing product source or the transport contract.

The original packet referred to one `Run max-size download transport check` button. The accepted implementation does not expose that control. `apps/web/src/CounterballDirectProbe.tsx` exposes `Write transport test file`, a ready status of `The bounded OPFS file is complete and ready to download.`, and then `Download transport file` (the button text is composed from `Download ` and `transport file`). The existing controls already use the accepted OPFS writer, finalizer, file-backed download, and host acknowledgement path.

The packet amendment changes only its output description, E2E step, and review question to use that existing two-step flow. It preserves the exact 504,365,056-byte size, awaited writes capped at 256 KiB, quota check, pre-registered Playwright download wait, host-side streamed count/SHA-256 validation, cleanup on both ends, transport-only scope, and sole source write path `tests/e2e/counterball-direct-probe.spec.ts`. It does not authorize adding or changing UI controls.

An implementation worker stopped before editing after finding this mismatch. No application files were changed. The amendment is pending independent review; the transport packet remains unassigned until that review and a fresh exact packet extraction report `ready:true` with the original T01 acceptance gate.
