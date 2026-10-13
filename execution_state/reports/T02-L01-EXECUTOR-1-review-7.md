# T02-L01-EXECUTOR-1 independent source review 7

**Verdict: PASS (source repair)**  
**Runtime and exact-head hosted verification: NOT RUN / PENDING**

## Scope

Reviewed the revised `T02-L01-EXECUTOR-1` packet, coordinator repair 2, review 6, `games/counterball/src/simulation/loftCoarseRunner.ts`, `games/counterball/src/viteAssetModules.d.ts`, and the package TypeScript configuration. The exact packet extraction passes document consistency, but the card remains `ready: false` with T01 still required. I did not edit source or shared status and did not run application typecheck, lint, tests, build, browser, physics, or deployment checks.

## Source findings

- **Package-owned asset declarations:** The new declaration file covers only the runner's two query imports: `*HavokPhysics.wasm?url` as a URL string and `*counterball-v1.json?raw` as text. It has no reference to `apps/web/node_modules`, `vite/client`, or a Vite runtime dependency. `games/counterball/tsconfig.json` includes `src`, so it includes this declaration. The root TypeScript configuration also does not import app-owned types. This addresses review 6's package-boundary finding at source/config level; TypeScript resolution is still unverified until hosted `pnpm verify` passes.

- **Asset bytes and identity checks:** The runner still imports the same pinned WASM URL and canonical fixture JSON/raw text. It UTF-8 encodes `fixtureRaw`, checks the fixture-file SHA and config-hash-independent payload SHA, validates both fixture config hashes, fetches the imported WASM URL, and compares the fetched bytes' SHA against `guard.wasmSha256` before initialization (`loftCoarseRunner.ts:1615-1633`). The declaration adds types only; it does not alter the import or hash path.

- **Fail-closed native material checks:** Missing or unsupported combine modes throw `resourceLimit` (`:307-323`). Friction, static friction, and restitution are captured once, required to be numeric and in range, and compared with the accepted combine modes (`:327-364`). The setter writes the guarded values and checks every native readback field for exact equality (`:381-401`).

- **World ownership and cleanup:** `activeWorld` is created once and immediately stored in the outer `world` cleanup reference (`:1005-1012`). Setup and simulation use the narrowed local. Cleanup still removes observers, restores the replaced surface shape, disposes the replacement and world, and combines cleanup errors without losing the primary error (`:1518-1535`).

- **Swept support and contact semantics:** Every dynamic body runs through the hashed sweep limits before a physics call; `margins.apronClearance` and `margins.surfaceClearance` are used for their corresponding swept-envelope extrema (`:1235-1310`). Static support witnesses and button/obstacle clearance are also checked before the call. A present non-finite contact point fails closed; missing points remain null (`:751-756`). `isButtonObstaclePair` uses the declared pair tuple and recognizes either endpoint order (`:759-767`).

- **Call accounting and timing guards:** Case calls are captured at `runCase` entry and checked against the case metadata before return (`:991,1540`). Every call is preceded by the energy, point-sweep, rotation, support, and workload checks; counts advance only after `executeStep` returns (`:1244-1339`). The 30-second case timer starts before setup and remains active while the yielded case is serialized; checks run after the writer resumes (`:1552-1569`). The matrix timer starts at run entry, and `measuredMatrixWallTimeMs` is sampled after `writeLoftCoarseMatrix` completes (`:1609-1612,1644-1654`). The hashed caps are still read from `guard`; no limits are relaxed.

## Limits and separate timing note

This is not a typecheck result. The earlier exact-head run failed before tests/build/runtime, and a new exact-SHA hosted `pnpm verify` remains required. No Havok matrix, browser interaction, physics validity, flick, gameplay, artifact acceptance, or deployment is established here.

The encoded case `wallTimeMs` is measured after world cleanup but before that case is serialized, and the envelope's `wallTimeMs` sums those case values. The outer per-case and matrix stop limits do include serialization, and the compact returned `measuredMatrixWallTimeMs` is measured after the writer completes. As documented in `T02-L01-EXECUTOR-1-time-contract-review-1.md`, the accepted text does not define whether the encoded case/envelope totals should include sink serialization. This repair preserves the existing timers and does not settle that artifact-semantics ambiguity; do not describe the encoded envelope sum as end-to-end matrix elapsed time.
