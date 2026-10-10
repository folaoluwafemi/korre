# Counterball — revised gameplay rules

Source: the user's dictated clarification in the local chat on 10 October 2026. These rules take precedence over the imported Counters specifications. The historical transcript remains unchanged.

## Name, pieces, and cultural direction

- Name the game **Counterball**.
- Launch with **seven bottle caps per player**. Seven reflects the minimum the user recalls. More caps were possible on larger smooth pavements; keep larger teams for later.
- Use an ordinary **plastic clothing button**, shaped like a small rigid disc. Preserve visible button holes for nostalgia.
- Build the Nigerian cultural details gradually, using the user's remembered play rather than inventing additional football rules.

## Normal play

- Retain alternating shots, any owned cap selection, and defensive repositioning.
- Retain the confirmed foul trigger: contact an opponent's cap without touching the button during that shot.
- Retain the target score, formations, goal resets, and open concrete surface from the current context.

## One shared restart mechanic

Fouls, throw-ins, and penalties use the same placed-shot mechanic. The user tentatively called this a “point play.” **Set play** is a proposed internal description, not an agreed cultural term. Player-facing event labels can remain **Foul**, **Throw-in**, and **Penalty**.

The awarded player places the button against the shooting cap:

1. Choose a position around the cap's circumference to aim the shot.
2. Adjust the button's tilt/contact angle against the cap to permit a lofted launch over other caps.
3. Flick to take the awarded shot.

“Around the cap” describes placement angle, not permission to choose an arbitrary distance from it. Exact contact geometry and lift controls need implementation and play tuning.

## Where each restart happens

| Event | Awarded player | Restart location |
|---|---|---|
| Ordinary foul | Opponent of the offending player | At or around the foul location |
| Button leaves the pitch | Opponent of the player who sent it out | At or around the button's boundary exit point |
| Penalty-area foul | Opponent of the defending player who committed the foul | At the edge of that penalty box |

Out of bounds is treated as conceding a foul. A penalty replaces the ordinary foul restart; it does not stack another reward on top.

## Superseded rule

The earlier automatic **two consecutive shots** award is superseded by the user's new recollection of a **placed restart**. Working interpretation: the player receives one awarded restart shot, then normal alternation continues. This interpretation should remain visible to the user rather than silently retain bonus-shot counters.

## Shooting cap and available space

The user confirmed that **any owned cap may move to the restart location**. The shooting cap does not need to be nearby.

Use the available space around the restart point. Do not move opponent caps to clear space. Adjust the button's placement and tilt to make a shot in crowded positions, including lofting over obstructing caps.

The user is unsure whether other friendly caps could be moved to clear space. **Provisional launch rule:** move only the selected shooting cap; leave every other cap in place. This is a practical default, not a confirmed traditional rule.

Placement must not overlap other pieces. Exact placement tolerance and handling of a completely blocked restart point need play testing; do not silently clear the surrounding pieces.

## Remaining tuning details

The exact position along the penalty-box edge, goalkeeper-specific behaviour, and tolerances for placement are not specified. Do not treat proposed values as traditional rules.

## Implementation effect

Use a shared placed-restart phase with a restart reason and location. Keep radial button placement and button tilt separate. Ordinary shots continue to use cap aim and force. Keep rule state independent of rendering and physics meshes.

The shooting-cap placement permission is settled. The first pitch/button/flick prototype can proceed, with crowded restart handling tuned during play.
