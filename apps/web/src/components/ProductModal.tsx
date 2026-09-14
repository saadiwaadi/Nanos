"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Check,
  Heart,
} from "lucide-react";
import type { Product } from "@nanospk/shared-types";
import { useCart, fmtPrice } from "@/lib/cart";
import { useProductModal } from "./ProductModalContext";

const SIZE_CHART = [
  { us: "US 6", uk: "UK 5.5", eu: "39", cm: "24.5" },
  { us: "US 6.5", uk: "UK 6", eu: "39.5", cm: "24.8" },
  { us: "US 7", uk: "UK 6.5", eu: "40", cm: "25.0" },
  { us: "US 7.5", uk: "UK 7", eu: "40.5", cm: "25.4" },
  { us: "US 8", uk: "UK 7.5", eu: "41", cm: "25.8" },
  { us: "US 8.5", uk: "UK 8", eu: "42", cm: "26.2" },
  { us: "US 9", uk: "UK 8.5", eu: "42.5", cm: "26.5" },
  { us: "US 9.5", uk: "UK 9", eu: "43", cm: "26.9" },
  { us: "US 10", uk: "UK 9.5", eu: "44", cm: "27.3" },
  { us: "US 10.5", uk: "UK 10", eu: "44.5", cm: "27.7" },
  { us: "US 11", uk: "UK 10.5", eu: "45", cm: "28.0" },
  { us: "US 12", uk: "UK 11.5", eu: "46", cm: "28.8" },
];

