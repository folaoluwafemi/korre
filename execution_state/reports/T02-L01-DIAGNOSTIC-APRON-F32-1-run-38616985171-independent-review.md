# T02-L01-DIAGNOSTIC-APRON-F32-1 — independent run review

**Verdict: RUN EVIDENCE PASS; packet/runtime acceptance NOT PROVEN.** The exact GitHub run and downloaded evidence agree that verification stopped only at Prettier. No matrix or browser test ran.

## Run identity and outcome

- Repository: `folaoluwafemi/korre`
- Run: [38616985171](https://github.com/folaoluwafemi/korre/actions/runs/38616985171)
- Head SHA: `41f70f1dd3bada6871c2099807408851ca757dba` (matches the requested SHA)
- Conclusion: `failure`; the `verify` job failed.
- The run started at `2026-10-14T18:39:21Z` and completed at `18:41:18Z` (UTC).

The workflow's frozen install, disposable Worker smoke test, Chromium installation, disposable migration checks, and focused protocol test succeeded. The focused protocol log reports 1 file and 13 tests passed. Both migration invocations report the single forward-only migration verified. These preliminary checks do not establish matrix runtime behavior.

## Verify failure and unrun work

The preserved `verify.log` shows `pnpm verify` invoking `pnpm typecheck && pnpm lint && pnpm test && pnpm build`. Workspace typechecking completed, including the Counterball package's export/bundle checks. ESLint also completed: the lint script proceeded to Prettier. Prettier reported exactly one file, `games/counterball/src/simulation/loftCoarseProbe.test.ts`, and exited nonzero with “Code style issues found in the above file.” No other Prettier warning or typecheck/lint diagnostic appears in the Verify log.

Because the `&&` chain stopped at lint, `pnpm test` and `pnpm build` did not run. GitHub's step record marks integration tests, browser preview tests, diagnostic-browser build/collection, and the diagnostic browser suite skipped. The run therefore provides no matrix test count, no matrix shot/step result, and no matrix download artifact. The successful upload step for general browser-review evidence contains three `T03-*` PNGs; they are not matrix observations. The artifact listing contains no matrix-result artifact. The separately uploaded verification log is identical to the copy in the hosted-checks artifact (both SHA-256 `2b52f76290d7bae25bc307ddda07e5b122dbb41f078619b106f79d4705aa086e`).

## Formatting suggestion review

The hosted `formatting-repair` artifact contains one patch targeting only `games/counterball/src/simulation/loftCoarseProbe.test.ts`. Its extracted patch is 2,412 bytes, SHA-256 `1e6592c83044c6dec079d4fe8f31351db837343d3e6ffb041bb38c2d45315340`. Its preimage blob is `7420d7a82d78013b981ab72707a60c5021fdb365`, matching the blob at the exact run commit. The patch only reflows the `it(...)` call and its closing delimiters; assertions, literals, callbacks, and test behavior remain the same. No second file is present in the patch.

GitHub's artifact API lists four run artifacts, all tied to this exact run/SHA:

| Artifact | ID | Uploaded bytes | Archive SHA-256 |
|---|---:|---:|---|
| `formatting-repair` | `11921040129` | 848 | `264d64a4aee85200a9c4d315ccd0249701dc9c4efb93aadafb2e4b1a6a51af45` |
| `counterball-hosted-checks-41f70f1dd3bada6871c2099807408851ca757dba-run-38616985171-attempt-1` | `11919633302` | 1,326,213 | `c09eb423779ede3a674d4d1a6d007f10b0a2fc16977c0b84dcc559ccf19f2a22` |
| `counterball-browser-evidence` | `11919503295` | 437,511 | `b5fbfe4a5ce0a0786b36a1f0b11fdb3af7faa9a5d55ecd7acd6c008af84c3d1a` |
| `counterball-verification-log` | `11919503286` | 1,773 | `930847d17e5626cd49ce042e2e4a7d00dbb20959b06b5deeb715df1e7ceeeb55` |

## Deterministic downloaded-file inventory

Inventory root: `execution_state/reports/T02-L01-DIAGNOSTIC-APRON-F32-1-run-38616985171-artifacts/`. Paths below are relative to that root and use `/`. Files were sorted by ordinal path; each row is `path<TAB>byte length<TAB>lowercase SHA-256`, encoded as UTF-8 without BOM with LF after each row. The inventory has 22 files, 48,597,288 bytes total, and SHA-256 `67249603aa9ed75c856fae7279da6f7a3e8297699e6256c49e823ef8b4b98048`.

| Relative path | Bytes | SHA-256 |
|---|---:|---|
| `counterball-browser-evidence/execution_state/reports/T03-inspection.png` | 139,998 | `13a8d0257dd07dfb6650954f07255e53d7c2acf37293059f541fc44bd4b8d34e` |
| `counterball-browser-evidence/execution_state/reports/T03-narrow-viewport.png` | 141,477 | `88b461d66f721b9b5a01096d5422f0f3a99df970aba95cf5b8d584a946ed3cee` |
| `counterball-browser-evidence/execution_state/reports/T03-preview.png` | 167,624 | `d06272c44382f35d1e91e7264bbd8cf6c570b77d12ab0960284767c7ac05cd4f` |
| `counterball-hosted-checks-41f70f1dd3bada6871c2099807408851ca757dba-run-38616985171-attempt-1/counterball-server-tsc-resolution.log` | 1,782,461 | `1b9f46e109d32e5818f98a2fa2564e33c59b3e7889200ed2f478b6638e3185fb` |
| `counterball-hosted-checks-41f70f1dd3bada6871c2099807408851ca757dba-run-38616985171-attempt-1/counterball-server-tsc-status.log` | 16 | `4e1559d3ce9c975650c353e902a1ddc490038493fc4e9aa3905bd14324ececf0` |
| `counterball-hosted-checks-41f70f1dd3bada6871c2099807408851ca757dba-run-38616985171-attempt-1/counterball-server-tsc-summary.log` | 16 | `4e1559d3ce9c975650c353e902a1ddc490038493fc4e9aa3905bd14324ececf0` |
| `counterball-hosted-checks-41f70f1dd3bada6871c2099807408851ca757dba-run-38616985171-attempt-1/counterball-tests-tsc-resolution.log` | 15,440,418 | `71160a9ad22e0d31c2c1d1d549a66fa35455da61d18f959f888c50c3ad671070` |
| `counterball-hosted-checks-41f70f1dd3bada6871c2099807408851ca757dba-run-38616985171-attempt-1/counterball-tests-tsc-status.log` | 16 | `4e1559d3ce9c975650c353e902a1ddc490038493fc4e9aa3905bd14324ececf0` |
| `counterball-hosted-checks-41f70f1dd3bada6871c2099807408851ca757dba-run-38616985171-attempt-1/counterball-tests-tsc-summary.log` | 7,341 | `bfbc8a88bb648fa05b280332b2aafe60d44b41919b7ad7fba06ffbe557430cbf` |
| `counterball-hosted-checks-41f70f1dd3bada6871c2099807408851ca757dba-run-38616985171-attempt-1/counterball-tsc-resolution.log` | 15,319,194 | `6ebc63d4a6bdad9ab01d99523ac486072b26461fd5f11560f62e806e28cb2bbf` |
| `counterball-hosted-checks-41f70f1dd3bada6871c2099807408851ca757dba-run-38616985171-attempt-1/counterball-tsc-status.log` | 16 | `4e1559d3ce9c975650c353e902a1ddc490038493fc4e9aa3905bd14324ececf0` |
| `counterball-hosted-checks-41f70f1dd3bada6871c2099807408851ca757dba-run-38616985171-attempt-1/counterball-tsc-summary.log` | 7,341 | `2781812793f59421440d650a126112a243d347e4eee1ac4ec76c68b73f4253e3` |
| `counterball-hosted-checks-41f70f1dd3bada6871c2099807408851ca757dba-run-38616985171-attempt-1/counterball-web-tsc-resolution.log` | 15,570,503 | `4ef5b10cab1ae0b0aa20c14806b6ea644ee10e10a3ba42a914c952ffcea70f30` |
| `counterball-hosted-checks-41f70f1dd3bada6871c2099807408851ca757dba-run-38616985171-attempt-1/counterball-web-tsc-status.log` | 16 | `4e1559d3ce9c975650c353e902a1ddc490038493fc4e9aa3905bd14324ececf0` |
| `counterball-hosted-checks-41f70f1dd3bada6871c2099807408851ca757dba-run-38616985171-attempt-1/counterball-web-tsc-summary.log` | 7,261 | `e62263614191173a2dfe265c4a87c47e02dce37c48fdd8213683e30d6266e66e` |
| `counterball-hosted-checks-41f70f1dd3bada6871c2099807408851ca757dba-run-38616985171-attempt-1/migrations.log` | 416 | `f40a42ad994e1e2145b4a29f0184d5c91570f55d08cbfc8292968de7cb0f9f67` |
| `counterball-hosted-checks-41f70f1dd3bada6871c2099807408851ca757dba-run-38616985171-attempt-1/protocol.log` | 478 | `6225a5eb737f176286ab3014e71d66368ab407c68c5d7701b9414a6c1e70da0d` |
| `counterball-hosted-checks-41f70f1dd3bada6871c2099807408851ca757dba-run-38616985171-attempt-1/tooling-format.log` | 66 | `17aa973d3f004560237d9a95171210b0671deff23d61628eecf7322ff5938f20` |
| `counterball-hosted-checks-41f70f1dd3bada6871c2099807408851ca757dba-run-38616985171-attempt-1/verify.log` | 4,821 | `2b52f76290d7bae25bc307ddda07e5b122dbb41f078619b106f79d4705aa086e` |
| `counterball-hosted-checks-41f70f1dd3bada6871c2099807408851ca757dba-run-38616985171-attempt-1/workers.log` | 576 | `bbeab5f6273ef63afeee753d0b8f1ed6d32492f58efb447ac66bc18634794f8f` |
| `counterball-verification-log/verify.log` | 4,821 | `2b52f76290d7bae25bc307ddda07e5b122dbb41f078619b106f79d4705aa086e` |
| `formatting-repair/formatting-repair.patch` | 2,412 | `1e6592c83044c6dec079d4fe8f31351db837343d3e6ffb041bb38c2d45315340` |

No local application tests, builds, browser automation, or physics checks were run for this review. The evidence establishes a formatting-only CI blocker and the absence of matrix/browser execution on this run; it does not accept the diagnostic apron card or any physics/runtime gate.
