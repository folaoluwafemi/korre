# T02-L01-CONTACT-ONSET-ADAPTER-1 implementation

## Scope and result

Implemented the internal public-API adapter and focused unit coverage in the two assigned source files. The helper validates the pinned runtime flag wrapper as a positive safe single uint32 bit, validates all 22 body IDs and method shapes before mutation, sets every mask in canonical order, then reads every mask in canonical order. It returns the exact `COLLISION_STARTED` subscription facts only when every readback equals the requested mask. Setter/getter exceptions propagate and no failure path returns subscription facts.

The tests cover canonical all-22 set-then-read ordering and metadata, malformed flag shapes and values, missing/duplicate/out-of-order bodies, a missing getter, setter/getter exceptions, and missing/mismatched readback values. The tests use structural stubs only; they do not claim native event-delivery or matrix proof. No package barrel, runner, config, contract, or status file was changed.

## Source hashes

- `games/counterball/src/simulation/nativeCollisionSubscription.ts`: `8D7CB802CA5996BCB07462C13C3FC46199D70CA960F5CFD8D44935489B0B4C9C`
- `games/counterball/src/simulation/nativeCollisionSubscription.test.ts`: `A08D4E0B5706741EA0FD0A7250BC21BEB19858999ED72E7BC8C42B0E435B3928`

## Checks and limits

The assigned scoped `git diff --check` command returned exit code 0. Both source files are new and remain untracked, so Git had no tracked diff hunks to inspect with that command. No install, typecheck, lint, formatter, test, build, browser, or physics command was run locally. Independent source review and the coordinator's GitHub Verify/build/integration/preview checks remain pending. The old native contact-budget failure, native onset delivery, all-22 proof in Havok, and full 24-case matrix remain unverified and unaccepted.
