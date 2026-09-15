"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useState } from "react";
import type { Product } from "@nanospk/shared-types";
import { ImgOrSlot } from "./ImgOrSlot";
import { ProductCodeTag } from "./ProductCodeTag";
import { useCart } from "@/lib/cart";
import { useProductModal } from "./ProductModalContext";
import { productSlotNums } from "@/lib/imageSlots";

function fmtPrice(n: number) {
  return "PKR " + n.toLocaleString("en-PK");
}

function badgeClass(p: Product): string | null {
  if (p.tag === "NEW") return "badge badge-new";
  if (p.tag === "SALE") return "badge badge-sale";
  if (p.tag === "BESTSELLER") return "badge badge-bestseller";
  if (p.oldPrice != null) return "badge badge-sale";
  return null;
}

export function ProductCard({ product: p }: { product: Product }) {
  const badge = badgeClass(p);
  const slot = productSlotNums(p.id);
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);
  const cart = useCart();
  const { openProduct } = useProductModal();

  function handleCardClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    openProduct(p);
  }

  function quickAdd() {
    // Default variant, mirroring the prototype's quickAdd().
    const size = p.sizes.find((s) => !p.outOfStock.includes(s)) ?? p.sizes[0];
    if (!size) return;
    cart.addItem({
      productId: p.id,
      name: p.name,
      color: p.colors[0]?.name ?? "Default",
      size,
      price: p.price,
      img: p.hero,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <div className="product-card">
      <Link href={`/product/${p.id}`} className="product-thumb" onClick={handleCardClick}>
        <ImgOrSlot
          src={p.hero}
          alt={p.name}
          slotName={`PRODUCT-IMAGE:${p.id}`}
          slotNum={slot.num}
          showBadge
        />
        <ProductCodeTag productId={p.id} slotNum={slot.num} />
        <div className="badges">
          {badge && (
            <span className={badge}>
              {p.oldPrice != null && !p.tag ? "SALE" : p.tag}
            </span>
          )}
        </div>
        <button
          type="button"
          className={`card-wish ${wished ? "active" : ""}`}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Wishlist API lands with the UsersModule — local echo for now.
            setWished((w) => !w);
          }}
        >
          <Heart size={16} strokeWidth={2} />
        </button>
      </Link>
      <Link href={`/product/${p.id}`} className="product-info" onClick={handleCardClick}>
        <h3>{p.name}</h3>
        <div className="variant">{p.colors[0]?.name}</div>
        <div className="price-row">
          <span className="price">{fmtPrice(p.price)}</span>
          {p.oldPrice != null && (
            <span className="price-old">{fmtPrice(p.oldPrice)}</span>
          )}
        </div>
        <div className="swatches">
          {p.colors.map((c) => (
            <span key={c.name} className="swatch" style={{ background: c.hex }} />
          ))}
        </div>
      </Link>
      <div style={{ padding: "0 16px 16px" }}>
        <button
          type="button"
          className={`quick-add ${added ? "added" : ""}`}
          onClick={quickAdd}
        >
          {added ? "Added ✓" : "Quick Add"}
        </button>
      </div>
    </div>
  );
}
