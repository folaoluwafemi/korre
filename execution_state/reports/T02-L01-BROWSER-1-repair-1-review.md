# T02-L01-BROWSER-1 repair 1 independent review

## SOURCE verdict: PASS

The repair directly resolves all ten diagnostics from the failed hosted run. I reviewed the saved implementation report and the source diff for `apps/web/src/CounterballDirectProbe.tsx`. The source repair is limited to that component; it adds no compiler suppressions or application configuration changes.

- The four TS4111 errors are fixed with bracket access at lines 110–113. The exact four-key check and string/number checks remain intact at lines 103–113.
- The four TS2412 errors are fixed in the session type at lines 145–148 by explicitly including `undefined` in the four optional mutable field value types. This matches existing reset-to-`undefined` cleanup behavior; it does not change runtime behavior or make any field required.
- The TS2345 write error is fixed at lines 341–343 by allocating an `ArrayBuffer`-backed `Uint8Array` with the same byte length, copying the bounded chunk into it, and awaiting the same writer. The existing nonempty, 256-KiB, and expected-total-byte checks still run first at lines 330–339; accounting still increments by the original chunk length at line 344.
- The TS2322 timer mismatch is fixed with `window.clearTimeout` at line 203 and `window.setTimeout` at line 766. These use the browser `Window` timer handle consistently in this browser-only component.

The requested invariants remain visible in the reviewed source: the canonical matrix maximum is read from the frozen config and the synthetic transport remains exactly 504,365,056 bytes (lines 151–154); chunks remain limited to 256 KiB (lines 334–345); OPFS writes remain awaited and file finalization still checks the exact expected size (lines 348–365). The host acknowledgement still validates the exact four-key shape and session identity, byte count, SHA-256 format, completed write, download, and closed writer before cleanup (lines 103–113 and 610–645). Cleanup remains idempotent and removes the abort listener, aborts an open writer, clears the timer, revokes the object URL, and removes the temporary file (lines 177–232). The direct pointer shot path is outside the diff and remains unchanged.

## HOSTED/RUNTIME verdict: NOT VERIFIED; pending exact-head CI

The failed baseline run was GitHub run 38414094519 on `eceb041f14035114e841361bf4d1fc26c8acf502`. Its job snapshot confirms 23 successful steps, 1 failed `Verify` step, and 13 skipped steps. The saved `verify.log` contains exactly the ten reported diagnostics: four TS4111 property accesses at original lines 110–113, four TS2412 resets at 187, 204, 208, and 229, one TS2345 OPFS write at 341, and one TS2322 timer assignment at 764. Unit tests, builds, and browser checks did not run in that baseline.

I independently recomputed the size and SHA-256 of all 10 files in the downloaded artifact inventory: all files are present; all sizes and hashes match; total size is 470,034 bytes; no path escaped the artifact root. This establishes evidence integrity, not runtime behavior.

The implementation report records only `git diff --check` as a local check. I ran no local app build, typecheck, lint, test, browser, OPFS, or physics command. No exact-head hosted run has yet verified the fix or the dev/production packaging boundary. Thus the source repair passes review, while hosted typecheck, OPFS behavior, ACK and cleanup behavior in Chromium, direct-shot regression, and production exclusion remain unverified until CI runs on the exact reviewed commit.

## Evidence reviewed

- `execution_state/reports/T02-L01-BROWSER-1-run-38414094519.md`
- `execution_state/reports/T02-L01-BROWSER-1-run-38414094519-job-snapshot.json`
- `execution_state/reports/T02-L01-BROWSER-1-run-38414094519-github.log`
- `execution_state/reports/T02-L01-BROWSER-1-run-38414094519-artifact-inventory.json` and all extracted files
- Run `verify.log` containing the TypeScript diagnostics
- `execution_state/reports/T02-L01-BROWSER-1-repair-1-implementation.md`
- The exact `T02-L01-BROWSER-1` packet and current source diff
