"use client";

import type { Product } from "@nanospk/shared-types";
import { ImgOrSlot } from "./ImgOrSlot";
import { useProductModal } from "./ProductModalContext";
import { fmtPrice } from "@/lib/cart";

/**
 * Home-page product feed ("Shop the feed"): every product renders as a
 * social-style tile; clicking opens the quick-view detail modal
 * (gallery / color / size / add-to-cart) without leaving the page.
 * The lime brand tile closes the 3x3 grid — it is not a product.
 */
export function SocialProductGrid({ products }: { products: Product[] }) {
  const { openProduct } = useProductModal();

  return (
    <div className="social-grid">
      {products.map((p) => (
        <button
          key={p.id}
          type="button"
          className="social-tile product-tile"
          onClick={() => openProduct(p)}
          aria-haspopup="dialog"
          aria-label={`Quick view ${p.name} — ${fmtPrice(p.price)}`}
        >
          <ImgOrSlot
            src={p.hero}
            alt={p.name}
            slotName={`PRODUCT-IMAGE:${p.id}`}
            className="tile-fill-img"
            slotClassName="tile-media"
          />
          <span className="tile-view">Quick view</span>
          <span className="tile-caption">
            <span className="tile-caption-name">{p.name}</span>
            <span className="tile-caption-price">{fmtPrice(p.price)}</span>
          </span>
        </button>
      ))}

      {/* brand tile — not a product, not clickable */}
      <div className="social-tile lime-tile">
        <p>
          KEEP IT SIMPLE.
          <br />
          WEAR IT YOUR WAY.
          <span className="tile-underline" />
        </p>
      </div>
    </div>
  );
}
