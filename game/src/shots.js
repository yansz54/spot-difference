// Screenshot scenes: the states the entry's screenshots are taken in.
// Each one plays the real rules forward from a fresh level — the same
// markAt() a player's click goes through — so the frame is what a real
// game looks like at that moment, and the same name always gives the same
// frame. Names: cover (level 1, 3 of 8 found), play2 (level 2, 5 of 8),
// complete (level 1 finished, stars on screen), hint (level 3, 2 found
// with a hint ring lit). Any other name stages the title screen.
import { LEVELS } from './scenes.js';
import { startLevel, markAt, useHint, SCREEN_PLAY } from './state.js';

function markFound(state, levelIndex, ids, nowMs) {
  const level = LEVELS[levelIndex];
  for (const id of ids) {
    const difference = level.differences.find((d) => d.id === id);
    if (difference) markAt(state, difference.x, difference.y, nowMs);
  }
}

/** Stage `name` on a fresh state and return the state, ready to render. */
export function stageShot(name, state, nowMs) {
  state.reticle.visible = false;
  if (name === 'cover') {
    startLevel(state, 0);
    markFound(state, 0, ['beam', 'window', 'buoy'], nowMs);
    state.levelSeconds = 47;
    state.screen = SCREEN_PLAY;
  } else if (name === 'play2') {
    startLevel(state, 1);
    markFound(state, 1, ['awning', 'fruit', 'cat', 'bird', 'can'], nowMs);
    state.levelSeconds = 92;
    state.screen = SCREEN_PLAY;
  } else if (name === 'complete') {
    startLevel(state, 0);
    state.levelSeconds = 52;
    markFound(state, 0, LEVELS[0].differences.map((d) => d.id), nowMs);
  } else if (name === 'hint') {
    startLevel(state, 2);
    markFound(state, 2, ['star', 'window'], nowMs);
    state.levelSeconds = 23;
    state.screen = SCREEN_PLAY;
    useHint(state, nowMs);
  }
  return state;
}
