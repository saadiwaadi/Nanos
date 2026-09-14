import { getProductsByCategory } from "@/lib/queries";
import { ShopView } from "@/components/ShopView";

export const metadata = { title: "Trousers — nanos.pk" };

export default async function TrousersPage() {
  const products = await getProductsByCategory("trousers");
  return <ShopView products={products} />;
}
