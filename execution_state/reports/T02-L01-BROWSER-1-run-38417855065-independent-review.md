# T02-L01-BROWSER-1 run 38417855065 evidence review

## Verdict: PASS for evidence identity and integrity

The run evidence is internally consistent. The job snapshot identifies run `38417855065`, head SHA `ff0b6dfead1c76f405a2cc3946b148b16e1e392f`, branch `codex/remote-ci-bootstrap`, and a failed run/job. The `Verify` step (step 13) failed. Its snapshot contains 23 successful steps, 1 failed step, and 13 skipped steps.

Both extracted hosted `verify.log` copies contain the same two TS2307 diagnostics, and the raw GitHub log records the same errors at lines 720–721:

- `loftCoarseRunner.ts(26,26)`: cannot find `@babylonjs/havok/lib/esm/HavokPhysics.wasm?url` or its declarations.
- `loftCoarseRunner.ts(28,24)`: cannot find `../../../../tests/fixtures/counterball-v1.json?raw` or its declarations.

The two extracted `verify.log` copies have identical inventory size and SHA-256. Verification stopped at typecheck. The 13 skipped steps include production packaging, integration, built-preview tests, and diagnostic browser checks; this run proves none of those results.

I independently recomputed the size and SHA-256 of every inventory entry against the extracted files. All 10 files are present under the artifact root; all sizes and hashes match. The inventory and recomputed total is 465,618 bytes, with 0 missing files, unsafe paths, size mismatches, or hash mismatches.

The three PNGs (`T03-inspection.png`, `T03-narrow-viewport.png`, and `T03-preview.png`) are carried browser-review evidence from earlier work, not screenshots produced by this run. The run report identifies them as pre-existing, and the preview/browser-producing steps were skipped.

This PASS covers the run evidence only. The run itself failed, Browser1 remains unaccepted, and no tests, production build, browser behavior, OPFS runtime, or physics result is proven here. I made no source/config/status/catalogue changes and ran no application checks.
