# T02-L01-BROWSER-1-SUCCESSOR-1 implementation

## Change

The exact packet extraction passed plan consistency. It reports `ready: false`
because this successor is already in progress; the required parent acceptance
is T01, which is ACCEPTED. The successor preserves the accepted L01 dependency
set and the root TypeScript-configuration repair predecessor.

Changed only `apps/web/src/CounterballDirectProbe.tsx`, at the OPFS setup
cleanup catch. The `AggregateError` still contains `[error, cleanupError]` and
now also receives `{ cause: error }` as its third argument. This preserves the
original setup failure as `cause` and retains both failures in the errors
iterable; cleanup behavior is unchanged.

Exact diff:

```diff
       throw new AggregateError(
         [error, cleanupError],
         "OPFS setup failed and cleanup was incomplete.",
+        { cause: error },
       );
```

## Checks and limits

- `node scripts/check-completion-plan.mjs --packet T02-L01-BROWSER-1-SUCCESSOR-1` — PASS for plan consistency; no
  implementation or runtime checks were run by the extractor.
- `git diff --check -- apps/web/src/CounterballDirectProbe.tsx` — exit 0.
- Local typecheck, lint, tests, build, browser, OPFS, and physics checks — NOT RUN.
- Exact-head hosted validation and independent review — PENDING.

This one-line source repair does not establish a browser flick, OPFS transport,
production exclusion, deployed Havok, or playability.
