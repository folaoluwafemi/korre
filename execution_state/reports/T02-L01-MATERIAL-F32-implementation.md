# T02-L01-MATERIAL-F32-1 implementation

Implemented the approved narrow Float32 material-readback policy in the three assigned source files.

The runner still writes the configured decimal friction, static friction, and restitution values. Before the impulse, it now accepts each numeric native getter only when it is finite and exactly equals `Math.fround(configuredSetter)`. Friction and restitution combine strings remain strict exact matches. A numeric mismatch remains a typed `resourceFailure` and reports the configured value, projected value, and observed native readback. The original raw getter values remain in the serialized material facts.

The artifact validator now checks setter records against the frozen configured values, checks native numeric readbacks against the exact projection helper, and checks combine strings against the frozen names. Each static body's material must pass the same native-readback checks and match its corresponding raw material record field-for-field. The test fixture now carries configured setters and projected raw readbacks; focused writer tests verify those raw values survive serialization and reject an adjacent Float32 friction value.

The exact packet extraction reported `PASS` and `ready:true`. The only local source check run was:

```text
git diff --check -- games/counterball/src/simulation/loftCoarseRunner.ts games/counterball/src/simulation/loftCoarseProbe.ts games/counterball/src/simulation/loftCoarseProbe.test.ts
PASS, exit 0
```

SHA-256 after the changes:

| File | SHA-256 |
| --- | --- |
| `games/counterball/src/simulation/loftCoarseRunner.ts` | `F7EB6B3B03A8EE46AEC53D37A404A30847F4E5FBF52A0E612902BBDFB6197B52` |
| `games/counterball/src/simulation/loftCoarseProbe.ts` | `D9C903E1640F94F7894F8543E5697950BDA124AD8CB58A1BAEBE0FA94FB68913` |
| `games/counterball/src/simulation/loftCoarseProbe.test.ts` | `79A6760297BB0A9AF56B592531E8ACEEBDD9C6639224457300F147740E0C5F9B` |

Unit tests, typecheck, lint, build, browser execution, physics trials, and hosted verification were NOT RUN. This change does not establish a completed loft matrix or runtime acceptance.
