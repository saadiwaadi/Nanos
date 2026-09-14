"use client";

import { createContext, useContext } from "react";
import type { Product } from "@nanospk/shared-types";export interface ProductModalCtx {
  selectedProduct: Product | null;
  openProduct: (p: Product) => void;
  closeProduct: () => void;
  openSizeGuide: () => void;
  closeSizeGuide: () => void;
  sizeGuideOpen: boolean;
  /** Open the slide-in detail panel (home page). Modal is separate. */
  openDetailPanel: (p: Product) => void;
  closeDetailPanel: () => void;
  detailPanelOpen: boolean;
}
export const ProductModalContext = createContext<ProductModalCtx | null>(null);

export function useProductModal(): ProductModalCtx {
  const ctx = useContext(ProductModalContext);
  if (!ctx) {
    throw new Error("useProductModal must be used within ProductModalContext");
  }
  return ctx;
}
