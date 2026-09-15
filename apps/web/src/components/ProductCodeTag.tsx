import { productCode } from "@/lib/imageSlots";

/**
 * Small product-code label shown with every product image, optionally with
 * its IMG-XX slot number — so a photo can be traced to its product on any
 * surface (shop grid, feed tile, PDP gallery, quick-view modal, cart).
 * `inline` renders a static chip for info rows; default is the absolute
 * corner badge (parent needs `position: relative`).
 */
export function ProductCodeTag({
  productId,
  slotNum,
  inline = false,
}: {
  productId: string;
  slotNum?: string;
  inline?: boolean;
}) {
  const text = `SKU ${productCode(productId)}${slotNum ? ` · ${slotNum}` : ""}`;
  return (
    <span className={inline ? "product-code-tag inline" : "product-code-tag"}>
      {text}
    </span>
  );
}

/**
 * Compact code chip for embedding inside product descriptions — renders
 * just the code (e.g. `CLO-BLK`) in a small bordered tag, no "SKU" prefix,
 * no positioning. Placed in the Description accordion on the PDP, the
 * quick-view modal, and the detail panel.
 */
export function ProductCodeChip({ productId }: { productId: string }) {
  return <span className="product-code-chip">{productCode(productId)}</span>;
}
