import { apiGet } from "./api";
import type { Product } from "@nanospk/shared-types";

/**
 * Raw row exactly as the API returns it (Prisma model — the JSON fields
 * arrive as strings). Mapped to the shared Product DTO below.
 */
export type RawProduct = {
  id: string;
  name: string;
  category: string;
  tag: string | null;
  price: number;
  oldPrice: number | null;
  desc: string;
  rating: number;
  reviews: number;
  /** Prisma relation (replaces the old colorsJson string field). */
  colors: { name: string; hex: string; imagesJson: string }[];
  sizesJson: string;
  outOfStockJson: string;
  hero: string;
  galleryJson: string;
  isSale: boolean;
};

function parseJsonArray<T>(value: string): T[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function toProduct(raw: RawProduct): Product {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category as Product["category"],
    tag: raw.tag,
    price: raw.price,
    oldPrice: raw.oldPrice,
    colors: raw.colors.map((c) => ({
      name: c.name,
      hex: c.hex,
      images: parseJsonArray<string>(c.imagesJson),
    })),
    sizes: parseJsonArray<string>(raw.sizesJson),
    outOfStock: parseJsonArray<string>(raw.outOfStockJson),
    hero: raw.hero,
    gallery: parseJsonArray<string>(raw.galleryJson),
    desc: raw.desc,
    rating: raw.rating,
    reviews: raw.reviews,
    isSale: raw.isSale,
  };
}

export async function getProducts(): Promise<Product[]> {
  const rows = await apiGet<RawProduct[]>("/products");
  return rows.map(toProduct);
}

export async function getProductsByCategory(
  category: "crocs" | "trousers",
): Promise<Product[]> {
  const rows = await apiGet<RawProduct[]>(
    `/products?category=${encodeURIComponent(category)}`,
  );
  return rows.map(toProduct);
}

export async function getSaleProducts(): Promise<Product[]> {
  const rows = await apiGet<RawProduct[]>("/products?sale=true");
  return rows.map(toProduct);
}

export async function getProduct(id: string): Promise<Product> {
  return toProduct(await apiGet<RawProduct>(`/products/${id}`));
}

export async function getCart(): Promise<{ items: unknown[] }> {
  return apiGet<{ items: unknown[] }>("/cart");
}
