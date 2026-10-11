# T02-BR02 implementation repair 1 — 2026-10-11

**IMPLEMENTED; independent repair review and hosted runtime checks are pending.** The source repair is limited to the existing owned path `apps/web/src/CounterballDirectProbe.tsx`. No package, export, shared contract, app route, or browser-spec path changed.

The exact-head GitHub run 38126747064 showed that `@korre/web` cannot directly import `@babylonjs/core` and that the prior `StandardMaterial` lookup was not valid under its public package boundary. The web component now checks the accepted concrete material name and reads `diffuseTexture.name` through a narrow, null-safe structural helper. A missing or malformed material/texture still returns `null`, so the existing scene-fact assertion fails closed. No dependency or assertion was removed.

## Checks performed

- `node scripts/check-completion-plan.mjs --packet T02-BR02`: PASS for packet/dependency consistency only.
- `git diff --check -- apps/web/src/CounterballDirectProbe.tsx`: PASS.
- Local app typecheck, lint, formatting, tests, build, browser automation, physics, and deployment: **NOT RUN**. The focused hosted browser spec and production artifact check are still required.

The source is released for independent repair review. The prior failed GitHub run remains unchanged and preserved in `T02-BR02-run-38126747064.md`; it is not presented as a successful check.
