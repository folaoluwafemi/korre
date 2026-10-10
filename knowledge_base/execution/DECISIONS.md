# Counterball decision register

Prepared 10 October 2026. `confirmed` means stated by the human. `default` means an implementation choice that can change through play. Defaults do not claim to be traditional rules.

| ID | Status | Decision |
|---|---|---|
| D01 | confirmed | Name: Counterball. Korre is the platform. Game ID: `counterball`. |
| D02 | confirmed | Seven caps per player for launch. Larger teams later. |
| D03 | confirmed | Ordinary plastic clothing button with visible holes. Rigid-body physics. |
| D04 | confirmed | Open smooth textured green concrete. No enclosing walls. |
| D05 | confirmed | Alternate shots. Any owned cap may be flicked for attack or defence. |
| D06 | confirmed | Cap contact with an opponent without button contact during that shot is a foul. Button contact anywhere in the shot prevents that stated foul. |
| D07 | confirmed | Fouls, exits, and penalties share a button-against-cap placed-shot mechanic. Button placement around the cap and tilt allow direction and loft. |
| D08 | confirmed | Ordinary foul restart near foul location; out restart near button exit; penalty at defending penalty-box edge. |
| D09 | confirmed | Any owned cap may relocate to take a restart. Use available space. Do not move opponent caps. |
| D10 | default | Only selected shooting cap may move during placement. Other friendly caps remain fixed because the user's memory is uncertain. |
| D11 | clarified interpretation | One awarded placed shot, then normal alternation. Earlier two-shot bonus is superseded. A penalty substitutes for an ordinary restart and adds no extra-shot award. Keep this visible during playtest. |
| D12 | confirmed | First to three by default; private matches can choose target score. Goals reset to chosen formations. |
| D13 | confirmed | Local AI; server-authoritative online duels. One basic AI, not three difficulty modes. |
| D14 | confirmed | Babylon.js/Havok, TypeScript, feature-first modular structure. Domain state independent of rendering. |
| D15 | confirmed | Cloudflare frontend/assets/Workers/DOs, Railway API/PostgreSQL initially. OCI later. |
| D16 | confirmed | Unique username required before any actual match, including AI. Email optional later. |
| D17 | confirmed | Friends, spectator invitations, waiting queue, private duels, casual matchmaking. Video streaming later. |
| D18 | confirmed | Vibrant Nigerian nostalgia. Ordinary English is valid; no forced Pidgin. Cultural details grow gradually. |
| D19 | default | A keeper is just a cap positioned near the goal. Same flick and foul rules; no extra goalkeeper powers. |
| D20 | default | Whole button crosses goal plane between posts and below crossbar. Own goals credit opposite defending side. |
| D21 | default | Random first player selected once and persisted. Conceding player starts after a goal. |
| D22 | default | Foul outranks scorer's goal; a valid goal outranks an exit beyond that goal. Specific event ordering in GAMEPLAY/CONTRACTS governs ambiguous cases. |
| D23 | default | Button exit charged to last team whose cap touched it in that shot; if no recorded contact use shooting team. Clear attribution each shot. |
| D24 | default | Penalty spot centred along the front edge of the defending penalty box, not a football penalty spot. Tunable and explicitly provisional. |
| D25 | default | Collision-free restart placement within bounded tolerance around anchor. Never clear pieces automatically. If no owned cap has a legal placement, pause in placementBlocked. Offer snapshot/inspection/leave; leaving this blocked match abandons without winner. No online reset action. Dev reset creates a new zero-score match. Frequent blocked cases require user playtest input before launch. |
| D26 | default | Caps that fall out return near their exit point without moving other pieces or extra foul. If no safe position exists, use the same recoverable blocked treatment. |
| D27 | default | Match pause on player disconnect; 60-second reconnect window then forfeit. Two absent players cause abandoned result, not a fabricated winner. |
| D28 | default | Winner stays in private queue; next friend opts into next match. Spectators cannot act. |
| D29 | default | Share links and username invites launch first. Email sends remain external-blocked until provider and recipient flow exist. Optional email is not proof of verified ownership. |
| D30 | default | Username uniqueness is case-insensitive. Secret device session authenticates; recovery code optional and shown once. Name alone never restores access. |
| D31 | default | Only the selected shooting cap's opponent contacts trigger the ordinary foul. Secondary chain contacts are not new fouls. Full-shot selected-cap button contact exempts that foul. |
| D32 | default | Attribute an exit using contacts at or before its crossing, never contacts later in the shot. Full-shot contacts still govern the user's button-contact foul exemption. |
| D33 | default | Disconnect pauses new commands. An already accepted shot may settle and commit; preserve paused status until reconnect. Terminal outcomes never unlock another shot. |
| D34 | confirmed | Use a monorepo. One pnpm workspace and lockfile hold apps, the Counterball game package, and shared packages. |
| D35 | default | Physical goal-frame radius is 0.06 world units and support slab thickness is 0.20; the slab top equals surfaceY. These initial collision proportions are tunable geometry defaults, not remembered traditional rules or measured pavement dimensions. |
| D36 | default | Registration is limited to five requests per hour per client address; recovery is limited to five per hour per address and normalized username. Persist only keyed HMAC rate-limit buckets, not raw address or username. This is an operational security default, not a cultural rule. |
| D37 | default | Initial gravity is `{x:0,y:-9.81,z:0}` game units/s², stored in canonical simulation config and included in configHash. World units are arbitrary; gravity and shot feel remain tunable and need actual Havok measurements/playtest. |
| D38 | default | Diagnostic vertical clearance tolerance is 0.005 arbitrary game units, about one ninth of the button thickness. This engineering margin is provisional and config-hashed. A peak above this margin does not prove obstacle traversal; report sampled clearance and actual contacts separately. It is not a cultural rule or an input the user must provide. |

