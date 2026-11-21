// Seeded random numbers (mulberry32) so every level draws the same picture
// every time it is played: the two panels of a level always match, and a
// screenshot taken today is the same frame tomorrow.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A number in [min, max) from a seeded generator. */
export function range(rng, min, max) {
  return min + rng() * (max - min);
}

/** An integer in [min, max] from a seeded generator. */
export function int(rng, min, max) {
  return Math.floor(range(rng, min, max + 1));
}

/** One element of `items`, picked by a seeded generator. */
export function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}
