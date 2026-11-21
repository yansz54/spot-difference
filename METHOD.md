# METHOD.md — how Twilight Harbor was built

## The idea

A spot-the-difference game lives or dies by its pictures: they must be rich
enough to study, and the differences must be hidden by design rather than
by noise. So each of the three scenes is drawn procedurally on canvas —
sky gradients, a low sun or a winter moon, houses, boats, stalls, pines —
from a fixed seed per level. The left panel is the original; the right
panel is the same painter run with the level's eight differences applied.
Nothing is copied art: every shape is a canvas path written for this game.

## The three levels

| Level | Scene | Differences (8 each) |
|---|---|---|
| 1 | Twilight Harbor (dusk) | lighthouse beam, extra gull, lit window, rowboat, flag colour, pier crate, buoy colour, pier cat |
| 2 | Garden Market (day) | awning stripes, apples vs oranges, flower pot, parasol open vs folded, stall cat, bird on the wire, lantern lit, watering can |
| 3 | Mountain Village (night) | bright star, snowcap, lit window, chimney smoke, pine tree, sheep, waterfall, lantern colour |

Difficulty rises: level 1 changes are large and placed on strong focal
points; level 3 changes are smaller and tucked into busy areas (a single
star, a snowcap edge, a lantern's colour).

## Rules

- Click either picture (or move the reticle with the arrow keys and press
  Enter) to mark a spot. A hit inside a difference's radius rings it red
  on both panels and plays a two-note chime; a miss costs a strike and
  +5 seconds.
- 3 hints per level: a gold dashed ring pulses for 4 seconds around one
  unfound difference, chosen nearest the reticle.
- The timer counts up per level. Stars: 3 at the fast time, 2 at the
  middle time, else 1 — minus one star per two strikes, minimum 1.
- Level complete shows stars, time and strikes; finishing all three
  levels shows the win screen with total stars and time.

## Code layout

- `game/src/scenes.js` — level data: seeds, star times, the eight
  differences of each level as (x, y, radius) in 600×560 scene space.
- `game/src/painter.js` — the three scene painters plus the small
  shape helpers (cloud, gull, cat, pine, house, sparkle). Each painter
  takes the set of applied difference ids and draws the changed version.
- `game/src/state.js` — the state machine and the rules only.
- `game/src/render.js` — the frame: panel layout, labels, found rings,
  hint pulse, wrong-click X marks, keyboard reticle.
- `game/src/input.js` — mouse and keyboard, with canvas-to-scene mapping.
- `game/src/audio.js` — WebAudio synthesis (found chime, wrong buzz,
  hint pluck, level fanfare). No audio files.
- `game/src/random.js` — mulberry32, so a seed always draws the same scene.
- `game/src/shots.js` — the `?shot=` scenes: each stages a real game
  state through the same `markAt()` a player's click uses.
- `game/src/main.js` — bootstrap, HUD sync, overlay screens, game loop.

## Screenshots

Taken with Playwright driving desktop Chromium at 1280×800 against a
local static server, each a real render of the game's own code:

1. `1-cover.jpg` — level 1 mid-game, 3 of 8 found (rings visible), 5 unfound.
2. `2-market.jpg` — level 2 mid-game, 5 of 8 found.
3. `3-complete.jpg` — level 1 finished, stars and time on screen.
4. `4-hint.jpg` — level 3 mid-game, 2 found, a hint ring lit.

Each is a JPEG under 256 KiB (long side 1280, short side 800).

## Verification

- Played through level 1 in the browser: all 8 differences found, the
  level-complete screen appears with 3 stars; zero console errors and
  zero network requests outside `game/`.
- `main.ts` run locally with `MAKEFUN_OUTPUT_DIR=out`: `out/` holds
  `game/`, `screenshots/` and `dossier.json` as `buildDossier` writes it.
