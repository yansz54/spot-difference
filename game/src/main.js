// Twilight Harbor: bootstrap, the render loop, the HUD and the screens.
// The loop ticks the rules (state.js), draws the frame (render.js) and
// keeps the DOM HUD in step. Overlays are plain DOM so their text stays
// crisp: the title screen, the level results, the win screen and pause.
import { LEVELS, formatTime } from './scenes.js';
import {
  createState,
  startGame,
  startLevel,
  nextLevel,
  markAt,
  useHint,
  tick,
  currentLevel,
  SCREEN_TITLE,
  SCREEN_PLAY,
  SCREEN_LEVEL_COMPLETE,
  SCREEN_WIN,
  SCREEN_PAUSED,
} from './state.js';
import { drawFrame } from './render.js';
import { attachInput } from './input.js';
import { SoundEngine } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const levelLabel = document.getElementById('levelLabel');
const foundLabel = document.getElementById('foundLabel');
const timeLabel = document.getElementById('timeLabel');
const strikeLabel = document.getElementById('strikeLabel');
const hintButton = document.getElementById('hintBtn');
const pauseButton = document.getElementById('pauseBtn');
const restartButton = document.getElementById('restartBtn');
const soundButton = document.getElementById('soundBtn');
const messageBox = document.getElementById('message');
const overlay = document.getElementById('overlay');
const statusLine = document.getElementById('status');

const sound = new SoundEngine();
const state = createState();
window.__game = { state, LEVELS };

// --- canvas sizing -------------------------------------------------------
function resizeCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeCanvas);

// --- overlays ------------------------------------------------------------
function showOverlay(html) {
  overlay.innerHTML = html;
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
  overlay.innerHTML = '';
}

function starRow(stars) {
  return '★'.repeat(stars) + '☆'.repeat(3 - stars);
}

function showTitle() {
  const levels = LEVELS.map((level, index) => '<li><b>Level ' + (index + 1) + ' · ' + level.name + '</b> — ' + level.subtitle + ' · ' + level.differences.length + ' differences</li>').join('');
  showOverlay(
    '<div class="card">' +
      '<h1>Twilight Harbor</h1>' +
      '<p class="tagline">A spot-the-difference game in three hand-drawn scenes</p>' +
      '<p>Two pictures hang side by side. They look the same — but eight small things changed in the right one. Find them all: click a difference, or move the glowing reticle with the arrow keys and press Enter.</p>' +
      '<ul class="levels">' + levels + '</ul>' +
      '<p class="keys">Wrong clicks cost 5 seconds. <b>H</b> spends a hint, <b>P</b> pauses, <b>R</b> restarts the level, <b>M</b> mutes.</p>' +
      '<button id="startBtn" class="primary">Start playing</button>' +
      '</div>',
  );
  document.getElementById('startBtn').addEventListener('click', (event) => {
    event.currentTarget.blur();
    sound.ensure();
    sound.click();
    startGame(state);
    hideOverlay();
    announce('Level 1: Twilight Harbor. Find 8 differences.');
  });
}

function showLevelComplete() {
  const level = currentLevel(state);
  const stars = state.levelStars[state.levelIndex] || 1;
  const last = state.levelIndex === LEVELS.length - 1;
  showOverlay(
    '<div class="card">' +
      '<h2>Level complete!</h2>' +
      '<p class="stars">' + starRow(stars) + '</p>' +
      '<p>' + level.name + ' finished in <b>' + formatTime(state.levelSeconds) + '</b> with <b>' + state.strikes + '</b> wrong click' + (state.strikes === 1 ? '' : 's') + '.</p>' +
      '<p class="dim">Total so far: ' + state.totalStars + ' stars · ' + formatTime(state.totalSeconds) + '</p>' +
      '<button id="nextBtn" class="primary">' + (last ? 'See your results' : 'Next level') + '</button>' +
      '<button id="replayBtn">Replay this level</button>' +
      '</div>',
  );
  document.getElementById('nextBtn').addEventListener('click', (event) => {
    event.currentTarget.blur();
    sound.click();
    hideOverlay();
    nextLevel(state);
    if (state.screen === SCREEN_WIN) showWin();
    else announce('Level ' + (state.levelIndex + 1) + ': ' + currentLevel(state).name + '. Find ' + currentLevel(state).differences.length + ' differences.');
  });
  document.getElementById('replayBtn').addEventListener('click', (event) => {
    event.currentTarget.blur();
    sound.click();
    hideOverlay();
    startLevel(state, state.levelIndex);
  });
}

function showWin() {
  showOverlay(
    '<div class="card">' +
      '<h2>You found them all!</h2>' +
      '<p class="stars">' + starRow(Math.min(3, Math.round(state.totalStars / LEVELS.length))) + '</p>' +
      '<p>All three scenes, all 24 differences, in <b>' + formatTime(state.totalSeconds) + '</b> — ' + state.totalStars + ' stars out of 9.</p>' +
      '<p class="dim">Twilight Harbor, Garden Market and Mountain Village, cleared.</p>' +
      '<button id="againBtn" class="primary">Play again</button>' +
      '</div>',
  );
  document.getElementById('againBtn').addEventListener('click', (event) => {
    event.currentTarget.blur();
    sound.click();
    startGame(state);
    hideOverlay();
  });
}

