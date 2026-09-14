import { getProducts } from "@/lib/queries";
import { HeroSlider } from "@/components/HeroSlider";
import { ProductCard } from "@/components/ProductCard";
import { PlaceholderSlot } from "@/components/PlaceholderSlot";
import { ImgOrSlot } from "@/components/ImgOrSlot";
import { SocialProductGrid } from "@/components/SocialProductGrid";
import { IMAGE_SLOTS, FEED_SLOT_NUMS } from "@/lib/imageSlots";

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
            <div className="product-grid">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="product-card">
                  <div className="product-thumb">
                    <div className="thumb-slot">
                      <span className="slot-box">
                        <b className="slot-num">IMG-{10 + i}</b>
                        [SLOT: PRODUCT-IMAGE]
                        <span>catalog position {i + 1} — tag NEW to appear here</span>
                      </span>
                    </div>
                  </div>
                  <div className="product-info">
                    <h3>Product {i + 1}</h3>
                  </div>
                </div>
              ))}
            </div>
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
                slotNum={IMAGE_SLOTS.promoCrocs}
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
                slotNum={IMAGE_SLOTS.promoTrousers}
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
            <div className="social-grid">
              <div className="social-tile dark-tile">
                <p>
                  nanos.pk
                  <br />
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#999" }}>
                    CROCS / TROUSERS
                  </span>
                </p>
              </div>
              {FEED_SLOT_NUMS.map((num) => (
                <div key={num} className="social-tile">
                  <p>
                    {num}
                    <span className="tile-underline" />
                  </p>
                </div>
              ))}
              <div className="social-tile lime-tile">
                <p>
                  KEEP IT SIMPLE.
                  <br />
                  WEAR IT YOUR WAY.
                  <span className="tile-underline" />
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
