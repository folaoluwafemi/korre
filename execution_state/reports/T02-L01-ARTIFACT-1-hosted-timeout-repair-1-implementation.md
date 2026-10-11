# T02-L01-ARTIFACT-1 hosted timeout repair 1

Hosted run `38168454484` on SHA `025eaee801d6b5cc6d384bf561b5c1fa389e4a8d` reported that the exact-maximum matrix test exceeded Vitest's default 10-second limit. The captured test duration was `122116ms` for 24 maximum cases, while all exact per-case and aggregate assertions remained in place.

## Change

Set a **per-test** timeout of `180_000ms` on `accepts exact per-case and aggregate row/workload limits using a discard sink`. This gives approximately 58 seconds of margin over the observed hosted runtime. The 24-case workload, exact row/workload caps, all assertions, and global Vitest timeout are unchanged.

Changed path:

- `games/counterball/src/simulation/loftCoarseProbe.test.ts`

## Checks and limits

- `git diff --check -- games/counterball/src/simulation/loftCoarseProbe.test.ts` — exit 0.
- No local application test, lint, typecheck, build, browser, physics, or deployment check was run. A fresh hosted run must verify the timeout is sufficient and the exact-max test passes.
