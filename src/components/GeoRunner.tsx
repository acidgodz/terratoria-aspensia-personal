"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { jumpFor, WAVE_GAP, waveHeight, wavePath, type WavePoint } from "@/lib/runner";

// FLOW theme, home page only: an original geometry run in a monochrome steel palette, built as a looping
// 21-bar level at 128 BPM. Our own layout, in the genre's style:
//   bars 0–5   build: the cube jumps spaced spike groups under a glowing orb
//   bars 5–11  drop: a flash, more speed, denser spikes, black-white inversion every bar, shake and pulse rings
//   bars 11–17 wave: a portal turns the cube into an arrow that zigzags through a spiked corridor
//   bars 17–21 run-out: back to the cube, fast, then the loop starts again
// Lite Mode drops glow blur, shake and half the particles. Reduced motion shows one still frame.
const BPM = 128;
const BAR = (60 / BPM) * 4;
const AT = { drop: 5 * BAR, wave: 11 * BAR, out: 17 * BAR, loop: 21 * BAR };
const SPEED = { build: 9, drop: 13, wave: 12, out: 11 }; // cube sizes per second
const SKY_TOP = "#262c3b", SKY_LOW = "#8790a8", INK = "#161a24", FACE_L = "#454e64", FACE_R = "#262c3a", EDGE = "rgba(214,222,238,0.55)", LIGHT = "#eef2fa";

type Phase = keyof typeof SPEED;
interface Group { x: number; n: number }
interface Shard { x: number; y: number; s: number; rot: number; spin: number; depth: number; vx: number; vy: number }

const phaseAt = (lt: number): Phase => (lt < AT.drop ? "build" : lt < AT.wave ? "drop" : lt < AT.out ? "wave" : "out");

