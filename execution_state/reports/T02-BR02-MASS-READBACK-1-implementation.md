# T02-BR02-MASS-READBACK-1 implementation

## Scope and inputs

Implemented the ready packet `T02-BR02-MASS-READBACK-1`. The plan checker reported the packet ready. I consulted the exact packet record, its listed diagnostic source and test, `CONTRACTS.md`, completion `OPERATIONS.md`, `SWARM.md`, and the accepted BR02 runtime diagnosis and pinned mass API audit/review.

## Changes

- `games/counterball/src/simulation/browserDirectProbe.ts`: added pure `formatNativeMassMismatch`, which formats the body ID, configured mass, native readback, absolute difference, and tolerance with JavaScript's shortest round-trip numeric representation (`String(number)`). The existing mass comparison and tolerance expression are unchanged. The formatter is called only after the existing comparison rejects the readback; it does not round or normalize either compared mass.
- `games/counterball/src/simulation/browserDirectProbe.test.ts`: added one focused formatter test with exact decimal output assertions for all numeric fields.

The expected example output includes native `0.15000000000000002`, configured `0.15`, absolute difference `2.7755575615628914e-17`, and tolerance `1.4210854715202004e-14`. These are formatter test inputs, not a claim about observed Havok readback.

## Checks and limits

- `node scripts/check-completion-plan.mjs --packet T02-BR02-MASS-READBACK-1`: PASS; this confirms packet readiness only.
- `git diff --check -- games/counterball/src/simulation/browserDirectProbe.ts games/counterball/src/simulation/browserDirectProbe.test.ts`: exit 0, no output.
- Application tests, typecheck, lint, formatting, build, browser/Havok runtime, and deployment checks: NOT RUN as required by the packet.

The actual native mass value remains unknown until the hosted browser diagnostic runs. This change makes the existing rejection informative; it does not change its acceptance threshold or prove a flick, successful diagnostic trial, or gameplay behavior. Release these source paths for independent review before hosted checks.
