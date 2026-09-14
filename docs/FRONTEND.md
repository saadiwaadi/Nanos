# Frontend — nanos.pk Web

> Next.js 16.3.5 (App Router, Turbopack) + React 19 + Tailwind v4.  
> Lives in `apps/web`. Serves `http://localhost:3000`.  
> Fetches product data server-side from `http://localhost:4000`.

---

## 1. Big picture

```
┌─────────────────────────────────────────────────────────┐
│  Root layout (layout.tsx)                               │
│  ├─ SiteHeader (shared, sticky → fixed on scroll)      │
│  ├─ ChromeShell (client)                               │
│  │   ├─ SideNav (hamburger drawer)                     │
│  │   ├─ CartDrawer (slide-in from right)               │
│  │   ├─ ProductModal (quick-view overlay)              │
│  │   ├─ ProductDetailPanel (slide-in from right)       │
│  │   └─ ProductModalContext (state for selected product)│
│  └─ <page> (server component, per route)              │
└─────────────────────────────────────────────────────────┘
```

**Two kinds of pages:**
- **Server components** (default) — fetch data from API, render HTML. Most pages.
- **Client islands** (`"use client"`) — interactivity: cart, modals, checkout form, product quick-view.

**No mock data.** Pages call the real API where it exists (products), show honest empty/slot states where it doesn't (cart, orders, user).

---

## 2. File map — what contains what

### `src/app/` — routes (file-system routing)

| File | Route | Role |
|---|---|---|
| `layout.tsx` | all | Root layout: renders `SiteHeader` + `ChromeShell` wrapping each page. Exports no metadata (global). |
| `page.tsx` | `/` | HomePage (async server): hero slider → New Arrivals grid (first 4 `tag=NEW` products, live from API) → promo tiles (CROCS / TROUSERS, image slots) → Follow @nanos.pk social grid. Falls back to `PlaceholderSlot` if API down. |
| `shop/page.tsx` | `/shop` | ShopPage (async server): calls `getProducts()`, passes to `<ShopView>`. |
| `crocs/page.tsx` | `/crocs` | Category page: `getProductsByCategory("crocs")` → `<ShopView>`. |
| `trousers/page.tsx` | `/trousers` | Category page: `getProductsByCategory("trousers")` → `<ShopView>`. |
| `sale/page.tsx` | `/sale` | Sale page: `getSaleProducts()` → `<ShopView>`. |
| `product/[id]/page.tsx` | `/product/[id]` | PDP (async server + client island `ProductDetail`): fetches product by id server-side, renders gallery, color/size pickers, qty stepper, accordions, Add-to-Cart (local echo until CartModule). 404 if not found. |
| `cart/page.tsx` | `/cart` | Cart page (server wrapper + client `CartDrawer` logic): live cart from `useCart()`, qty steppers, remove, promo `NANOS10`, free shipping nudger, Proceed to Checkout → `/checkout`. Empty state with "Start Shopping". |
| `checkout/page.tsx` | `/checkout` | Checkout (server wrapper + client `CheckoutForm`): shipping form, payment picker (COD / card / easypaisa), live order summary from cart, Place Order (shows notice until OrdersModule). Empty-cart guard → shop. |
| `login/page.tsx` | `/login` | Login page: calls real `/auth/login` API, email+password form + Google button. |
| `account/page.tsx` | `/account` | Account page: renders real session state from `lib/auth.ts` localStorage, sign-out. Shows placeholder slots for orders/wishlist/profile until those APIs land. |

### `src/components/` — UI components

