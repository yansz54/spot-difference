// The frame: two picture panels side by side, the labels above them, the
// red rings around differences already found, the gold pulse of a hint and
// the keyboard reticle. The left panel is always the original picture, the
// right panel always the changed one (all eight differences applied); the
// player hunts the changes, and a found one is circled on both panels.
import { SCENE_WIDTH, SCENE_HEIGHT } from './scenes.js';
import { drawScene } from './painter.js';
import { SCREEN_PLAY, currentLevel } from './state.js';

const PAD_X = 16;
const GAP = 20;
const LABEL_HEIGHT = 30;
const PAD_BOTTOM = 16;

/** Where the two panels sit inside a canvas of `width` by `height` (CSS px). */
export function computeLayout(width, height) {
  const panelWidth = Math.floor((width - PAD_X * 2 - GAP) / 2);
  const panelHeight = Math.floor((panelWidth * SCENE_HEIGHT) / SCENE_WIDTH);
  const contentHeight = LABEL_HEIGHT + panelHeight;
  const top = Math.max(0, Math.floor((height - contentHeight) / 2));
  return {
    left: { x: PAD_X, y: top + LABEL_HEIGHT, w: panelWidth, h: panelHeight },
    right: { x: PAD_X + panelWidth + GAP, y: top + LABEL_HEIGHT, w: panelWidth, h: panelHeight },
    labelY: top,
  };
}

/** Canvas pixels to scene coordinates inside a panel rect, or null outside. */
export function toSceneCoords(rect, canvasX, canvasY) {
  if (canvasX < rect.x || canvasX > rect.x + rect.w || canvasY < rect.y || canvasY > rect.y + rect.h) return null;
  return {
    x: ((canvasX - rect.x) / rect.w) * SCENE_WIDTH,
    y: ((canvasY - rect.y) / rect.h) * SCENE_HEIGHT,
  };
}

function drawPanelLabel(ctx, rect, labelY, text) {
  ctx.font = '600 15px system-ui, sans-serif';
  const textWidth = ctx.measureText(text).width;
  const badgeX = rect.x;
  const badgeY = labelY + 2;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, textWidth + 24, 22, 11);
  ctx.fill();
  ctx.fillStyle = '#e8eaf2';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, badgeX + 12, badgeY + 11);
}

function drawFoundRing(ctx, rect, difference, scale) {
  const cx = rect.x + (difference.x / SCENE_WIDTH) * rect.w;
  const cy = rect.y + (difference.y / SCENE_HEIGHT) * rect.h;
  const radius = (difference.r / SCENE_WIDTH) * rect.w + 4;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#ff3b30';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,59,48,0.07)';
  ctx.fill();
}

function drawHintRing(ctx, rect, difference, nowMs) {
  const pulse = 0.5 + 0.5 * Math.sin(nowMs / 220);
  const cx = rect.x + (difference.x / SCENE_WIDTH) * rect.w;
  const cy = rect.y + (difference.y / SCENE_HEIGHT) * rect.h;
  const radius = (difference.r / SCENE_WIDTH) * rect.w + 6 + pulse * 5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,190,77,' + (0.55 + pulse * 0.45).toFixed(2) + ')';
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 7]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawWrongMark(ctx, rect, mark, nowMs) {
  const age = nowMs - mark.at;
  const alpha = Math.max(0, 1 - age / 1200);
  const cx = rect.x + (mark.x / SCENE_WIDTH) * rect.w;
  const cy = rect.y + (mark.y / SCENE_HEIGHT) * rect.h;
  const size = 12;
  ctx.strokeStyle = 'rgba(255,59,48,' + alpha.toFixed(2) + ')';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - size, cy - size);
  ctx.lineTo(cx + size, cy + size);
  ctx.moveTo(cx + size, cy - size);
  ctx.lineTo(cx - size, cy + size);
  ctx.stroke();
}

function drawReticle(ctx, rect, reticle) {
  const cx = rect.x + (reticle.x / SCENE_WIDTH) * rect.w;
  const cy = rect.y + (reticle.y / SCENE_HEIGHT) * rect.h;
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 20, cy);
  ctx.lineTo(cx - 8, cy);
  ctx.moveTo(cx + 8, cy);
  ctx.lineTo(cx + 20, cy);
  ctx.moveTo(cx, cy - 20);
  ctx.lineTo(cx, cy - 8);
  ctx.moveTo(cx, cy + 8);
  ctx.lineTo(cx, cy + 20);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

/** Draw one frame of the game into `ctx` (already scaled to CSS pixels). */
export function drawFrame(ctx, state, width, height, nowMs) {
  const background = ctx.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, '#171b2c');
  background.addColorStop(1, '#232742');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const level = currentLevel(state);
  const layout = computeLayout(width, height);
  const allIds = new Set(level.differences.map((d) => d.id));

  drawPanelLabel(ctx, layout.left, layout.labelY, 'A · ' + level.name + ' — original');
  drawPanelLabel(ctx, layout.right, layout.labelY, 'B · ' + level.name + ' — find the differences');

  // The pictures themselves.
  drawScene(ctx, level, layout.left, new Set());
  drawScene(ctx, level, layout.right, allIds);

  // Panel frames.
  for (const rect of [layout.left, layout.right]) {
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(rect.x - 1, rect.y - 1, rect.w + 2, rect.h + 2, 10);
    ctx.stroke();
  }

  // Rings around what the player has found, on both panels.
  for (const difference of level.differences) {
    if (!state.found.has(difference.id)) continue;
    drawFoundRing(ctx, layout.left, difference);
    drawFoundRing(ctx, layout.right, difference);
  }
  // The happy pulse on the most recent find.
  if (state.lastFound) {
    const age = nowMs - state.lastFound.at;
    const progress = Math.min(1, age / 1200);
    for (const rect of [layout.left, layout.right]) {
      const cx = rect.x + (state.lastFound.difference.x / SCENE_WIDTH) * rect.w;
      const cy = rect.y + (state.lastFound.difference.y / SCENE_HEIGHT) * rect.h;
      const radius = (state.lastFound.difference.r / SCENE_WIDTH) * rect.w + 8 + progress * 22;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,190,77,' + (0.9 * (1 - progress)).toFixed(2) + ')';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
  // The hint ring, while a hint is live.
  if (state.hint) {
    drawHintRing(ctx, layout.left, state.hint.difference, nowMs);
    drawHintRing(ctx, layout.right, state.hint.difference, nowMs);
  }
  // Red X marks where a wrong click landed.
  for (const mark of state.wrongMarks) {
    drawWrongMark(ctx, layout.left, mark, nowMs);
    drawWrongMark(ctx, layout.right, mark, nowMs);
  }
  // The keyboard reticle, only once the player has moved it.
  if (state.screen === SCREEN_PLAY && state.reticle.visible) {
    drawReticle(ctx, layout.left, state.reticle);
    drawReticle(ctx, layout.right, state.reticle);
  }
}
