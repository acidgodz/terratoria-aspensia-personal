import { describe, expect, test } from "vitest";
import { arc, jumpFor, WAVE_GAP, waveHeight, wavePath } from "./runner";

describe("runner jump", () => {
  const unit = 30, speed = unit * 9;
  test("the cube is above every spike for as long as it overlaps the group", () => {
    for (const n of [1, 2, 3]) {
      for (const gap of [0.15 * unit, 0.5 * unit, 0.9 * unit]) {
        const j = jumpFor(gap, n, unit, speed);
        // Sample the flight: whenever any part of the cube is over a spike, its bottom must be above that spike.
        for (let s = 0; s <= j.duration; s += 0.002) {
          const front = speed * s; // cube front edge, relative to take-off
          const back = front - unit;
          for (let k = 0; k < n; k++) {
            const left = gap + k * unit, right = left + unit, tipX = left + unit / 2;
            if (front < left || back > right) continue;
            // Spike height under the cube's nearest point to the tip.
            const xNear = Math.min(Math.max(tipX, back), front);
            const spike = 0.95 * unit * (1 - Math.abs(xNear - tipX) / (unit / 2));
            expect(arc(j.height, j.duration, s), `n=${n} gap=${gap} s=${s.toFixed(3)}`).toBeGreaterThan(spike - 0.5);
          }
        }
        expect(speed * j.duration - unit).toBeGreaterThan(gap + n * unit); // lands past the last spike
      }
    }
  });
});

describe("wave path", () => {
  let seed = 3;
  const rnd = () => ((seed = (seed * 16807) % 2147483647), seed / 2147483647);
  test("zigzags at 45 degrees inside the corridor band and lands on the floor by the end", () => {
    for (let k = 0; k < 50; k++) {
      const len = 60 + k * 3;
      const p = wavePath(len, rnd);
      expect(p[0].h).toBe(0.5);
      expect(p[p.length - 1].h).toBe(0.5);
      expect(p[p.length - 1].u).toBeLessThanOrEqual(len + 1e-9);
      expect(p.length).toBeGreaterThan(6);
      for (let i = 1; i < p.length; i++) {
        const du = p[i].u - p[i - 1].u, dh = Math.abs(p[i].h - p[i - 1].h);
        expect(du).toBeGreaterThanOrEqual(0);
        if (dh > 0) expect(Math.abs(du - dh)).toBeLessThan(1e-9); // 45° legs
        expect(p[i].h).toBeLessThanOrEqual(5.6 + 1e-9);
        // The corridor floor (h − WAVE_GAP) never cuts below the ground in mid-flight.
        if (i > 1 && i < p.length - 2) expect(p[i].h - WAVE_GAP).toBeGreaterThanOrEqual(0);
      }
      expect(waveHeight(p, len / 2)).toBeGreaterThan(0.5);
    }
  });
});
