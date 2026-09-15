# nanos.pk — Build Progress Spec

> Last updated: 2026-09-15 (frontend polish batch — see "Frontend polish batch" below). Read this at the start of every session.
> Status legend: ✅ done · 🔶 partially done · ⬜ not started

## What this project is

E-commerce storefront (Crocs & trousers) ported from a static HTML/CSS/JS
prototype (`../nanos-pk-prototype.html`) to a real stack:

- **Front end:** Next.js 16.3.5 (App Router, Turbopack) + React 19 + Tailwind v4 — `apps/web`
- **Back end:** NestJS 11 (REST API) — `apps/api`
- **Database:** PostgreSQL on Neon (`neondb`, region ap-southeast-1) via Prisma **6.19.3**
- **Jobs:** BullMQ on Redis (order-confirmation email pipeline, stub worker)
- **Monorepo:** pnpm workspaces + Turborepo (`pnpm@10.12.0` pinned)

## CRITICAL environment quirks (read first)

1. **Always run pnpm through corepack:** `corepack pnpm ...` — the globally
   installed `pnpm` 12.4.1 is broken on this machine (missing
   `@pnpm/exe.win32-x64` native binary) and ignores the repo's version pin.
2. **Ports: web = 3000, API = 4000.** `apps/api/src/main.ts` pins the API to
   `PORT ?? 4000` because Next owns 3000. Front-end fetches must target
   `http://localhost:4000`.
3. **Dev servers run detached.** Web logs to `apps/web/dev-server.log`, API
   logs to `apps/api/api-dev.log`. Restart pattern:
   `pid=$(netstat -ano | grep ':<PORT>' | grep LISTENING | awk '{print $5}' | head -1); taskkill //F //PID $pid`
   then `cd apps/<x> && (nohup corepack pnpm dev > <log> 2>&1 &)`.
   (Never kill all node processes — the other dev server dies with them.)
4. **ESM `.js` import suffixes are mandatory in `apps/api/src`:** the api is
   `"type": "module"`; extensionless relative imports compile fine (tsc
   `bundler` resolution) but crash Node at runtime with
   `ERR_MODULE_NOT_FOUND`. Always write `./foo.service.js`.
5. **No `incremental` in api tsconfig.** `nest start --watch` deletes `dist/`
   before compiling; a fresh `*.tsbuildinfo` from a manual build makes
   incremental tsc decide there is nothing to emit → empty dist → boot fails.
   If `dist` is empty but builds "succeed": `rm -rf dist *.tsbuildinfo`.
6. `apps/api/.env` holds the real Neon `DATABASE_URL` (gitignored — never print it).
   `main.ts` loads it via `dotenv/config` (dotenv is now a dependency).
7. pnpm 10 build-script approvals live in the root `pnpm-workspace.yaml`
   (`onlyBuiltDependencies`) — needed for Prisma engines, bcrypt, esbuild.

## ✅ DONE — foundation (all verified)

### Database (Prisma 6.x on Neon)
- **Prisma 8 RC fully removed:** deleted `contract.prisma`, both
  `prisma.config.ts` files (api + workspace root), `prisma-8.md`, and the dead
  `src/prisma/db.ts` (the NestJS `PrismaService` is the only client).
- `apps/api/prisma/schema.prisma` is the source of truth — 7 models
  (`User, Product, Cart, CartItem, WishlistItem, Order, OrderItem`) with
  `@default(cuid())`, cascading deletes, timestamps, and back-relations.
- `prisma` + `@prisma/client` pinned to exact **6.19.3**.
- Migration **`20260913074857_init`** applied — 7 tables + `_prisma_migrations`
  confirmed live in Neon.

### Back end
- `PrismaModule` (global) wired into `AppModule`; `PrismaService` handles
  connect/disconnect lifecycle.
- Redis module + global `BullModule` with an `order-emails` queue and a stub
  worker. `bullmq` installed (^6.3.4).
- **ProductsModule (✅ NEW — curl-verified):**
  - `GET /products` → 8 items from Neon
  - `GET /products?category=crocs` → 4 · `?category=trousers` → 4
  - `GET /products?sale=true` → 2 (`trouser-charcoal`, `clog-black-sale`)
  - `GET /products/:id` → full record; unknown id → 404 with JSON error body
  - Files: `src/products/{products.module,products.controller,products.service}.ts`
