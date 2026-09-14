"use client";

import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@nanospk/shared-types";

export function ShopView({ products }: { products: Product[] }) {
  return (
    <div className="page">
      <div className="wrap">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">/</span>
          <span className="current">Shop</span>
        </div>

        <div className="category-hero" style={{ borderBottom: "none", paddingBottom: 0 }}>
          <h1>Shop All</h1>
          <p>Browse our full collection of crocs and trousers.</p>
        </div>

        <div className="product-grid">
          {products.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px", color: "#777" }}>
              No products available right now.
            </div>
          ) : (
            products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
