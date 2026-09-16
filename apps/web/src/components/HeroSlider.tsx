"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Headset,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { HERO_SLIDES } from "@/lib/brand";

// Auto-advance disabled for now (user request) — flip to true to restore
// the 5.5s rotation. Arrows/dots/hover-pause still work either way.
const AUTO_ROTATE = false;
const ROTATE_MS = 5500;

const PERK_ICONS = [
  { Icon: Truck, lines: ["Fast", "Delivery"] },
  { Icon: ShieldCheck, lines: ["Secure", "Shopping"] },
  { Icon: RotateCcw, lines: ["Easy", "Returns"] },
  { Icon: Headset, lines: ["Customer", "Support"] },
] as const;

/**
 * Full-viewport hero: continuous crossfade slideshow, 100vh on load,
 * consistent vertical rhythm, scroll-reveal cue at the bottom.
 */
export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY <= 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setAtTop(true); // hero owns the first screen on every page load
  }, [pathname]);

  useEffect(() => {
    if (!AUTO_ROTATE) return;
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [paused, index]);

  return (
    <section
      className="hero-banner"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {HERO_SLIDES.map((slide, i) => {
        const active = i === index;
        return (
          <div
            key={slide.title}
            className={`hero-slide ${active ? "active" : ""}`}
            style={{ backgroundImage: `url('${slide.img}')` }}
            aria-hidden={!active}
          >
            <div className="hero-banner-scrim" />
          </div>
        );
      })}

      {/* text layer over the image */}
      {HERO_SLIDES.map((slide, i) => {
        const active = i === index;
        return (
          <div
            key={`copy-${slide.title}`}
            className={`hero-copy-layer ${active ? "active" : ""}`}
            aria-hidden={!active}
          >
            <div className={`hero-banner-copy ${active ? "active" : ""}`}>
              <div className="hero-eyebrow-row">
                <span className="hero-eyebrow-lime">{slide.eyebrowLime}</span>
                <span className="hero-eyebrow-x">×</span>
                <span className="hero-eyebrow-rest">{slide.eyebrowRest}</span>
              </div>

              <h1 className="hero-banner-title">
                {slide.title.split("<br>").map((line, j, arr) => (
                  <span key={j}>
                    {line}
                    {j < arr.length - 1 && <br />}
                  </span>
                ))}
              </h1>

              <p className="hero-banner-sub">{slide.copy}</p>

              {slide.perks.length > 0 && (
                <div className="hero-perks">
                  {PERK_ICONS.map(({ Icon, lines }) => (
                    <div key={lines.join(" ")} className="hero-perk-item">
                      <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
                      <span>
                        {lines[0]}
                        <br />
                        {lines[1]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <button
        type="button"
        className="hero-arrow hero-arrow-left"
        aria-label="Previous slide"
        onClick={() => setIndex((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
      >
        <ChevronLeft size={28} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        className="hero-arrow hero-arrow-right"
        aria-label="Next slide"
        onClick={() => setIndex((i) => (i + 1) % HERO_SLIDES.length)}
      >
        <ChevronRight size={28} strokeWidth={1.8} />
      </button>

      <div className="hero-dots" role="tablist" aria-label="Choose slide">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.title}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Slide ${i + 1}`}
            className={`dot ${i === index ? "active" : ""}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>

      {/* scroll cue — fades out once the user scrolls */}
      <div className={`hero-scroll-cue ${atTop ? "" : "hide"}`} aria-hidden="true">
        <ChevronDown size={26} strokeWidth={1.8} />
      </div>
    </section>
  );
}
