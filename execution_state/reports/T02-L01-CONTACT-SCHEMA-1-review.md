# T02-L01-CONTACT-SCHEMA-1 independent source review

**Verdict: PASS for source scope.** The additive types, canonical pair helper, serializer checks, and focused tests satisfy the packet. Hosted verification is still required before acceptance. No local application checks were run.

## Findings

`games/counterball/src/simulation/loftCoarseProbe.ts` defines the seven static IDs separately from `LoftCoarseEntityId` and composes `canonicalContactBodyIds` by appending them to the unchanged 15-entry `canonicalEntityIds` order (`:30-58`, `:275-303`). The new helper checks each endpoint against that closed set, rejects equal IDs, and returns the pair in total order (`:536-561`). The row validator requires an array of exactly two entries, validates both IDs, and rejects equal or reversed encoded pairs (`:1160-1192`). It does not sort or filter contact rows: `writeRows` validates and serializes each row in array order (`:1686-1710`), preserving duplicate rows.

The tests in `games/counterball/src/simulation/loftCoarseProbe.test.ts` cover reversed dynamic order; both input orientations for a dynamic/static pair; static/static ordering; every one of the seven static IDs; serialized retention and order of two symmetric duplicate callbacks; and rejection of unknown, non-string, identical, reversed, and malformed pairs (`:757-879`). The existing default dynamic contact fixture remains valid. The seven IDs match the accepted metadata order and the explicit factory-name mapping reviewed in `CONTRACT_WORK.md`; no gameplay or protocol ID was repurposed.

The current diff changes exactly the two assigned paths. It leaves the protocol package, fixture/config hashes, world factory geometry, physics behavior, matrix envelope and contact caps untouched. No filtering or deduplication was introduced.

## Checks and limits

- `node scripts/check-completion-plan.mjs --packet T02-L01-CONTACT-SCHEMA-1` — PASS, exact record extracted. The card is now IMPLEMENTED and awaits review, so the checker reports `ready:false`; its contract and status dependencies are accepted and the executor remains separately gated.
- `git diff --check -- games/counterball/src/simulation/loftCoarseProbe.ts games/counterball/src/simulation/loftCoarseProbe.test.ts` — PASS, exit 0.
- Read the accepted `T02-L01-CONTACT-CONTRACT-1` and `T02-L01-CONTACT-STATUS-1` implementation/review reports, the executor stop/blocker reports, and inspected `worldFactory.ts` for the exact static body names.
- The author report correctly records application tests, typecheck, lint, format, build, browser, physics/Havok, and deployment checks as NOT RUN. Exact-head hosted `pnpm verify` remains pending; this review does not claim runtime contact capture or a Havok matrix result.