- **Seed (✅ NEW):** `apps/api/prisma/seed.ts` upserts the 8 prototype
  products (extracted 1:1 from `PRODUCTS` in `nanos-pk-prototype.html`) using
  the prototype ids as stable PKs (`clog-black`, `clog-sand`, `clog-olive`,
  `trouser-black`, `trouser-charcoal`, `trouser-stone`, `clog-black-sale`,
  `trouser-black-cargo`). Idempotent (upsert). Run:
  `corepack pnpm --filter api db:seed`. Verified: `Products in database: 8`.
- **`pnpm --filter api typecheck` passes cleanly.**

### Front end
- **Site serves at http://localhost:3000** (Next 16.3.5 Turbopack).
- Single `next.config.ts` (remote image patterns for Cloudinary/Unsplash kept).
- Tailwind v4 installed (`tailwindcss` + `@tailwindcss/postcss` +
  `postcss.config.mjs`); prototype palette lives in `@theme` in `globals.css`.
- `next/font` variables wired into the CSS theme tokens; `suppressHydrationWarning`
  on `<html>` (browser-extension attribute injection).
- **Shop pages wired to the live API (✅ NEW — curl-verified, server-rendered
  from Neon data):**
  - Pages: `/shop`, `/crocs`, `/trousers`, `/sale` (all fetch products server-
    side via `lib/queries.ts`) and `/product/[id]` (interactive PDP: gallery,
    color/size pickers, qty stepper, accordions; unknown id → 404).
  - Components: `ProductCard` + `ShopView` + `ProductDetail` in
    `src/components/`, using the prototype's authentic class names
    (`.product-card`, `.badge badge-new`, `.pdp`, `.color-opt`, …).
  - **Prototype CSS ported**: the full 508-line `<style>` block was extracted
    verbatim from `nanos-pk-prototype.html` into `src/styles/prototype.css`,
    imported by `globals.css`. Styling matches the prototype 1:1.
  - Data layer: `lib/api.ts` (fetch wrapper, `API_BASE` defaults to
    `http://localhost:4000`, overridable via `NEXT_PUBLIC_API_URL`);
    `lib/queries.ts` maps raw Prisma rows (JSON-as-string fields) to the
    shared `Product` DTO. `@nanospk/shared-types` is now a real web dependency
    (`workspace:*`).
- **ALL pages built (✅ NEW):** `/` hero, `/shop`, `/crocs`, `/trousers`,
  `/sale`, `/product/[id]`, `/cart`, `/checkout`, `/login`, `/account` — every
  page 200, styled with the ported prototype CSS.
- **NO mock data anywhere (project rule).** Pages render real API data where
  the backend exists (products — live from Neon) and honest empty states
  everywhere it doesn't (cart, orders, user).
- **PlaceholderSlot convention:** every region waiting on a backend module
  renders a dashed box labeled `[SLOT: NAME]` + `Wire up: <endpoint>`:
  - `/cart` → `CART-ITEMS`, `CART-SUMMARY` (CartModule)
  - `/checkout` → `CHECKOUT-SUMMARY`, `ORDER-CREATE` (CartModule totals,
    OrdersModule)
  - `/account` → `ORDERS-API`, `WISHLIST-API`, `PROFILE-API` — page shows
    real signed-in/signed-out state (AuthModule is live).
  To wire one: replace the `<PlaceholderSlot name="X" …/>` with the real
  component; prototype markup for each is documented in the slot's `note`.
