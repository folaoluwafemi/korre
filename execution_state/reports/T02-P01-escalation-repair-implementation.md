# T02-P01 coordinator escalation repair

The two worker repair attempts were exhausted after GitHub run 38104471030 reported TS4111 in the new runtime type guards. The independent diagnosis in `T02-P01-escalation-diagnosis.md` confirmed that the smallest correction is bracket access for the three fields read through `Record<string, unknown>`.

Coordinator changed only `games/counterball/src/scene/presentation.ts`: `value.id`, `value.position`, and `value.rotation` now use indexed access. No cast, lint suppression, acceptance change, predicate change, or validation-order change was made. The unknown-array guard, canonical ID check, finite vector/quaternion checks, duplicate and missing-ID checks, and complete validation before the first scene mutation remain.

No local application command was run. Independent source review and exact-head GitHub checks are required before this card can be accepted. The prior run stopped in typecheck, before lint, tests, build, integration, or browser runtime.
