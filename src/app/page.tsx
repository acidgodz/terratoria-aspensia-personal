"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppState";
import { ZoomableImage } from "@/components/Lightbox";
import { CountUp, Magnet } from "@/components/motion/Motion";
import SplitText from "@/components/SplitText";
import { TeamStrip } from "@/components/Team";
import { WorldTour } from "@/components/WorldTour";
import { textureUrl } from "@/components/three/space";
import { EARTH_SITES, REFERENCES } from "@/data/catalog";
import { DATASETS } from "@/data/datasets";
import { trackById } from "@/data/tracks";
import { DATASET_KM } from "@/data/km";
import { sfx } from "@/lib/audio";
import type { Key } from "@/lib/i18n";
import { DIMENSIONS } from "@/lib/types";

const SolarSystem = dynamic(
  () => import("@/components/three/SolarSystem").then((m) => m.SolarSystem),
  { ssr: false },
);
// Theme-song backdrops (Settings → Theme song). They replace the solar system on this page only.
const BlackHole = dynamic(
  () => import("@/components/three/BlackHole").then((m) => m.BlackHole),
  { ssr: false },
);
const TauCeti = dynamic(
  () => import("@/components/three/TauCeti").then((m) => m.TauCeti),
  { ssr: false },
);
const Earthrise = dynamic(
  () => import("@/components/three/Earthrise").then((m) => m.Earthrise),
  { ssr: false },
);
const GeoRunner = dynamic(
  () => import("@/components/GeoRunner").then((m) => m.GeoRunner),
  { ssr: false },
);

