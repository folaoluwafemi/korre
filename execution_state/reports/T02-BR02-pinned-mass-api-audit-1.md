# T02-BR02 pinned mass API audit 1

## Finding

The exact installed Babylon.js 9.30.0 path requests the configured `0.15` mass, then reads mass back from the Havok native body. The API uses JavaScript `number`, but neither Babylon's nor Havok's public types/docs promise a bit-exact native round trip. Therefore the current very narrow guard's readback equality is an implementation assumption, not a documented guarantee. The package source does not establish that Havok rounds mass to float32; no such claim is made here.

The failed browser run from the prior diagnosis proves only that the returned button mass differs from `0.15` by more than the guard tolerance. It does not report the returned value, expected value, setter result, or discrepancy source. Thus the pinned source alone cannot determine whether the mismatch comes from native numeric representation, a rejected setter, or another Havok behavior.

## Exact pinned source examined

The checked-in `pnpm-lock.yaml` pins `@babylonjs/core@9.30.0` and `@babylonjs/havok@1.3.14` with package integrity entries at lines 180-184. The matching package copies are present in `node_modules/.pnpm/`; their package manifests report those exact versions.

The package artifacts and relevant source files are:

- Babylon npm package [`@babylonjs/core` 9.30.0](https://www.npmjs.com/package/@babylonjs/core/v/9.30.0), installed source `node_modules/.pnpm/@babylonjs+core@9.30.0/node_modules/@babylonjs/core/Physics/v2/Plugins/havokPlugin.js`.
- Havok npm package [`@babylonjs/havok` 1.3.14](https://www.npmjs.com/package/@babylonjs/havok/v/1.3.14), installed declaration `node_modules/.pnpm/@babylonjs+havok@1.3.14/node_modules/@babylonjs/havok/HavokPhysics.d.ts`.

The exact package tarballs are `https://registry.npmjs.org/@babylonjs/core/-/core-9.30.0.tgz` and `https://registry.npmjs.org/@babylonjs/havok/-/havok-1.3.14.tgz`. The exact local package files and lockfile pins were inspected; no package was installed or fetched during this audit.

## Read/write path

- `packages/game-protocol/src/config.ts:27-31` sets `bodies.buttonMass` to the JavaScript number literal `0.15`.
- `games/counterball/src/simulation/worldFactory.ts:202-207` assigns the shape, then calls `body.setMassProperties({ mass })`; the dynamic-body path does the same at `:303-312`.
- Babylon's `PhysicsBody.setMassProperties` delegates to its plugin (`.../Physics/v2/physicsBody.js:249-250`); the public declarations say the setter returns `void` and the getter returns `PhysicsMassProperties` (`physicsBody.d.ts:187-198`).
- Babylon Havok plugin `havokPlugin.js:1007-1024` computes properties from the shape, overwrites the tuple's mass slot with `massProps.mass`, and calls `HP_Body_SetMassProperties`. It does not inspect that call's returned result.
- Its getter at `havokPlugin.js:1133-1137` calls `HP_Body_GetMassProperties`, takes tuple element `[1]` (the mass-properties tuple, discarding the result code), and returns `_fromMassPropertiesTuple`. That conversion assigns `mass: massPropsTuple[1]` directly (`:999-1005`); it neither substitutes the cached user value nor rounds the value in JavaScript.
- The Havok declaration defines the mass slot as `number` (`HavokPhysics.d.ts:110-115`), and declares setter/getter result tuples at `:334-337`. It does not document scalar storage precision or an exact round-trip promise. Babylon's `PhysicsMassProperties.mass` is also a `number` (`IPhysicsEnginePlugin.d.ts:286-304`), without an exactness guarantee.
- The browser runner's strict comparison is at `games/counterball/src/simulation/browserDirectProbe.ts:800-808`: `abs(nativeMass - expectedMass) <= Number.EPSILON * max(1, expectedMass) * 64`. For `expectedMass = 0.15`, the permitted absolute difference is `1.4210854715202004e-14`.

A JavaScript `0.15` literal is a finite `number`; its decimal spelling alone does not imply that a no-conversion setter/getter would differ, because both ends could preserve the same JavaScript numeric value. The package types do not establish whether the Havok native ABI preserves that value exactly. Conversely, the observed guard error means this runtime readback exceeded the stated tolerance; absent logged values, it does not reveal by how much.

## Smallest evidence-led next action

Add a separately reviewed, diagnostic-only observation of the pinned browser getter immediately before rejection: record `expectedMass`, `nativeMass`, absolute difference, and tolerance for the button, then run the existing exact-head hosted browser suite. Do not widen the tolerance or label the cause as float32. If the observed value is still discrepant, investigate the setter's `Result` through a public/supported path before changing the canonical mass rule; Babylon's `PhysicsBody.setMassProperties` currently discards that status and the public body getter does not expose it.

## Checks and limits

This was a read-only source/package inspection. I ran no install, build, test, browser, or physics command and changed no source/configuration. The audit establishes the JS-level write/read path and its declared API surface. It cannot establish the native scalar width, the exact returned mass, whether the native setter accepted this particular write, or the cause of the hosted discrepancy. Those require a real-browser measurement with the requested and returned values exposed.
