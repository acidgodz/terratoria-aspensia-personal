"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TRACKS, trackById, type Track } from "@/data/tracks";
import { useApp } from "./AppState";

/** Coloured Greek-letter badge, or the themed song's own icon. */
export function TrackBadge({ track, size = 28 }: { track: Track; size?: number }) {
  const box = { width: size, height: size };
  if (track.icon === "blackhole")
    return (
      <svg {...box} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <ellipse cx="16" cy="16" rx="14" ry="5" fill="none" stroke="#ffb35c" strokeWidth="2.2" />
        <path d="M5 13a11 11 0 0 1 22 0" fill="none" stroke="#ffd9a0" strokeWidth="1.6" />
        <circle cx="16" cy="16" r="6" fill="#000" stroke="#ffe7c2" strokeWidth="1" />
      </svg>
    );
  if (track.icon === "tauceti")
    return (
      <svg {...box} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.25)" strokeDasharray="2 3" />
        <circle cx="16" cy="16" r="5" fill="#ffc46b" />
        <circle cx="27" cy="11" r="3.4" fill="#5fe38a" />
        <path d="M24 5l2.5 1-1 2.5" fill="none" stroke="#e9ecf1" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  if (track.icon === "earthrise")
    return (
      <svg {...box} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <rect width="32" height="32" rx="7" fill="#05070c" />
        <circle cx="17" cy="14" r="9" fill="#1f5fae" />
        <path d="M10 10c3-2 6 0 8-2s5 1 6 3c-2 1-4 0-6 2s-5 1-8-3zM13 17c2 0 3 2 6 1s3 2 2 3c-3 1-6 0-8-4z" fill="#eef4ff" opacity="0.9" />
        <circle cx="17" cy="14" r="9.6" fill="none" stroke="#7cc4ff" strokeWidth="1" opacity="0.8" />
        <path d="M0 24c6-3 11-1 16-2s11-2 16 0v10H0z" fill="#9a9a9e" />
        <path d="M0 24c6-3 11-1 16-2s11-2 16 0" fill="none" stroke="#e4e4e8" strokeWidth="1" />
        <ellipse cx="9" cy="28" rx="3" ry="1" fill="#6e6e74" />
        <ellipse cx="23" cy="27" rx="2" ry="0.7" fill="#6e6e74" />
        <circle cx="27" cy="5" r="0.7" fill="#fff" /><circle cx="5" cy="7" r="0.5" fill="#fff" />
      </svg>
    );
  if (track.icon === "runner")
    return (
      <svg {...box} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <rect width="32" height="32" rx="7" fill="#262c3b" />
        <circle cx="24" cy="9" r="4" fill="#eef2fa" opacity="0.85" />
        <rect x="6" y="9.5" width="9" height="9" fill="#eef2fa" transform="rotate(-14 10.5 14)" />
        <rect x="8.75" y="12.25" width="3.5" height="3.5" fill="#161a24" transform="rotate(-14 10.5 14)" />
        <path d="M17 25l3.5-7 3.5 7zM24 25l3.5-7 3.5 7z" fill="#454e64" stroke="#d6deee" strokeWidth="0.9" strokeLinejoin="round" />
        <path d="M2 25h28" stroke="#eef2fa" strokeWidth="1.6" />
      </svg>
    );
  return (
    <span className="track-greek shrink-0" style={{ ...box, background: track.color, fontSize: size * 0.5 }} aria-hidden="true">
      {"αβγδεζ"[["alpha", "beta", "gamma", "delta", "epsilon", "zeta"].indexOf(track.id)]}
    </span>
  );
}