function SizeGuideModal({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);
  const handlerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  useEffect(() => {
    if (!panelRef.current) return;
    prevFocus.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]):not([tabindex="-1"]), [href], input:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    requestAnimationFrame(() => first?.focus());

    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    handlerRef.current = handler;
    panel.addEventListener("keydown", handler);
    return () => {
      panel.removeEventListener("keydown", handlerRef.current!);
      prevFocus.current?.focus();
    };
  }, []);

  return (
    <div
      className="sg-backdrop open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-hidden="true"
    >
      <div
        ref={panelRef}
        className="sg-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Size guide"
      >
        <div className="sg-header">
          <h3>Size Guide</h3>
          <button
            type="button"
            className="sg-close"
            onClick={onClose}
            aria-label="Close size guide"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="sg-body">
          <table className="sg-table">
            <thead>
              <tr>
                <th>US</th>
                <th>UK</th>
                <th>EU</th>
                <th>CM</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_CHART.map((r) => (
                <tr key={r.us}>
                  <td>{r.us}</td>
                  <td>{r.uk}</td>
                  <td>{r.eu}</td>
                  <td>{r.cm}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="sg-note">
            Sizes are approximate. Measure your foot length in centimeters and
            match to the CM column. If you are between sizes, we recommend
            sizing up for a roomier fit. For trousers, CM refers to the waist
            measurement converted to centimeters.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProductModal() {
  const ctx = useProductModal();
  const cart = useCart();
  const { selectedProduct, closeProduct, openSizeGuide, sizeGuideOpen } = ctx;

  const [imgIdx, setImgIdx] = useState(0);
  const [mainSrc, setMainSrc] = useState("");
  const [imgOpacity, setImgOpacity] = useState(1);
  const [colorName, setColorName] = useState("");
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [wish, setWish] = useState(false);
  const [desc, setDesc] = useState("");

  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);
  const trapHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gotoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const product: Product | null = selectedProduct;
  const gallery =
    product && product.gallery.length > 0
      ? product.gallery
      : product
        ? [product.hero]
        : [];

  const soldOut = useCallback(
    (s: string) => product ? product.outOfStock.includes(s) : true,
    [product],
  );

  // reset per-product state when product changes
  useEffect(() => {
    if (!product) return;
    if (gotoTimerRef.current) clearTimeout(gotoTimerRef.current);
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    const colors = product.colors;
    setColorName(colors[0]?.name ?? "");
    setSize(product.sizes.find((s) => !product.outOfStock.includes(s)) ?? null);
    setQty(1);
    setAdded(false);
    setWish(false);
    setImgIdx(0);
    setDesc(product.desc ?? "");
    const firstSrc = gallery[0] ?? product.hero ?? "";
    setMainSrc(firstSrc);
    setImgOpacity(1);
  }, [product, gallery]);

  // focus management + tab trap
  useEffect(() => {
    if (!product) {
      prevFocus.current?.focus();
      return;
    }
    prevFocus.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (!panel) return;

    const closeBtn = panel.querySelector<HTMLElement>(".pmq-close");
    requestAnimationFrame(() => closeBtn?.focus());

    const focusables = panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]):not([tabindex="-1"]), [href], input:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    trapHandlerRef.current = handler;
    panel.addEventListener("keydown", handler);
    trapHandlerRef.current = handler;
    return () => {
      panel.removeEventListener("keydown", handler);
      prevFocus.current?.focus();
    };
  }, [product]);

  // fade in when new main image loads
  const onImgLoad = useCallback(() => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => setImgOpacity(1), 30);
  }, []);

  const goTo = useCallback(
    (idx: number) => {
      const newSrc = gallery[idx] ?? product?.hero ?? "";
      if (newSrc === mainSrc) {
        setImgIdx(idx);
        return;
      }
      if (gotoTimerRef.current) clearTimeout(gotoTimerRef.current);
      setImgOpacity(0);
      gotoTimerRef.current = setTimeout(() => {
        setMainSrc(newSrc);
        setImgIdx(idx);
        gotoTimerRef.current = null;
      }, 200);
    },
    [gallery, mainSrc, product],
  );

  const handleAdd = useCallback(() => {
    if (!product || !size || soldOut(size)) return;
    cart.addItem(
      {
        productId: product.id,
        name: product.name,
        color: colorName,
        size,
        price: product.price,
        img: mainSrc ?? product.hero,
      },
      qty,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }, [product, size, soldOut, colorName, qty, mainSrc, cart]);

  const cycleImg = useCallback(
    (dir: 1 | -1) => {
      if (gallery.length === 0) return;
      const next = (imgIdx + dir + gallery.length) % gallery.length;
      goTo(next);
    },
    [gallery, imgIdx, goTo],
  );

  const handleColor = (name: string) => setColorName(name);

  if (!product) return null;

  return (
    <>
      <div
        className="prod-modal-backdrop open"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeProduct();
        }}
        aria-hidden="true"
      >
        <div
          ref={panelRef}
          className="prod-modal-panel"
          role="dialog"
          aria-modal="true"
          aria-label={product.name}
        >
          {/* close button first in DOM for focus order, positioned top-right */}
          <button
            type="button"
            className="pmq-close"
            onClick={closeProduct}
            aria-label="Close quick view"
          >
            <X size={18} strokeWidth={2} />
          </button>

          {/* gallery */}
          <div className="pmq-gallery">
            <div className="pmq-main">
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    className="pmq-arrow pmq-arrow-left"
                    onClick={() => cycleImg(-1)}
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={18} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    className="pmq-arrow pmq-arrow-right"
                    onClick={() => cycleImg(1)}
                    aria-label="Next image"
                  >
                    <ChevronRight size={18} strokeWidth={2} />
                  </button>
                </>
              )}
              <img
                src={mainSrc}
                alt={product.name}
                className="pmq-main-img"
                style={{
                  opacity: imgOpacity,
                  transition: "opacity 0.25s ease",
                }}
                onLoad={onImgLoad}
                onError={onImgLoad}
              />
            </div>
            {gallery.length > 1 && (
              <div className="pmq-thumbs">
                {gallery.map((g, i) => (
                  <div
                    key={i}
                    className={`pmq-thumb${i === imgIdx ? " active" : ""}`}
                    onClick={() => goTo(i)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        goTo(i);
                      }
                    }}
                    aria-label={`Image ${i + 1}`}
                    aria-pressed={i === imgIdx}
                  >
                    <img src={g} alt="" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* details */}
          <div className="pmq-details">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <h1 className="pmq-name">{product.name}</h1>
              <button
                type="button"
                className={`pmq-wish${wish ? " active" : ""}`}
                aria-label={
                  wish
                    ? "Remove from wishlist"
                    : "Add to wishlist"
                }
                aria-pressed={wish}
                onClick={() => setWish((w) => !w)}
              >
                <Heart size={18} strokeWidth={2} />
              </button>
            </div>

            <p className="pmq-sub">
              {product.category === "crocs" ? "Crocs" : "Trousers"} ·{" "}
              {product.colors.length} colors · {product.sizes.length} sizes
            </p>

            <div className="pmq-price-row">
              <span className="pmq-price">{fmtPrice(product.price)}</span>
              {product.oldPrice != null && (
                <span className="pmq-price-old">
                  {fmtPrice(product.oldPrice)}
                </span>
              )}
            </div>

            <div className="pmq-rating">
              <span className="lime">★</span> {product.rating} ·{" "}
              {product.reviews} reviews
            </div>

            <div className="option-group">
              <div className="option-label">
                <span className="title">Color</span>
                <span className="val">{colorName}</span>
              </div>
              <div className="color-swatches">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    className={`color-swatch${
                      colorName === c.name ? " selected" : ""
                    }`}
                    onClick={() => handleColor(c.name)}
                    aria-label={c.name}
                    aria-pressed={colorName === c.name}
                    title={c.name}
                  >
                    <span
                      className="swatch-inner"
                      style={{
                        background: c.hex,
                        border:
                          c.hex === "#ffffff" || c.hex === "#F7F5F0"
                            ? "1px solid #d9d6cf"
                            : undefined,
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="option-group">
              <div className="option-label">
                <span className="title">Size</span>
                <span className="val">
                  {size ?? "Select a size"}
                </span>
              </div>
              <div className="size-options">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`size-opt${
                      size === s ? " selected" : ""
                    }${soldOut(s) ? " disabled" : ""}`}
                    onClick={() => !soldOut(s) && setSize(s)}
                    disabled={soldOut(s)}
                    aria-pressed={size === s}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="size-guide-link"
                onClick={openSizeGuide}
              >
                Size Guide
              </button>
            </div>

            <div className="option-group">
              <div className="option-label">
                <span className="title">Quantity</span>
                <span className="val">{qty}</span>
              </div>
              <div className="qty-stepper">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="qty-val" aria-label={`Quantity ${qty}`}>
                  {qty}
                </span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <div className="pmq-actions">
              <button
                type="button"
                className={`add-to-cart${added ? " added" : ""}`}
                onClick={handleAdd}
                disabled={!size || soldOut(size)}
                aria-label={
                  added
                    ? "Added to cart"
                    : !size
                      ? "Select a size to add to cart"
                      : `Add to cart — ${fmtPrice(product.price * qty)}`
                }
              >
                <ShoppingBag size={18} strokeWidth={2} className="cart-icon" />
                <Check size={18} strokeWidth={2.5} className="check-icon" />
                <span>
                  {added
                    ? "Added ✓"
                    : size
                      ? "Add to Cart"
                      : "Select a size"}
                </span>
              </button>
              <button
                type="button"
                className="pmq-wish"
                aria-label="Add to wishlist"
                onClick={() => setWish((w) => !w)}
              >
                <Heart size={18} strokeWidth={2} />
              </button>
            </div>

            {added && (
              <p
                style={{
                  fontSize: 13,
                  color: "#5a8f00",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Added to cart ✓
              </p>
            )}

            <p className="pmq-desc">{desc}</p>
          </div>
        </div>
      </div>

      {/* nested size guide modal (z-index 210/211 — above product modal) */}
      {sizeGuideOpen && (
        <SizeGuideModal onClose={ctx.closeSizeGuide} />
      )}
    </>
  );
}