export function GeoRunner() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    const x = c?.getContext("2d");
    if (!c || !x) return;
    const lite = document.documentElement.dataset.perf === "lite" || window.matchMedia("(hover: none)").matches;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, floor = 0, unit = 0;
    const shards: Shard[] = [];
    const groups: Group[] = [];
    const trail: { x: number; y: number; r: number; a: number }[] = [];
    const streaks = Array.from({ length: lite ? 10 : 24 }, () => ({ x: Math.random(), y: Math.random(), l: 0.05 + Math.random() * 0.12 }));
    const gapFor = (p: Phase) => unit * (p === "drop" ? 4.5 + Math.random() * 4 : p === "out" ? 5.5 + Math.random() * 4.5 : 7 + Math.random() * 6);
    const countFor = (p: Phase) => 1 + Math.floor(Math.random() * (p === "build" ? 2.4 : 3));

    const resize = () => {
      const dpr = lite ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      c.width = W * dpr;
      c.height = H * dpr;
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      floor = H * 0.8;
      unit = Math.max(26, Math.min(44, W / 34));
      shards.length = 0;
      for (let i = 0; i < (lite ? 12 : 26); i++) {
        const depth = 0.2 + Math.random() * 0.8;
        shards.push({ x: Math.random() * W, y: Math.random() * floor * 0.85, s: 8 + depth * 26, rot: Math.random() * 6.3, spin: (Math.random() - 0.5) * 1.2, depth, vx: -(20 + depth * 60), vy: 6 + Math.random() * 14 });
      }
      groups.length = 0;
      for (let gx = W * 0.8; gx < W * 2.4; gx += gapFor("build")) groups.push({ x: gx, n: countFor("build") });
    };
    resize();
    window.addEventListener("resize", resize);

    const tri = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => {
      x.beginPath();
      x.moveTo(ax, ay);
      x.lineTo(bx, by);
      x.lineTo(cx, cy);
      x.closePath();
    };

    const player = { y: 0, rot: 0, jump: null as null | { t0: number; dur: number; h: number; r0: number; turns: number } };
    const px = () => W * 0.6;
    let last = performance.now(), frame = 0, scroll = 0, lt = 0, phase: Phase = "build", flash = 0;
    // Wave section: its path (cube sizes) and the scroll position where it starts.
    let path: WavePoint[] = [], wave0 = Infinity;
    const newPath = () => {
      path = wavePath((SPEED.wave * (AT.out - AT.wave)), Math.random);
    };
    newPath();

    // Screen y of the wave path at screen x (null outside the section).
    const waveY = (sx: number) => {
      const u = (scroll - wave0 + (sx - px())) / unit;
      if (u < 0 || u > path[path.length - 1].u) return null;
      return floor - waveHeight(path, u) * unit;
    };

    const tick = (now: number) => {
      const dt = still ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      lt = (lt + dt) % AT.loop;
      const p = phaseAt(lt);
      if (p !== phase) {
        // Section change: a flash on the drop and through each portal; fresh spikes after the wave.
        if (p !== "build") flash = 1;
        if (p === "out") {
          groups.length = 0;
          for (let gx = W * 1.05; gx < W * 2.4; gx += gapFor("out")) groups.push({ x: gx, n: countFor("out") });
        }
        if (p === "build") newPath();
        phase = p;
      }
      const speed = SPEED[phase] * unit;
      scroll += speed * dt;
      flash *= Math.exp(-dt * 4);
      const beats = (lt * BPM) / 60;
      const beat = Math.exp(-(beats % 1) * 5);
      const hot = phase === "drop" || phase === "wave";
      const invert = phase === "drop" && Math.floor(beats / 4) % 2 === 1;

      // Where the wave section begins, predicted while the drop runs at its steady speed.
      const toWave = AT.wave - lt;
      if (phase === "drop") wave0 = scroll + speed * toWave;
      const portalIn = phase === "drop" ? px() + speed * toWave : null;
      const portalOut = phase === "wave" ? px() + speed * (AT.out - lt) : null;

      x.save();
      if (hot && !lite && !still) x.translate((Math.random() - 0.5) * unit * 0.22 * beat, (Math.random() - 0.5) * unit * 0.22 * beat);

      // Sky and the glowing orb with slow rays; pulse rings on every beat of the hot sections.
      const sky = x.createLinearGradient(0, 0, 0, floor);
      sky.addColorStop(0, SKY_TOP);
      sky.addColorStop(1, SKY_LOW);
      x.fillStyle = sky;
      x.fillRect(-20, -20, W + 40, H + 40);
      const ox = W * 0.74, oy = floor - H * 0.3, or = H * 0.2 * (1 + (hot ? 0.06 : 0.02) * beat);
      x.save();
      x.translate(ox, oy);
      x.rotate(t * (hot ? 0.12 : 0.03));
      x.fillStyle = `rgba(255,255,255,${hot ? 0.08 : 0.05})`;
      for (let i = 0; i < 9; i++) {
        x.rotate((Math.PI * 2) / 9);
        tri(0, 0, -or * 0.35, -H * 1.4, or * 0.35, -H * 1.4);
        x.fill();
      }
      x.restore();
      const halo = x.createRadialGradient(ox, oy, or * 0.6, ox, oy, or * 2.6);
      halo.addColorStop(0, `rgba(240,244,255,${0.5 + beat * 0.15})`);
      halo.addColorStop(1, "rgba(240,244,255,0)");
      x.fillStyle = halo;
      x.fillRect(0, 0, W, H);
      if (hot) {
        const k = beats % 1;
        x.strokeStyle = `rgba(245,248,255,${0.5 * (1 - k)})`;
        x.lineWidth = 3;
        x.beginPath();
        x.arc(ox, oy, or * (1 + k * 1.6), 0, Math.PI * 2);
        x.stroke();
      }
      x.fillStyle = `rgba(250,252,255,${0.9 + beat * 0.1})`;
      x.beginPath();
      x.arc(ox, oy, or, 0, Math.PI * 2);
      x.fill();

      // Drifting shards, faster when the track is hot.
      for (const s of shards) {
        s.x += s.vx * dt * (hot ? 2.2 : 1);
        s.y += s.vy * dt * 0.3;
        s.rot += s.spin * dt;
        if (s.x < -40) (s.x = W + 40), (s.y = Math.random() * floor * 0.85);
        x.save();
        x.translate(s.x, s.y);
        x.rotate(s.rot);
        x.globalAlpha = 0.45 + s.depth * 0.55;
        x.fillStyle = INK;
        tri(-s.s, s.s * 0.3, s.s, 0, -s.s * 0.4, -s.s * 0.35);
        x.fill();
        x.strokeStyle = EDGE;
        x.lineWidth = 1;
        x.stroke();
        x.restore();
      }
      x.globalAlpha = 1;

      // Speed streaks in the hot sections.
      if (hot) {
        x.strokeStyle = "rgba(240,244,255,0.22)";
        x.lineWidth = 1.5;
        for (const s of streaks) {
          s.x -= dt * 2.4;
          if (s.x < -s.l) (s.x = 1 + Math.random() * 0.3), (s.y = Math.random());
          x.beginPath();
          x.moveTo(s.x * W, s.y * floor);
          x.lineTo((s.x + s.l) * W, s.y * floor);
          x.stroke();
        }
      }

      // Floor with scrolling tiles that flash on the beat.
      x.fillStyle = INK;
      x.fillRect(-20, floor, W + 40, H - floor + 20);
      x.strokeStyle = `rgba(200,208,226,${0.12 + (hot ? 0.18 * beat : 0)})`;
      x.lineWidth = 1;
      for (let tx = -(scroll % (unit * 2)); tx < W; tx += unit * 2) x.strokeRect(tx, floor + 6, unit * 2, unit * 2);
      if (!lite) {
        x.shadowColor = "rgba(235,240,255,0.9)";
        x.shadowBlur = 10 + beat * (hot ? 22 : 12);
      }
      x.strokeStyle = `rgba(235,240,255,${0.75 + beat * 0.25})`;
      x.lineWidth = 2.5;
      x.beginPath();
      x.moveTo(-20, floor);
      x.lineTo(W + 20, floor);
      x.stroke();
      x.shadowBlur = 0;

      // Wave corridor: solid steel above and below the path, with teeth on both edges.
      if (wave0 !== Infinity) {
        const step = unit / 2;
        const top: [number, number][] = [], bot: [number, number][] = [];
        for (let sx = -step; sx <= W + step; sx += step) {
          const y = waveY(sx);
          if (y === null) continue;
          top.push([sx, y - WAVE_GAP * unit]);
          bot.push([sx, Math.min(floor, y + WAVE_GAP * unit)]);
        }
        if (top.length > 1) {
          x.fillStyle = INK;
          // The ceiling is a thick zigzag band, so the sky and orb stay visible above it.
          x.beginPath();
          top.forEach(([sx, sy], i) => (i ? x.lineTo(sx, sy) : x.moveTo(sx, sy)));
          for (let i = top.length - 1; i >= 0; i--) x.lineTo(top[i][0], top[i][1] - unit * 2.6);
          x.fill();
          x.beginPath();
          x.moveTo(bot[0][0], floor);
          for (const [sx, sy] of bot) x.lineTo(sx, sy);
          x.lineTo(bot[bot.length - 1][0], floor);
          x.fill();
          // Teeth pointing into the corridor.
          for (const [edge, dir] of [[top, 1], [bot, -1]] as const)
            for (let i = 0; i < edge.length - 1; i++) {
              const [ax, ay] = edge[i], [bx, by] = edge[i + 1];
              if (dir === -1 && ay >= floor - 1 && by >= floor - 1) continue;
              const mx = (ax + bx) / 2, my = (ay + by) / 2 + dir * unit * 0.55;
              x.fillStyle = i % 2 ? FACE_L : FACE_R;
              tri(ax, ay, mx, my, bx, by);
              x.fill();
            }
          x.strokeStyle = `rgba(235,240,255,${0.55 + beat * 0.35})`;
          x.lineWidth = 2;
          for (const [edge, lift] of [[top, 0], [top, unit * 2.6], [bot, 0]] as const) {
            x.beginPath();
            edge.forEach(([sx, sy], i) => (i ? x.lineTo(sx, sy - lift) : x.moveTo(sx, sy - lift)));
            x.stroke();
          }
        }
      }

      // Portals: tall rings the player passes through at each mode change.
      for (const gx of [portalIn, portalOut]) {
        if (gx === null || gx > W + unit * 2 || gx < -unit * 2) continue;
        const gy = floor - unit * 2.2;
        if (!lite) {
          x.shadowColor = "rgba(240,244,255,0.95)";
          x.shadowBlur = 18;
        }
        x.strokeStyle = LIGHT;
        x.lineWidth = 4;
        x.beginPath();
        x.ellipse(gx, gy, unit * 0.55, unit * 2.1, 0, 0, Math.PI * 2);
        x.stroke();
        x.lineWidth = 2;
        x.beginPath();
        x.ellipse(gx, gy, unit * 0.32, unit * 1.6, 0, 0, Math.PI * 2);
        x.stroke();
        x.shadowBlur = 0;
      }

      // Spike groups (cube sections). Groups that would reach the cube after the wave portal are removed.
      let next: Group | null = null;
      const front = px() + unit / 2;
      for (let i = groups.length - 1; i >= 0; i--) {
        const g = groups[i];
        g.x -= speed * dt;
        if (portalIn !== null && g.x > portalIn - unit * 2) {
          groups.splice(i, 1);
          continue;
        }
        if (g.x + g.n * unit < 0) {
          if (phase === "wave" || portalIn !== null && portalIn < W * 2.4) {
            groups.splice(i, 1);
            continue;
          }
          g.x = Math.max(W, ...groups.map((o) => o.x + o.n * unit)) + gapFor(phase);
          g.n = countFor(phase);
        }
      }
      for (const g of groups) {
        for (let k = 0; k < g.n; k++) {
          const bx = g.x + k * unit, tip = floor - unit * 0.95;
          x.fillStyle = FACE_L;
          tri(bx, floor, bx + unit / 2, tip, bx + unit / 2, floor);
          x.fill();
          x.fillStyle = FACE_R;
          tri(bx + unit / 2, tip, bx + unit, floor, bx + unit / 2, floor);
          x.fill();
          x.strokeStyle = EDGE;
          x.lineWidth = 1.2;
          tri(bx, floor, bx + unit / 2, tip, bx + unit, floor);
          x.stroke();
        }
        if (g.x + g.n * unit > px() - unit / 2 && (!next || g.x < next.x)) next = g;
      }

      if (phase === "wave") {
        // The arrow rides the zigzag; its glowing trail is the path it has flown.
        player.jump = null;
        const y = waveY(px()) ?? floor - unit / 2;
        const ahead = waveY(px() + 2) ?? y;
        if (!lite) {
          x.shadowColor = "rgba(240,244,255,0.9)";
          x.shadowBlur = 12;
        }
        x.strokeStyle = LIGHT;
        x.lineWidth = unit * 0.16;
        x.beginPath();
        for (let sx = Math.max(0, px() - W * 0.45); sx <= px(); sx += 3) {
          const ty = waveY(sx);
          if (ty !== null) x.lineTo(sx, ty);
        }
        x.stroke();
        x.shadowBlur = 0;
        x.save();
        x.translate(px(), y);
        x.rotate(Math.atan2(ahead - y, 2));
        x.fillStyle = LIGHT;
        tri(unit * 0.55, 0, -unit * 0.45, -unit * 0.38, -unit * 0.45, unit * 0.38);
        x.fill();
        x.fillStyle = INK;
        tri(unit * 0.2, 0, -unit * 0.25, -unit * 0.15, -unit * 0.25, unit * 0.15);
        x.fill();
        x.restore();
        trail.length = 0;
        player.rot = 0;
      } else {
        // Jump: start just before the group; the arc is timed to land past its last spike.
        if (!player.jump && next && next.x - front < unit * 0.9 && next.x - front > unit * 0.15) {
          const j = jumpFor(next.x - front, next.n, unit, speed);
          player.jump = { t0: t, dur: j.duration, h: j.height, r0: player.rot, turns: j.turns };
        }
        if (player.jump) {
          const q = Math.min(1, (t - player.jump.t0) / player.jump.dur);
          player.y = -4 * player.jump.h * q * (1 - q);
          player.rot = player.jump.r0 + (Math.PI / 2) * player.jump.turns * q;
          if (q >= 1) player.jump = null;
        } else player.y = 0;

        // The cube and its fading trail.
        const cy = floor - unit / 2 + player.y;
        trail.push({ x: px(), y: cy, r: player.rot, a: 1 });
        if (trail.length > (lite ? 7 : 14)) trail.shift();
        for (const q of trail) {
          q.x -= speed * dt;
          q.a *= 0.84;
          x.save();
          x.translate(q.x, q.y);
          x.rotate(q.r);
          x.strokeStyle = `rgba(235,240,255,${q.a * 0.35})`;
          x.lineWidth = 1.5;
          x.strokeRect(-unit / 2.6, -unit / 2.6, unit / 1.3, unit / 1.3);
          x.restore();
        }
        x.save();
        x.translate(px(), cy);
        x.rotate(player.rot);
        x.fillStyle = LIGHT;
        x.fillRect(-unit / 2, -unit / 2, unit, unit);
        x.fillStyle = INK;
        x.fillRect(-unit / 4, -unit / 4, unit / 2, unit / 2);
        x.fillStyle = LIGHT;
        x.fillRect(-unit / 9, -unit / 9, unit / 4.5, unit / 4.5);
        x.strokeStyle = INK;
        x.lineWidth = 2;
        x.strokeRect(-unit / 2, -unit / 2, unit, unit);
        x.restore();
      }
      x.restore();

      // The drop inverts black and white every other bar; section changes flash.
      if (invert) {
        x.globalCompositeOperation = "difference";
        x.fillStyle = "#fff";
        x.fillRect(0, 0, W, H);
        // Inverting the steel blue gives beige; strip the colour so the flip is pure black and white.
        x.globalCompositeOperation = "saturation";
        x.fillStyle = "#808080";
        x.fillRect(0, 0, W, H);
        x.globalCompositeOperation = "source-over";
      }
      if (flash > 0.01) {
        x.fillStyle = `rgba(255,255,255,${flash * 0.55})`;
        x.fillRect(0, 0, W, H);
      }

      if (!still) frame = requestAnimationFrame(tick);
    };
    const onVis = () => {
      cancelAnimationFrame(frame);
      last = performance.now();
      if (document.visibilityState === "visible" && !still) frame = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVis);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <canvas ref={ref} className="h-full w-full" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,9,11,0.82) 0%, rgba(8,9,11,0.4) 40%, rgba(8,9,11,0) 66%)" }} />
    </div>,
    document.body,
  );
}
