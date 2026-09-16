import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/queries";
import { ProductDetail } from "@/components/ProductDetail";
import { ProductCard } from "@/components/ProductCard";
import Link from "next/link";

import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await getProduct(id);
    const description =
      product.desc || `${product.name} — available at nanos.pk`;
    return {
      title: product.name,
      description,
      openGraph: {
        title: product.name,
        description,
        images: product.hero ? [{ url: product.hero, alt: product.name }] : [],
        url: `https://nanos.pk/product/${product.id}`,
        siteName: "nanos.pk",
      },
      other: {
        "og:type": "product",
        "og:price": product.price.toString(),
        "product:price:amount": product.price.toString(),
        "product:price:currency": "PKR",
      },
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let product;
  try {
    product = await getProduct(id);
  } catch {
    notFound();
  }

  const all = await getProducts();
  const related = all.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="page">
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="sep">/</span>
        <Link href={`/${product.category}`}>
          {product.category === "crocs" ? "Crocs" : "Trousers"}
        </Link>
        <span className="sep">/</span>
        <span className="current">{product.name}</span>
      </div>

      <ProductDetail product={product} />

      {related.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>You may also like</h2>
          </div>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
