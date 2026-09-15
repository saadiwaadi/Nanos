"use client";

import { useState } from "react";
import { Heart, Truck, RotateCcw, Headset } from "lucide-react";
import type { Product } from "@nanospk/shared-types";
import { cn } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { productSlotNums } from "@/lib/imageSlots";
import { ProductCodeTag, ProductCodeChip } from "./ProductCodeTag";

function fmtPrice(n: number) {
  return "PKR " + n.toLocaleString("en-PK");
}

export function ProductDetail({ product: p }: { product: Product }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [color, setColor] = useState(p.colors[0]?.name ?? "");
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);
  const cart = useCart();

  // Gallery derives from the SELECTED COLOR's images (backfilled per-color
  // galleries); falls back to the product-wide gallery, then to hero.
  const selectedColor = p.colors.find((c) => c.name === color);
  const colorImages = selectedColor?.images ?? [];
  const gallery =
    colorImages.length > 0
      ? colorImages
      : p.gallery.length > 0
        ? p.gallery
        : [p.hero];
  const soldOut = (s: string) => p.outOfStock.includes(s);
  const slotNums = productSlotNums(p.id);

  function handleAdd() {
    if (!size || soldOut(size)) return;
    cart.addItem({
      productId: p.id,
      name: p.name,
      color,
      size,
      price: p.price,
      img: gallery[imgIdx] ?? p.hero,
    }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="pdp">
      <div className="pdp-gallery">
        <div className="pdp-main-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gallery[imgIdx]} alt={p.name} />
          <span className="img-slot-badge">{slotNums.galleryNums[imgIdx] ?? slotNums.num}</span>
        </div>
        <div className="pdp-thumbs">
          {gallery.map((g, i) => (
            <div
              key={g}
              className={cn("pdp-thumb", i === imgIdx && "active")}
              onClick={() => setImgIdx(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g} alt="" />
              <span className="img-slot-badge">{slotNums.galleryNums[i] ?? slotNums.num}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pdp-info">
        <h1>{p.name}</h1>
        <div className="pdp-sub">
          {p.category === "crocs" ? "Crocs" : "Trousers"} · {p.colors.length}{" "}
          colors available{" "}
          <ProductCodeTag productId={p.id} slotNum={slotNums.num} inline />
        </div>
        <div className="pdp-price-row">
          <span className="price">{fmtPrice(p.price)}</span>
          {p.oldPrice != null && (
            <>
              <span className="price-old">{fmtPrice(p.oldPrice)}</span>
              <span className="badge badge-sale">SALE</span>
            </>
          )}
        </div>
        <div className="pdp-rating">
          <span>★ {p.rating}</span>
          <span>({p.reviews} reviews)</span>
        </div>

        <div className="option-group">
          <div className="label-row">
            <label className="title">Color</label>
            <span className="selected-val">{color}</span>
          </div>
          <div className="color-options">
            {p.colors.map((c) => (
              <div
                key={c.name}
                title={c.name}
                className={cn("color-opt", color === c.name && "selected")}
                onClick={() => {
                  setColor(c.name);
                  setImgIdx(0); // new color => new thumbnail strip; avoid stale index
                }}
              >
                <span className="swatch-inner" style={{ background: c.hex }} />
              </div>
            ))}
          </div>
        </div>

        <div className="option-group">
          <div className="label-row">
            <label className="title">Size</label>
            <span className="selected-val">{size ?? "Select a size"}</span>
          </div>
          <div className="size-options">
            {p.sizes.map((s) => (
              <div
                key={s}
                className={cn(
                  "size-opt",
                  size === s && "selected",
                  soldOut(s) && "disabled",
                )}
                onClick={() => !soldOut(s) && setSize(s)}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        <div className="qty-row">
          <label className="title">Quantity</label>
          <div className="qty-stepper">
            <button type="button" onClick={() => setQty(Math.max(1, qty - 1))}>
              −
            </button>
            <span className="qty-val">{qty}</span>
            <button type="button" onClick={() => setQty(qty + 1)}>
              +
            </button>
          </div>
        </div>

        <div className="pdp-actions">
          <button
            className="btn btn-primary"
            disabled={!size || soldOut(size)}
            onClick={handleAdd}
          >
            {added
              ? "Added ✓"
              : !size
                ? "Select a size"
                : `Add to Cart — ${fmtPrice(p.price * qty)}`}
          </button>
          <button
            type="button"
            className={`wish-toggle ${wished ? "active" : ""}`}
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wished}
            onClick={() => setWished((w) => !w)}
          >
            <Heart size={18} strokeWidth={2} />
          </button>
        </div>
        {added && (
          <div
            style={{
              fontSize: 13,
              color: "#5a8f00",
              marginTop: -16,
              marginBottom: 24,
              fontWeight: 600,
            }}
          >
            Added to cart ✓ — <a href="/cart">view cart</a>
          </div>
        )}

        <div className="pdp-perks">
          <div className="pdp-perk">
            <Truck size={16} strokeWidth={1.8} aria-hidden="true" />
            Free delivery on orders over PKR 5,000
          </div>
          <div className="pdp-perk">
            <RotateCcw size={16} strokeWidth={1.8} aria-hidden="true" />
            Easy 14-day returns
          </div>
          <div className="pdp-perk">
            <Headset size={16} strokeWidth={1.8} aria-hidden="true" />
            Customer support 7 days a week
          </div>
        </div>

        <div className="pdp-accordion">
          <details open>
            <summary>Description</summary>
            <p>
              {p.desc}
              <ProductCodeChip productId={p.id} />
            </p>
          </details>
          <details>
            <summary>Size &amp; Fit</summary>
            <p>
              True to size for most. If you are between sizes, we recommend
              sizing up for a roomier fit.
            </p>
          </details>
          <details>
            <summary>Shipping &amp; Returns</summary>
            <p>
              Orders ship within 1-2 business days. Delivery takes 2-5 business
              days across Pakistan. Unworn items can be returned within 14 days
              of delivery.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
