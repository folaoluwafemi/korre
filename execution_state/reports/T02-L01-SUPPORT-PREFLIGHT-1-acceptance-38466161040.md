# T02-L01-SUPPORT-PREFLIGHT-1 acceptance

**Status: ACCEPTED — diagnostic-only support mismatch disclosure.**

Exact source SHA `1dedcf96e92a0eefcdc4938f45ad50c1d863209a` passed independent source review and ran in GitHub Actions [38466161040](https://github.com/folaoluwafemi/korre/actions/runs/38466161040). Independent exact-run review PASS is at `execution_state/reports/T02-L01-SUPPORT-PREFLIGHT-1-run-38466161040-independent-review.md`; complete local evidence and hashes are in `execution_state/reports/T02-L01-SUPPORT-PREFLIGHT-1-run-38466161040.md` and its run directory.

The hosted Verify stage completed type/lint/format checks, 30 unit-test files (179 tests), and production/diagnostic builds. Integration passed 1/1. The normal built-browser preview passed 4/4 with no skips, retries, or flakes. Routed diagnostic Chromium passed the actual browser flick, WASM-failure cleanup/retry, and maximum synthetic transport cases; the real-Havok matrix case stopped before download at the support preflight. It exposed only native AABB Y as mismatching: configured `0.2`, read back as `0.20000000298023224`. Position, rotation, parent, scale, and AABB X/Z matched. The readback exactly equals `Math.fround(0.2)`.

The run and independent review confirm zero matrix cases, no impulse/`executeStep` on the rejected setup path, and no matrix success artifact. The failure-disclosure acceptance criterion is met without changing the original guard. This accepts no MATRIX-1 result, physics behavior/calibration, deployed Cloudflare Havok, playable match, AI, online flow, or human feel.

The original support packet prohibited changing equality. Any projection-aware guard repair is therefore a distinct coordinator-reviewed contract amendment and separately reviewed implementation packet. The canonical configured slab remains `12 x 0.2 x 20`, with unchanged position, material, filters, and open-pavement treatment; no numerical tolerance is approved by this acceptance.
