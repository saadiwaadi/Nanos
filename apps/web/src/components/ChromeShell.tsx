"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Product } from "@nanospk/shared-types";
import { SiteHeader } from "./SiteHeader";
import { SideNav } from "./SideNav";
import { CartDrawer } from "./CartDrawer";
import { ProductModal } from "./ProductModal";
import { ProductModalContext } from "./ProductModalContext";
import { ProductDetailPanel } from "./ProductDetailPanel";

// v2: fresh key so the new closed-by-default behavior applies to everyone
const STORAGE_KEY = "nanos_nav_open_v2";
const REVEAL_AFTER_PX = 80;

/**
 * Chrome behaviors:
 * - Navbar is hidden (transparent) at the very top so the hero owns the
 *   first screen; after REVEAL_AFTER_PX of scroll it transitions in
 *   (fade + slide-down) as a fixed solid bar, and hides again at the top.
 * - Hamburger drawer is ALWAYS an overlay: fixed, slides from the left,
 *   with a dim backdrop — page content never shifts.
 * - Drawer state persists across reloads; Escape closes it.
 */
export function ChromeShell({ children }: { children: React.ReactNode }) {
  // Drawer starts CLOSED so it never overlays the hero on first paint; the
  // user's persisted choice (localStorage) is restored right after mount.
  const [navOpen, setNavOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  // Reveal-on-scroll is a homepage-hero behavior; inner pages always show the bar.
  const barVisible = isHome ? revealed : true;
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setNavOpen(stored === "true");
  }, []);

  useEffect(() => {
    const onScroll = () => setRevealed(window.scrollY > REVEAL_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // body scroll lock — locked while ANY overlay is open, so overlays never fight
  const anyOverlayOpen =
    navOpen || cartOpen || selectedProduct || sizeGuideOpen;
  useEffect(() => {
    document.body.style.overflow = anyOverlayOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [anyOverlayOpen]);

  // centralized Escape cascade — topmost overlay (by z-index) closes first
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (cartOpen) {
        e.preventDefault();
        setCartOpen(false);
        return;
      }
      if (sizeGuideOpen) {
        e.preventDefault();
        setSizeGuideOpen(false);
        return;
      }
      if (selectedProduct) {
        e.preventDefault();
        closeProduct();
        return;
      }
      if (navOpen) {
        e.preventDefault();
        setNavOpen(false);
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen, sizeGuideOpen, selectedProduct, navOpen]);

  function toggleNav() {
    setNavOpen((o) => {
      localStorage.setItem(STORAGE_KEY, String(!o));
      return !o;
    });
  }

  function openCart() {
    setCartOpen(true);
  }

  function openProduct(p: Product) {
    setSelectedProduct(p);
    setSizeGuideOpen(false);
    setNavOpen(false);
  }

  function openDetailPanel(p: Product) {
    setSelectedProduct(p);
    setDetailPanelOpen(true);
    setSizeGuideOpen(false);
    setNavOpen(false);
  }

  function closeDetailPanel() {
    setDetailPanelOpen(false);
    setSelectedProduct(null);
    setSizeGuideOpen(false);
  }

  function closeProduct() {
    setSelectedProduct(null);
    setSizeGuideOpen(false);
  }

  function openSizeGuide() {
    setSizeGuideOpen(true);
  }

  function closeSizeGuide() {
    setSizeGuideOpen(false);
  }

  // reset overlay state on route change so overlays don't persist across pages
  useEffect(() => {
    setCartOpen(false);
    setSelectedProduct(null);
    setSizeGuideOpen(false);
  }, [pathname]);

  return (
    <ProductModalContext.Provider
      value={{
        selectedProduct,
        openProduct,
        closeProduct,
        openSizeGuide,
        closeSizeGuide,
        sizeGuideOpen,
        openDetailPanel,
        closeDetailPanel,
        detailPanelOpen,
      }}
    >
      <>
      <SiteHeader
        revealed={barVisible}
        navToggle={
          <button
            type="button"
            className={`icon-btn nav-toggle ${navOpen ? "open" : ""}`}
            aria-label={navOpen ? "Close menu" : "Open menu"}
            aria-expanded={navOpen}
            onClick={toggleNav}
          >
            <span className="nav-line nav-line-1" />
            <span className="nav-line nav-line-2" />
            <span className="nav-line nav-line-3" />
          </button>
        }
        onOpenCart={openCart}
      />

      <SideNav open={navOpen} onNavigate={() => setNavOpen(false)} />
      <div
        className={"nav-backdrop" + (navOpen ? " show" : "")}
        onClick={() => setNavOpen(false)}
        aria-hidden="true"
      />

      {/* cart drawer — fixed overlay, above the page (z-index 250/251) */}
      <div className={"cart-drawer-wrapper" + (cartOpen ? " is-open" : "")}>
        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      </div>

      {/* product quick-view modal — overlay, z-index 200/201 (below cart drawer) */}
      {selectedProduct && (
        <div
          className="prod-modal-backdrop open"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeProduct();
          }}
          aria-hidden="true"
        >
          <ProductModal />
        </div>
      )}

      {/* product detail panel — slide-in from right, z-index 180/181 */}
      {selectedProduct && <ProductDetailPanel />}

      <main className={`page-shell${isHome ? "" : " with-fixed-header"}`}>{children}</main>
      </>
    </ProductModalContext.Provider>
  );
}