| File | Type | Role |
|---|---|---|
| `ChromeShell.tsx` | client island | Wraps every page. Manages: nav drawer open/close (persisted to localStorage `nanos_nav_open_v2`), cart drawer, product modal, product detail panel, size guide modal, body scroll lock, Escape-key cascade (topmost overlay closes first), scroll-reveal navbar (transparent at top → fades in after 80px scroll on home). |
| `SiteHeader.tsx` | — | Shared header: logo (`nanos.pk` + Cloudinary image), search icon, cart icon with lime badge (reads `useCart().count`), hamburger toggle. Fixed position, scroll-reveal via `revealed` prop. |
| `SideNav.tsx` | client island | Hamburger drawer: fixed overlay, slides from left, dim backdrop. Links: Home, Shop, Crocs, Trousers, New In, Sale, Account (filtered to what's relevant). Active state from `usePathname()`. |
| `CartDrawer.tsx` | client island | Slide-in cart panel from right: live cart items (img, name, color, size, qty stepper, remove), subtotal/discount/shipping/total, promo code input (`NANOS10`), Continue to Checkout button. Empty state when cart is empty. |
| `CartBadge.tsx` | client island | Lime-green circle badge with cart count, shown in header. Reads `useCart().count`. |
| `ProductCard.tsx` | client island | Product grid card: image (`ImgOrSlot`), badge (NEW/SALE/BESTSELLER), wishlist heart overlay (local echo), product info (name, variant, price, old price, color swatches), **Quick Add** button (adds default available variant to cart, local echo). Click → `openProduct(p)` → quick-view modal. |
| `ProductModal.tsx` | client island | Quick-view overlay modal (z-index 200): gallery with prev/next arrows + thumbnails, product name, color swatches, size options (with sold-out dimming), qty stepper, Add-to-Cart button (with check animation), wishlist heart, description. Size guide modal nested inside (z-index 210). |
| `ProductDetailPanel.tsx` | client island | Slide-in detail panel from right (z-index 180): same detail content as modal but as a side panel with drag handle. Opens via `openDetailPanel(p)`. |
| `ProductModalContext.tsx` | client island (context) | React context holding: `selectedProduct`, `openProduct`, `closeProduct`, `openSizeGuide`, `closeSizeGuide`, `sizeGuideOpen`, `openDetailPanel`, `closeDetailPanel`, `detailPanelOpen`. Provided by `ChromeShell`. |
| `ProductDetail.tsx` | client island | PDP interactive island (used on `/product/[id]`): gallery, color/size/qty controls, Add-to-Cart, wishlist, perks row with lucide icons. |
| `HeroSlider.tsx` | client island | Full-viewport hero carousel: 3 slides, crossfade every 5.5s, pause on hover, prev/next arrows, dot indicators, scroll-reveal cue. Reads `HERO_SLIDES` from `lib/brand.ts`. |
| `ShopView.tsx` | client island | Product grid wrapper: section head + `<ProductCard>` for each product, empty state if no products. Used by shop/category pages. |
| `CheckoutForm.tsx` | client island | Checkout interactive: shipping form (name, phone, email, address, city, postal), payment method picker (`PayMethodPicker`), Place Order button (notice until OrdersModule). |
| `PayMethodPicker.tsx` | client island | Payment method toggle: COD / card / easypaisa radio-style options. |
| `PlaceholderSlot.tsx` | — | Dashed box labeled `[SLOT: NAME]` + `Wire up: <endpoint>` + note. Used for regions waiting on a backend module. |
| `ImgOrSlot.tsx` | client island | Renders `<img>` if URL loads, otherwise a labeled `[SLOT: NAME]` dashed box. Used for all images (product thumbs, promo tiles, social tiles). `onError` reverts to slot. |

### `src/lib/` — data layer + utilities

| File | Role |
|---|---|
| `api.ts` | Fetch wrapper: `apiGet<T>(url)` → `fetch(API_BASE + url)`, throws on non-2xx. `API_BASE` defaults to `http://localhost:4000`, overridable via `NEXT_PUBLIC_API_URL`. |
| `queries.ts` | Product query functions: `getProducts()`, `getProductsByCategory(category)`, `getSaleProducts()`, `getProduct(id)`. Each calls `apiGet` and maps raw Prisma rows (JSON-as-string fields) to the shared `Product` DTO via `toProduct()`. `getProducts()` is used by home + shop; category functions by crocs/trousers/sale pages. |
| `cart.ts` | Client-side cart store: `useCart()` hook, localStorage-backed (`nanos_cart_v1`), single state shared across all components via custom event + `storage` listener. Methods: `addItem`, `updateQty`, `removeItem`, `applyPromo` (NANOS10 → 10% off), `clearPromo`, `clear`. Computed: `count`, `subtotal`, `discount`, `shipping` (free ≥ PKR 5,000, else PKR 250), `total`. `fmtPrice(n)` → `"PKR " + n.toLocaleString("en-PK")`. |
| `auth.ts` | Client-side auth state: reads/writes JWT + user to localStorage, `useAuth()` hook, sign-out. Session persists until token expiry (7d). |
| `brand.ts` | Static content: `HERO_SLIDES` (3 slides with eyebrow, title, copy, image, perks), `NAV_LINKS` (category nav), `fmtPrice` (duplicate of cart.ts — keep in sync). |

### `src/styles/` — CSS

| File | Role |
|---|---|
| `globals.css` | Tailwind v4 import, `@theme` with palette tokens (`--color-black`, `--color-lime`, etc.), font families, utility classes, custom chrome (navbar, drawer, scroll-reveal), hero styles, cart styles, promo/social tile image-fill rules (`.promo-media img`, `.social-tile .tile-media img` → `width:100%; height:100%; object-fit:cover`). |
| `prototype.css` | Full prototype CSS ported verbatim from `nanos-pk-prototype.html` (508 lines): header, buttons, badges, hero, product grid, promo banners, social strip, PDP, cart, checkout, account, responsive. |
| `modal.css` | Product quick-view modal + detail panel + size guide modal styles. Layer stack: header 300 > cart drawer 250/251 > size guide 210/211 > product modal 200/201 > detail panel 180/181 > side nav 130/125. |

### `packages/shared-types/src/index.ts` — shared types

Both `apps/api` and `apps/web` import from here. Contains:
- `Product`, `ProductColor`, `ProductVariant`, `CartItem`, `Cart`, `WishlistItem`, `ShippingInfo`, `PaymentMethod`, `OrderStatus`, `Order`, `OrderItem`, `ApiError`, `AppRouter` (tRPC placeholder).

---

## 3. Data flow — how a product gets from DB to screen

```
PostgreSQL (Neon)
  └─ Prisma 6.19.3
      └─ NestJS API (apps/api, port 4000)
          ├─ GET /products          → raw Prisma rows (JSON-as-string fields)
          ├─ GET /products?category=crocs
          ├─ GET /products?sale=true
          └─ GET /products/:id
              └─ Next.js web (apps/web, port 3000)
                  ├─ lib/queries.ts  → apiGet() + toProduct() (JSON parse → Product DTO)
                  ├─ page.tsx (server component) → fetch server-side, pass to components
                  └─ ProductCard / ShopView / ProductDetail / ProductModal / ProductDetailPanel
                      └─ ImgOrSlot → <img> or [SLOT: NAME] box
```

**Home page flow (page.tsx):**
1. `getProducts()` called server-side (async).
2. Catches API errors silently (API down → sections render empty/slot states).
3. Filters `tag === "NEW"`, slices first 4 → `newArrivals`.
4. Renders: `<HeroSlider>` + New Arrivals grid (`<ProductCard>` per product) + promo tiles (`ImgOrSlot` with empty src → slot boxes) + social grid (`ImgOrSlot` with Cloudinary URLs).

**Product card click flow:**
1. User clicks card → `ProductCard.handleCardClick` → `openProduct(p)` (from `useProductModal()`).
2. `ChromeShell` sets `selectedProduct = p` in context.
3. `<ProductModal>` renders (z-index 200 overlay) — gallery, colors, sizes, qty, Add-to-Cart.
4. OR user triggers detail panel → `openDetailPanel(p)` → `<ProductDetailPanel>` slides in from right (z-index 180).

**Add-to-Cart flow (local echo until CartModule):**
1. User clicks Add-to-Cart in modal/panel/PDP.
2. `cart.addItem({ productId, name, color, size, price, img }, qty)` → writes to localStorage (`nanos_cart_v1`).
3. Custom event `nanos-cart-changed` fires → all `useCart()` listeners re-sync.
4. Header badge updates, cart drawer updates, checkout summary updates — no navigation.

---

## 4. Client islands — what's interactive

| Component | Why client |
|---|---|
| `ChromeShell` | Drawer state, scroll reveal, Escape handling, overlay management |
| `SideNav` | Open/close state, active link highlighting |
| `CartDrawer` | Cart item rendering, qty steppers, remove, promo code |
| `CartBadge` | Live cart count |
| `ProductCard` | Quick Add, wishlist heart toggle |
| `ProductModal` | Gallery navigation, color/size/qty selectors, Add-to-Cart |
| `ProductDetailPanel` | Same as modal, slide-in panel |
| `ProductModalContext` | State management for selected product |
| `ProductDetail` | PDP interactivity (gallery, options, Add-to-Cart) |
| `CheckoutForm` | Form submission, payment picker |
| `PayMethodPicker` | Payment option toggle |
| `ImgOrSlot` | `onError` → slot fallback |

Everything else (pages, `SiteHeader`, `ShopView`, `PlaceholderSlot`, `HeroSlider` partial) is a server component or static.

---

## 5. Image slots convention

Any image we don't have yet renders a dashed `[SLOT: NAME]` box instead of a broken `<img>`. Current slots (fill by passing URL to `ImgOrSlot src="…"`):

| Slot name | Where | Current state |
|---|---|---|
| `PROMO-IMAGE-CROCS` | Home promo tile (left) | Empty → slot box |
| `PROMO-IMAGE-TROUSERS` | Home promo tile (right) | Empty → slot box |
| `SOCIAL-TILE-BRAND` | Social tile 1 (dark) | Cloudinary URL → renders |
| `SOCIAL-IMAGE-02`–`05` | Social tiles 2–5 | Cloudinary URLs → render |
| `PRODUCT-IMAGE:<id>` | Product cards / PDP / cart | Seeded products have images → render; fallback only if empty/404 |

---

## 6. Running it

```bash
cd nanos-pk

# 1. Install (once):
corepack pnpm install

# 2. Start web (logs to apps/web/dev-server.log):
cd apps/web
nohup corepack pnpm dev > dev-server.log 2>&1 &

# 3. Verify:
curl http://localhost:3000             # → 200, homepage HTML
curl http://localhost:3000/shop        # → 200, shop page (live products if API up)
curl http://localhost:3000/product/clog-black  # → 200, PDP

# Port conflict (web = 3000):
pid=$(netstat -ano | grep ':3000' | grep LISTENING | awk '{print $5}' | head -1)
taskkill //F //PID $pid
```

**API must be running** for product data to appear. If API is down, pages render honest empty/slot states (no crash).
