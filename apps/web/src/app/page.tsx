import { getProducts } from "@/lib/queries";
import { HeroSlider } from "@/components/HeroSlider";
import { ProductCard } from "@/components/ProductCard";
import { PlaceholderSlot } from "@/components/PlaceholderSlot";
import { ImgOrSlot } from "@/components/ImgOrSlot";
import { SocialProductGrid } from "@/components/SocialProductGrid";

export const metadata = { title: "nanos.pk — Crocs & Trousers" };

export default async function HomePage() {
  let products: Awaited<ReturnType<typeof getProducts>> = [];
  try {
    products = await getProducts();
  } catch {
    // API down — sections below render their honest empty/slot states.
  }
  const newArrivals = products.filter((p) => p.tag === "NEW").slice(0, 4);

  return (
    <main>
      <HeroSlider />

      <div className="wrap">
        {/* ---- New Arrivals (live data) ---- */}
        <section className="section">
          <div className="section-head">
            <h2>New Arrivals</h2>
          </div>
          {newArrivals.length > 0 ? (
            <div className="product-grid">
              {newArrivals.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <PlaceholderSlot
              name="NEW-ARRIVALS"
              feeds="GET /products?tag=NEW (live when API is up)"
              note="Shows the first 4 products tagged NEW once the API is reachable."
            />
          )}
        </section>

        {/* ---- Category promo tiles ---- */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="promo-grid">
            <div className="promo-card">
              <ImgOrSlot
                src=""
                alt=""
                slotName="PROMO-IMAGE-CROCS"
                slotClassName="promo-media"
              />
              <div className="promo-content">
                <div className="tag">CROCS</div>
                <h3>
                  All day comfort,
                  <br />
                  anywhere.
                </h3>
                <span className="promo-link">Shop Crocs →</span>
              </div>
            </div>
            <div className="promo-card">
              <ImgOrSlot
                src=""
                alt=""
                slotName="PROMO-IMAGE-TROUSERS"
                slotClassName="promo-media"
              />
              <div className="promo-content">
                <div className="tag">TROUSERS</div>
                <h3>
                  Comfort meets
                  <br />
                  versatility.
                </h3>
                <span className="promo-link">Shop Trousers →</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---- Shop the feed: social strip (prototype renderHome) ----} */}
        <section className="section">
          <div className="section-head">
            <h2>Follow @nanos.pk</h2>
          </div>
          {products.length > 0 ? (
            <SocialProductGrid products={products} />
          ) : (
            <PlaceholderSlot
              name="HOME-PRODUCT-FEED"
              feeds="GET /products (live when API is up)"
              note="Shows the social feed strip once the API is reachable."
            />
          )}
        </section>
      </div>
    </main>
  );
}
