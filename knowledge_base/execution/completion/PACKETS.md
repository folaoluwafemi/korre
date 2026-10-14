# Packet index

Generated from the three JSON catalogues. This is a plan, not a status ledger. Original parent gates are added automatically. Only ACCEPTED dependencies unblock work; supersedes closes a failed card and orders write ownership but is not an acceptance gate. Coordinator-role cards have one exclusive writer even when listed dependencies do not order shared files.

113 bounded cards cover 21 remaining parents. Initially ready: T02-L01-GEOMETRY-READBACK-1.

| ID | Parent | Outcome | Writer | Explicit prerequisites | Exact paths |
|---|---|---|---|---|---|
| C00-A | T02 | Freeze portable cancellation and typed abort semantics | coordinator | parent:T01 | 5 |
| C00-B | T02 | Freeze nullable calibration schema and open-pavement policy | coordinator | C00-A | 5 |
| C01-P | T02 | Prepare package exports and browser/Worker type boundaries | coordinator | C01 | 5 |
| C01-H | T02 | Separate diagnostic, identity, production and online browser harnesses | coordinator | C01-P | 5 |
| C04-QA | T21 | Prepare and run automated release checks before the physical-device gate | coordinator | parent:T17, parent:T18, parent:T19, parent:T20, C01-H | 4 |
| C00 | T02 | Accept contract preparation before producer work | coordinator | C00-B | 0 |
| C01 | T02 | Wire hosted future tests and preserve evidence remotely | coordinator | C00, C01-DIAG-BUILD | 5 |
| C01-DIAG-BUILD | T02 | Build and hash a separate diagnostic renderer artifact | coordinator | C01-DIAG-PANEL, C00, parent:T03 | 4 |
| C02 | T02 | Publish only evidence-supported calibration and support settings | coordinator | T02-L02, T02-D01, C01-H | 5 |
| C03 | T02 | Accept canonical calibration handoff for real runner | coordinator | C02 | 0 |
| COMPLETION-GRAPH-REPAIR-2 | T02 | Synchronize the accepted fact-repair graph and close its stale failed card | coordinator | T02-F01-ROTATION-1, T02-F01-ROTATION-1-FORMAT-REPAIR-2 | 3 |
| T02-GC01 | T02 | Freeze a hashed diagnostic-only direct-shot guard | coordinator | C00, T02-D01, T02-GA01 | 3 |
| T02-GC02 | T02 | Add the hashed diagnostic guard to protocol config | coordinator | C00, T02-GC01, T02-D01, T02-GA01 | 5 |
| T02-L01-GUARD-CONTRACT-1 | T02 | Freeze the strict diagnostic restart-loft guard and matrix contract | coordinator | parent:T01, C00, C00-B, C01, T02-B0, T02-C0, T02-C2, T02-D01, T02-GC01, T02-GC02, T02-BR02-OBSERVED-MASS-PROJECTION-1 | 2 |
| T02-L01-GUARD-PACKET-1 | T02 | Add the strict L01 schema card and append its prerequisites without changing original dependencies | coordinator | T02-L01-GUARD-CONTRACT-1 | 4 |
| T02-L01-GUARD-SCHEMA-1 | T02 | Implement the strict hashed L01 diagnostic guard in the protocol config | coordinator | parent:T01, C00, C00-B, C01, T02-B0, T02-C0, T02-C2, T02-D01, T02-GC01, T02-GC02, T02-BR02-OBSERVED-MASS-PROJECTION-1, T02-L01-GUARD-CONTRACT-1, T02-L01-GUARD-PACKET-1 | 5 |
| T02-L01-PACKET-SPLIT-1 | T02 | Split L01 into disjoint core, browser, transport, and matrix packets | coordinator | C00-B, C01, T02-B0, T02-C0, T02-C2, C00, T02-L01-GUARD-CONTRACT-1, T02-L01-GUARD-SCHEMA-1 | 5 |
| T02-L01-CONTACT-CONTRACT-1 | T02 | Freeze the additive L01 contact participant contract | coordinator | T02-L01-ARTIFACT-1 | 5 |
| T02-L01 | T02 | Integrate and accept the bounded restart-loft diagnostic | coordinator | C00-B, C01, T02-B0, T02-C0, T02-C2, C00, T02-L01-GUARD-CONTRACT-1, T02-L01-GUARD-SCHEMA-1, T02-L01-PACKET-SPLIT-1, T02-L01-ARTIFACT-1, T02-L01-EXECUTOR-1, T02-L01-BROWSER-1-SUCCESSOR-3, T02-L01-TRANSPORT-1, T02-L01-MATRIX-1 | 3 |
| T02-L01-CONTACT-STATUS-1 | T02 | Reconcile contact contract and runner execution state | coordinator | T02-L01-CONTACT-CONTRACT-1 | 3 |
| T02-L01-BROWSER-1-TSC-DIAG-1 | T02 | Capture remote TypeScript asset declaration resolution evidence | coordinator | None | 1 |
| T02-L01-BROWSER-1-WEB-TSC-DIAG-1 | T02 | Trace the consuming web TypeScript project for Counterball asset declarations | coordinator | T02-L01-BROWSER-1-TSC-DIAG-1 | 1 |
| T02-L01-BROWSER-1-ROOT-TSC-DIAG-1 | T02 | Trace the root test and web-server TypeScript projects for Counterball asset declarations | coordinator | T02-L01-BROWSER-1-WEB-TSC-DIAG-1 | 1 |
| T02-L01-BROWSER-1-TESTS-ASSET-TYPES-FIX-1 | T02 | Include Counterball asset-query declarations in the root test TypeScript project | coordinator | T02-L01-BROWSER-1-ROOT-TSC-DIAG-1 | 1 |
| T02-L01-BROWSER-1-SUCCESSOR-1 | T02 | Repair diagnosed type and lint failures, then prove the first browser flick | worker | C00-B, C01, T02-B0, T02-C0, T02-C2, C00, T02-L01-GUARD-CONTRACT-1, T02-L01-GUARD-SCHEMA-1, T02-L01-PACKET-SPLIT-1, T02-L01-EXECUTOR-1, T02-BR02-FORMAT-REPAIR-1, T02-L01-BROWSER-1-TESTS-ASSET-TYPES-FIX-1 | 1 |
| T02-L01-BROWSER-1-SUCCESSOR-1-RUN-REVIEW-1 | T02 | Independently verify the first browser-flick successor failure evidence | coordinator | T02-BR02-FORMAT-REPAIR-1, T02-L01-BROWSER-1-TESTS-ASSET-TYPES-FIX-1 | 0 |
| T02-L01-BROWSER-1-SUCCESSOR-2 | T02 | Use the nested cleanup error as AggregateError cause and prove first browser flick | worker | C00-B, C01, T02-B0, T02-C0, T02-C2, C00, T02-L01-GUARD-CONTRACT-1, T02-L01-GUARD-SCHEMA-1, T02-L01-PACKET-SPLIT-1, T02-L01-EXECUTOR-1, T02-BR02-FORMAT-REPAIR-1, T02-L01-BROWSER-1-TESTS-ASSET-TYPES-FIX-1, T02-L01-BROWSER-1-SUCCESSOR-1-RUN-REVIEW-1 | 1 |
| T02-L01-BROWSER-1-SUCCESSOR-3 | T02 | Apply the exact hosted format patch and prove the first browser flick | worker | C00-B, C01, T02-B0, T02-C0, T02-C2, C00, T02-L01-GUARD-CONTRACT-1, T02-L01-GUARD-SCHEMA-1, T02-L01-PACKET-SPLIT-1, T02-L01-EXECUTOR-1, T02-BR02-FORMAT-REPAIR-1, T02-L01-BROWSER-1-TESTS-ASSET-TYPES-FIX-1, T02-L01-BROWSER-1-SUCCESSOR-1-RUN-REVIEW-1 | 1 |
| T02-D01 | T02 | Measure direct-shot impulse response on the canonical fixture | worker | C00-B, C01, T02-B0, T02-A, C00 | 1 |
| T02-F01 | T02 | Implement pure simulation facts from physics-step observations | worker | T02-C0, T02-C2, C00-A, C00 | 2 |
| T02-F01-ROTATION-1 | T02 | Replace endpoint-axis travel with a conservative rotational support bound | worker | T02-F01-math-escalation-1, T02-C0, T02-C2, C00-A, C00 | 2 |
| T02-L02 | T02 | Run one bounded local refinement or record no eligible restart | worker | T02-L01 | 1 |
| T02-P01 | T02 | Provide stable scene pose update and entity picking API | worker | parent:T03, C00, C01-H | 4 |
| T02-BR01 | T02 | Expose a bounded browser-WASM direct-shot diagnostic | worker | T02-D01, T02-P01, C01, C01-H | 3 |
| T02-BR02 | T02 | Show the first real direct shot in the diagnostic browser | coordinator | T02-BR01, T02-D01, T02-P01, parent:T03, C01, C01-H, T02-BR02-FORMAT-REPAIR-1 | 0 |
| T02-BR02-CI-ESCALATION-1 | T02 | Classify exact-head BR02 formatting failure before another source edit | coordinator | T02-BR01, T02-D01, T02-P01, parent:T03, C01, C01-H | 0 |
| T02-BR02-FORMAT-REPAIR-1 | T02 | Apply only the exact hosted BR02 formatting artifact | worker | T02-BR01, T02-D01, T02-P01, parent:T03, C01, C01-H, T02-BR02-CI-ESCALATION-1 | 2 |
| T02-R01 | T02 | Implement isolated asynchronous runner and host entrypoints | worker | T02-F01, T02-W01, T02-C0, T02-C2, C00-A, C00-B, C03, C00 | 3 |
| T02-R02 | T02 | Prove direct shot movement in pinned Havok WASM | worker | T02-R01, T02-D01, C03 | 1 |
| T02-R03 | T02 | Prove placed restart pose and physical traversal | worker | T02-R02, T02-L02, C02, C03 | 1 |
| T02-R04 | T02 | Prove timeout, cancellation, limits and isolated cleanup | worker | T02-R01, C00-A, C00 | 1 |
| T02-R05 | T02 | Prove a direct shot in the browser with real Havok WASM | coordinator | T02-R02, T02-P01, T02-E01, parent:T03, C01, C01-H, T02-BR02 | 3 |
| T02-R07 | T02 | Prove placed-restart traversal in Chromium after physics proof | coordinator | T02-R03, T02-R05, T02-P01, T02-E01, parent:T03, C01, C01-H | 2 |
| T02-R06 | T02 | Prove crossing bounds, tunneling resistance and repeated-world cleanup | worker | T02-R02, T02-R03, T02-R04, T02-W01, T02-P01 | 1 |
| T02-W01 | T02 | Apply measured material, damping and apron config to Physics V2 | worker | C03, T02-A | 2 |
| T05-F01 | T05 | Build deterministic flick and camera input state machines | worker | T02-P01, parent:T02, parent:T03, C00-A, C01-H | 4 |
| T05-F02 | T05 | Deliver first real local flick in a compiled-out dev harness | coordinator | T05-F01, T02-P01, parent:T02, parent:T03, C01, C01-H | 4 |
| T06-R01 | T06 | Implement pure referee resolution and match transition | worker | parent:T01, parent:T02, C00-A | 4 |
| T07-F01 | T07 | Define deterministic seven-cap formation presets | worker | parent:T01, parent:T06 | 2 |
| T07-R02 | T07 | Implement bounded legal restart placement solver | worker | T07-F01, parent:T01, parent:T06, parent:T02, C00 | 2 |
| T08-R01 | T08 | Build accessible placed-restart controls and local HUD | worker | parent:T05, parent:T07, T07-F01, T07-R02, C01-H | 4 |
| T09-R01 | T09 | Integrate local checkpoint, simulation, resolution and playback controller | worker | parent:T06, parent:T08, parent:T02, parent:T05, C01-H | 4 |
| T09-R02 | T09 | Prove complete first-to-three local match and rematch in the browser | worker | T09-R01, T08-R01, parent:T02, parent:T03, C01-H | 1 |
| T10-A01 | T10 | Adapt local AI and match controller to the existing GameTransport | worker | T10-R01, T10-R02, parent:T09, C00, C01-H | 2 |
| T10-R01 | T10 | Implement bounded legal AI candidates and deterministic scoring | worker | parent:T09, parent:T02, parent:T07 | 4 |
| T10-R02 | T10 | Evaluate at most eight AI shots off the input-critical path | worker | T10-R01, parent:T02, C00-A, C01-H | 5 |
| T10-R03 | T10 | Expose AI only behind the mandatory username identity gate | coordinator | T10-R02, T10-A01, parent:T12 | 3 |
| T21-D01 | T21 | Measure real-phone support on Android Chrome and iOS Safari | coordinator | T21-P01, T21-P02, parent:T09, parent:T10, parent:T15 | 0 |
| T21-O01 | T21 | Bind online camera presentation to authoritative shared playback | worker | T21-P02, parent:T15, C01-H, O19 | 4 |
| T21-P01 | T21 | Add persisted audio and accessibility preferences | worker | parent:T09, parent:T10, parent:T15, C01-H | 5 |
| T21-P02 | T21 | Polish local scene materials and skippable camera presentation | worker | T21-P01, parent:T09, parent:T10, parent:T03, parent:T15, C01-H | 5 |
| T02-E01 | T02 | Export the real WASM browser runner factory | worker | T02-R01, C00, C03, C01-H, T02-P01, T02-BR01 | 1 |
| T02-F01-ROTATION-1-FORMAT-ESCALATION-1 | T02 | Classify the hosted formatting failure before any source retry | coordinator | parent:T01, T02-F01-math-escalation-1, T02-C0, T02-C2, C00-A, C00 | 0 |
| T02-F01-ROTATION-1-FORMAT-REPAIR-1 | T02 | Apply only the independently approved F01 formatting artifact | worker | parent:T01, T02-F01-math-escalation-1, T02-C0, T02-C2, C00-A, C00, T02-F01-ROTATION-1-FORMAT-ESCALATION-1, T02-F01-ROTATION-1 | 2 |
| T02-F01-ROTATION-1-CI-FAIL-ESCALATION-1 | T02 | Classify seven exact-head fact failures before another source edit | coordinator | parent:T01, T02-F01-math-escalation-1, T02-C0, T02-C2, C00-A, C00, T02-F01-ROTATION-1-FORMAT-ESCALATION-1 | 0 |
| T02-F01-ROTATION-1-SEMANTIC-REPAIR-2 | T02 | Repair seven exact-head simulation fact failures without weakening the crossing proof | worker | parent:T01, T02-F01-math-escalation-1, T02-C0, T02-C2, C00-A, C00, T02-F01-ROTATION-1-FORMAT-ESCALATION-1, T02-F01-ROTATION-1-CI-FAIL-ESCALATION-1, T02-F01-ROTATION-1 | 2 |
| T02-F01-ROTATION-1-CI-FAIL-ESCALATION-2 | T02 | Classify exact-head formatting failure before another source edit | coordinator | parent:T01, T02-F01-math-escalation-1, T02-C0, T02-C2, C00-A, C00, T02-F01-ROTATION-1-FORMAT-ESCALATION-1, T02-F01-ROTATION-1-CI-FAIL-ESCALATION-1 | 0 |
| T02-F01-ROTATION-1-FORMAT-REPAIR-2 | T02 | Apply only the exact hosted formatting patch to facts.ts | worker | parent:T01, T02-F01-math-escalation-1, T02-C0, T02-C2, C00-A, C00, T02-F01-ROTATION-1-FORMAT-ESCALATION-1, T02-F01-ROTATION-1-CI-FAIL-ESCALATION-1, T02-F01-ROTATION-1-CI-FAIL-ESCALATION-2 | 1 |
| C01-DIAG-PANEL | T02 | Add an explicit non-playable renderer diagnostic panel | worker | parent:T03, C00 | 3 |
| T02-BR02-MASS-READBACK-1 | T02 | Capture the exact pinned-browser native button-mass readback | worker | T02-BR01, T02-D01, T02-P01, T02-GC02, C01, C01-H, T02-BR02-CI-ESCALATION-1, T02-BR02-PINNED-MASS-API-AUDIT-1, parent:T03 | 2 |
| T02-BR02-OBSERVED-MASS-PROJECTION-1 | T02 | Use the observed native mass representation without weakening the guard | worker | T02-BR02-MASS-READBACK-1, T02-BR02-FORMAT-REPAIR-1 | 3 |
| T02-L01-ARTIFACT-1 | T02 | Define pure L01 matrix types, guards, and bounded JSON encoding | worker | C00-B, C01, T02-B0, T02-C0, T02-C2, C00, T02-L01-GUARD-CONTRACT-1, T02-L01-GUARD-SCHEMA-1, T02-L01-PACKET-SPLIT-1 | 2 |
| T02-L01-CONTACT-SCHEMA-1 | T02 | Represent dynamic and static L01 contact participants | worker | T02-L01-CONTACT-CONTRACT-1, T02-L01-CONTACT-STATUS-1, C00-B, C01, T02-B0, T02-C0, T02-C2, C00, T02-L01-GUARD-CONTRACT-1, T02-L01-GUARD-SCHEMA-1, T02-L01-PACKET-SPLIT-1, T02-L01-ARTIFACT-1 | 2 |
| T02-L01-EXECUTOR-1 | T02 | Run L01 cases with the real page Havok engine | worker | C00-B, C01, T02-B0, T02-C0, T02-C2, C00, T02-L01-GUARD-CONTRACT-1, T02-L01-GUARD-SCHEMA-1, T02-L01-PACKET-SPLIT-1, T02-L01-ARTIFACT-1, T02-L01-CONTACT-SCHEMA-1 | 2 |
| T02-L01-BROWSER-1 | T02 | Add the development-only L01 page action and file-backed download | worker | C00-B, C01, T02-B0, T02-C0, T02-C2, C00, T02-L01-GUARD-CONTRACT-1, T02-L01-GUARD-SCHEMA-1, T02-L01-PACKET-SPLIT-1, T02-L01-EXECUTOR-1 | 3 |
| T02-L01-TRANSPORT-HARNESS-1 | T02 | Expose test-only transport controls in the diagnostic build | worker | C00-B, C01, T02-B0, T02-C0, T02-C2, C00, T02-L01-GUARD-CONTRACT-1, T02-L01-GUARD-SCHEMA-1, T02-L01-PACKET-SPLIT-1, T02-L01-BROWSER-1-SUCCESSOR-3 | 3 |
| T02-L01-TRANSPORT-1 | T02 | Prove maximum-size browser-to-host transfer in Chromium | worker | C00-B, C01, T02-B0, T02-C0, T02-C2, C00, T02-L01-GUARD-CONTRACT-1, T02-L01-GUARD-SCHEMA-1, T02-L01-PACKET-SPLIT-1, T02-L01-BROWSER-1-SUCCESSOR-3, T02-L01-TRANSPORT-HARNESS-1 | 1 |
| T02-L01-MATRIX-1 | T02 | Run and retain the complete 24-case browser Havok matrix | worker | C00-B, C01, T02-B0, T02-C0, T02-C2, C00, T02-L01-GUARD-CONTRACT-1, T02-L01-GUARD-SCHEMA-1, T02-L01-PACKET-SPLIT-1, T02-L01-TRANSPORT-1, T02-L01-SUPPORT-PREFLIGHT-1, T02-L01-SUPPORT-F32-1 | 1 |
| T02-L01-SUPPORT-PREFLIGHT-1 | T02 | Expose exact canonical support-slab preflight readbacks | worker | T02-L01-EXECUTOR-1, T02-L01-GUARD-CONTRACT-1, T02-L01-GUARD-SCHEMA-1, T02-L01-PACKET-SPLIT-1, T02-L01-TRANSPORT-1 | 1 |
| T02-L01-SUPPORT-F32-1 | T02 | Compare native support thickness by exact float32 projection | worker | T02-L01-EXECUTOR-1, T02-L01-GUARD-CONTRACT-1, T02-L01-GUARD-SCHEMA-1, T02-L01-PACKET-SPLIT-1, T02-L01-TRANSPORT-1, T02-L01-SUPPORT-PREFLIGHT-1 | 3 |
| T02-L01-MATERIAL-DIAGNOSTIC-1 | T02 | Expose exact native material setter/readback mismatch values | worker | C00-B, C01, T02-B0, T02-C0, T02-C2, C00, T02-L01-EXECUTOR-1, T02-L01-GUARD-CONTRACT-1, T02-L01-GUARD-SCHEMA-1, T02-L01-PACKET-SPLIT-1, T02-L01-TRANSPORT-1, T02-L01-SUPPORT-PREFLIGHT-1, T02-L01-SUPPORT-F32-1 | 1 |
| T02-L01-MATERIAL-F32-1 | T02 | Apply exact native float32 material semantics through preflight and artifact validation | worker | C00-B, C01, T02-B0, T02-C0, T02-C2, C00, T02-L01-EXECUTOR-1, T02-L01-GUARD-CONTRACT-1, T02-L01-GUARD-SCHEMA-1, T02-L01-PACKET-SPLIT-1, T02-L01-TRANSPORT-1, T02-L01-SUPPORT-PREFLIGHT-1, T02-L01-SUPPORT-F32-1, T02-L01-MATERIAL-DIAGNOSTIC-1 | 3 |
| T02-L01-GEOMETRY-READBACK-1 | T02 | Expose native button bounds on strict dimension preflight failure | worker | C00-B, C01, T02-B0, T02-C0, T02-C2, C00, T02-L01-EXECUTOR-1, T02-L01-GUARD-CONTRACT-1, T02-L01-GUARD-SCHEMA-1, T02-L01-PACKET-SPLIT-1, T02-L01-TRANSPORT-1, T02-L01-SUPPORT-PREFLIGHT-1, T02-L01-SUPPORT-F32-1, T02-L01-MATERIAL-DIAGNOSTIC-1 | 1 |
| O01 | T04 | Freeze missing online service and queue boundaries after C00 | coordinator | C00, C01, parent:T01 | 4 |
| O02 | T04 | Build restricted real-WASM smoke Durable Object | coordinator | C00, O01, parent:T02, C01 | 5 |
| O03 | T04 | Prove deployed staging WASM before online authority | coordinator | O02, C01 | 4 |
| O04 | T12 | Same-origin development bridge and identity client | coordinator | C00, parent:T11, parent:T05, C01, C01-H | 5 |
| O05 | T12 | Accessible username and recovery views | worker | C00, O04, C01 | 5 |
| O06 | T12 | Wire mandatory identity gate without blocking static preview | coordinator | O05, parent:T05, C01, C01-H | 3 |
| O07 | T13 | Add single-use room-bound socket ticket persistence | coordinator | C00, parent:T11, C01 | 3 |
| O08 | T13 | Wire ticket issuance and private consumption API | coordinator | O07, O06, C01 | 4 |
| O09 | T13 | Trusted edge/BFF routes and staging API composition | coordinator | C00, O03, O06, O08, C01 | 5 |
| O10 | T13 | SQLite room schema and bounded snapshots | worker | C00, O01, O09, C01 | 4 |
| O11 | T13 | Authenticated membership and hibernating socket upgrade | coordinator | O08, O10, C01 | 5 |
| O12 | T14 | Durable reservation and idempotent action journal | worker | C00, O11, parent:T06, parent:T07, C01 | 4 |
| O13 | T14 | Integrate canonical runner/resolver and committed replay | coordinator | O12, O03, parent:T02, parent:T06, parent:T07, C01 | 5 |
| O14 | T15 | Shared authority transport, clock and playback assembly | worker | C00, O13, parent:T09, C01 | 4 |
| O15 | T16 | One durable alarm for playback, recovery and presence | worker | O13, O14, C01 | 4 |
| O16 | T16 | Integrate hibernation/revocation and online shell | coordinator | O15, O14, O06, C01 | 5 |
| O17 | T16 | Idempotent service-only final result ingestion | coordinator | C00, parent:T11, O13, C01 | 4 |
| O18 | T16 | Durable result outbox and retention | worker | O17, O15, C01 | 4 |
| O19 | T17 | Two authenticated clients complete real online gate | coordinator | O03, O16, O18, parent:T10, O06, C01, C01-H | 5 |
| O20 | T18 | Spectators, private queue and consented rematches | worker | O19, C00, C01 | 4 |
| O21 | T18 | Private room watch/queue/rematch interface | worker | O20, O16, C01 | 4 |
| O22 | T19 | Host-bound invitation capabilities and revocation | worker | O20, C00, C01 | 3 |
| O23 | T19 | Normalized username lookup and authenticated inbox index | coordinator | O22, parent:T11, C01 | 4 |
| O24 | T19 | Share-link and username-invite browser flow | worker | O23, O21, O06, C01 | 4 |
| O25 | T20 | Crash-safe compatible casual matchmaking | coordinator | C00, O19, O20, C01 | 5 |
| O26 | T20 | Gated casual queue browser experience | worker | O25, O24, C01 | 4 |
| O27 | T22 | Independent security/reliability regression matrix | coordinator | O24, O26, O19, parent:T21, C01, C04-QA | 1 |
| O28 | T22 | Consume accepted real-device evidence and check changed-build impact | coordinator | O27, parent:T21, T21-D01, C01 | 1 |
| O29 | T23 | Staging operational rollout and reversible handoff | coordinator | O27, O28, C01 | 5 |
| O30 | T24 | Concrete user playtest and publication approval checkpoint | coordinator | O29, C01 | 2 |

To read one exact card: `node scripts/check-completion-plan.mjs --packet <ID>`. To revalidate or regenerate this index: `node scripts/check-completion-plan.mjs --write-index`. Both commands perform documentation work only. Runtime state remains execution_state/tasks.json.
