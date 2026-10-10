# Korre Counterball — working context

Imported on 10 October 2026 from [Branch · Plan Counters Game UX](https://chatgpt.com/share/6ac982b4-b490-83e9-a223-d8aa0bf771af).

Read this first for the latest state. [README.md](README.md) contains the complete visible conversation. [conversation.json](conversation.json) preserves original message text, component definitions, and source metadata. The last audit corrects several earlier summaries. Historical proposals do not become confirmed requirements merely because an assistant called them final.

The user's clarification in this local chat on 10 October 2026 supersedes the imported foul rewards and restart questions. The game is now **Counterball**. [COUNTERBALL_RULES.md](COUNTERBALL_RULES.md) records the revised rules and placement permissions.

The user explicitly confirmed a monorepo and requested a detailed plan for a less capable model using subagents. The [execution plan](execution/README.md) defines the pnpm workspace, canonical contracts, 25 ordered task cards, bounded swarm workflow, and review gates. Use [START_HERE](execution/START_HERE.md) for the implementation prompt. The plan is prepared; application tasks are not yet executed.

## Product and priorities

- Korre is a free-to-play ecosystem for multiple games. Counterball is the first game.
- Recreate the Nigerian childhood game: flick metal beverage bottle caps to strike a clothing button into a goal.
- [NaijaGames](https://naijagames.app/) supplies the initial interaction reference. The original screenshot is now available at [assets/image(2).png](assets/image%282%29.png).
- Ship Counterball quickly. Build small reusable contracts without building a general game engine or a physics benchmarking project.
- Future plans include a Kraddle-based AI game creation harness. Those plans inform boundaries but do not expand launch scope.

## Confirmed direction

| Area | Latest decision |
|---|---|
| Platform | Web first, including mobile browsers |
| Engine | Babylon.js with modular imports |
| Physics | Havok WASM; realistic physical feel |
| Modes | Human vs one basic AI opponent; online human vs human duels |
| Match target | First to 3 goals by default; configurable target for private matches |
| Pitch | Larger, open, textured green concrete; objects can leave the surface |
| Pieces | Nostalgic Nigerian beverage bottle caps and a small plastic clothing button with visible holes |
| Cap count | Seven per player for launch; larger teams remain a future option |
| Turns | Alternate shots; select any owned cap, including for defensive repositioning |
| Ordinary foul | Hit an opponent's cap without touching the button during the shot |
| Contact order | Button contact anywhere during the shot prevents that stated foul |
| Foul award | Opponent receives a placed restart at the foul location; this supersedes the earlier two-shot award |
| Penalty trigger | Foul against the opponent inside the defending player's own penalty area |
| Out of bounds | The player who sends the button out concedes a foul; opponent restarts around the exit point |
| Special restarts | Same placement mechanic for fouls, throw-ins, and penalties: choose button position around the shooting cap and its tilt against the cap for a lofted shot |
| Penalty restart | Replace the ordinary foul restart; take the shot at the edge of the penalty box |
| Shooting cap for restarts | Move any owned cap to the restart location; use available space without moving opponent caps |
| Goals | Reset button and caps; retain each player's selected formation |
| Formations | Choose from football formations valid for seven caps |
| Camera | Orbit, zoom, reset, and cinematic flick playback; preserve the player's view |
| Cinematics | Skippable and independently disableable; do not affect outcomes |
| Identity | Unique username required before any play; persistent player ID and authenticated session |
| Email | Optional later, especially for recovery; no mandatory email during initial play |
| Onboarding | Game-focused and informal: ask for a username, without a welcome or signup ceremony |
| Social play | Private duels, friend invitations, waiting friends, and invited spectators |
| Spectating | Receive match state and render locally; spectators cannot submit shots |
| Public play | Casual matchmaking; competitive ranking comes later |
| Visuals | Vibrant, tactile, playful Nigerian nostalgia; strong colour and warm lighting |
| Assets | Procedural first; a realistic imported hand is optional, not a launch dependency |
| Copy | Natural English for function; Nigerian character where it feels natural |

The button is confirmed as an ordinary plastic clothing button. Preserve its visible holes for nostalgia. Treat it as a small rigid disc, not cloth.

## Technical direction

- TypeScript monorepo with feature-first modules.
- Each feature uses `domain`, `application`, `infrastructure`, and `presentation` only when needed.
- Domain rules and gameplay state must not depend on Babylon meshes or rendering.
- Korre owns identity, rooms, transport, matchmaking, and spectators. Counterball owns its rules, simulation, AI, input, and presentation.
- Keep a small engine-agnostic game SDK, lifecycle contract, manifest, and versioned action/event protocol.
- Local Havok runs AI matches. Online shots use server authority in Cloudflare Durable Objects.
- Clients submit intent. The server validates ownership, active player, state version, and legality before simulation.
- Distribute authoritative trajectories and final state. Clients interpolate playback instead of assuming deterministic independent physics.
- Use Cloudflare for frontend/assets, Workers, and Durable Object rooms. Offload as much as practical from Railway.
- Start with Railway for the API/identity service and PostgreSQL. OCI remains a later hosting option.
- A simulation runner interface permits a Railway fallback if the real Cloudflare integration fails. Do not build the fallback service upfront.
- Persist accepted actions and settled results. Support idempotency, checkpoints, reconnection, and late spectators.
- Prefer WebGL2 initially, lazy-loaded Havok/game assets, shared cap geometry, and adjustable mobile graphics.

### Cloudflare correction from the final audit

The earlier “80 MiB per match” allocation was withdrawn. The cited 128 MB limit is per isolate, and multiple Durable Objects may share an isolate. Historical Havok heap figures do not establish current peak memory usage.

Proceed with Havok in Durable Objects as the chosen integration direction. Early backend work should load the actual WASM and resolve one shot in the deployed runtime. That checks compatibility without creating a separate benchmarking project. This import does not independently revalidate the historical platform limits.

## Questions still open

The local clarification answers the cap count, button material, penalty award, restart location, and shooting-cap movement questions. Any owned cap can move to the restart location. Opponent caps stay in place.

Moving additional friendly caps to clear space remains uncertain in the user's memory. Provisional launch rule: move only the selected shooting cap, with all other caps left in place. Button angle and loft help handle crowded restarts.

The exact point along the penalty-box edge and any special goalkeeper restrictions remain unspecified. Keep those details distinct from confirmed rules. No additional goalkeeper behaviour has been agreed.

## Proposed defaults, not confirmed choices

The final audit suggests the following defaults. Preserve their provisional status until accepted or checked during implementation.

- Count a goal when the whole button crosses the goal line between posts and below goal height.
- Treat goal-line exits outside the goal as throw-ins unless corners or goal kicks are requested.
- Return caps that leave the pitch near the exit point, without overlap or another penalty.
- Randomly choose the starting player. The conceding player starts after a goal.
- A foul invalidates the offending player's goal in the same shot.
- A subsequent foul awards another placed restart rather than accumulating bonus shots. This follows the revised restart model; verify the final turn transition during implementation.
- End simulation after sustained low movement, with a maximum simulated duration.
- Allow a 60-second reconnect window before forfeit.
- Private queue: winner stays, next waiting friend challenges.
- Start invitations with usernames and shareable links. Actual email invitations require an email provider.
- Offer an optional recovery code for accounts without email. A username alone must never authenticate an account.
- Tune dimensions, friction, masses, shot strength, and formation spacing through play.

## UX and delivery notes

- Touch: select a cap, pull back, release to shoot, and provide a clear cancel action. Camera gestures must not interfere.
- Send a shared playback start time. Late viewers need the current shot and playback position.
- Failed simulation restores the previous valid state. Duplicate action submission must not create another shot.
- Support browser backgrounding and reconnection.
- Add flick, collision, and goal sounds with mute controls.
- Provide loading failures, retries, cached assets, and a low graphics setting.
- “Play with Friends” is acceptable. Avoid forced Pidgin and unnatural phrases such as “you don collect extra turn.”
- The exploratory colours in the source are `#25B85A`, `#F8CE46`, `#F36B3F`, `#2455D6`, and `#172C23`. They are not a final brand palette.

## Deferred scope

Leaderboards, ranked competition, custom cap designs, adjustable rubber weights, extra game modes, video streaming, spectator chat, public live-match discovery, and the Kraddle creation harness remain later work. The open concrete pitch is already part of the current direction; the original wooden enclosure was superseded.

## Build sequence carried from the final audit

1. Shared physics and one convincing flick on a concrete pitch.
2. Complete local rules and restarts.
3. One basic AI opponent.
4. Username identity and session handling.
5. Online shot authority and recovery.
6. Spectating, invitations, and waiting friends.

Integrate the Cloudflare shot runner early. Continue with mobile controls, sounds, graphics, and cinematic polish throughout the playable work.

## Archive coverage

- 19 visible messages: 9 user messages and 10 assistant messages, including the final progress note and audit.
- 21 unique downloaded visual reference images under [assets](assets/README.md).
- Original uploaded `image(2).png`: supplied locally by the user on 10 October 2026. The screenshot shows seven caps per side, including one near each goal. The user confirmed seven caps per player for launch.
- Interactive UI code and its resolved image/citation metadata are preserved in `conversation.json`. Static Markdown cannot run those original controls.
- The full visible message text is preserved. Internal system records, hidden draft duplicates, tool traffic, and reasoning records are excluded.
