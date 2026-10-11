# Completion-plan readiness filter repair 1

**Scope: coordinator document tooling only.** The plan checker treated every non-accepted, non-superseded catalogue packet as initially ready, even if its authoritative task record was `CHANGES_REQUIRED`, `RUNNING`, `IMPLEMENTED`, `REVIEWING`, `VERIFIED`, or `BLOCKED`. On the current state this incorrectly advertised the failed BR02 formatter packet as ready for dispatch.

The checker now admits unstarted catalogue packets with no runtime record and materialized packets explicitly in `PLANNED` or `READY` only. Accepted and superseded records remain excluded; prerequisites still require ACCEPTED as before. A focused temporary-state invocation marked the new mass-readback packet `RUNNING` and returned no initially ready packets, while the current authoritative state lists only `T02-BR02-MASS-READBACK-1` and no failed formatter retry.

Checks run (documentation/tooling only):

- `node scripts/check-completion-plan.mjs` — PASS, 86 packets, 21 remaining parents, only the materialized READY mass-readback packet initially ready.
- `node scripts/check-completion-plan.mjs --packet T02-BR02-MASS-READBACK-1` — PASS; exact card returned `ready: true`.
- `node scripts/check-completion-plan.mjs --state <temporary fixture with mass-readback status RUNNING>` — PASS; no initially ready packet. The temporary fixture was removed.
- `git diff --check -- scripts/check-completion-plan.mjs` — PASS.

No workspace installation, app test, build, browser, physics, deployment, Wrangler or Railway command ran. This fix changes only document-task readiness reporting and does not change any application behavior or authorize a failed card retry.
