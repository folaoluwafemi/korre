# T02-L01-MATERIAL-F32-1 formatting repair 1

Applied the single hosted formatting suggestion to `games/counterball/src/simulation/loftCoarseProbe.test.ts`. The equality assertion is now one line:

```ts
expect(support?.material).toEqual(supportMaterialRecord?.readback);
```

No test logic or other source path changed.

SHA-256 before: `79A6760297BB0A9AF56B592531E8ACEEBDD9C6639224457300F147740E0C5F9B`

SHA-256 after: `7B7AE60A3B40EB30A361242E454A3344F22A1E655E1AD3FE97B3E305E53A8F64`

The only local check was:

```text
git diff --check -- games/counterball/src/simulation/loftCoarseProbe.test.ts
PASS, exit 0
```

Tests, typecheck, lint, build, browser, physics, and hosted verification were NOT RUN.
