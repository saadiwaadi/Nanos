import { getProducts } from "@/lib/queries";
import { ShopView } from "@/components/ShopView";

export const metadata = { title: "Shop — nanos.pk" };

export default async function ShopPage() {
  const products = await getProducts();
  return <ShopView products={products} />;
}
