// Jump planning for the FLOW home-page runner (components/GeoRunner.tsx).
// The cube moves at `speed` px/s; a group of `n` spikes, each `unit` wide and 0.95 unit tall, starts `gap` px ahead
// of the cube's front edge. The jump must keep the cube in the air until its back edge has passed the last spike.

export const JUMP_HEIGHT = 2.4; // peak height in cube sizes, clear of the 0.95-unit spikes
const MARGIN = 0.35; // extra flight, in cube sizes, before and after the group

export function jumpFor(gap: number, n: number, unit: number, speed: number) {
  const distance = Math.max(0, gap) + n * unit + unit + MARGIN * unit; // front edge to past the last spike, plus the cube's width
  const duration = distance / speed;
  return { duration, height: JUMP_HEIGHT * unit, turns: Math.max(1, Math.round(duration * 3)) };
}

/** Height (px, positive up) of a jump of `height` and `duration` at time `s` after take-off. */
export const arc = (height: number, duration: number, s: number) => {
  const p = Math.min(1, Math.max(0, s / duration));
  return 4 * height * p * (1 - p);
};

/** One corner of the wave section's zigzag, in cube sizes: `u` along the run, `h` above the floor. */
export interface WavePoint { u: number; h: number }
export const WAVE_GAP = 1.5; // half the corridor height around the arrow, in cube sizes
const WAVE_LOW = 1.7, WAVE_HIGH = 5.6;

/**
 * The wave section's path: it leaves the floor, zigzags at 45° (each leg 1.5–4.5 cube sizes) between WAVE_LOW and
 * WAVE_HIGH, and comes back down to rest on the floor (h = 0.5) by `length`. `rnd` returns 0–1.
 */
export function wavePath(length: number, rnd: () => number): WavePoint[] {
  const pts: WavePoint[] = [{ u: 0, h: 0.5 }, { u: 1, h: 0.5 }];
  let u = 1, h = 0.5, up = true;
  const land = length - 2;
  while (true) {
    const target = up ? WAVE_LOW + 1.2 + rnd() * (WAVE_HIGH - WAVE_LOW - 1.2) : WAVE_LOW + rnd() * Math.max(0, h - WAVE_LOW - 1.5);
    const leg = Math.max(1.5, Math.min(4.5, Math.abs(target - h)));
    const nh = up ? Math.min(WAVE_HIGH, h + leg) : Math.max(WAVE_LOW, h - leg);
    // Stop zigzagging when the descent to the floor would no longer fit before `land`.
    if (u + Math.abs(nh - h) + (nh - 0.5) > land) break;
    u += Math.abs(nh - h);
    h = nh;
    pts.push({ u, h });
    up = !up;
  }
  u += h - 0.5;
  pts.push({ u, h: 0.5 }, { u: Math.max(u, length), h: 0.5 });
  return pts;
}

/** Height of the path at `u` (flat at the ends). */
export function waveHeight(path: WavePoint[], u: number) {
  if (u <= path[0].u) return path[0].h;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    if (u <= b.u) return b.u === a.u ? b.h : a.h + ((b.h - a.h) * (u - a.u)) / (b.u - a.u);
  }
  return path[path.length - 1].h;
}
