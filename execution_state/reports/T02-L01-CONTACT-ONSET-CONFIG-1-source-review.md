# T02-L01-CONTACT-ONSET-CONFIG-1 source review

**Source verdict: PASS. Runtime and canonical-hash assertion: NOT RUN.**

The reviewed changes are limited to the five assigned producer files:

- `packages/game-protocol/src/types.ts`
- `packages/game-protocol/src/schemas.ts`
- `packages/game-protocol/src/config.ts`
- `packages/game-protocol/src/protocol.test.ts`
- `tests/fixtures/counterball-v1.json`

The packet extraction reports plan consistency PASS (127 packets). Its current `ready:false` is not evidence that the implementation or dependencies passed; this review concerns source only. The packet requires accepted contract and parent gates before producer acceptance.

The type, Zod schema, and canonical config agree on schema/config version 5, diagnostic guard schema 3, config schema version 5, algorithm `loft-coarse-probe-v3`, and the exact strict `contactPolicy`:

```json
{
  "eventType": "COLLISION_STARTED",
  "nativeSubscription": "started-only",
  "readback": "all-22-exact",
  "callbackRetention": "all-delivered-including-symmetric"
}
```

The Zod objects remain strict. The protocol test checks the exact policy and rejects missing/null/empty, wrong-literal, and extra-field policy objects. Its legacy rejection cases now include config schema 4, guard schema 2, configSchemaVersion 4, and algorithm v2 while retaining earlier older-version negatives.

The diff changes diagnostic identity/version fields and adds the four policy literals. It does not change gameplay geometry, mass, gravity, fixed step, restart clearance, the D01 diagnostic guard, or calibration: `physicsCalibration` remains `null`; protocol version stays 1. The 24-tuple matrix, energy/sweep/workload limits, material values, and fixture payload digest are unchanged. The fixture diff updates only its eight `configHash` leaves. An independent JSON traversal found exactly 8 such leaves and all 8 equal `6c1d2f0979612dcd0a3c78a51e7cd6cc9f466f0ae3031fb940e48e1687026e90`. The omitted-configHash payload digest remains `6ce26e4203017e446687dfd8ad95106ba582f09420f8c623129c7d1bbe6b625d` in the canonical producer. The submitted data-hash report records the restricted literal-to-JSON computation and old-hash parity; the real `hashCounterballConfig()` assertion still needs hosted verification.

SHA-256 of the five reviewed files:

| File | SHA-256 |
|---|---|
| `packages/game-protocol/src/types.ts` | `4d35dcaef0c386ffa7912bbc71d7971f87875bc595820527a7e7a54cf2ff4a8f` |
| `packages/game-protocol/src/schemas.ts` | `e8a6d2ff8265f9f1ec58a6c96338b2992d22598949a682c03cd0a8b7b4f23dc4` |
| `packages/game-protocol/src/config.ts` | `08a5db357b2da81c86ed2dc964c5ca4ee04223f3e0c227c22c7bfdbcd1c80f9f` |
| `packages/game-protocol/src/protocol.test.ts` | `e1303ff9f703236faad6ef7f5f220d147ce8e2a7ebd609c9dcb8bc8d82c9fb60` |
| `tests/fixtures/counterball-v1.json` | `b0d2987128b2bb486ae27a62255b16e899ebdd6419b9e8d9140351defb31e9a0` |

**Checks performed:** exact packet extraction and plan consistency; source diff inspection; independent fixture JSON traversal and SHA-256 of each assigned file. No application tests, typecheck, lint, formatter, build, browser, or physics checks ran. No runtime, native collision delivery, or matrix acceptance is claimed. The exact-host GitHub run must prove the canonical hash assertion and required producer checks.