gsap.registerPlugin(ScrollTrigger);

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const calm = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Moment one: the archive instruments behind every score, on a slow loop with a pause control. */
function DataTicker() {
  const { tx, lang } = useApp();
  const [paused, setPaused] = useState(false);
  const items = DATASETS.map((d) => ({
    id: d.id,
    mission: d.mission,
    instrument: (lang === "km" && DATASET_KM[d.id]?.instrument) || d.instrument,
  }));
  return (
    <section
      aria-label={tx("Data sources", "ប្រភពទិន្នន័យ")}
      className="ticker"
      data-paused={paused}
    >
      <div className="ticker-window">
        <div className="ticker-track" aria-hidden="true">
          {[0, 1].map((copy) =>
            items.map((d) => (
              <span key={`${copy}-${d.id}`} className="ticker-item">
                <b>{d.mission}</b> {d.instrument}
              </span>
            )),
          )}
        </div>
      </div>
      <ul className="sr-only">
        {items.map((d) => (
          <li key={d.id}>
            {d.mission}: {d.instrument}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn absolute right-2 top-1/2 h-9 min-h-0 w-9 -translate-y-1/2 justify-center p-0"
        aria-pressed={paused}
        aria-label={
          paused
            ? tx("Play the data ticker", "ចាក់បន្ទាត់ទិន្នន័យ")
            : tx("Pause the data ticker", "ផ្អាកបន្ទាត់ទិន្នន័យ")
        }
        onClick={() => setPaused(!paused)}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          aria-hidden="true"
          fill="currentColor"
        >
          {paused ? (
            <path d="M3 1.5v9l7-4.5z" />
          ) : (
            <path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" />
          )}
        </svg>
      </button>
    </section>
  );
}

type Bi = { en: string; km: string };

const ARCHIVE: { src: string; alt: Bi; caption: Bi }[] = [
  {
    src: `${BASE}/images/apollo-full-moon.jpg`,
    alt: {
      en: "Full Moon photographed during the Apollo programme",
      km: "ព្រះច័ន្ទពេញវង់ ថតក្នុងកម្មវិធី Apollo",
    },
    caption: {
      en: "Full Moon photographed during the Apollo programme. Source: NASA 3D Resources (public domain).",
      km: "ព្រះច័ន្ទពេញវង់ ថតក្នុងកម្មវិធី Apollo។ ប្រភព៖ NASA 3D Resources (សាធារណៈ)។",
    },
  },
  {
    src: `${BASE}/images/apollo-lunar-surface.jpg`,
    alt: { en: "Lunar surface seen from orbit", km: "ផ្ទៃព្រះច័ន្ទមើលពីគន្លងគោចរ" },
    caption: {
      en: "Lunar surface photographed from orbit during the Apollo programme. Source: NASA 3D Resources (public domain).",
      km: "ផ្ទៃព្រះច័ន្ទ ថតពីគន្លងគោចរក្នុងកម្មវិធី Apollo។ ប្រភព៖ NASA 3D Resources (សាធារណៈ)។",
    },
  },
  {
    src: textureUrl("earth"),
    alt: {
      en: "NASA Blue Marble map of Earth",
      km: "ផែនទីផែនដី Blue Marble របស់ NASA",
    },
    caption: {
      en: "NASA Blue Marble with shaded relief and bathymetry, served by NASA GIBS. A static composite, not a live image.",
      km: "NASA Blue Marble ដែលមានស្រមោលសណ្ឋានដី និងជម្រៅសមុទ្រ ពី NASA GIBS។ ជារូបភាពផ្គុំ មិនមែនរូបភាពផ្ទាល់ទេ។",
    },
  },
  {
    src: textureUrl("mars"),
    alt: { en: "Global colour mosaic of Mars", km: "រូបភាពពណ៌ផ្គុំទូទាំងភពអង្គារ" },
    caption: {
      en: "Global colour mosaic of Mars. Source: NASA 3D Resources (public domain).",
      km: "រូបភាពពណ៌ផ្គុំទូទាំងភពអង្គារ។ ប្រភព៖ NASA 3D Resources (សាធារណៈ)។",
    },
  },
];

export default function Home() {
  const { t, lang, track } = useApp();
  const scene = trackById(track).scene;
  const [amaze, setAmaze] = useState(false);
  const hero = useRef<HTMLElement>(null);
  const archive = useRef<HTMLDivElement>(null);

  // Hero entrance, once on load.
  useIso(() => {
    if (!hero.current || calm()) return;
    const ctx = gsap.context(() => {
      const done = { clearProps: "transform,opacity,visibility,letterSpacing" };
      gsap
        .timeline({ defaults: { ease: "expo.out" } })
        .from("[data-hero='kicker']", {
          autoAlpha: 0,
          y: 14,
          duration: 0.8,
          ...done,
        })
        .from(
          "[data-hero='project']",
          { autoAlpha: 0, letterSpacing: "1.1em", duration: 1.4, ...done },
          0.1,
        )
        .from(
          "[data-hero='line']",
          { autoAlpha: 0, y: 22, duration: 1, stagger: 0.1, ...done },
          0.55,
        )
        .from(
          "[data-hero='cta'] > *",
          {
            autoAlpha: 0,
            y: 18,
            scale: 0.94,
            duration: 0.8,
            stagger: 0.07,
            ease: "back.out(1.7)",
            ...done,
          },
          0.8,
        )
        .from(
          ".stat-cell",
          { autoAlpha: 0, y: 24, duration: 0.9, stagger: 0.08, ...done },
          0.95,
        )
        .from("[data-hero='cue']", { autoAlpha: 0, duration: 1, ...done }, 1.4);
    }, hero);
    return () => ctx.revert();
  }, []);

  // Moment two: the archive frames open as the section scrolls into place.
  useEffect(() => {
    const grid = archive.current;
    if (!grid || calm()) return;
    const ctx = gsap.context(() => {
      const st = {
        trigger: grid,
        start: "top 92%",
        end: "top 30%",
        scrub: 0.8,
      };
      gsap.fromTo(grid, { y: 70 }, { y: 0, ease: "none", scrollTrigger: st });
      gsap.fromTo(
        grid.children,
        { clipPath: "inset(24% 24% 24% 24% round 22px)" },
        {
          clipPath: "inset(-20% -20% -20% -20% round 0px)",
          ease: "none",
          stagger: 0.08,
          scrollTrigger: st,
        },
      );
    }, grid);
    return () => ctx.revert();
  }, []);

  const stats: [number, Key][] = [
    [REFERENCES.length, "stat_regions"],
    [EARTH_SITES.length, "stat_sites"],
    [DIMENSIONS.length, "stat_dims"],
    [DATASETS.filter((d) => d.level !== "literature").length, "stat_data"],
  ];

  return (
    <>
      {scene === "blackhole" ? (
        <BlackHole />
      ) : scene === "tauceti" ? (
        <TauCeti amaze={amaze} />
      ) : scene === "runner" ? (
        <GeoRunner />
      ) : scene === "earthrise" ? (
        <Earthrise />
      ) : (
        <SolarSystem />
      )}
      <div className="relative z-10 space-y-20 pb-10">
        <section
          ref={hero}
          data-own-enter
          className="flex min-h-[calc(100svh-11rem)] max-w-3xl flex-col justify-center pt-6"
        >
          <p data-hero="kicker" className="label !text-accent">
            {t("hero_kicker")}
          </p>
          <h1 className="hero-title hud-frame mt-4 leading-none">
            <span
              data-hero="project"
              className="block font-mono text-sm tracking-[0.45em] text-accent"
            >
              PROJECT:
            </span>
            <SplitText
              key={scene === "tauceti" ? "hail" : scene === "earthrise" ? "edge" : "terra"}
              text={scene === "tauceti" ? "HAIL MARY" : scene === "earthrise" ? "EDGERUNNERS" : "Terratoria"}
              tag="span"
              trigger="load"
              textAlign="left"
              delay={50}
              className={`mt-2 !block text-6xl font-semibold tracking-tight sm:text-7xl ${scene === "earthrise" ? "is-edge" : ""}`}
            />
          </h1>
          <p data-hero="line" className="mt-5 text-xl text-text/90 sm:text-2xl">
            {t("tagline")}
          </p>
          <p data-hero="line" className="mt-3 max-w-xl text-muted">
            {t("hero_desc")}
          </p>
          {/* The CTA block shrinks to the width of its button row, so AMAZE below can span exactly that width. */}
          <div
            data-hero="cta"
            className="mt-8 inline-flex max-w-full flex-col gap-3"
          >
            <div className="flex flex-wrap gap-3">
              <Magnet>
                <Link href="/discover/" className="btn btn-primary btn-lg">
                  {t("start_discovering")} →
                </Link>
              </Magnet>
              <Link href="/explore/" className="btn btn-lg">
                {t("explore_3d")}
              </Link>
              <Link href="/plan/" className="btn btn-lg">
                {t("nav_plan")}
              </Link>
              <Link href="/challenge/" className="btn btn-lg">
                ▶ {t("nav_challenge")}
              </Link>
            </div>
            {scene === "tauceti" && (
              <button
                type="button"
                className={`btn btn-lg amaze-btn w-full justify-center tracking-[0.2em] ${amaze ? "is-on" : ""}`}
                aria-pressed={amaze}
                onClick={() => (setAmaze(!amaze), sfx("open"))}
              >
                ✦ AMAZE
              </button>
            )}
          </div>
          <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(([n, k], i) => (
              <div key={k} className="stat-cell">
                <dt className="sr-only">{t(k)}</dt>
                <dd className="stat-num font-mono text-3xl tabular-nums">
                  <CountUp to={n} delay={1 + i * 0.1} />
                </dd>
                <dd aria-hidden="true" className="text-xs text-muted">
                  {t(k)}
                </dd>
              </div>
            ))}
          </dl>
          <span
            data-hero="cue"
            aria-hidden="true"
            className="scroll-cue mt-10 hidden sm:block"
          />
        </section>

        <DataTicker />

        <WorldTour />

        <section aria-labelledby="archive-h">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="archive-h" className="label">
              {t("archive_title")}
            </h2>
            <p className="text-xs text-muted">{t("archive_hint")}</p>
          </div>
          <div ref={archive} className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {ARCHIVE.map((img) => (
              <ZoomableImage
                key={img.src}
                image={{
                  src: img.src,
                  alt: img.alt[lang],
                  caption: img.caption[lang],
                }}
                className="img-frame aspect-square"
              />
            ))}
          </div>
        </section>

        <TeamStrip />
      </div>
    </>
  );
}
