# T02-L01-GOALFRAME-READBACK-1 proposal review 2

**Verdict: PASS**

The updated proposal resolves both findings from review 1. It now lists the exact hosted checks: `pnpm verify`, `pnpm test:integration`, `COUNTERBALL_PREBUILT_PREVIEW=1 pnpm test:e2e --workers=1`, and the unchanged diagnostic command `COUNTERBALL_DEV_E2E=1 COUNTERBALL_PREBUILT_PREVIEW=1 pnpm test:e2e $diagnostic_specs --workers=1`. It states that `$diagnostic_specs` must come from the current workflow's produced-spec selector. These commands and the selector/routing match `.github/workflows/ci.yml`; the proposal keeps them on GitHub and does not shorten or replace the diagnostic suite.

The later matrix successor now explicitly retains `required_parent_acceptance: ["T01"]`, every original matrix `depends_on` entry, and adds the accepted goal-frame readback. It explicitly excludes a dependency on the unaccepted apron-matrix card while preserving the apron projection that passed the observed preflight.

The diagnostic scope remains bounded to `games/counterball/src/simulation/loftCoarseRunner.ts`: one native bounds read supplies the unchanged strict comparison and the disclosed min/max/observed dimensions. The proposal prohibits tolerance, projection, geometry or physics changes, preserves failure-before-impulse/step, and defines the expected diagnostic stop with no completed tuple or matrix artifact.

Its run summary remains consistent with the independent evidence for run 38618192294 on SHA `4d8a4d8da2827074ddd2767c3978e62fb305f9fc`: verification, integration, and preview passed; three diagnostic probes passed; the matrix test stopped at `goal-frame-0` before impulse or `executeStep`; no matrix artifact was produced. The run evidence does not provide the actual goal-frame bounds, which is the stated reason for this readback diagnostic.

This is a proposal review only. No source or runtime checks were run.
