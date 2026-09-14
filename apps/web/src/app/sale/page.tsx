import { getSaleProducts } from "@/lib/queries";
import { ShopView } from "@/components/ShopView";

export const metadata = { title: "Sale — nanos.pk" };

export default async function SalePage() {
  const products = await getSaleProducts();
  return <ShopView products={products} />;
}
