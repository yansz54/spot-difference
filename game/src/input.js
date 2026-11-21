// Pointer and keyboard input. The mouse clicks a spot on either picture;
// the keyboard moves a reticle (arrow keys, Shift for big steps) and marks
// with Enter or Space. H asks for a hint, R restarts the level, P pauses,
// M toggles the sound. The reticle stays hidden until the player first
// moves it, so a fresh frame is clean.
import { SCENE_WIDTH, SCENE_HEIGHT } from './scenes.js';
import { SCREEN_PLAY, SCREEN_PAUSED } from './state.js';
import { computeLayout, toSceneCoords } from './render.js';

const RETICLE_STEP = 14;
const RETICLE_STEP_FAST = 48;

/** Canvas pixel coordinates of a pointer event, in CSS pixels. */
function eventPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

export function attachInput(canvas, state, handlers) {
  canvas.addEventListener('pointerdown', (event) => {
    handlers.ensureAudio();
    if (state.screen !== SCREEN_PLAY) return;
    const point = eventPoint(canvas, event);
    const layout = computeLayout(canvas.clientWidth, canvas.clientHeight);
    for (const rect of [layout.left, layout.right]) {
      const scene = toSceneCoords(rect, point.x, point.y);
      if (scene) {
        state.reticle = { x: scene.x, y: scene.y, visible: true };
        handlers.mark(scene.x, scene.y);
        return;
      }
    }
  });

  canvas.addEventListener('pointermove', (event) => {
    if (state.screen !== SCREEN_PLAY) return;
    const point = eventPoint(canvas, event);
    const layout = computeLayout(canvas.clientWidth, canvas.clientHeight);
    for (const rect of [layout.left, layout.right]) {
      const scene = toSceneCoords(rect, point.x, point.y);
      if (scene) {
        state.reticle = { x: scene.x, y: scene.y, visible: true };
        return;
      }
    }
  });

  window.addEventListener('keydown', (event) => {
    const onButton = event.target && event.target.tagName === 'BUTTON';
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      if (state.screen !== SCREEN_PLAY) return;
      const step = event.shiftKey ? RETICLE_STEP_FAST : RETICLE_STEP;
      state.reticle.visible = true;
      if (event.key === 'ArrowLeft') state.reticle.x = Math.max(0, state.reticle.x - step);
      if (event.key === 'ArrowRight') state.reticle.x = Math.min(SCENE_WIDTH, state.reticle.x + step);
      if (event.key === 'ArrowUp') state.reticle.y = Math.max(0, state.reticle.y - step);
      if (event.key === 'ArrowDown') state.reticle.y = Math.min(SCENE_HEIGHT, state.reticle.y + step);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      if (onButton) return; // let the focused button take it
      event.preventDefault();
      if (state.screen !== SCREEN_PLAY) return;
      handlers.ensureAudio();
      state.reticle.visible = true;
      handlers.mark(state.reticle.x, state.reticle.y);
      return;
    }
    const key = event.key.toLowerCase();
    if (key === 'h') {
      handlers.ensureAudio();
      handlers.hint();
    } else if (key === 'r') {
      handlers.restart();
    } else if (key === 'p' || event.key === 'Escape') {
      if (state.screen === SCREEN_PLAY || state.screen === SCREEN_PAUSED) handlers.pause();
    } else if (key === 'm') {
      handlers.mute();
    }
  });
}
