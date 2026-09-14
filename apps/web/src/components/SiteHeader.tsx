"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CartBadge } from "./CartBadge";

/**
 * Reference layout: [hamburger] --- nanos.pk (centered) --- [search, cart].
 * Hidden at the very top of the page; fades + slides in as a fixed solid
 * black bar after the user scrolls past the hero's first pixels.
 */
export function SiteHeader({
  revealed,
  navToggle,
  onOpenCart,
}: {
  revealed: boolean;
  navToggle?: ReactNode;
  onOpenCart?: () => void;
}) {
  return (
    <header className={`site-header ${revealed ? "revealed" : ""}`}>
      <div className="header-inner">
        <div className="header-left">
          {navToggle}
        </div>

        <Link href="/" className="logo" aria-label="nanos.pk home">
          <img
            src="https://res.cloudinary.com/tp1vyxi3/image/upload/v1789301766/ChatGPT_Image_Sep_13__2026__05_15_23_AM-removebg-preview.png"
            alt="nanos.pk"
            className="logo-img"
            width={120}
            height={32}
          />
        </Link>

        <div className="header-actions">
          <button className="icon-btn" aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Open cart"
            style={{ position: "relative" }}
            onClick={onOpenCart}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <CartBadge />
          </button>
        </div>
      </div>
    </header>
  );
}