function showPaused() {
  showOverlay(
    '<div class="card">' +
      '<h2>Paused</h2>' +
      '<p>Take a breath — the harbor will wait.</p>' +
      '<button id="resumeBtn" class="primary">Resume</button>' +
      '<button id="restartLevelBtn">Restart this level</button>' +
      '</div>',
  );
  document.getElementById('resumeBtn').addEventListener('click', (event) => {
    event.currentTarget.blur();
    sound.click();
    state.screen = SCREEN_PLAY;
    hideOverlay();
  });
  document.getElementById('restartLevelBtn').addEventListener('click', (event) => {
    event.currentTarget.blur();
    sound.click();
    hideOverlay();
    startLevel(state, state.levelIndex);
  });
}

function announce(text) {
  statusLine.textContent = text;
}

// --- actions -------------------------------------------------------------
function doMark(x, y) {
  const result = markAt(state, x, y, performance.now());
  if (result === 'found') sound.found();
  else if (result === 'wrong') sound.wrong();
  else if (result === 'already') sound.click();
  if (result === 'complete') {
    sound.fanfare();
    announce(currentLevel(state).name + ' complete!');
    window.setTimeout(() => {
      if (state.screen === SCREEN_LEVEL_COMPLETE) showLevelComplete();
    }, 900);
  }
}

function doHint() {
  const found = useHint(state, performance.now());
  if (found) sound.hint();
  else sound.click();
}

function doPause() {
  if (state.screen === SCREEN_PLAY) {
    state.screen = SCREEN_PAUSED;
    showPaused();
  } else if (state.screen === SCREEN_PAUSED) {
    state.screen = SCREEN_PLAY;
    hideOverlay();
  }
}

function doRestart() {
  sound.click();
  hideOverlay();
  startLevel(state, state.levelIndex);
}

function doMute() {
  state.muted = !state.muted;
  sound.setMuted(state.muted);
  soundButton.textContent = state.muted ? 'Sound: Off' : 'Sound: On';
}

attachInput(canvas, state, {
  mark: doMark,
  hint: doHint,
  restart: doRestart,
  pause: doPause,
  mute: doMute,
  ensureAudio: () => sound.ensure(),
});

hintButton.addEventListener('click', (event) => {
  event.currentTarget.blur();
  doHint();
});
pauseButton.addEventListener('click', (event) => {
  event.currentTarget.blur();
  doPause();
});
restartButton.addEventListener('click', (event) => {
  event.currentTarget.blur();
  doRestart();
});
soundButton.addEventListener('click', (event) => {
  event.currentTarget.blur();
  doMute();
});

// --- HUD -----------------------------------------------------------------
let lastHud = '';
function syncHud() {
  const level = currentLevel(state);
  const hud =
    level.name + '|' + state.found.size + ' / ' + level.differences.length + '|' +
    formatTime(state.levelSeconds) + '|' + state.strikes + '|' + state.hintsLeft + '|' +
    state.message + '|' + (state.levelIndex + 1);
  if (hud === lastHud) return;
  lastHud = hud;
  levelLabel.textContent = 'Level ' + (state.levelIndex + 1) + ' · ' + level.name;
  foundLabel.textContent = 'Found ' + state.found.size + ' / ' + level.differences.length;
  timeLabel.textContent = 'Time ' + formatTime(state.levelSeconds);
  strikeLabel.textContent = 'Strikes ' + state.strikes + ' / 3';
  hintButton.textContent = 'Hint (' + state.hintsLeft + ')';
  hintButton.disabled = state.hintsLeft <= 0 || state.screen !== SCREEN_PLAY;
  pauseButton.textContent = state.screen === SCREEN_PAUSED ? 'Resume' : 'Pause';
  messageBox.textContent = state.message;
  messageBox.classList.toggle('hidden', !state.message);
}

// --- boot ----------------------------------------------------------------
const shot = new URLSearchParams(window.location.search).get('shot');
resizeCanvas();
if (shot) {
  stageShot(shot, state, performance.now());
  if (state.screen === SCREEN_LEVEL_COMPLETE) showLevelComplete();
  // The title screen is skipped: a shot stages a real game state.
} else {
  showTitle();
}

let lastNow = performance.now();
function frame(nowMs) {
  const dt = Math.min(0.1, (nowMs - lastNow) / 1000);
  lastNow = nowMs;
  tick(state, dt, nowMs);
  drawFrame(ctx, state, canvas.clientWidth, canvas.clientHeight, nowMs);
  syncHud();
  window.requestAnimationFrame(frame);
}
window.requestAnimationFrame(frame);