## Numeric tuning configuration v1

Canonical axes: x across pitch, y up, z along pitch. World unit is an arbitrary consistent game unit. Values below are initial tuning, not measured Nigerian pavement dimensions.

| Setting | Initial value | Reason/check |
|---|---:|---|
| Pitch width / length | 12 / 20 | Seven caps fit without crowding the opening |
| Cap radius / height | 0.32 / 0.12 | Disc approximation; render crown rim separately |
| Button radius / thickness | 0.13 / 0.045 | Smaller plastic disc; visual holes do not require complex collision holes |
| Cap mass / button mass | 1 / 0.15 | Relative units, tune feel |
| Goal width / height | 2.4 / 0.8 | Loft can miss over goal |
| Penalty box width / depth | 5 / 3.5 | Tunable football-like marking |
| Fixed simulation dt | 1/120 second | Render framerate must not alter authority |
| Gravity | `{x:0,y:-9.81,z:0}` game units/s² | Provisional; explicit canonical input so local and Worker worlds agree |
| Maximum simulated shot duration | 15 seconds | Fail/restore on runaway instead of silently awarding outcome |
| Settling window | 0.5 seconds | All movable objects continuously below velocity limits |
| Linear / angular settle threshold | 0.03 / 0.1 | Tune against perceptible drift |
| Placement anchor tolerance | 0.64 | One cap diameter; server validates, no extra caps move |
| Restart tilt range | 0–60 degrees | Tunable contact/lift mapping; no arbitrary button teleport |
| Normalized power | 0–1 | UI clamps; authority rejects values outside range; max impulse tuned in adapter |
| Playback sample rate | 30 Hz | Physics remains 120 Hz; preserve all decisive event times |
| Input action payload limit | 4 KiB | Prevent unbounded client messages |
| Playback chunk limit | 32 KiB encoded | Split frames; message count and duration bounded |
| Invitation lifetime | 24 hours | Proposed; private room invitations revocable |
| Reconnect grace | 60 seconds | Proposed; server deadlines authoritative |

Friction, restitution, damping, impulse, and lift mapping live in one versioned config. Choose pinned defaults in T02 and record actual values. No agent invents its own constants. A physical tuning change updates `configHash`; a rule change updates `rulesVersion`. Neither may silently alter a running online match.

## No launch expansion

Do not add ranking, monetisation, video streaming, creator sandbox, custom weights, UGC uploads, chat, payments, extra AI difficulty screens, or more teams. Cap artwork begins with original nostalgic designs; imported visual references are not production art licenses.

## Open items and bounded treatment

- User uncertainty about moving other friendly caps: use D10 until playtest changes it.
- Completely crowded restart: do not move other pieces; blocked-state treatment D25 is a provisional safeguard. Report frequency during testing and request a rule only if encountered.
- Penalty edge/keeper detail: use D19/D24, show during prototype review.
- Staging credentials and real-phone playtest: external dependencies, not reasons to stop all local work.
