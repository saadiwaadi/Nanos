import { getProductsByCategory } from "@/lib/queries";
import { ShopView } from "@/components/ShopView";

export const metadata = { title: "Crocs — nanos.pk" };

export default async function CrocsPage() {
  const products = await getProductsByCategory("crocs");
  return <ShopView products={products} />;
}
