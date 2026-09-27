import { getProductsByCategory } from "@/lib/queries";
import { ShopView } from "@/components/ShopView";

export const metadata = { title: "Trousers — nanos.pk" };

export default async function TrousersPage() {
  let products: Awaited<ReturnType<typeof getProductsByCategory>> = [];
  try {
    products = await getProductsByCategory("trousers");
  } catch (err) {
    console.error("Failed to fetch trousers products:", err);
  }
  return <ShopView products={products} />;
}
