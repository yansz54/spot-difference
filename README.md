# Twilight Harbor — Spot the Difference

[![make.fun](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/yansz54/spot-difference/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/yansz54/spot-difference/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)

**Twilight Harbor** is an original spot-the-difference game: two pictures hang side by side, and eight small things changed in the right one. Find them all — click a difference, or move the glowing reticle with the arrow keys and press Enter.

## The game

Three hand-drawn scenes, each with 8 differences and rising difficulty:

1. **Twilight Harbor** — a sleepy harbor town at dusk: lighthouse beam, gulls, lit windows, boats, a buoy and the pier cat.
2. **Garden Market** — a sunny morning at the flower market: striped awnings, fruit baskets, a parasol, a bird on the wire and the stall cat.
3. **Mountain Village** — a quiet village under a winter moon: stars, snowcaps, chimney smoke, a waterfall and a sheep in the meadow.

Every picture is drawn procedurally on canvas from a fixed seed — no copied art, no stock images — so the same seed always draws the same two pictures.

## How it plays

- **Mouse:** click a difference on either picture. Found differences get a red ring on both panels.
- **Keyboard:** arrow keys move the reticle (Shift for big steps), Enter/Space marks, **H** spends a hint, **P** pauses, **R** restarts the level, **M** mutes.
- **Hints:** 3 per level — a gold ring pulses around one difference you haven't found yet.
- **Wrong clicks** cost a strike and 5 seconds. Finish a level fast and clean for 3 stars.
- **Sound:** every sound is synthesized with WebAudio — chimes, clicks and a little fanfare. No audio files.

## Play it

Serve `game/` with any static server and open `index.html` in desktop Chrome:

```sh
cd game && python3 -m http.server 8080
```

Then open http://localhost:8080. No network requests, no build step.

## Layout

- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored library.
- `game/index.html` — the page: canvas, HUD and overlay screens.
- `game/src/main.js` — bootstrap, render loop, HUD and screens.
- `game/src/state.js` — the rules: screens, marking, hints, strikes, timer, stars.
- `game/src/scenes.js` — the three levels: seeds and the eight differences of each.
- `game/src/painter.js` — the procedural painters: harbor, market and village, drawn twice (original and changed).
- `game/src/render.js` — the frame: panels, labels, found rings, hint pulse, reticle.
- `game/src/input.js` — mouse and keyboard.
- `game/src/audio.js` — synthesized WebAudio sounds.
- `game/src/random.js` — seeded random numbers.
- `game/src/shots.js` — the `?shot=` scenes the screenshots were taken in.
- `screenshots/` — 4 real renders of the game's own code in a browser.

Built for the [make.fun best spot the difference game bounty](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451).
