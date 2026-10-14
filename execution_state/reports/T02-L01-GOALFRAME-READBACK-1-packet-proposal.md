# T02-L01-GOALFRAME-READBACK-1 packet proposal

## Purpose

Exact hosted run 38618192294 passed `pnpm verify`, integration, the built preview suite, the apron Float32 dimension preflight, and the 15 dynamic-body checks. The real pinned-Havok diagnostic suite then stopped at the unchanged strict canonical-dimension preflight for `goal-frame-0`, before any impulse, `executeStep`, tuple completion, or matrix download. The independent review found that the saved error and full artifacts do not expose actual goal-frame bounds or dimensions. This packet adds those readback facts to the existing failure detail, so the next bounded decision can tell a native representation difference from a geometry discrepancy.

## Exact worker scope

- Read the exact packet extraction and dependency records, accepted geometry-readback source/review, accepted apron contract, source-reviewed apron implementation report, and exact run 38618192294 with its independent review.
- Write only `games/counterball/src/simulation/loftCoarseRunner.ts`.
- At the static-body loop, obtain the local AABB, min, max, and dimensions once. Continue comparing the exact same dimensions against the exact same canonical goal-frame values and retain the exact cylinder type check.
- On the existing goal-frame dimension failure only, disclose body ID, native shape type, configured goal width/height/frame radius, expected dimensions, native AABB minimum/maximum, and observed dimensions from that same single read. Preserve the existing `resourceLimit` failure code and fail-before-impulse/step order.
- Do not project any goal-frame axis, add tolerance, change frame geometry/pose/type, change any other static/dynamic check, or change configuration, hash, protocol, artifact schema, or physics behavior.

This is a readback diagnostic only. It accepts neither the goal-frame dimensions nor MATRIX-1, T02, deployed Havok, calibration, a complete match, or playability.

## Required hosted evidence

On the exact source-reviewed SHA, run these checks on GitHub using the current `.github/workflows/ci.yml` commands:

- `pnpm verify`
- `pnpm test:integration`
- `COUNTERBALL_PREBUILT_PREVIEW=1 pnpm test:e2e --workers=1`
- The unchanged workflow-produced diagnostic suite: `$diagnostic_specs` comes from the existing workflow's produced-spec selector, then `COUNTERBALL_DEV_E2E=1 COUNTERBALL_PREBUILT_PREVIEW=1 pnpm test:e2e $diagnostic_specs --workers=1`. Do not substitute, shorten, or bypass its routed suite.

Expected diagnostic outcome is 3 passing probe cases and the matrix test stopping at the strict `goal-frame-0` preflight with the complete JSON readback visible in the saved failure context/log. Require zero skips, retries and flaky tests. The diagnostic workflow may conclude failure at that expected preflight; it must complete no matrix tuple, impulse, or physics step and produce no matrix success artifact.

Capture the exact commit/run, full logs, structured browser result, and all actual hosted artifacts. An independent exact-source reviewer and an independent exact-run/artifact reviewer must verify the same SHA, unchanged strict predicate, one-read provenance, complete native facts, test counts, no-step ordering, and absence of a matrix artifact.

## Stop conditions and next dependency

If the diagnostic does not reach `goal-frame-0`, omits any native bound/expected/observed value, uses more than one bounds read, changes the strict predicate, or runs an impulse/step, fail the card and do not propose a geometry contract change. After this one diagnostic attempt, stop and base any corrective contract proposal only on the independently reviewed actual values. The later full-matrix successor must preserve `required_parent_acceptance: ["T01"]`, keep every original matrix `depends_on` entry, and add the accepted goal-frame readback plus any separately reviewed exact representation contract; it must not depend on the unaccepted apron-matrix card and must preserve the apron projection already shown to pass preflight.
