# T02-L01-CONTACT-ONSET-NATIVE-1 implementation

## Status

Source implementation is present for independent review. Runtime evidence is NOT RUN. The native proof, matrix, parent T02 and playability are not accepted. The new simulation source has long lines and is not yet confirmed against the repository formatter; hosted formatting or exact reviewed corrections remain required.

## Changed paths

- `games/counterball/src/simulation/nativeContactOnsetProbe.ts` — controlled 22-body native lifecycle, pinned config/fixture/WASM checks, shared overlap predicate, per-body Started mask adapter, 64 recorded calls, bounded raw callbacks, cleanup and cancellation.
- `games/counterball/src/browser.ts` — browser entry export.
- `apps/web/src/CounterballDirectProbe.tsx` — explicitly diagnostic control, status, raw JSON and error, common busy/cancel/unmount coordination.

The sustained phase resets velocities but does not teleport, and uses the specified fixed quiet checks. The high separated control checks actual fall and gravity-factor readback. All delivered callbacks are retained until the fixed cap; unexpected type or pair fails.

## Sources

Read exact live packet, `nativeCollisionSubscription.ts`, `loftStartSeparation.ts`, contract proposal review, interface note, existing world factory, runner, browser probe and pinned installed Babylon/Havok declarations/dispatch source. The current packet's 64 calls and native Float32 apron rule supersede the older note's five calls and exact configured top. Existing web guidance report was supplied by coordinator.

## Checks

- `node scripts/check-completion-plan.mjs --packet T02-L01-CONTACT-ONSET-NATIVE-1`: exit 0, ready true. Document consistency only.
- `git diff --check -- games/counterball/src/simulation/nativeContactOnsetProbe.ts games/counterball/src/browser.ts apps/web/src/CounterballDirectProbe.tsx`: exit 0 for tracked source changes.
- `git diff --no-index --check -- NUL games/counterball/src/simulation/nativeContactOnsetProbe.ts`: no whitespace diagnostics for the untracked new file; wrapper treated the normal difference exit as success.
- Local application checks, formatter, builds, browser tests, installs and deployments: NOT RUN per user instruction.
- GitHub checks, native lifecycle and 24-case matrix: NOT RUN, pending integrated source review and hosted wave.

## Limits and handoff

No native event delivery or supported-window behavior is proven by source. Independent reviewer must inspect implementation, teardown and exact interface, then the coordinator must run hosted Chromium/Havok and save raw facts. Formatting has not been verified; the new file remains long-lined. No shared status or other worker paths were edited. Source ownership is released after this report.
