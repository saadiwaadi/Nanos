"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useWishlist, type WishlistItem } from "@/lib/wishlist";
import { useCart, fmtPrice } from "@/lib/cart";

export function LikedProductsSection({ title = "Liked Products" }: { title?: string }) {
  const wishlist = useWishlist();
  const cart = useCart();
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  if (wishlist.items.length === 0) {
    return null;
  }

  const handleQuickAdd = (item: WishlistItem) => {
    const size = item.sizes && item.sizes.length > 0
      ? (item.sizes.find((s) => !item.outOfStock?.includes(s)) ?? item.sizes[0])
      : "Default";

    cart.addItem({
      productId: item.productId,
      name: item.name,
      color: item.color ?? "Default",
      size,
      price: item.price,
      img: item.img,
    });

    setAddedMap((prev) => ({ ...prev, [item.productId]: true }));
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [item.productId]: false }));
    }, 1500);
  };

  return (
    <div style={{ marginTop: 40, borderTop: "1px solid var(--stone, #e0e0e0)", paddingTop: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Heart size={20} fill="#111" stroke="#111" />
        <h2 style={{ fontSize: 20, margin: 0, fontWeight: 700 }}>
          {title} ({wishlist.items.length})
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {wishlist.items.map((item) => {
          const isAdded = addedMap[item.productId];
          return (
            <div
              key={item.productId}
              style={{
                background: "#ffffff",
                border: "1px solid #e0e0e0",
                borderRadius: 6,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <button
                type="button"
                aria-label="Remove from wishlist"
                title="Remove from wishlist"
                onClick={() => wishlist.removeWishlist(item.productId)}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  background: "rgba(255, 255, 255, 0.9)",
                  border: "none",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  zIndex: 2,
                }}
              >
                <Trash2 size={14} color="#666" />
              </button>

              <Link
                href={`/product/${item.productId}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    width: "100%",
                    height: 160,
                    background: "#f7f5f0",
                    borderRadius: 4,
                    overflow: "hidden",
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.img ? (
                    <img
                      src={item.img}
                      alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }}
                    />
                  ) : (
                    <div style={{ color: "#999", fontSize: 12 }}>[NO IMAGE]</div>
                  )}
                </div>

                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                  {item.name}
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
                  {fmtPrice(item.price)}
                </div>
              </Link>

              <button
                type="button"
                className={`btn btn-block ${isAdded ? "btn-primary" : "btn-outline"}`}
                style={{
                  marginTop: "auto",
                  fontSize: 12,
                  padding: "7px 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontWeight: 700,
                  background: isAdded ? "var(--lime, #c8ff00)" : "transparent",
                  color: "#111",
                }}
                onClick={() => handleQuickAdd(item)}
              >
                <ShoppingBag size={14} />
                {isAdded ? "Added to Cart ✓" : "Add to Cart"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LikedProductsDrawerSection() {
  const wishlist = useWishlist();
  const cart = useCart();
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  if (wishlist.items.length === 0) return null;

  const handleQuickAdd = (item: WishlistItem) => {
    const size = item.sizes && item.sizes.length > 0
      ? (item.sizes.find((s) => !item.outOfStock?.includes(s)) ?? item.sizes[0])
      : "Default";

    cart.addItem({
      productId: item.productId,
      name: item.name,
      color: item.color ?? "Default",
      size,
      price: item.price,
      img: item.img,
    });

    setAddedMap((prev) => ({ ...prev, [item.productId]: true }));
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [item.productId]: false }));
    }, 1500);
  };

  return (
    <div
      style={{
        marginTop: 20,
        paddingTop: 16,
        borderTop: "1px solid #eee",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <Heart size={16} fill="#111" stroke="#111" />
        <span style={{ fontSize: 13, fontWeight: 700 }}>
          Your Liked Items ({wishlist.items.length})
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {wishlist.items.map((item) => {
          const isAdded = addedMap[item.productId];
          return (
            <div
              key={item.productId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 8,
                background: "#f9f9f9",
                borderRadius: 6,
                border: "1px solid #eee",
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 4, overflow: "hidden", background: "#fff", flexShrink: 0 }}>
                {item.img && <img src={item.img} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 11, color: "#666" }}>{fmtPrice(item.price)}</div>
              </div>
              <button
                type="button"
                onClick={() => handleQuickAdd(item)}
                style={{
                  padding: "4px 8px",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 4,
                  border: "1px solid #111",
                  background: isAdded ? "#c8ff00" : "#111",
                  color: isAdded ? "#111" : "#fff",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {isAdded ? "Added ✓" : "+ Add"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
