# Exact canonical diagnostic guard identity repair

Coordinator changed only two stale numeric bounds in validateMatrixMetadata to guard.schemaVersion for BOTH min/max. Existing subsequent canonical identity equality remains unchanged. This is exact current-version matching, no version range/guard weakening, no metadata/physics semantics change. Existing writer positive suites remain unchanged; focused new negative test rejects previous/next/fractional/nonfinite versions before any sink bytes, with awaited abort.

Readback/runner/full support-datum consumer remains unaccepted. Original15/T01 plus accepted contract gates preserved. Source hashes:

- games/counterball/src/simulation/loftCoarseProbe.ts: 721ca0c3d7a5c5847f390a0d184c5c55a3dd63733a24acc588ed8ff8194d70ef
- games/counterball/src/simulation/loftCoarseProbe.test.ts: 72e9468b19663afe32e16642b32d720b7e89cf00e2f344c73d842933ddd5849b

All app tests/builds NOTRUN locally; unchanged GitHub rerun required after independent review. Scoped diffcheck required.