const YT = "https://www.youtube-nocookie.com";
const cmd = (f: HTMLIFrameElement | null, func: string, args: unknown[] = []) => f?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), YT);
const clock = (s: number) => (Number.isFinite(s) && s > 0 ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

function Icon({ d, size = 14 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
// Player layout the visitor chose (position, see-through level, mini size), kept between visits.
type Layout = { x: number | null; y: number | null; fade: number; mini: boolean };
const LAYOUT_KEY = "terratoria.musicLayout";
const FADES = [1, 0.7, 0.45]; // see-through steps; hovering or focusing the player always shows it fully
const readLayout = (): Layout => {
  try {
    const l = JSON.parse(localStorage.getItem(LAYOUT_KEY) ?? "{}");
    return { x: typeof l.x === "number" ? l.x : null, y: typeof l.y === "number" ? l.y : null, fade: FADES.includes(l.fade) ? l.fade : 1, mini: !!l.mini };
  } catch {
    return { x: null, y: null, fade: 1, mini: false };
  }
};
const clampTo = (v: number, size: number, room: number) => Math.min(Math.max(8, v), Math.max(8, room - size - 8));

const PLAY = "M4 2.5v11l9-5.5z", PAUSE = "M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z", PREV = "M3 3h2v10H3zM14 3v10L6 8z", NEXT = "M11 3h2v10h-2zM2 3v10l8-5z";

/**
 * The site's music player. Songs with a licensed audio file play in the background through an <audio> element.
 * YouTube songs play in YouTube's embedded player, kept visible (at least 200 × 200 px) as YouTube requires,
 * driven by this player's own controls; collapsing the player pauses a YouTube song.
 */
export function MusicDock() {
  const { music, setMusic, musicAll, track: id, setTrack, volume, setVolume, muted, setMuted, tx, lang } = useApp();
  const track = trackById(id);
  const home = usePathname() === "/";
  const frame = useRef<HTMLIFrameElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const [open, setOpen] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState({ cur: 0, dur: 0 });
  const file = !!track.audio;
  const yt = !file && !!track.youtube;
  const level = muted ? 0 : volume;
  const lastVol = useRef(0.7);
  const dock = useRef<HTMLElement>(null);
  const [layout, setLayoutState] = useState<Layout>({ x: null, y: null, fade: 1, mini: false });
  const setLayout = (l: Layout) => {
    setLayoutState(l);
    try {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(l));
    } catch {
      // storage blocked: the layout just lasts for this visit
    }
  };
  useEffect(() => setLayoutState(readLayout()), []);

  // Keep a moved player on screen when the window shrinks or the player changes size.
  useEffect(() => {
    const fit = () => {
      const el = dock.current;
      if (!el || layout.x === null || layout.y === null) return;
      const x = clampTo(layout.x, el.offsetWidth, window.innerWidth), y = clampTo(layout.y, el.offsetHeight, window.innerHeight);
      if (x !== layout.x || y !== layout.y) setLayoutState((l) => ({ ...l, x, y }));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [layout, open]);

  // Drag by the grip (pointer capture keeps the drag going over the YouTube frame); arrow keys nudge it.
  const moveTo = (x: number, y: number, save: boolean) => {
    const el = dock.current;
    if (!el) return;
    const next = { ...layout, x: clampTo(x, el.offsetWidth, window.innerWidth), y: clampTo(y, el.offsetHeight, window.innerHeight) };
    if (save) setLayout(next);
    else setLayoutState(next);
  };
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const onGripDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = dock.current?.getBoundingClientRect();
    if (!r) return;
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onGripMove = (e: React.PointerEvent<HTMLButtonElement>) => drag.current && moveTo(e.clientX - drag.current.dx, e.clientY - drag.current.dy, false);
  const onGripUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return;
    drag.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setLayout(layout); // save where the drag ended
  };
  const onGripKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    const r = dock.current?.getBoundingClientRect();
    if (!d || !r) return;
    e.preventDefault();
    const n = e.shiftKey ? 80 : 20;
    moveTo(r.left + d[0] * n, r.top + d[1] * n, true);
  };

  // New song: start fresh and playing.
  useEffect(() => {
    setTime({ cur: 0, dur: 0 });
    setPlaying(true);
  }, [id]);

  // YouTube reports its state and time by postMessage once asked to; it also loops here (its own loop needs a playlist).
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || typeof e.data !== "string") return;
      try {
        const d = JSON.parse(e.data);
        const info = d.info ?? {};
        if (typeof info.currentTime === "number" || typeof info.duration === "number")
          setTime((tm) => ({ cur: info.currentTime ?? tm.cur, dur: info.duration || tm.dur }));
        const state = d.event === "onStateChange" ? d.info : info.playerState;
        if (state === 0) {
          cmd(frame.current, "seekTo", [0, true]);
          cmd(frame.current, "playVideo");
        }
      } catch {
        // not a player message
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Keep the player in step with play/pause, collapse, volume and mute.
  useEffect(() => {
    const go = playing && (open || file);
    if (file && audio.current) {
      audio.current.volume = level;
      if (go) void audio.current.play().catch(() => setPlaying(false));
      else audio.current.pause();
      return;
    }
    const apply = () => {
      frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), YT);
      cmd(frame.current, "setVolume", [Math.round(level * 100)]);
      cmd(frame.current, go ? "playVideo" : "pauseVideo");
    };
    apply();
    const f = frame.current;
    f?.addEventListener("load", apply);
    return () => f?.removeEventListener("load", apply);
  }, [playing, open, level, id, file]);

  if (!music || !(file || yt) || (!musicAll && !home)) return null;

  const at = TRACKS.findIndex((x) => x.id === id);
  const step = (d: number) => setTrack(TRACKS[(at + d + TRACKS.length) % TRACKS.length].id);
  const seek = (v: number) => {
    setTime((tm) => ({ ...tm, cur: v }));
    if (file && audio.current) audio.current.currentTime = v;
    else cmd(frame.current, "seekTo", [v, true]);
  };
  const origin = typeof window === "undefined" ? "" : `&origin=${encodeURIComponent(window.location.origin)}`;
  const toggle = () => {
    if (!open && yt) setOpen(true);
    setPlaying(!(playing && (open || file)));
  };
  const isOn = playing && (open || file);

  return (
    <aside
      ref={dock}
      className={`music-dock no-print ${open ? "" : "is-closed"} ${layout.mini ? "is-mini" : ""}`}
      aria-label={tx("Music player", "កម្មវិធីចាក់តន្ត្រី")}
      style={{
        ["--fade" as string]: layout.fade,
        ...(layout.x !== null && layout.y !== null ? { left: layout.x, top: layout.y, right: "auto", bottom: "auto" } : {}),
      }}
    >
      <div className="flex items-center gap-1.5 px-2 py-2">
        <button
          type="button"
          className="music-btn music-grip"
          aria-label={tx("Move player: drag, or use the arrow keys. Double-click to put it back.", "ផ្លាស់ទីកម្មវិធីចាក់៖ អូស ឬប្រើគ្រាប់ចុចព្រួញ។ ចុចពីរដងដើម្បីដាក់វាត្រឡប់។")}
          title={tx("Drag to move · double-click to reset", "អូសដើម្បីផ្លាស់ទី · ចុចពីរដងដើម្បីកំណត់ឡើងវិញ")}
          onPointerDown={onGripDown}
          onPointerMove={onGripMove}
          onPointerUp={onGripUp}
          onPointerCancel={() => (drag.current = null)}
          onKeyDown={onGripKey}
          onDoubleClick={() => setLayout({ ...layout, x: null, y: null })}
        >
          <Icon d="M5 3h2v2H5zM9 3h2v2H9zM5 7h2v2H5zM9 7h2v2H9zM5 11h2v2H5zM9 11h2v2H9z" />
        </button>
        <TrackBadge track={track} size={22} />
        <span className="music-label min-w-0 flex-1">
          <span className="block truncate text-[11px] font-semibold tracking-wide" style={track.color ? { color: track.color } : undefined}>
            {track.label}
          </span>
          <span className="block truncate text-[11px] text-muted">
            {track.title} · {track.artist}
          </span>
        </span>
        {!open && (
          <button type="button" className="music-btn" aria-label={isOn ? tx("Pause", "ផ្អាក") : tx("Play", "ចាក់")} onClick={toggle}>
            <Icon d={isOn ? PAUSE : PLAY} />
          </button>
        )}
        <button
          type="button"
          className="music-btn"
          aria-label={tx(`See-through: ${Math.round(layout.fade * 100)}%`, `ភាពមើលឃើញ៖ ${Math.round(layout.fade * 100)}%`)}
          title={tx("Make the player see-through (it shows fully while you point at it)", "ធ្វើឱ្យកម្មវិធីចាក់ថ្លា (វាបង្ហាញពេញពេលអ្នកចង្អុលលើវា)")}
          onClick={() => setLayout({ ...layout, fade: FADES[(FADES.indexOf(layout.fade) + 1) % FADES.length] })}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 2a6 6 0 010 12z" fill="currentColor" opacity={layout.fade} />
          </svg>
        </button>
        <button
          type="button"
          className="music-btn"
          aria-pressed={layout.mini}
          aria-label={layout.mini ? tx("Full-size player", "កម្មវិធីចាក់ទំហំពេញ") : tx("Mini player", "កម្មវិធីចាក់តូច")}
          title={layout.mini ? tx("Full-size player", "កម្មវិធីចាក់ទំហំពេញ") : tx("Mini player", "កម្មវិធីចាក់តូច")}
          onClick={() => setLayout({ ...layout, mini: !layout.mini })}
        >
          <Icon d={layout.mini ? "M2 2h12v12H2zM3.5 3.5v9h9v-9z" : "M7 7h7v7H7zM8.5 8.5v4h4v-4zM2 2h9v2H4v7H2z"} />
        </button>
        <button
          type="button"
          className="music-btn"
          aria-expanded={open}
          aria-label={open ? tx("Collapse player", "បង្រួមកម្មវិធីចាក់") : tx("Expand player", "ពង្រីកកម្មវិធីចាក់")}
          title={yt && open ? tx("YouTube songs pause while the player is collapsed (YouTube requires a visible player).", "បទពី YouTube នឹងផ្អាកពេលបង្រួម (YouTube តម្រូវឱ្យឃើញកម្មវិធីចាក់)។") : undefined}
          onClick={() => setOpen(!open)}
        >
          <Icon d={open ? "M3 6l5 5 5-5z" : "M3 10l5-5 5 5z"} />
        </button>
        <button type="button" className="music-btn" aria-label={tx("Turn music off", "បិទតន្ត្រី")} onClick={() => setMusic(false)}>
          <span aria-hidden="true" className="text-base leading-none">×</span>
        </button>
      </div>

      {file && <audio ref={audio} src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${track.audio}`} loop preload="auto" onTimeUpdate={(e) => setTime({ cur: e.currentTarget.currentTime, dur: e.currentTarget.duration })} />}

      {yt && (
        // Stays mounted while collapsed so the song resumes where it paused.
        <div className="music-frame" hidden={!open}>
          <iframe
            key={track.youtube}
            ref={frame}
            title={`${track.title} · ${track.artist}`}
            src={`${YT}/embed/${track.youtube}?autoplay=1&enablejsapi=1&playsinline=1&rel=0&iv_load_policy=3&controls=0&disablekb=1${origin}`}
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}

      {open && (
        <div className="px-3 pb-2.5 pt-2">
          <div className="flex items-center gap-1.5">
            <button type="button" className="music-btn" aria-label={tx("Previous song", "បទមុន")} onClick={() => step(-1)}>
              <Icon d={PREV} />
            </button>
            <button type="button" className="music-btn music-play" aria-label={isOn ? tx("Pause", "ផ្អាក") : tx("Play", "ចាក់")} onClick={toggle}>
              <Icon d={isOn ? PAUSE : PLAY} size={16} />
            </button>
            <button type="button" className="music-btn" aria-label={tx("Next song", "បទបន្ទាប់")} onClick={() => step(1)}>
              <Icon d={NEXT} />
            </button>
            <span className="ml-auto font-mono text-[10.5px] tabular-nums text-muted">
              {clock(time.cur)} / {clock(time.dur)}
            </span>
          </div>
          {!layout.mini && (<>
          <input
            type="range"
            className="music-range mt-2 w-full"
            min={0}
            max={Math.max(1, time.dur)}
            step={0.5}
            value={Math.min(time.cur, time.dur || 1)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label={tx("Song position", "ទីតាំងក្នុងបទ")}
            style={{ ["--p" as string]: `${time.dur ? (time.cur / time.dur) * 100 : 0}%` }}
          />
          <div className="mt-1.5 flex items-center gap-2">
            <button
              type="button"
              className="music-btn"
              aria-label={level === 0 ? tx("Unmute music", "បើកសំឡេងតន្ត្រី") : tx("Mute music", "បិទសំឡេងតន្ត្រី")}
              onClick={() => {
                // Music only: sound effects keep their own volume.
                if (muted) setMuted(false);
                if (level > 0) (lastVol.current = volume), setVolume(0);
                else setVolume(lastVol.current || 0.7);
              }}
            >
              <Icon d={level === 0 ? "M2 6h3l4-3v10l-4-3H2zM11 6l4 4M15 6l-4 4" : "M2 6h3l4-3v10l-4-3H2zM11.5 5.5a3.5 3.5 0 010 5"} />
            </button>
            <input
              type="range"
              className="music-range w-full"
              min={0}
              max={100}
              value={Math.round(level * 100)}
              onChange={(e) => {
                setVolume(Number(e.target.value) / 100);
                if (muted) setMuted(false);
              }}
              aria-label={tx("Music volume", "កម្រិតសំឡេងតន្ត្រី")}
              style={{ ["--p" as string]: `${level * 100}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] leading-snug text-muted">{track.credit[lang]}</p>
          </>)}
        </div>
      )}
    </aside>
  );
}
