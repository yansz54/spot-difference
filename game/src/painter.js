// Procedural scene painting: every picture in Twilight Harbor is drawn with
// canvas shapes, never copied art or stock images. One painter per level
// draws the same scene twice — the left panel as it is, the right panel with
// the differences from scenes.js applied — so the two pictures are identical
// except for the eight changes the player hunts. Scene space is 600 by 560
// units; drawScene scales it into whatever panel rectangle it is given.
// A fresh seeded generator per paint call keeps the random details (stars,
// clouds, wave streaks) identical on both panels.
import { mulberry32, range, int } from './random.js';
import { SCENE_WIDTH, SCENE_HEIGHT } from './scenes.js';

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function cloud(ctx, x, y, scale, color) {
  ctx.fillStyle = color;
  ellipse(ctx, x, y, 34 * scale, 15 * scale);
  ctx.fill();
  ellipse(ctx, x - 22 * scale, y + 5 * scale, 22 * scale, 11 * scale);
  ctx.fill();
  ellipse(ctx, x + 24 * scale, y + 5 * scale, 24 * scale, 12 * scale);
  ctx.fill();
}

/** A small gull: two curved strokes, like a shallow "v". */
function gull(ctx, x, y, scale, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 9 * scale, y);
  ctx.quadraticCurveTo(x - 4 * scale, y - 6 * scale, x, y);
  ctx.quadraticCurveTo(x + 4 * scale, y - 6 * scale, x + 9 * scale, y);
  ctx.stroke();
}

/** A four-point sparkle star. */
function sparkle(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.quadraticCurveTo(x + size * 0.22, y - size * 0.22, x + size, y);
  ctx.quadraticCurveTo(x + size * 0.22, y + size * 0.22, x, y + size);
  ctx.quadraticCurveTo(x - size * 0.22, y + size * 0.22, x - size, y);
  ctx.quadraticCurveTo(x - size * 0.22, y - size * 0.22, x, y - size);
  ctx.fill();
}

/** A sitting cat silhouette, facing right. */
function cat(ctx, x, y, scale, color) {
  ctx.fillStyle = color;
  ellipse(ctx, x, y - 8 * scale, 9 * scale, 11 * scale); // body
  ctx.beginPath();
  ctx.arc(x + 2 * scale, y - 22 * scale, 6.5 * scale, 0, Math.PI * 2); // head
  ctx.fill();
  ctx.beginPath(); // ears
  ctx.moveTo(x - 2 * scale, y - 27 * scale);
  ctx.lineTo(x - 4 * scale, y - 33 * scale);
  ctx.lineTo(x + 1 * scale, y - 28 * scale);
  ctx.moveTo(x + 5 * scale, y - 28 * scale);
  ctx.lineTo(x + 7 * scale, y - 33 * scale);
  ctx.lineTo(x + 8 * scale, y - 27 * scale);
  ctx.fill();
  ctx.beginPath(); // tail
  ctx.moveTo(x - 8 * scale, y + 2 * scale);
  ctx.quadraticCurveTo(x - 18 * scale, y, x - 16 * scale, y - 10 * scale);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3 * scale;
  ctx.lineCap = 'round';
  ctx.stroke();
}

/** A pine tree: three stacked triangles and a trunk. */
function pine(ctx, x, y, height, color) {
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(x - 3, y - 8, 6, 8);
  ctx.fillStyle = color;
  const w = height * 0.42;
  for (let i = 0; i < 3; i += 1) {
    const top = y - height + (i * height) / 3;
    const half = (w * (i + 1)) / 3 / 2;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x - half, top + height / 3 + 6);
    ctx.lineTo(x + half, top + height / 3 + 6);
    ctx.closePath();
    ctx.fill();
  }
}

/** A house with a pitched roof, door and windows. Windows is an array of
 *  {x, y, lit} in scene space; lit windows glow warm, dark ones stay navy. */
