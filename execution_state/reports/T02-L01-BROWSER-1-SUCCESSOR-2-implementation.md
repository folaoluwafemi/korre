# T02-L01-BROWSER-1-SUCCESSOR-2 implementation

## Change

The packet extraction returned PASS for plan consistency and `ready: false`
because this packet is already RUNNING. Its required parent acceptance is T01,
which is ACCEPTED. The packet preserves the original L01 dependencies and
requires the accepted prior run review.

Changed only `apps/web/src/CounterballDirectProbe.tsx`. In the nested
`catch (cleanupError)`, the `AggregateError` options now use
`{ cause: cleanupError }`. The errors iterable remains `[error, cleanupError]`,
and the message, cleanup call, surrounding catch flow, and all cleanup behavior
are unchanged.

The precise one-line diff is:

```diff
-        { cause: error },
+        { cause: cleanupError },
```

This matches run `38427239299` on commit
`829e160e1cd8264bd406959301b8ffe63c68dc1e`, whose Verify lint diagnostic
identifies `cleanupError` as the nested caught error and rejects `error` as the
cause value.

## Checks and limits

- `node scripts/check-completion-plan.mjs --packet T02-L01-BROWSER-1-SUCCESSOR-2` — PASS for plan consistency; no
  implementation/runtime check ran in the extractor.
- `git diff --check -- apps/web/src/CounterballDirectProbe.tsx` — exit 0.
- Local typecheck, lint, tests, build, browser, OPFS, and physics checks — NOT RUN.
- Hosted checks and independent review for this exact change — PENDING.

This source repair alone does not prove the browser flick, OPFS transport,
production exclusion, deployed Havok, or playability.
