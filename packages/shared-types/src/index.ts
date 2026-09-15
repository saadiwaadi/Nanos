// Shared types between apps/api and apps/web.
// Rule: neither app imports from the other; both import from here.
// These are intentionally pure TS types/DTOs plus the tRPC router shape.

export type Category = "crocs" | "trousers" | "shop" | "sale";

export interface ProductColor {
  name: string;
  hex: string;
  /** Per-color gallery (ordered). Falls back to the product gallery on the PDP when empty. */
  images: string[];
}

export interface ProductVariant {
  productId: string;
  color: string;
  size: string;
  qty: number;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  tag?: string | null;
  price: number;
  oldPrice?: number | null;
  colors: ProductColor[];
  sizes: string[];
  outOfStock: string[];
  hero: string;
  gallery: string[];
  desc: string;
  rating: number;
  reviews: number;
  isSale: boolean;
}

export interface CartItem {
  productId: string;
  color: string;
  size: string;
  qty: number;
}

export interface Cart {
  items: CartItem[];
}

export interface WishlistItem {
  productId: string;
}

export interface ShippingInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postal: string;
}

export type PaymentMethod = "cod" | "card" | "easypaisa";

export type OrderStatus = "processing" | "shipped" | "delivered";

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shippingInfo: ShippingInfo;
  payment: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  color: string;
  size: string;
  qty: number;
  unitPrice: number;
}

export interface ApiError {
  code: string;
  message: string;
}

// tRPC router shape.
// We prefer a single AppRouter assembled from feature routers.
// The shape below is what apps/web will consume via tRPC client.
export type AppRouter = unknown;

export interface TrpcInference {
  // Placeholder for the inferred tRPC client type.
  // Finalized once the router is defined in apps/api.
  _def: unknown;
}
