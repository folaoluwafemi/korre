# Concrete completion checks

Each row is mandatory proof at that milestone, not a suggested test name. Cards supply exact future files and commands. Existing tests remain regression coverage. Every real-engine/DB/browser/deployment claim needs its own executed evidence.

## T02 physics and T05 first flick

| Case | Required observation |
|---|---|
| Normal shot | Owned cap moves and genuinely contacts/moves the button under the pinned runtime. Zero power never invents a shot impulse. |
| Restart setup | Any owned cap, including a distant cap, can relocate legally; only that cap and button setup differ. Button pose uses accepted helper, radius and tilt. |
| Loft | Whole button traverses an intervening cap with observed collision-free clearance; actual contact log and full-rate transforms support the result. Positive peak alone fails. |
| Side/end/goal | Swept whole-body geometry, oriented button support, posts/crossbar and corner ties produce finite ordered facts at physics resolution. |
| Full settling | All 15 bodies satisfy linear AND angular thresholds continuously for the entire quiet window. Exits do not create perpetual falling or hidden deletions. |
| Failure | Initialization/nonfinite/workload/time-limit/cancellation yield typed errors, restore upstream checkpoint, dispose resources and return no partial success. |
| Isolation | Repeated and overlapping independent shots preserve snapshots and world ownership; no mutable globally shared room world. |
| Playback | Initial and exact final frames, 30 Hz samples, finite IDs/poses and bounded frame/fact counts; final pose matches settled result at 30/60 Hz presentation. |
| Browser action | Mouse and touch produce one command; second finger, pointercancel, lost capture, resize/unmount and cancel produce no stray shot. Keyboard can aim/fire. |

## T06–T09 complete local match

| Rule | Required positive/negative cases |
|---|---|
| Ordinary foul | Selected cap touches opponent and never button => one restart; opponent then button anywhere in same shot => stated exemption. Secondary chain contacts do not invent fouls. |
| Attribution/ordering | Same-step contact/crossing stable tie; contact after exit does not change exit attribution, but full-shot button contact still supplies foul exemption. Foul/goal/exit ordering matches canonical rules. |
| Goals | Whole button between posts/below crossbar; above crossbar out; own goal credits opposite defending team; valid goal and later exit award no duplicate result. |
| Turn/reward | No-contact shot alternates; one placed restart then alternation; penalty substitutes ordinary restart. No extra-shot bank. |
| Restarts | Foul/exit anchor, separate horizontal inset, penalty-box edge, any owned cap, all other caps byte-identical during setup, overlap rejects without mutation. |
| Crowding | Invalid attempted placement leaves restart active. Bounded all-owned-cap search supports placementBlocked only under its documented criterion; never move other pieces. |
| Formations/returns | Two seven-cap mirrored presets, no fresh overlap; cap returns preserve other pieces; failed safe return follows documented blocked treatment. |
| Match lifecycle | First-to-three, terminal input lock, chosen formation reset after goal, rematch fresh matchId, full checkpoint on abort, no listener/world leak after repeated matches. |

Script complete local matches including normal shot, foul, exit, penalty, goal and target victory using the real runner. Pure fixtures can verify rare rule precedence, but cannot replace real complete-match proof. Test-only deterministic replay/injection helpers must be excluded from the production bundle.

## T10–T12 AI and identity

AI evaluates bounded legal normal/restart candidates using the same runner/referee, remains beatable, cancels on rematch/disposal and never acts outside its turn. Blocking the event loop while evaluating is a failure. Prove a complete AI match, not just a chosen command.

Real API/database claim, restore, session expiry/revocation, name conflict, CSRF/logout and one-use recovery are already tested. Preserve them and add actual browser-to-HTTP-server/proxy-to-PostgreSQL coverage. Two browser users with the same normalized name cannot both claim it. Authentication secrets may travel only through their canonical protected identity request/one-time recovery response; they never enter game messages/state, localStorage, URLs, browser bundles or public logs. Missing identity blocks all shipped AI/online routes; dev harness is explicit and build-excluded.

## T04 and T13–T17 online authority

T04 needs a staging deployment/version, actual pinned WASM and adapter, plausible cap/button movement, cold start, two isolated rooms and typed failure evidence. No mock/dry-run/Node substitute. Missing staging access blocks only this external check and its actual dependents.

Run two independent browser contexts/accounts against actual Worker/DO authority and real persistence. Verify command rejection for wrong actor/team/phase/version, bad Origin/ticket replay, spectator writes and oversized messages. Duplicates while accepted/committed/aborted have one effect. Same action ID with changed payload conflicts; stale revision cannot replay after a dedup check.

Test independent concurrent rooms, one busy room, lost/reordered playback chunks, clock skew, background tabs, late join mid-playback and snapshot recovery. Players/spectators converge on the same committed state. Camera and skipped cinematic change no authority.

Crash after accepted-before-commit => recorded abort/checkpoint at a new monotone revision. Crash after commit => reuse stored result; never rerun as though deterministic. Disconnect/pause survives an in-flight commit. Forfeit/abandon cancels reservation; late results cannot resurrect terminal state. Playback/reconnect deadlines use durable alarms. Hibernation must restore membership/state, not trust an in-memory map.

Result outbox persists through API outage and clears only after real idempotent PostgreSQL acknowledgement. Same result hash retries safely; conflicting matchId/hash fails without overwriting. Public edge cannot reach internal ingestion routes.

## T18–T20 social flows

Host-only invite creation/revocation; authenticated recipient-bound redemption with role/expiry/count/replay limits. Spectator remains read-only. Username inbox failures grant no room authorization. Unknown/private rooms disclose no roster before authorization.

Private queue mutations are idempotent, ordered and consent-based; rematch gets a fresh matchId, requires both seats, and preserves version/formation constraints. Public matchmaking tests concurrent joins, duplicate/replayed joins, cancellation/expiry, one reservation per player, private/public isolation and stale reservation repair. No accidental unsolicited matches.

## T21–T24 release evidence

Measure gameplay frame pacing, responsiveness, lazy WASM/scene loading and hidden/idle resource use. Preserve graphics retry, focus, reduced-motion, audio gesture/mute and keyboard behavior. Browser emulation is a useful gate but not physical-device evidence.

Actual modest Android Chrome and actual iOS Safari checks record device/OS/browser, build SHA, normal/restart/loft/full match, portrait/landscape, pinch/cancel, reconnect and observed performance. Original 30/60 FPS targets need measured results; do not certify them from screenshots. An unavailable phone is a specific BLOCKED release check.

Staging needs deployed same-origin secure cookies, WebSocket authorization, WASM MIME/CSP, API readiness, migration/backups and reversible code rollout. A liveness `/health` is not DB readiness. No destructive migration rollback. Final playtest covers D10/D11/D19/D24/D25 cultural defaults and feel. Production is a separate specific human authorization after reviewable staging; absent approval, deliver staging-ready artifacts and explicit blocked publication.
