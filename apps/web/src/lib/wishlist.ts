"use client";

import { useEffect, useState } from "react";
import type { Product } from "@nanospk/shared-types";

export type WishlistItem = {
  productId: string;
  name: string;
  price: number;
  oldPrice?: number | null;
  img: string;
  color?: string;
  sizes?: string[];
  outOfStock?: string[];
};

type WishlistState = {
  items: WishlistItem[];
};

const STORAGE_KEY = "nanos_wishlist_v1";
const CHANGE_EVENT = "nanos-wishlist-changed";

function load(): WishlistState {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as WishlistState;
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    return { items: [] };
  }
}

function save(state: WishlistState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useWishlist() {
  const [state, setState] = useState<WishlistState>({ items: [] });

  useEffect(() => {
    const sync = () => setState(load());
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const items = state.items;

  return {
    items,
    count: items.length,

    isWishlisted(productId: string): boolean {
      return items.some((i) => i.productId === productId);
    },

    toggleWishlist(p: Product | { id: string; name: string; price: number; oldPrice?: number | null; hero: string; colors?: any[]; sizes?: string[]; outOfStock?: string[] }) {
      const cur = load();
      const exists = cur.items.some((i) => i.productId === p.id);
      if (exists) {
        cur.items = cur.items.filter((i) => i.productId !== p.id);
      } else {
        const item: WishlistItem = {
          productId: p.id,
          name: p.name,
          price: p.price,
          oldPrice: p.oldPrice,
          img: 'hero' in p ? p.hero : (p as any).img,
          color: p.colors?.[0]?.name ?? "Default",
          sizes: p.sizes ?? [],
          outOfStock: p.outOfStock ?? [],
        };
        cur.items.push(item);
      }
      save(cur);
    },

    removeWishlist(productId: string) {
      const cur = load();
      cur.items = cur.items.filter((i) => i.productId !== productId);
      save(cur);
    },
  };
}
