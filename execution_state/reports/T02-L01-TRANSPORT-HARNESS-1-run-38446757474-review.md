# T02-L01-TRANSPORT-HARNESS-1 — independent run review

**SOURCE: PASS (bounded to this packet). RUNTIME: PASS for the hosted browser and transport evidence below.**

## Provenance and workflow

The saved GitHub job snapshot identifies successful run **38446757474**, attempt 1, for commit `8e31b3320295d02d57dbf40a6acded3a9ea57485` on `codex/remote-ci-bootstrap`; the complete log and Playwright metadata carry the same run and commit. The run URL is [GitHub Actions run 38446757474](https://github.com/folaoluwafemi/korre/actions/runs/38446757474). Its job snapshot records **35 successful, 0 failed, 5 skipped, 40 total steps**. Steps 14–16 are failure-only TypeScript diagnostics skipped after Verify passed; steps 34–35 are failure-only formatting suggestion/upload steps skipped after checks passed.

The GitHub artifact API lists nine artifacts, and every record ties to this run and SHA. Relevant API artifact records include hosted checks **11838741731** (reported archive digest `sha256:eb32a865483b6a304cf24e99f29fbf9fb523c3fe4340bd97328b5db0d9f7c7da`), browser evidence **11838567072** (`sha256:89331c504629dbafd9d3c9f71eddf18f077f5b1a8e1adae2506423300c46eaeb`), production browser bundle **11839380707** (`sha256:845ce15beb308c342e8f206cd0a0b0ffd6fa1c109a8883692c1f6615a269cfd7`), and diagnostic browser bundle **11838616799** (`sha256:0221d28aa16538de28ce47158e97e013ddbd7dca4670eac992bee5aaeffbbb99`). Those digests are the values reported by GitHub's artifact API. The five extracted browser attachments independently match the saved attachment inventory by byte size and SHA-256; their hashes are `e75ce3a9…82dfad` (the two direct-shot traces), `2c23179e…3ad1cc` (both clean teardown records), and `42c1f294…0aa831` (blocked-WASM teardown).

## Checks actually completed

- Hosted `pnpm verify`: **30/30 test files, 179/179 tests passed**. The log also records package typechecks, lint/format, and the workspace build completing.
- Production diagnostic-marker scan: passed. The workflow ran `tests/production/counterball-dev-match-absent.mjs` against the unflagged production build; the exact production bundle and inventory were uploaded.
- Integration: **1/1 passed**.
- Built production preview: **4/4 passed**.
- Diagnostic Chromium run: **3/3 passed**, with JSON stats `expected=3`, `skipped=0`, `unexpected=0`, `flaky=0`; each result has retry 0. The saved config selects `tests/e2e/counterball-direct-probe.spec.ts` and runs Chromium against the separately built diagnostic preview.

## Browser and transport evidence

The direct-shot trace is from the actual browser test named “a real pointer flick runs browser Havok and changes rendered WebGL pixels.” It records scope `browser-direct-impulse-v1`, termination `settled`, the seven-per-side/one-button scene, and all **15** bodies settled. The contacts include `home-6` with the button. After the pointer flick, the cap moved `5.826547096074273`, the button moved `2.3875367620379495`, and **328** rendered WebGL pixels changed in a 1102×490 comparison. The test also asserts visible button holes and absence of enclosing walls. On leaving the scene, its teardown artifact and assertions show engine count returned to baseline 0, with 0 active listeners and resize observers.

The blocked-WASM test records one deliberately blocked WASM request, a visible fetch failure, and a failed-phase snapshot with 0 engines/listeners/observers. Its retry teardown returns to the same zero-resource baseline. That test then attaches the same passing direct-shot trace (same independently verified hash), so the saved result supports a real shot after retry as well as cleanup of the failed load.

The maximum synthetic transport test passed. The exact source at the run SHA checks the declared **504,365,056-byte** export and summary of **1,924 × 256-KiB chunks**, downloads it, streams the saved file through a bounded host-side hash, asserts exact byte length and SHA-256, sends the matching run/file/length attestation, requires host acknowledgement and the “temporary storage was removed” completion status, and fails if browser or host temporary-file cleanup fails. The test computes the expected digest from the repeated byte-index-mod-251 block; independently recomputing that source-defined digest gives `6852543d94f4a441ef410b5851729cf0fa308b3581ab819ebf582b5104342404`. The passing browser assertion establishes that the downloaded file matched it and the host ACK succeeded. No artifact implies the full loft matrix itself ran; this transport case is synthetic.

The implementation report and prior independent source review both limit their claim to the harness. This exact hosted run now provides the previously pending production-marker, integration, preview, browser flick, failure/retry, and full-size synthetic transport evidence for this packet.

## Scope limit

This is evidence for a real browser Havok/WASM diagnostic flick and synthetic browser-file transport on the GitHub Chromium runner. It does **not** prove deployed Cloudflare Havok, the loft/restart matrix, a complete playable match, online play, or real-device behavior. No deployment or Cloudflare runtime was involved.
