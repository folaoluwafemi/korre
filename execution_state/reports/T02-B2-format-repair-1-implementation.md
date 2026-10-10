# T02-B2 formatting repair 1

## Trigger and changes

Hosted GitHub Actions run `38042116007` passed typecheck and ESLint, then
Prettier reported only `games/counterball/src/simulation/intendedShotProbe.test.ts`.
The pinned formatter changed line wrapping only in that exact file. No probe
logic, inputs, assertions, cleanup, or clearance fields changed.

## Checks

From the repository root:

- `pnpm.cmd exec prettier --write games/counterball/src/simulation/intendedShotProbe.test.ts` — exit 0; formatted exactly the one path named by CI.
- `git diff --check` — exit 0.

No local build, test, typecheck, lint, or server command ran. Independent review
and a fresh hosted CI run are still required. This formatting repair provides
no real-WASM runtime or measurement evidence. The canonical clearance-epsilon
decision remains unresolved.

Exact changed source path: `games/counterball/src/simulation/intendedShotProbe.test.ts`.
