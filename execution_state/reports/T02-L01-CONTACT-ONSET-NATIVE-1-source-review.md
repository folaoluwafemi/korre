# T02-L01-CONTACT-ONSET-NATIVE-1 independent source review

Verdict: PASS for source review, with hosted type/format/build plus real Chromium/Havok lifecycle evidence still required. This is not runtime or packet acceptance.

Reviewed live exact packet, implementation report, all three source paths, accepted adapter and separation helpers, world factory and pinned declarations. Source SHA-256 at review: probe `7478911ed6db84627be5d658effdaea1ffdec8b3eeca0bff8277a6240b81d2b8`; browser `b16bd88b8f175dcbcf6c600924d60c18ced3bdc91dd05ade57e3fc5b9d9c9930`; web `e464b37f3e872489e32c902d4c5ec5cf0b7655efc26df586872b559e6f2c2379`.

Actual initialized Havok Started enum wrapper enters the accepted adapter, which derives its .value, sets all 22 bodies and reads all 22 in canonical order before stepping. No later boolean enable is used. World/fixture/WASM identity is checked; overlapping button/home-1 geometry uses accepted native AABB radius and strict separation before any world call. The diagnostic replaces the factory surface with the configured large apron in the same fashion as the matrix and uses the same engine, factory and pinned physics plugin. It records native bounds, actual poses, gravity and before/after samples; it parks other dynamics, runs five fixed phases with 64 calls, velocity resets without teleport during the sustained phase, 10 final quiet support samples, initial negative fall, mirrored first/recontact, separated negative and fixed 4096 row/30s limits. Callbacks are not deduplicated, unexpected pair/type and cap overflow fail. All observers are removed and the apron restored/disposed and temporary world disposed; engine remains owned by caller. UI adds the required diagnostic selectors and coordinates busy/cancel/unmount with matrix and rendering cleanup.

Interface reconciliation: the proof records buttonGravityFactor with support geometry to establish the packet-required gravity readback. The current host validator explicitly includes this field in its exact-key schema and requires it to equal 1, so the source/host shape concern is resolved. This readback remains a source-level assertion until the real browser run. Source inspection cannot prove native event behavior, sustained support, timing, or actual cleanup at runtime.

Scoped diff whitespace checks gave no whitespace diagnostics, including the new file. No application tests, typecheck, formatter, build, browser or deployment was run locally. Required hosted native lifecycle, raw JSON evidence, full matrix and independent run/artifact review remain outstanding.


