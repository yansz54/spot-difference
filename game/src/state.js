// The rules of Twilight Harbor: what state a game is in, what a click does,
// how hints, strikes, the timer and the stars work. Nothing here draws or
// listens: main.js owns the loop and the screen, input.js owns the pointer
// and the keys, render.js owns the frame. This file only decides.
import { LEVELS, starsForLevel } from './scenes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_LEVEL_COMPLETE = 'levelComplete';
export const SCREEN_WIN = 'win';
export const SCREEN_PAUSED = 'paused';

export const MAX_STRIKES = 3;
export const HINTS_PER_LEVEL = 3;
export const WRONG_CLICK_PENALTY_SECONDS = 5;
export const HINT_HOLD_SECONDS = 4;

/** A fresh game, waiting on the title screen. */
export function createState() {
  return {
    screen: SCREEN_TITLE,
    levelIndex: 0,
    found: new Set(),
    strikes: 0,
    hintsLeft: HINTS_PER_LEVEL,
    hint: null, // {difference, until} while a hint ring is showing
    levelSeconds: 0,
    totalSeconds: 0,
    totalStars: 0,
    levelStars: [],
    wrongMarks: [], // {x, y, at} red X flashes for wrong clicks
    lastFound: null, // {difference, at} for the happy pulse on a find
    message: '',
    messageAt: 0,
    muted: false,
    // The keyboard reticle, in scene space (left panel coordinates).
    reticle: { x: 300, y: 280, visible: false },
  };
}

export function currentLevel(state) {
  return LEVELS[state.levelIndex];
}

/** Begin a level from scratch: fresh finds, strikes, hints and timer. */
export function startLevel(state, levelIndex) {
  state.levelIndex = levelIndex;
  state.found = new Set();
  state.strikes = 0;
  state.hintsLeft = HINTS_PER_LEVEL;
  state.hint = null;
  state.levelSeconds = 0;
  state.wrongMarks = [];
  state.lastFound = null;
  state.message = '';
  state.screen = SCREEN_PLAY;
  state.reticle = { x: 300, y: 280, visible: false };
}

/** Start the whole game from level 1. */
export function startGame(state) {
  state.totalSeconds = 0;
  state.totalStars = 0;
  state.levelStars = [];
  startLevel(state, 0);
}

/** The nearest difference to (x, y) in scene space, within its hit radius. */
export function differenceAt(level, x, y) {
  let best = null;
  let bestDistance = Infinity;
  for (const difference of level.differences) {
    const distance = Math.hypot(difference.x - x, difference.y - y);
    if (distance <= difference.r && distance < bestDistance) {
      best = difference;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Mark the spot (x, y) in scene space. Returns 'found', 'already' or
 * 'wrong'. A find circles the difference on both panels; a wrong click
 * costs a strike and five seconds on the clock.
 */
export function markAt(state, x, y, nowMs) {
  if (state.screen !== SCREEN_PLAY) return 'idle';
  const level = currentLevel(state);
  const difference = differenceAt(level, x, y);
  if (!difference) {
    state.strikes += 1;
    state.levelSeconds += WRONG_CLICK_PENALTY_SECONDS;
    state.wrongMarks.push({ x, y, at: nowMs });
    state.message = 'Not a difference — +' + WRONG_CLICK_PENALTY_SECONDS + 's';
    state.messageAt = nowMs;
    return 'wrong';
  }
  if (state.found.has(difference.id)) {
    state.message = 'Already found: ' + difference.label;
    state.messageAt = nowMs;
    return 'already';
  }
  state.found.add(difference.id);
  state.lastFound = { difference, at: nowMs };
  state.message = 'Found it! ' + difference.label + ' (' + state.found.size + ' / ' + level.differences.length + ')';
  state.messageAt = nowMs;
  if (state.found.size === level.differences.length) {
    finishLevel(state, nowMs);
    return 'complete';
  }
  return 'found';
}

/** The level is done: bank its stars and time, and open the results screen. */
export function finishLevel(state, nowMs) {
  const level = currentLevel(state);
  const stars = starsForLevel(level, state.levelSeconds, state.strikes);
  state.levelStars[state.levelIndex] = stars;
  state.totalStars += stars;
  state.totalSeconds += state.levelSeconds;
  state.screen = SCREEN_LEVEL_COMPLETE;
  state.message = '';
  state.messageAt = nowMs;
}

/** Move on: the next level, or the win screen after the last one. */
export function nextLevel(state) {
  if (state.levelIndex + 1 < LEVELS.length) {
    startLevel(state, state.levelIndex + 1);
  } else {
    state.screen = SCREEN_WIN;
  }
}

/** Spend one hint: light up one difference the player has not found yet. */
export function useHint(state, nowMs) {
  if (state.screen !== SCREEN_PLAY) return null;
  if (state.hintsLeft <= 0) {
    state.message = 'No hints left on this level';
    state.messageAt = nowMs;
    return null;
  }
  const level = currentLevel(state);
  const remaining = level.differences.filter((d) => !state.found.has(d.id));
  if (remaining.length === 0) return null;
  // The hint picks the difference nearest the reticle, so it feels helpful
  // rather than random; with the reticle hidden it takes the first one.
  let best = remaining[0];
  let bestDistance = Infinity;
  for (const difference of remaining) {
    const distance = Math.hypot(difference.x - state.reticle.x, difference.y - state.reticle.y);
    if (distance < bestDistance) {
      best = difference;
      bestDistance = distance;
    }
  }
  state.hintsLeft -= 1;
  state.hint = { difference: best, until: nowMs + HINT_HOLD_SECONDS * 1000 };
  state.message = 'Hint: look near ' + best.label.toLowerCase();
  state.messageAt = nowMs;
  return best;
}

/** Advance the clocks; drop expired hint rings and old wrong-click marks. */
export function tick(state, dtSeconds, nowMs) {
  if (state.screen === SCREEN_PLAY) {
    state.levelSeconds += dtSeconds;
  }
  if (state.hint && nowMs > state.hint.until) state.hint = null;
  state.wrongMarks = state.wrongMarks.filter((mark) => nowMs - mark.at < 1200);
  if (state.lastFound && nowMs - state.lastFound.at > 1200) state.lastFound = null;
  if (state.message && nowMs - state.messageAt > 2600) state.message = '';
}
