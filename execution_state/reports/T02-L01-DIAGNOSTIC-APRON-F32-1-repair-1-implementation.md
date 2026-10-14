# T02-L01-DIAGNOSTIC-APRON-F32-1 repair 1 implementation

Date: 2026-10-14  
Trigger: GitHub run `38616985171`, which failed only at Prettier for `loftCoarseProbe.test.ts`. The setup and independent run review were read before applying the repair.

Applied the exact hosted formatter patch with `git apply`. Patch application exited `0`. The patch SHA-256 is `1e6592c83044c6dec079d4fe8f31351db837343d3e6ffb041bb38c2d45315340`, matching the reviewed artifact. Its only target is `games/counterball/src/simulation/loftCoarseProbe.test.ts`.

## Exact bounded diff

The resulting file diff is exactly the patch’s single formatting hunk: it changes the `it(...)` call and callback delimiters from the wrapped form to the formatter’s single-line call form. The apron test body, assertions, expected dimensions, projected-Y helper call, adjacent-value construction, and all other tests are unchanged. No other source or configuration file was edited for this repair.

The post-application file hashes are:

- `games/counterball/src/simulation/loftCoarseRunner.ts` (unchanged by this repair): `43E1459AC6C912B1820E6774C15EC237DD2C3ED31659F6D9F9E05037C443F423`
- `games/counterball/src/simulation/loftCoarseProbe.test.ts`: `6F7B83E427D1EE4C259EB1D896193C586B9A3CCA5D61CD84ADF4E439135A4DE4`

The only permitted local check was run:

```text
git diff --check -- games/counterball/src/simulation/loftCoarseProbe.test.ts
exit code: 0
```

No local Prettier, application install, typecheck, lint, test, build, integration, browser, physics, or deployment command was run. Hosted gates remain pending. This formatting repair does not claim runtime, matrix, T02, or playability acceptance.