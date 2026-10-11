# T02-BR01 attempt 4 independent source review

Date: 2026-10-11

## Verdict

- SOURCE: PASS for the bounded source criteria in T02-BR01.
- RUNTIME: NOT RUN. This review does not establish that the probe executes successfully.

I extracted T02-BR01 with `node scripts/check-completion-plan.mjs --packet T02-BR01`. Its parent is T02; its original dependencies remain T02-D01, T02-P01, C01, and C01-H. The only assigned source paths are `games/counterball/src/simulation/browserDirectProbe.ts`, `games/counterball/src/simulation/browserDirectProbe.test.ts`, and `games/counterball/src/browser.ts`. The implementation report and attempt-3 review were also read.

## Source findings

The attempt-4 changes address the three concrete findings in the attempt-3 review:

1. `browserDirectProbe.ts:105-116` assembles the diagnostic sweep guard from all six required values: mechanical-energy ceiling, permitted rest-height drop, support-apron margin, point-sweep limit, rotation limit, and substep budget. The test at `browserDirectProbe.test.ts:257-266` checks the exact assembled six-field object. Runtime planning uses that assembled guard at `browserDirectProbe.ts:1208-1225`, so the energy and sweep paths receive the same complete guard.
2. `browserDirectProbe.test.ts:195-235` separates the apron equality case from the drop constraint and checks equality plus just-outside behavior. The distinct drop-crossing case at lines 237-255 tests the lower permitted height separately.
3. `browserDirectProbe.ts:599-628` normalizes guard/resource failures into typed simulation errors, preserves recognized simulation error codes, and classifies unknown outer failures as initialization errors. The runner catch at line 1604 uses that normalization. Tests at `browserDirectProbe.test.ts:267-308` cover these paths.

The shifted-energy calculation at `browserDirectProbe.ts:265-332` includes all 15 bodies and references potential energy to the lowest permitted center-of-mass height. The exact accepted D01 impulse tuple is read from the hashed guard at lines 1249-1250 and applied once at lines 1348-1351; preconditions and predicted-versus-observed energy checks surround that operation. The browser path initializes the pinned Havok runtime and canonical Counterball world factory at lines 1046-1048. The probe checks actual native body state, performs the bounded substep loop, and evaluates full-collider sweep/support constraints before stepping (lines 1400-1420, 1478-1495, and 1514-1516).

Cleanup is handled on success and failure at `browserDirectProbe.ts:1604-1628`; the helper at lines 491-537 restores the original state or tears down the world if restoration fails. The tests at `browserDirectProbe.test.ts:310-366` cover normal cleanup and the failure branches. `browser.ts:17-21` exposes the diagnostic API and result/contact types; it does not add a playable route or change production authority.

These changes stay within the diagnostic packet. I found no new rule, gameplay, or production-default behavior in the three assigned files. The source review is limited to static inspection and the reported source checks; it does not certify native runtime behavior.

## Runtime and evidence limits

No app install, build, test, browser automation, physics run, Wrangler command, or deployment was run for this review. Hosted `pnpm verify` and independent review of any resulting raw runtime artifact remain pending. Therefore this report supports no claim of a successful browser flick, calibrated physics, deployed Havok, continuous traversal, a playable game, T02 or T05 acceptance, deployment, or real-phone compatibility.
