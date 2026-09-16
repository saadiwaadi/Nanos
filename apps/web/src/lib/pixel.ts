declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
  }
}

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID || "";

export function pageview() {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView");
  }
}

export function trackEvent(name: string, options: Record<string, any> = {}) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", name, options);
  }
}

export function trackViewContent(product: {
  id: string;
  name: string;
  price: number;
  currency?: string;
}) {
  trackEvent("ViewContent", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value: product.price,
    currency: product.currency || "PKR",
  });
}

export function trackAddToCart(item: {
  productId: string;
  name: string;
  price: number;
  quantity?: number;
  currency?: string;
}) {
  const qty = item.quantity || 1;
  trackEvent("AddToCart", {
    content_ids: [item.productId],
    content_name: item.name,
    content_type: "product",
    value: item.price * qty,
    currency: item.currency || "PKR",
  });
}

export function trackInitiateCheckout(
  items: { productId: string; price: number; quantity: number }[],
  totalValue: number,
  currency = "PKR",
) {
  trackEvent("InitiateCheckout", {
    content_ids: items.map((i) => i.productId),
    content_type: "product",
    num_items: items.reduce((acc, i) => acc + (i.quantity || 1), 0),
    value: totalValue,
    currency,
  });
}
