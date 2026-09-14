"use client";

import type { Product } from "@nanospk/shared-types";
import { ImgOrSlot } from "./ImgOrSlot";
import { useProductModal } from "./ProductModalContext";
import { fmtPrice } from "@/lib/cart";
import { FEED_SLOT_NUMS } from "@/lib/imageSlots";

/**
 * Home-page product feed ("Shop the feed") — rebuilt to the prototype's
 * social strip (nanos-pk-prototype.html renderHome):
 *   [dark brand tile] [product × tagline] [product × tagline]
 *   [product × tagline] [product]      [lime brand tile]
 * Product tiles are live API products (first 4, prototype order) and open
 * the quick-view modal on click — no navigation. Taglines are the
 * prototype's overlay copy; the 4th tile is bare, as in the prototype.
 * API down → the home page renders the HOME-PRODUCT-FEED slot instead.
 */
const TAGLINES: Array<[string, string] | null> = [
  ["COMFORT", "IN EVERY STEP."],
  ["BETTER", "BASICS."],
  ["SIMPLE STYLES.", "BIGGER DAYS."],
  null, // bare image tile, like the prototype's 5th tile
];

export function SocialProductGrid({ products }: { products: Product[] }) {
  const { openProduct } = useProductModal();
  const feed = products.slice(0, 4);

  return (
    <div className="social-grid">
      {/* brand tile — dark intro (not a product, not clickable) */}
      <div className="social-tile dark-tile">
        <p>
          nanos.pk
          <br />
          <span style={{ fontSize: 11, fontWeight: 500, color: "#999" }}>
            CROCS / TROUSERS
          </span>
        </p>
      </div>

      {feed.map((p, i) => {
        const tagline = TAGLINES[i];
        return (
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
              slotNum={FEED_SLOT_NUMS[i]}
              className="tile-fill-img"
              slotClassName="tile-media"
            />
            {tagline && (
              <p>
                {tagline[0]}
                <br />
                {tagline[1]}
                <span className="tile-underline" />
              </p>
            )}
            <span className="tile-view">Quick view</span>
          </button>
        );
      })}

      {/* brand tile — lime closer (not a product, not clickable) */}
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
