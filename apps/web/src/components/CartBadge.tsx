"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";

/** Live cart count for the header icon — syncs across tabs and pages.
 * Pulses briefly when the count changes (e.g. after Add to Cart). */
export function CartBadge() {
  const { count } = useCart();
  const prev = useRef(count);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (count !== prev.current) {
      setPulse(true);
      prev.current = count;
      const t = setTimeout(() => setPulse(false), 700);
      return () => clearTimeout(t);
    }
  }, [count]);

  return (
    <span className={`cart-count${pulse ? " pulse" : ""}`}>
      {count}
    </span>
  );
}
