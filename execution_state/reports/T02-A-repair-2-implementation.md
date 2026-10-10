# T02-A repair 2 implementation

Implemented the bounded native-resource cleanup repair. Independent re-review is pending; this report does not accept T02-A or parent T02 and does not prove shots or deployed physics.

## Changed paths

- `games/counterball/src/simulation/worldFactory.ts`
- `games/counterball/src/simulation/worldFactory.test.ts`
- `execution_state/reports/T02-A-repair-2-implementation.md`

`createOwnedPlugin` provides a per-construction Proxy around the real initialized runtime without modifying the shared module. It intercepts only `HP_World_Create` and `HP_QueryCollector_Create`, records successfully returned native handles during synchronous plugin construction, and forwards other API reads. Success clears the tracking arrays and ends tracking, transferring ownership exclusively to normal Babylon plugin disposal. No later allocation is tracked or double-released.

If construction throws, every tracked collector is released through pinned `HP_QueryCollector_Release`, then every tracked world through `HP_World_Release`. Each release has its own handler so a release exception does not prevent subsequent cleanup. The original constructor exception is rethrown; the outer handler still disposes the owned Scene. Caller-owned Engine and shared runtime remain available. No geometry, calibration, protocol, fixture, or exports changed.

Inspected the installed `@babylonjs/core@9.30.0` HavokPlugin constructor and dispose method, plus `@babylonjs/havok@1.3.14` declarations: native world creation precedes query-collector creation; pinned release methods accept the corresponding native handle tuples. Constructor tracking checks the package's own `Result.RESULT_OK`, following the installed plugin's result comparison convention.

## Regression evidence

The new parameterized test initializes actual pinned WASM and calls genuine `HP_World_Create`, records its bigint native handle, then injects a one-time collector creation exception. It verifies:

- the original constructor error is observed by object identity;
- the genuine allocated world handle reaches `HP_World_Release` exactly once before recovery;
- the engine's scene list returns to its pre-construction baseline;
- the same Engine/runtime then create a real world with all fifteen match bodies;
- disposal of that recovered world returns the scene list to baseline and yields exactly two total world releases, one for each allocation.

The second parameter case calls the genuine world release and then injects a cleanup error, proving error preservation and scene cleanup despite that release exception. Failure injection is only cleanup evidence; actual construction/isolation/disposal tests remain in place and continue using real Havok WASM. Tests do not step the simulation.

## Commands actually run

Workspace: `C:\Users\USER\StudioProjects\korre`. Required commands were run separately in packet order.

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm.cmd --filter @korre/counterball typecheck` | 0 | TypeScript passes. |
| `pnpm.cmd --filter @korre/counterball exec vitest run --root ../.. --config vitest.config.ts games/counterball/src/simulation/worldFactory.test.ts` | 0 | 1 file, 6 tests passed. |
| `pnpm.cmd exec eslint games/counterball/src/simulation/worldFactory.ts games/counterball/src/simulation/worldFactory.test.ts --max-warnings=0` | 0 | No findings. |
| `pnpm.cmd exec prettier --check games/counterball/src/simulation/worldFactory.ts games/counterball/src/simulation/worldFactory.test.ts` | 0 | Both files pass. |
| `git diff --check` | 0 | No tracked-diff whitespace errors. Both simulation files are currently untracked, so this command does not examine their contents; the explicit Prettier check does. This report is also new/untracked. |

Preparation command `pnpm.cmd exec prettier --write games/counterball/src/simulation/worldFactory.ts games/counterball/src/simulation/worldFactory.test.ts` exited 0. Scoped `git status --short` exited 0 and confirmed the two source paths are untracked. All packet checks ran; no broad root test/lint/build, deployed Worker, shot, or real-phone checks were run or claimed. No task status or shared records changed. Stopped for independent review.