function house(ctx, x, y, w, h, wall, roof, windows) {
  ctx.fillStyle = wall;
  ctx.fillRect(x, y - h, w, h);
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(x - 8, y - h);
  ctx.lineTo(x + w / 2, y - h - 34);
  ctx.lineTo(x + w + 8, y - h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(x + w / 2 - 9, y - 30, 18, 30); // door
  for (const win of windows) {
    if (win.lit) {
      ctx.fillStyle = '#ffd97a';
      ctx.shadowColor = '#ffbe4d';
      ctx.shadowBlur = 12;
    } else {
      ctx.fillStyle = '#2c2c44';
      ctx.shadowBlur = 0;
    }
    ctx.fillRect(win.x, win.y, 18, 22);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#3a2a1c';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(win.x, win.y, 18, 22);
  }
}

// ---------------------------------------------------------------- harbor ---

function paintHarbor(ctx, level, applied) {
  const rng = mulberry32(level.seed);
  // Dusk sky.
  const sky = ctx.createLinearGradient(0, 0, 0, 330);
  sky.addColorStop(0, '#3a2560');
  sky.addColorStop(0.55, '#8a4a7a');
  sky.addColorStop(1, '#f2a65e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 600, 330);
  // Early stars.
  for (let i = 0; i < 26; i += 1) {
    ctx.fillStyle = 'rgba(255,255,255,' + range(rng, 0.3, 0.9).toFixed(2) + ')';
    ctx.beginPath();
    ctx.arc(range(rng, 10, 590), range(rng, 8, 180), range(rng, 0.8, 1.8), 0, Math.PI * 2);
    ctx.fill();
  }
  // Low sun with a soft glow.
  const glow = ctx.createRadialGradient(470, 150, 8, 470, 150, 78);
  glow.addColorStop(0, 'rgba(255,217,122,0.85)');
  glow.addColorStop(1, 'rgba(255,217,122,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(470, 150, 78, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd97a';
  ctx.beginPath();
  ctx.arc(470, 150, 30, 0, Math.PI * 2);
  ctx.fill();
  cloud(ctx, 110, 70, 1.1, 'rgba(255,236,220,0.9)');
  cloud(ctx, 250, 132, 0.8, 'rgba(255,236,220,0.75)');
  cloud(ctx, 505, 55, 0.7, 'rgba(255,236,220,0.8)');
  // Gulls that belong to both pictures.
  gull(ctx, 180, 110, 1, '#2b2b33');
  gull(ctx, 240, 80, 0.85, '#2b2b33');
  gull(ctx, 420, 140, 0.9, '#2b2b33');
  // The extra gull only the right picture has.
  if (applied.has('gull')) gull(ctx, 350, 92, 1, '#2b2b33');
  // Distant headland.
  ctx.fillStyle = '#2c2140';
  ctx.beginPath();
  ctx.moveTo(0, 330);
  ctx.lineTo(0, 300);
  ctx.quadraticCurveTo(90, 272, 170, 300);
  ctx.quadraticCurveTo(240, 322, 320, 306);
  ctx.lineTo(340, 330);
  ctx.closePath();
  ctx.fill();
  // Sea.
  const sea = ctx.createLinearGradient(0, 330, 0, 560);
  sea.addColorStop(0, '#2a6f7e');
  sea.addColorStop(1, '#123f4d');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 330, 600, 230);
  // Sun reflection: shimmering streaks under the sun.
  ctx.fillStyle = 'rgba(255,217,122,0.28)';
  for (let i = 0; i < 12; i += 1) {
    const y = 344 + i * 17;
    const w = range(rng, 30, 90);
    ctx.fillRect(470 - w / 2 + range(rng, -14, 14), y, w, 3);
  }
  // Wave lines.
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 14; i += 1) {
    const x = range(rng, 20, 580);
    const y = range(rng, 345, 545);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 18, y - 4, x + 40, y);
    ctx.stroke();
  }
  // Houses on the shore.
  house(ctx, 40, 330, 80, 95, '#f4d58d', '#b5524f', [
    { x: 56, y: 262, lit: true }, { x: 88, y: 262, lit: false },
  ]);
  house(ctx, 132, 330, 88, 115, '#e8a87c', '#7a4a3a', [
    { x: 167, y: 252, lit: !applied.has('window') }, { x: 192, y: 252, lit: true },
    { x: 167, y: 288, lit: false }, { x: 192, y: 288, lit: true },
  ]);
  house(ctx, 232, 330, 76, 85, '#c9d6a3', '#5a6b4f', [
    { x: 248, y: 272, lit: true }, { x: 274, y: 272, lit: false },
  ]);
  // The pier, planks and posts.
  ctx.fillStyle = '#8a6b4a';
  ctx.fillRect(55, 352, 375, 20);
  ctx.fillStyle = '#6e5238';
  for (let x = 55; x < 430; x += 30) ctx.fillRect(x, 352, 2, 20);
  for (let x = 75; x < 430; x += 44) {
    ctx.fillStyle = '#5a4028';
    ctx.fillRect(x, 372, 8, 30);
  }
  // A crate on the pier, only in the left picture.
  if (!applied.has('crate')) {
    ctx.fillStyle = '#b07a3e';
    ctx.fillRect(285, 322, 30, 30);
    ctx.strokeStyle = '#7a4f22';
    ctx.lineWidth = 2;
    ctx.strokeRect(285, 322, 30, 30);
    ctx.beginPath();
    ctx.moveTo(285, 322);
    ctx.lineTo(315, 352);
    ctx.moveTo(315, 322);
    ctx.lineTo(285, 352);
    ctx.stroke();
  }
  // The pier cat, only in the left picture.
  if (!applied.has('cat')) cat(ctx, 92, 352, 1, '#2b2b33');
  // Sailboat and rowboat.
  ctx.fillStyle = '#6e3b2a';
  ctx.beginPath();
  ctx.moveTo(118, 402);
  ctx.lineTo(192, 402);
  ctx.lineTo(182, 420);
  ctx.lineTo(128, 420);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4a2a1c';
  ctx.fillRect(153, 348, 4, 56);
  ctx.fillStyle = '#f7f3e8';
  ctx.beginPath();
  ctx.moveTo(157, 350);
  ctx.lineTo(157, 398);
  ctx.lineTo(188, 398);
  ctx.closePath();
  ctx.fill();
  // The little rowboat, only in the left picture.
  if (!applied.has('rowboat')) {
    ctx.fillStyle = '#7a4a2e';
    ctx.beginPath();
    ctx.ellipse(382, 424, 30, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(378, 414, 3, 8);
  }
  // The buoy: red in the left picture, yellow in the right one.
  ctx.fillStyle = applied.has('buoy') ? '#f2c230' : '#e23b3b';
  ctx.beginPath();
  ctx.arc(432, 470, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f7f3e8';
  ctx.fillRect(420, 466, 24, 5);
  ctx.fillStyle = '#3a2a1c';
  ctx.fillRect(430, 450, 4, 8);
  // The lighthouse, on its rock at the right.
  ctx.fillStyle = '#3a2f4a';
  ellipse(ctx, 523, 332, 42, 12);
  ctx.fill();
  ctx.fillStyle = '#f7f3e8';
  ctx.beginPath();
  ctx.moveTo(505, 330);
  ctx.lineTo(512, 152);
  ctx.lineTo(534, 152);
  ctx.lineTo(541, 330);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c65b5b';
  ctx.fillRect(508, 268, 30, 22);
  ctx.fillRect(510, 206, 26, 22);
  // The beam: bright in the left picture, dark in the right one.
  if (!applied.has('beam')) {
    const beam = ctx.createLinearGradient(514, 125, 350, 165);
    beam.addColorStop(0, 'rgba(255,222,120,0.5)');
    beam.addColorStop(1, 'rgba(255,222,120,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(514, 118);
    ctx.lineTo(514, 132);
    ctx.lineTo(350, 252);
    ctx.lineTo(350, 84);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#2b2b33';
  ctx.fillRect(500, 138, 46, 14);
  ctx.fillStyle = '#2b2b33';
  ctx.fillRect(508, 112, 30, 26);
  ctx.fillStyle = '#ffe98a';
  ctx.beginPath();
  ctx.arc(523, 125, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b2b33';
  ctx.beginPath();
  ctx.moveTo(504, 112);
  ctx.lineTo(523, 96);
  ctx.lineTo(542, 112);
  ctx.closePath();
  ctx.fill();
  // The flag on the lighthouse: red left, blue right.
  ctx.strokeStyle = '#2b2b33';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(523, 96);
  ctx.lineTo(523, 78);
  ctx.stroke();
  ctx.fillStyle = applied.has('flag') ? '#3b6fe2' : '#e23b3b';
  ctx.beginPath();
  ctx.moveTo(523, 78);
  ctx.lineTo(545, 84);
  ctx.lineTo(523, 92);
  ctx.closePath();
  ctx.fill();
}

// ---------------------------------------------------------------- market ---

function stripedAwning(ctx, x, y, w, h, colorA, colorB) {
  const stripes = 7;
  for (let i = 0; i < stripes; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? colorA : colorB;
    ctx.fillRect(x + (w * i) / stripes, y, w / stripes + 1, h);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(x, y + h - 8, w, 8);
  // Scalloped edge.
  ctx.fillStyle = colorA;
  for (let i = 0; i < stripes; i += 1) {
    ctx.beginPath();
    ctx.arc(x + (w * (i + 0.5)) / stripes, y + h, w / stripes / 2, 0, Math.PI);
    ctx.fill();
  }
}

function paintMarket(ctx, level, applied) {
  const rng = mulberry32(level.seed);
  const sky = ctx.createLinearGradient(0, 0, 0, 380);
  sky.addColorStop(0, '#8ec8e8');
  sky.addColorStop(1, '#eaf7ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 600, 380);
  ctx.fillStyle = '#ffd97a';
  ctx.beginPath();
  ctx.arc(90, 80, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,217,122,0.4)';
  ctx.beginPath();
  ctx.arc(90, 80, 46, 0, Math.PI * 2);
  ctx.fill();
  cloud(ctx, 200, 60, 1, 'rgba(255,255,255,0.95)');
  cloud(ctx, 420, 90, 0.8, 'rgba(255,255,255,0.9)');
  cloud(ctx, 520, 160, 0.7, 'rgba(255,255,255,0.85)');
  // A wire across the sky; a bird sits on it in the left picture only.
  ctx.strokeStyle = '#4a4a55';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 120);
  ctx.lineTo(600, 120);
  ctx.stroke();
  if (!applied.has('bird')) {
    ctx.fillStyle = '#3a3a44';
    ellipse(ctx, 420, 114, 9, 6);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(427, 106, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(412, 116);
    ctx.lineTo(404, 122);
    ctx.lineTo(413, 122);
    ctx.fill();
  }
  // Bunting flags strung above the stalls.
  ctx.strokeStyle = '#7a5a3a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 168);
  ctx.quadraticCurveTo(300, 196, 600, 168);
  ctx.stroke();
  const flagColors = ['#e23b3b', '#f2c230', '#3b6fe2', '#4caf6d', '#e26ab0'];
  for (let i = 0; i < 15; i += 1) {
    const x = 20 + i * 40;
    const y = 168 + Math.sin((x / 600) * Math.PI) * 26;
    ctx.fillStyle = flagColors[i % flagColors.length];
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x, y + 16);
    ctx.closePath();
    ctx.fill();
  }
  // Grass and a pale path.
  ctx.fillStyle = '#7fb069';
  ctx.fillRect(0, 380, 600, 180);
  ctx.fillStyle = '#e8d5a8';
  ctx.beginPath();
  ctx.moveTo(270, 560);
  ctx.lineTo(300, 380);
  ctx.lineTo(330, 380);
  ctx.lineTo(360, 560);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let i = 0; i < 20; i += 1) {
    ellipse(ctx, range(rng, 10, 590), range(rng, 390, 550), range(rng, 8, 22), range(rng, 4, 8));
    ctx.fill();
  }
  // Three stalls.
  const stalls = [
    { x: 70, awning: ['#e23b3b', '#fdf6ec'] },
    { x: 248, awning: applied.has('awning') ? ['#4caf6d', '#fdf6ec'] : ['#e23b3b', '#fdf6ec'] },
    { x: 430, awning: ['#3b6fe2', '#fdf6ec'] },
  ];
  for (const stall of stalls) {
    ctx.fillStyle = '#8a5a34';
    ctx.fillRect(stall.x + 4, 240, 6, 140);
    ctx.fillRect(stall.x + 94, 240, 6, 140);
    stripedAwning(ctx, stall.x - 6, 200, 116, 40, stall.awning[0], stall.awning[1]);
    ctx.fillStyle = '#a97c50';
    ctx.fillRect(stall.x, 300, 104, 80);
    ctx.fillStyle = '#7a4f22';
    ctx.fillRect(stall.x, 300, 104, 6);
  }
  // Flower pots on the left stall; the middle pot is missing on the right.
  for (const [px, withFlower] of [[92, true], [122, !applied.has('flowerpot')], [152, true]]) {
    if (!withFlower) continue;
    ctx.fillStyle = '#c96f3e';
    ctx.beginPath();
    ctx.moveTo(px - 10, 282);
    ctx.lineTo(px + 10, 282);
    ctx.lineTo(px + 7, 300);
    ctx.lineTo(px - 7, 300);
    ctx.closePath();
    ctx.fill();
    const petals = ['#e26ab0', '#f2c230', '#e23b3b'];
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = petals[(px + i) % 3];
      ctx.beginPath();
      ctx.arc(px - 6 + i * 6, 276 - (i % 2) * 4, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Fruit basket on the middle stall: apples left, oranges right.
  ctx.fillStyle = '#8a5a34';
  ctx.beginPath();
  ctx.moveTo(282, 318);
  ctx.lineTo(318, 318);
  ctx.lineTo(312, 342);
  ctx.lineTo(288, 342);
  ctx.closePath();
  ctx.fill();
  const fruitColor = applied.has('fruit') ? '#f28c1e' : '#d93838';
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = fruitColor;
    ctx.beginPath();
    ctx.arc(286 + i * 7, 314 - (i % 2) * 5, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  // The stall cat, only in the left picture: it sits on the counter's
  // right end, clear of the fruit basket so the two rings never overlap.
  if (!applied.has('cat')) cat(ctx, 335, 300, 0.9, '#3a3a44');
  // Loaves on the right stall.
  ctx.fillStyle = '#d9a05b';
  for (const [lx, ly] of [[452, 292], [478, 288], [504, 292]]) {
    ellipse(ctx, lx, ly, 16, 9);
    ctx.fill();
  }
  // The parasol behind the right stall: open left, folded right.
  ctx.fillStyle = '#8a5a34';
  ctx.fillRect(480, 240, 4, 140);
  if (!applied.has('umbrella')) {
    ctx.fillStyle = '#e26ab0';
    ctx.beginPath();
    ctx.arc(482, 222, 42, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c94a92';
    ctx.lineWidth = 2;
    for (const dx of [-28, -14, 0, 14, 28]) {
      ctx.beginPath();
      ctx.moveTo(482, 222);
      ctx.lineTo(482 + dx, 222 - Math.sqrt(42 * 42 - dx * dx) * 0.9);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#e26ab0';
    ctx.beginPath();
    ctx.moveTo(482, 180);
    ctx.lineTo(492, 222);
    ctx.lineTo(472, 222);
    ctx.closePath();
    ctx.fill();
  }
  // A lantern hanging between the stalls: lit left, dark right.
  ctx.strokeStyle = '#7a5a3a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(174, 238);
  ctx.lineTo(248, 238);
  ctx.stroke();
  ctx.strokeStyle = '#3a2a1c';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(210, 238);
  ctx.lineTo(210, 244);
  ctx.stroke();
  if (!applied.has('lantern')) {
    ctx.fillStyle = 'rgba(255,190,77,0.35)';
    ctx.beginPath();
    ctx.arc(210, 258, 20, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = applied.has('lantern') ? '#5a5a66' : '#ffbe4d';
  roundedRect(ctx, 202, 246, 16, 20, 4);
  ctx.fill();
  ctx.fillStyle = '#3a2a1c';
  ctx.fillRect(205, 242, 10, 4);
  // The watering can on the grass, only in the left picture.
  if (!applied.has('can')) {
    ctx.fillStyle = '#4caf6d';
    roundedRect(ctx, 66, 452, 34, 26, 5);
    ctx.fill();
    ctx.fillStyle = '#3d8a54';
    ctx.beginPath();
    ctx.moveTo(100, 458);
    ctx.lineTo(118, 450);
    ctx.lineTo(118, 462);
    ctx.lineTo(100, 468);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3d8a54';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(70, 454);
    ctx.quadraticCurveTo(58, 452, 58, 466);
    ctx.stroke();
  }
  // Butterflies and a flower bed along the bottom.
  for (const [bx, by, bc] of [[540, 430, '#e26ab0'], [560, 470, '#3b6fe2']]) {
    ctx.fillStyle = bc;
    ellipse(ctx, bx - 5, by, 6, 4);
    ctx.fill();
    ellipse(ctx, bx + 5, by, 6, 4);
    ctx.fill();
  }
  for (let i = 0; i < 8; i += 1) {
    const fx = 20 + i * 22;
    ctx.fillStyle = ['#e26ab0', '#f2c230', '#e23b3b'][i % 3];
    ctx.beginPath();
    ctx.arc(fx, 540, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3d8a54';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx, 544);
    ctx.lineTo(fx, 554);
    ctx.stroke();
  }
}

// --------------------------------------------------------------- village ---

function paintVillage(ctx, level, applied) {
  const rng = mulberry32(level.seed);
  const sky = ctx.createLinearGradient(0, 0, 0, 400);
  sky.addColorStop(0, '#0d1b3e');
  sky.addColorStop(1, '#274b7a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 600, 400);
  // Moon with a soft halo.
  const halo = ctx.createRadialGradient(480, 90, 8, 480, 90, 64);
  halo.addColorStop(0, 'rgba(244,234,216,0.5)');
  halo.addColorStop(1, 'rgba(244,234,216,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(480, 90, 64, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4ead8';
  ctx.beginPath();
  ctx.arc(480, 90, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(180,170,150,0.5)';
  ctx.beginPath();
  ctx.arc(472, 84, 5, 0, Math.PI * 2);
  ctx.arc(488, 98, 4, 0, Math.PI * 2);
  ctx.fill();
  // Stars; one bright sparkle only the left picture has.
  for (let i = 0; i < 42; i += 1) {
    ctx.fillStyle = 'rgba(255,255,255,' + range(rng, 0.35, 0.95).toFixed(2) + ')';
    ctx.beginPath();
    ctx.arc(range(rng, 8, 592), range(rng, 8, 260), range(rng, 0.8, 1.9), 0, Math.PI * 2);
    ctx.fill();
  }
  if (!applied.has('star')) sparkle(ctx, 150, 72, 9, '#fff6c9');
  // Three mountain peaks.
  const peaks = [
    { points: [[0, 400], [0, 260], [130, 190], [260, 400]], color: '#22314e', snow: [[130, 190], [104, 224], [122, 214], [140, 232], [156, 216]] },
    { points: [[180, 400], [220, 250], [300, 150], [380, 250], [430, 400]], color: '#2c3e5e', snow: [[300, 150], [272, 196], [292, 184], [312, 202], [328, 188]] },
    { points: [[380, 400], [430, 260], [500, 200], [600, 300], [600, 400]], color: '#24344f', snow: [[500, 200], [476, 232], [494, 224], [512, 238], [526, 222]] },
  ];
  for (const peak of peaks) {
    ctx.fillStyle = peak.color;
    ctx.beginPath();
    ctx.moveTo(peak.points[0][0], peak.points[0][1]);
    for (const [x, y] of peak.points.slice(1)) ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
  }
  // Snowcaps on the outer peaks always; the middle one only on the left.
  for (const peak of [peaks[0], peaks[2]]) {
    ctx.fillStyle = '#f4f8ff';
    ctx.beginPath();
    ctx.moveTo(peak.snow[0][0], peak.snow[0][1]);
    for (const [x, y] of peak.snow.slice(1)) ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
  }
  if (!applied.has('snowcap')) {
    const peak = peaks[1];
    ctx.fillStyle = '#f4f8ff';
    ctx.beginPath();
    ctx.moveTo(peak.snow[0][0], peak.snow[0][1]);
    for (const [x, y] of peak.snow.slice(1)) ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
  }
  // The waterfall down the middle peak, only in the left picture.
  if (!applied.has('waterfall')) {
    ctx.strokeStyle = 'rgba(220,238,255,0.9)';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(312, 220);
    ctx.quadraticCurveTo(306, 270, 314, 320);
    ctx.quadraticCurveTo(318, 345, 310, 368);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(312, 226);
    ctx.quadraticCurveTo(307, 272, 314, 318);
    ctx.stroke();
  }
  // Snowy ground.
  ctx.fillStyle = '#dfe9f2';
  ctx.fillRect(0, 400, 600, 160);
  ctx.fillStyle = 'rgba(140,170,205,0.5)';
  for (let i = 0; i < 10; i += 1) {
    ellipse(ctx, range(rng, 10, 590), range(rng, 420, 545), range(rng, 14, 34), range(rng, 4, 8));
    ctx.fill();
  }
  // Village houses with snowy roofs.
  const villageHouses = [
    { x: 40, w: 90, h: 80, wall: '#e8b48a', roof: '#f4f8ff' },
    { x: 160, w: 100, h: 95, wall: '#d9a05b', roof: '#f4f8ff' },
    { x: 300, w: 95, h: 85, wall: '#c98d6b', roof: '#f4f8ff' },
    { x: 430, w: 100, h: 90, wall: '#e8b48a', roof: '#f4f8ff' },
  ];
  for (const h of villageHouses) {
    ctx.fillStyle = h.wall;
    ctx.fillRect(h.x, 400 - h.h, h.w, h.h);
    ctx.fillStyle = h.roof;
    ctx.beginPath();
    ctx.moveTo(h.x - 8, 400 - h.h);
    ctx.lineTo(h.x + h.w / 2, 400 - h.h - 36);
    ctx.lineTo(h.x + h.w + 8, 400 - h.h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(h.x + h.w / 2 - 9, 370, 18, 30);
  }
  // Windows: warm lit, except one that is dark on the right.
  const windows = [
    { x: 56, y: 352, lit: true }, { x: 88, y: 352, lit: false },
    { x: 191, y: 392, lit: !applied.has('window') }, { x: 216, y: 352, lit: true },
    { x: 316, y: 356, lit: true }, { x: 342, y: 356, lit: false },
    { x: 446, y: 354, lit: true }, { x: 472, y: 354, lit: true },
  ];
  for (const win of windows) {
    if (win.lit) {
      ctx.fillStyle = '#ffd97a';
      ctx.shadowColor = '#ffbe4d';
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = '#2c2c44';
      ctx.shadowBlur = 0;
    }
    ctx.fillRect(win.x, win.y, 16, 18);
    ctx.shadowBlur = 0;
  }
  // Chimney smoke above the third house, only in the left picture.
  if (!applied.has('smoke')) {
    ctx.fillStyle = 'rgba(220,225,235,0.75)';
    ctx.beginPath();
    ctx.arc(352, 322, 9, 0, Math.PI * 2);
    ctx.arc(358, 306, 12, 0, Math.PI * 2);
    ctx.arc(348, 290, 14, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(348, 318, 10, 26);
  // Pine trees; one is missing on the right.
  pine(ctx, 80, 448, 62, '#1d4a2e');
  pine(ctx, 282, 452, 54, '#245636');
  pine(ctx, 382, 448, 58, '#1d4a2e');
  if (!applied.has('pine')) pine(ctx, 522, 448, 66, '#245636');
  // A stream and an arched wooden bridge.
  ctx.fillStyle = '#7fa8c9';
  ctx.fillRect(0, 512, 600, 48);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i += 1) {
    const x = range(rng, 20, 580);
    ctx.beginPath();
    ctx.moveTo(x, 528 + (i % 3) * 8);
    ctx.lineTo(x + 26, 528 + (i % 3) * 8);
    ctx.stroke();
  }
  ctx.fillStyle = '#8a5a34';
  ctx.beginPath();
  ctx.moveTo(236, 524);
  ctx.quadraticCurveTo(300, 488, 364, 524);
  ctx.lineTo(364, 534);
  ctx.quadraticCurveTo(300, 500, 236, 534);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6e4526';
  for (let i = 0; i < 7; i += 1) {
    const x = 244 + i * 18;
    ctx.fillRect(x, 508 + Math.abs(x - 300) * 0.06, 3, 18);
  }
  // A sheep in the meadow, only in the left picture.
  if (!applied.has('sheep')) {
    ctx.fillStyle = '#f7f3e8';
    ctx.beginPath();
    ctx.arc(444, 476, 12, 0, Math.PI * 2);
    ctx.arc(456, 472, 12, 0, Math.PI * 2);
    ctx.arc(462, 482, 11, 0, Math.PI * 2);
    ctx.arc(450, 486, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a3a44';
    ctx.beginPath();
    ctx.arc(466, 478, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(446, 488, 3, 8);
    ctx.fillRect(458, 488, 3, 8);
  }
  // A lantern post: warm light left, cold blue light right.
  ctx.fillStyle = '#3a2a1c';
  ctx.fillRect(120, 420, 5, 84);
  ctx.fillRect(120, 420, 22, 4);
  const lanternGlow = applied.has('lantern') ? 'rgba(120,170,255,0.4)' : 'rgba(255,190,77,0.45)';
  ctx.fillStyle = lanternGlow;
  ctx.beginPath();
  ctx.arc(136, 438, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = applied.has('lantern') ? '#7aa8ff' : '#ffbe4d';
  roundedRect(ctx, 129, 428, 14, 18, 4);
  ctx.fill();
  // Falling snow, faint and slow.
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 24; i += 1) {
    ctx.beginPath();
    ctx.arc(range(rng, 8, 592), range(rng, 8, 552), range(rng, 1, 2.2), 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Draw one level's scene into `rect` (canvas pixels). `applied` is the set
 *  of difference ids whose changed version this panel shows: empty for the
 *  left picture, the found ones for the right picture. */
export function drawScene(ctx, level, rect, applied) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.translate(rect.x, rect.y);
  ctx.scale(rect.w / SCENE_WIDTH, rect.h / SCENE_HEIGHT);
  if (level.id === 'harbor') paintHarbor(ctx, level, applied);
  else if (level.id === 'market') paintMarket(ctx, level, applied);
  else paintVillage(ctx, level, applied);
  ctx.restore();
}