- **Named image slots (`ImgOrSlot`, ✅ NEW):** any image we don't have yet
  renders a dashed `[SLOT: NAME]` box instead of a broken `img`. Current
  slots (fill by passing the URL to `<ImgOrSlot src="…">` in `page.tsx`):
  - `/` home → `PROMO-IMAGE-CROCS`, `PROMO-IMAGE-TROUSERS` (category tiles
    — both filled 2026-09-15 with brand Cloudinary URLs, curl-verified 200;
    trousers tile first URL 404'd and was replaced same day)
  - Product cards/PDP/home feed tiles fall back to `PRODUCT-IMAGE:<id>`
    only if a seeded image URL is empty or 404s (all 8 seeded products have
    images today; the dead Unsplash `photo-1621665421964` was replaced with
    the brand Cloudinary black-clog shot and re-seeded 2026-09-14).
- **Home page sections (✅ NEW — all from the prototype's `renderHome`):**
  hero slider → **New Arrivals** (first 4 `tag=NEW` products, live from
  Neon; falls back to a `NEW-ARRIVALS` slot if the API is down) → category
  **promo tiles** (CROCS / TROUSERS) → **Follow @nanos.pk** social feed
  strip (below).
- **Social feed strip (✅ rebuilt 2026-09-14 — user reference):**
  the home feed is `SocialProductGrid`, matching the prototype's
  `renderHome` social strip 1:1: dark brand tile ("nanos.pk / CROCS /
  TROUSERS") → 4 product tiles (first 4 live products) with the prototype
  tagline overlays (COMFORT IN EVERY STEP. / BETTER BASICS. / SIMPLE
  STYLES. BIGGER DAYS. / bare 4th tile) → lime "KEEP IT SIMPLE. WEAR IT
  YOUR WAY." tile closes the 3×3. Clicking a product tile opens the
  quick-view modal (`openProduct`) — no navigation; hover shows the lime
  `Quick view` chip + image zoom. Images stay live (`ImgOrSlot` with
  `className="tile-fill-img"`, slot fallback `slotClassName="tile-media"`).
  API down → `HOME-PRODUCT-FEED` slot (honest empty state). Old 8-tile
  E2E probe `home-tiles-e2e.mjs` targets the previous variant and needs a
  rewrite if reused.
- **ProductCard upgraded (✅ NEW):** prototype-exact footer **Quick Add**
  button (adds default variant — local echo until CartModule), wishlist
  heart overlay on the thumbnail (local echo until UsersModule), and
  `ImgOrSlot` fallback on the image.
- **Shared `SiteHeader`** (extracted) rendered from the root layout on every
  page; home page no longer has its own inline header.
- Client islands: `CheckoutForm` (checkout page is a server wrapper because
  `metadata` can't be exported from "use client" pages), `PayMethodPicker`
  (card-fields toggle), `ProductDetail`. PDP "Add to Cart" is a local echo
  until CartModule lands.
- **PDP completed to prototype spec (✅ NEW):** wishlist heart beside
  Add-to-Cart (`.wish-toggle`, local echo → `WISHLIST-API`), lucide icons on
  the perks row (truck/rotate/headset).

### Cart UI — fully interactive (✅ NEW — browser E2E verified 9/9)

- **Client cart store `lib/cart.ts`:** localStorage-backed (`nanos_cart_v1`),
  `useCart()` hook shares one state across all components (custom event +
  `storage` listener → header badge, cart page and checkout stay in sync
  without navigation). Multi-line merge by product+color+size.
- **Everything works today:** PDP Add-to-Cart (with size/qty), card
  **Quick Add** (default available variant), qty steppers, Remove,
  **promo `NANOS10`** (−10%), free shipping ≥ PKR 5,000 (else PKR 250,
  with the "Add PKR X more" nudge), live totals, **header badge**.
- **Same-page traversing rule (user spec):** cart mutations never navigate;
  the only page change is Proceed to Checkout → `/checkout`.
- `/checkout` shows the live order summary (per-line mini rows + totals,
  Place Order — PKR total). Empty-cart guard sends shoppers to shop.
  Remaining slot: `ORDER-CREATE` (POST /orders) only.
- When the CartModule API lands: swap `lib/cart.ts` mutators for fetches —
  no consumer changes (hook signature stays).
- E2E script: `apps/web/cart-e2e.mjs` (puppeteer-core + installed Chrome).

### Hero overlay fixes (✅ NEW — pixel-verified)

- **Root cause of "text clipped/gray":** the side drawer defaulted OPEN and
  its 50% black backdrop sat over the page (`.hero-copy-layer` never got the
  `active` class either, so `visibility:hidden` hid all hero copy after
  hydration). Fixed: drawer starts closed (storage key bumped to
  `_v2`), copy layer receives `active`, scrim z-indexed 1 under copy (2).
- Scrim softened to a light wash (`0.75 → 0` by 55%); heading is crisp
  `#111` at 84px starting at x=96 (no left-edge bleed) — verified by
  screenshot pixel analysis (`apps/web/hero-probe.mjs`).
- `prefers-reduced-motion`: all hero/backdrop/header transitions disabled.

### Frontend polish batch (✅ NEW — 2026-09-15, tsc-verified)

- **Promo tiles clickable (✅):** the home IMG-04/IMG-05 category tiles are
  now `next/link` anchors → `/crocs` and `/trousers` (restores the
  prototype's `onclick="navigate(... )"`; whole card clickable, aria-labels).
  `a.promo-card` link reset added to `prototype.css`.
- **Promo tile hover zoom (✅):** `.promo-media` scales to 1.04 on
  hover/keyboard focus with the social tiles' exact easing
  (`cubic-bezier(.16,1,.3,1)`, 0.35s) — applied to the wrapper so it covers
  both the loaded image and the slot placeholder state; `:focus-visible`
  lime outline matches the social tiles.
- **Product codes (SKU) system (✅):** `lib/imageSlots.ts` gained
  `PRODUCT_CODES` + `productCode()` — stable short codes for the 8 seeded
  products (`CLO-BLK`, `CLO-SND`, `CLO-OLV`, `TRU-BLK`, `TRU-CHR`,
  `TRU-STN`, `CLO-LTE`, `TRU-CRG`); unknown ids get a safe derived
  fallback. Purpose: any photo on any surface is traceable to its product.
- **`ProductCodeTag` component (✅):** two modes — corner badge
  `SKU CLO-BLK · IMG-10` (bottom-right, opposite the existing IMG badge)
  on every product image (ProductCard, SocialProductGrid feed tiles, cart
  page lines, CartDrawer rows, quick-view modal main image), and an
  `inline` chip on the PDP sub-line. Fixed missing `position:relative` on
  `.cart-item-img` / `.cart-line-img` so the badges anchor correctly.
- **Code chip inside descriptions (✅):** `ProductCodeChip` renders the
  bare code (e.g. `CLO-OLV`) as a small bordered tag at the end of the
  description in all three description surfaces — PDP accordion, quick-view
  modal (`pmq-desc`), `ProductDetailPanel`. `user-select: all` for
  one-click copy while filling image slots.
- **Sticky footer (✅):** `body` is now a full-height flex column
  (`min-height: 100vh` + `100svh`), `body > main { flex: 1 0 auto }` → the
  footer hugs the viewport bottom on short pages (empty cart, login) and
  flows normally on long ones. Tailwind `min-h-screen` removed from
  `<body>` in `layout.tsx` (single source of truth in `globals.css`);
  works because all chrome (header/drawer/cart/modal) is `position:fixed`
  and out of flow.
- **Side nav Categories (✅):** the drawer gained a "Categories" heading
  (`.nav-heading` — small uppercase gray) with **Crocs** and **Trousers**
  links, reusing the same link renderer as Home/Cart (lime hover arrow,
  active state, drawer closes on navigate, `next/link` prefetch).

### Tooling
- Api dev deps: `@nestjs/testing@^11`, `supertest`, `@types/supertest`,
  `vitest@^5`, `vite-tsconfig-paths`; runtime: `bullmq`, `dotenv`.
- Root `pnpm-workspace.yaml` has `onlyBuiltDependencies`.

## ⬜ NOT DONE — ordered build plan

1. ⬜ **AuthModule (next task).** JWT register/login (`@nestjs/jwt`,
   `passport-jwt`, bcrypt — all installed), Passport guard. Endpoints:
   `POST /auth/register`, `POST /auth/login`. Manually test with curl and
   confirm a real JWT. Cart/Orders depend on identity, so this comes first.
2. ⬜ **CartModule → OrdersModule (that order).** Orders are built from cart
   contents. Add `UsersModule` (profile, wishlist) alongside; lower priority.
3. 🔶 **Front end pages:** Shop/category + product detail ✅ done (live data).
   Remaining: Cart (real), Checkout, Account — build after their backend
   modules exist.
4. ✅ **Product data swap done** — shop/category/PDP pages fetch
   `http://localhost:4000/products` server-side. (There was no product mock
   layer left in `apps/web`; the home hero still uses static copy, which is
   fine for now.)
5. ⬜ **Nice-to-haves last:** Cloudinary signed/admin upload endpoints, real
   BullMQ order-confirmation email job (replace stub worker; pick email
   provider), global exception filter.

### Suggested next-session kickoff

```bash
cd nanos-pk && corepack pnpm install        # 1. sync deps
curl -o /dev/null -w "%{http_code}\n" http://localhost:3000   # 2. web up?
curl -o /dev/null -w "%{http_code}\n" http://localhost:4000/products  # 3. api up?
# 4. start AuthModule (item 1) — register/login with JWT + bcrypt
```

## NEXT STEPS (clear order)

1. ✅ **AuthModule DONE** (see Auth section). **Only remaining piece: user
   creates Google OAuth credentials** (Cloud Console → OAuth client ID,
   redirect `http://localhost:4000/auth/google/callback`) and replaces the
   `set-me` sentinels in `apps/api/.env` (`GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`), then restart the API.
2. ⬜ **CartModule (api)** — `GET /cart`, `POST /cart/items`,
   `PATCH /cart/items/:id`, `DELETE /cart/items/:id` (user-bound; JWT guard
   now available). **Then wire web slots `CART-ITEMS` + `CART-SUMMARY`,**
   replace the PDP add-to-cart echo, and feed `CHECKOUT-SUMMARY`.
3. ⬜ **OrdersModule (api)** — `POST /orders`, `GET /orders` (auth).
   **Then wire web slots `ORDER-CREATE`** (→ navigate to a confirmation
   page) **and `ORDERS-API`**.
4. ⬜ **UsersModule (api)** — `GET/PATCH /users/me`, `GET/DELETE /wishlist`.
   **Then wire web slots `PROFILE-API` + `WISHLIST-API`.**
5. ⬜ Polish: confirmation page (`/confirmation/[id]`), promo code handling
   (NANOS10), Cloudinary uploads, BullMQ email worker, global exception
   filter.

### Auth (✅ NEW — curl-verified)

- Endpoints: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
  (JWT guard), `GET /auth/google` + `GET /auth/google/callback` (OAuth).
- bcrypt (12 rounds) password hashing — verified `$2b$12$` prefix in DB.
- JWT HS256, 7-day expiry, secret from `process.env.JWT_SECRET` (48-byte
  random value generated into `.env`). `/auth/me` returns no password.
- **Deliberate provider policy** (enforced in `auth.service.ts`, tested):
  - Password login/register on a Google-registered email → **409**
    `"This email is registered with Google. Please sign in with Google."`
    (prevents account takeover via password-setting).
  - Google sign-in on a password-registered email → **auto-link**
    (`googleId` attached; Google verified email ownership).
- Schema: `User.googleId String? @unique` added via migration
  `20260913083000_add_google_id` (applied to Neon with `migrate deploy`;
  note: `prisma migrate dev` is interactive-only — create-only + deploy is
  the non-TTY workaround).
- Validation: global `ValidationPipe` (whitelist + transform); CORS locked
  to `WEB_ORIGIN` (default `http://localhost:3000`).
- Frontend: `/login` calls the real API (slot `AUTH-API` fully removed),
  has a Google button; `/account` renders real session state from
  `localStorage` (`lib/auth.ts`) with sign-out. Session persists until
  token expiry (7d); token attached manually until an axios/fetch wrapper
  adds it globally.
- `GOOGLE_CLIENT_ID`/`SECRET` are `set-me` sentinels until the user creates
  Google credentials; email+password flow works fully right now.

## Project docs

- `docs/BACKEND.md` — API architecture: NestJS modules, DB wiring (Prisma 6 on Neon), all endpoints, data contracts, Redis/BullMQ, what's real vs stub, how to run.
- `docs/FRONTEND.md` — Frontend file map: every route, component, and lib file with its responsibility; data flow from DB → screen; client islands; image slot convention; how to run.

## Verification snapshot (2026-09-13, after AuthModule)

- **2026-09-15 addendum:** `apps/web` `npx tsc --noEmit` → passes ✅ after
  every step of the frontend polish batch (promo links/zoom, SKU system,
  code chips, sticky footer, drawer categories). UI changes not yet
  browser-E2E probed — visual check on short pages (empty cart) and drawer
  still pending.
- `corepack pnpm --filter api typecheck` → passes ✅
- `corepack pnpm --filter web typecheck` (tsc --noEmit) → passes ✅
- Neon: migrations `init` + `add_google_id` applied; `Product` count = 8,
  `User` count = 0 (test users cleaned) ✅
- Auth curl matrix: register 201 · login 200 + JWT · `/auth/me` 200/401 ·
  duplicate 409 · wrong password 401 · short password 400 · Google-account
  password login AND register both 409 with the Google message ✅
- Web: all pages 200 incl. `/login` (Google button renders) ✅
- Prisma client v6.19.3 generated ✅
