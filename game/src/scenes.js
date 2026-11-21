// The three levels of Twilight Harbor. Each level names its scene, its seed
// (the same seed always draws the same two pictures) and its differences.
// A difference is a spot in scene space (600 by 560 units) with a hit radius:
// the left picture shows the base version, the right picture shows the
// changed version, and the painter in painter.js draws both from this data.
// Keep every (x, y) on the element the painter draws for that difference,
// or the click will land on empty scenery.
export const SCENE_WIDTH = 600;
export const SCENE_HEIGHT = 560;

export const LEVELS = [
  {
    id: 'harbor',
    name: 'Twilight Harbor',
    subtitle: 'A sleepy harbor town at dusk',
    seed: 20261121,
    // 3 stars at 75 s or less, 2 stars at 150 s or less, else 1 star.
    starTimes: [75, 150],
    differences: [
      { id: 'beam', x: 452, y: 168, r: 42, label: 'The lighthouse beam' },
      { id: 'gull', x: 350, y: 92, r: 26, label: 'An extra gull in the sky' },
      { id: 'window', x: 176, y: 262, r: 24, label: 'A lit window' },
      { id: 'rowboat', x: 382, y: 424, r: 36, label: 'The little rowboat' },
      { id: 'flag', x: 532, y: 86, r: 20, label: 'The lighthouse flag' },
      { id: 'crate', x: 300, y: 342, r: 26, label: 'A crate on the pier' },
      { id: 'buoy', x: 432, y: 470, r: 24, label: 'The buoy in the bay' },
      { id: 'cat', x: 92, y: 348, r: 24, label: 'The pier cat' },
    ],
  },
  {
    id: 'market',
    name: 'Garden Market',
    subtitle: 'A sunny morning at the flower market',
    seed: 20261122,
    starTimes: [90, 180],
    differences: [
      { id: 'awning', x: 300, y: 218, r: 40, label: 'The middle awning' },
      { id: 'fruit', x: 300, y: 330, r: 28, label: 'The fruit in the basket' },
      { id: 'flowerpot', x: 122, y: 300, r: 26, label: 'A flower pot' },
      { id: 'umbrella', x: 482, y: 222, r: 34, label: 'The parasol' },
      { id: 'cat', x: 335, y: 290, r: 22, label: 'The stall cat' },
      { id: 'bird', x: 420, y: 122, r: 22, label: 'A bird on the wire' },
      { id: 'lantern', x: 210, y: 252, r: 24, label: 'The hanging lantern' },
      { id: 'can', x: 82, y: 470, r: 26, label: 'The watering can' },
    ],
  },
  {
    id: 'village',
    name: 'Mountain Village',
    subtitle: 'A quiet village under a winter moon',
    seed: 20261123,
    starTimes: [105, 210],
    differences: [
      { id: 'star', x: 150, y: 72, r: 22, label: 'A bright star' },
      { id: 'snowcap', x: 300, y: 182, r: 36, label: 'Snow on the middle peak' },
      { id: 'window', x: 200, y: 402, r: 24, label: 'A lit window' },
      { id: 'smoke', x: 352, y: 330, r: 30, label: 'Chimney smoke' },
      { id: 'pine', x: 522, y: 422, r: 30, label: 'A pine tree' },
      { id: 'sheep', x: 452, y: 482, r: 28, label: 'A sheep in the meadow' },
      { id: 'waterfall', x: 312, y: 246, r: 26, label: 'The waterfall' },
      { id: 'lantern', x: 122, y: 452, r: 24, label: 'The lantern post' },
    ],
  },
];

/** Stars (1-3) for finishing a level in `seconds` with `strikes` wrong clicks. */
export function starsForLevel(level, seconds, strikes) {
  let stars = seconds <= level.starTimes[0] ? 3 : seconds <= level.starTimes[1] ? 2 : 1;
  stars -= Math.floor(strikes / 2);
  return Math.max(1, stars);
}

/** Format seconds as mm:ss for the timer and the results screens. */
export function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return String(minutes).padStart(2, '0') + ':' + String(rest).padStart(2, '0');
}
