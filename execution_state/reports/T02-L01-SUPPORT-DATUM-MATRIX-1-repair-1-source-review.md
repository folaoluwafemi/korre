# T02-L01-SUPPORT-DATUM-MATRIX-1 repair 1 independent source review

**SOURCE: PASS. RUNTIME: NOT RUN.**

I reviewed the current five packet source files against the initial CHANGES_REQUIRED review and repair-1 implementation report. All three requested corrections are present. The coordinator's separately documented `componentTolerance: 0` telemetry edit is also present in the runner; it changes no predicate or physics behavior.

- The support apron requires exact quaternion `(0, 0, 0, 1)` in the native readback and the early surface guard (`loftCoarseRunner.ts:1173-1181, 1456-1465`), writer (`loftCoarseProbe.ts:699-706`), and Playwright host (`counterball-direct-probe.spec.ts:996-1008`). The expected failure readback now says `componentTolerance: 0` (`loftCoarseRunner.ts:1484-1500`), consistent with exact comparison and the unrotated native-top calculation.
- The writer rejection cases include `z: 5e-13` (`loftCoarseProbe.test.ts:1167-1175`), so they cover a nonidentity value that was within the former tolerance.
- The added supported-pose test uses configured Float32 button dimensions and a nonzero native COM offset. It derives flat and 45-degree support extents, rotates the COM offset for the tilted pose, checks each pose's support plane and lower-datum relation, and verifies the corresponding gravitational energy increments (`loftCoarseProbe.test.ts:674-734`). The old energy and drop boundary cases remain.
- The reported wrap repairs are present. A static scan found no other newly added over-width code lines; the remaining long added lines are indivisible diagnostic strings. I did not run Prettier or application checks, so hosted formatting and runtime remain unverified.

`git diff --check` over the five packet source paths passed. Current SHA-256 values:

- `games/counterball/src/simulation/loftCoarseRunner.ts` — `78fc5ee06b37b2a77175215f7ee0b7387eff4205b638d792382cec0ded14e414`
- `games/counterball/src/simulation/loftCoarseProbe.ts` — `aa5c77440a2948ed637a6175ada03433992395e8c97b53584308b8b753f4b2aa`
- `games/counterball/src/simulation/loftCoarseProbe.test.ts` — `579f353240d1dd1995fcced7d6107a06ab8eed35521d07e9944e1102bfa3cf35`
- `games/counterball/src/simulation/nativeCylinderSupportDatum.ts` — `930360592e6f2a3a2bb7f3f4de857584160d40289ad4527e17aa83bc7952c4e9`
- `tests/e2e/counterball-direct-probe.spec.ts` — `f68fea78121ea9840549295b857a494aa92d90584a8c6deace7a5ca072e41c2b`

The runner hash includes the coordinator's single telemetry-literal amendment documented in `T02-L01-SUPPORT-DATUM-MATRIX-1-exact-telemetry-repair.md`; the other four hashes match the repair-1 implementation report. No typecheck, lint, tests, build, browser, physics, or CI ran. The exact-hosted checks and full 24-case real-Havok matrix are still pending; this report does not accept the matrix or parent.
