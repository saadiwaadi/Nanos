import { productCode } from "@/lib/imageSlots";

/**
 * Returns clean SKU text (e.g. `SKU: CLO-BLK`).
 */
export function getProductSku(productId: string): string {
  return `SKU: ${productCode(productId)}`;
}

/**
 * Legacy ProductCodeTag kept for backwards compatibility — renders plain SKU text inline.
 */
export function ProductCodeTag({
  productId,
}: {
  productId: string;
  slotNum?: string;
  inline?: boolean;
}) {
  return <span className="sku-subtext">{getProductSku(productId)}</span>;
}

/**
 * Compact code chip for embedding inside product descriptions.
 */
export function ProductCodeChip({ productId }: { productId: string }) {
  return <span className="product-code-chip">{productCode(productId)}</span>;
}
