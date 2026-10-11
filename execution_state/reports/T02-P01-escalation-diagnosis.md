# T02-P01 repair escalation diagnosis

Date: 2026-10-11

## Diagnosis

GitHub run 38104471030 at SHA 5d84c64ac3181ae959ccdf91cfb21e3c78fcc35f fails in the Counterball package typecheck with exactly three TS4111 errors in isPlaybackTransform: dot-property access to id, position, and rotation on a Record<string, unknown>. The package-export checks and headless bundle probe completed first. The typecheck then stopped the workflow; lint, unit tests, build, integration, browser tests, and physics/runtime checks were not reached.

## Smallest coordinator-owned correction

Replace only the three index-signature property reads in games/counterball/src/scene/presentation.ts:

```ts
isEntityId(value["id"]) &&
isFiniteVector3(value["position"]) &&
isFiniteQuaternion(value["rotation"])
```

TypeScript requires bracket access for these keys under the strict index-signature setting. This preserves the existing guards and narrows each unknown value before the complete PlaybackTransform predicate succeeds. It uses no any, cast, suppression, or lint-rule change.

## Contract and behavior preserved

The frozen presentation contract requires exactly one finite transform for each of the 15 canonical IDs and presentation-only updates. The proposed edit changes no predicate semantics: the array still enters through unknown and is narrowed to readonly unknown[]; every element must have a canonical ID and finite position/quaternion; duplicate IDs and missing IDs still fail; and validateSnapshots still completes before the updater mutates any scene roots. This is a type-access correction only.

Worker repair attempts are exhausted, so this is a coordinator-owned correction recommendation. No source or status file was edited here. This diagnosis is not source approval or runtime evidence. No gameplay, physics, or Havok claim is made.

\n