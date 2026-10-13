# T02-L01-SUPPORT-F32-1 acceptance

**Decision: ACCEPTED for the exact support AABB-Y representation check.** This decision does not accept MATRIX-1 or parent T02.

The implementation changes only the support native AABB Y comparison to require exact equality with the finite `Math.fround(configuredThickness)` projection. The configured slab stays `12 × 0.2 × 20`, x/z and all other transform/material/filter/physics checks remain exact, and downstream calculations continue to use raw native values. Independent source review is recorded at `execution_state/reports/T02-L01-SUPPORT-F32-source-review.md`.

GitHub run [38470988448](https://github.com/folaoluwafemi/korre/actions/runs/38470988448) used exact reviewed source SHA `9977d984ee91dae726baff56d49e23cfe1d5f53d`. Hosted Verify passed with 30/30 test files and 181/181 tests; integration passed 1/1; preview Chromium passed 4/4 with no skips, retries, or flakes. The diagnostic browser suite had three passing checks and one later matrix failure, with zero skips, retries, or flakes.

The later matrix error was `Native friction material readback differs from its setter.` Independent exact-run review confirms the support AABB-Y preflight at runner lines 1293–1403 completed before the material check at line 1420 threw. The browser therefore passed the F32 preflight. Review and all nine retained-file hashes/seven listed artifact metadata rows are recorded at `execution_state/reports/T02-L01-SUPPORT-F32-run-38470988448-independent-review.md`.

The 24-case matrix did not complete a case, download a result, or emit its validated matrix artifact. The calibration and intended-shot artifacts are separate diagnostics. MATRIX-1 remains `CHANGES_REQUIRED`; T02 remains `RUNNING`. The next work is a separately packeted diagnosis/repair for the later native friction readback. No tolerance or material behavior change is authorized by this acceptance.
