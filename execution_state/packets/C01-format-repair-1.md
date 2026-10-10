# C01 format repair 1

Parent: C01 (T02 hosted future-test wiring)
Owner: coordinator
Attempt: 1

## Objective

Repair the one formatting failure reported by GitHub Actions run 38084305781 on the exact source SHA `f1e81ebf1b1303cfa7fb1ecfef60769497d77ad7`.

## Inputs

- Exact C01 catalogue record from `node scripts/check-completion-plan.mjs --packet C01`.
- `execution_state/reports/C01-runtime-run-38084305781-github.log` and the downloaded hosted `tooling-format.log`.
- Pinned local Prettier 3.9.9, already present; no dependency install is part of this packet.
- Only `vitest.config.ts` was named by the hosted formatter failure.

## Output and allowed writes

- Formatting-only change to `vitest.config.ts`.
- This packet and `execution_state/reports/C01-format-repair-1-implementation.md`.
- Coordinator-owned runtime status and ownership records may be updated separately by the coordinator.

No package scripts, test discovery, Worker settings, workflow behavior, lockfile, or contracts may change in this packet.

## Exact implementation command

`pnpm.cmd exec prettier --write vitest.config.ts`

This is a formatting-only command, not an application build or test. All application tests, builds, browser checks, and dry-runs remain on GitHub.

## Acceptance

1. Git diff for `vitest.config.ts` contains only Prettier formatting changes.
2. The implementation report records the exact command and says no local application test/build ran.
3. Independent review passes the exact one-file diff and confirms test-discovery semantics are unchanged.
4. After review, the complete parent C01 checks are rerun on GitHub at the exact reviewed SHA; this repair alone does not accept C01.

## Stop condition

If formatting exposes a semantic ambiguity or a second file is required, stop and create a new bounded coordinator packet before editing it. Do not weaken the hosted check.
