# Backend — nanos.pk API

> NestJS 11 REST API on `apps/api`. Serves `http://localhost:4000` by default.  
> PostgreSQL via Prisma 6.19.3 on Neon. Redis via BullMQ for jobs.

---

## 1. How the API starts

**Entry point:** `apps/api/src/main.ts`

```ts
// 1. Loads .env (dotenv/config)
// 2. Creates NestJS app, wires global ValidationPipe (whitelist + transform)
// 3. Enables CORS — origin = WEB_ORIGIN (default http://localhost:3000), credentials true
// 4. Listens on PORT env var, else 4000
// 5. Prints: "API ready on http://localhost:<PORT>"
```

**AppModule** (`src/app.module.ts`) — root module, imports:

| Module | Role |
|---|---|
| `PrismaModule` | Global — single `PrismaService` (extends `PrismaClient`) wired to `DATABASE_URL` from `.env`. Connects on `onModuleInit`, disconnects on `onModuleDestroy`. |
| `ProductsModule` | Product CRUD endpoints. |
| `AuthModule` | JWT + Google OAuth auth. |
| `AppController` / `AppService` | Root `GET /` → "Hello World!" health check. |

**Environment (gitignored `.env` in `apps/api/`):**
```
DATABASE_URL=postgresql://... (Neon)
REDIS_URL=redis://localhost:6379
JWT_SECRET=<48-byte random>
WEB_ORIGIN=http://localhost:3000
PORT=4000
GOOGLE_CLIENT_ID=<set-me>
GOOGLE_CLIENT_SECRET=<set-me>
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback
```

---

## 2. Database wiring

**Prisma schema:** `apps/api/prisma/schema.prisma`

7 models:

```
User              — id, email@unique, name?, password?, googleId?@unique
Cart              — id, userId@unique → User
CartItem          — id, cartId, productId → Product, color, size, qty
                   @@unique([cartId, productId, color, size])
WishlistItem      — id, userId, productId → Product
Order             — id, userId → User, items → OrderItem[], totals, shippingInfo (JSON),
                   payment (cod|card|easypaisa), status (processing|shipped|delivered)
OrderItem         — id, orderId, productId → Product, color, size, qty, unitPrice
Product           — id, name, category, tag?, price, oldPrice?, desc, rating@default(0),
                   reviews@default(0), colorsJson, sizesJson, outOfStockJson,
                   hero, galleryJson, isSale@default(false)
```

**JSON-as-string fields** (Prisma doesn't support JSON columns here): `colorsJson`, `sizesJson`, `outOfStockJson`, `galleryJson`, `shippingInfo`. The API and web layer parse these with `JSON.parse` at the boundary.

**Migrations (applied to Neon):**
- `20260913074857_init` — 7 tables + `_prisma_migrations`.
- `20260913083000_add_google_id` — added `User.googleId String? @unique`.

**PrismaClient** is `PrismaService` — a single global instance. Every module injects `PrismaService` and reads/writes through it. No separate DB connections.

**Seed:** `apps/api/prisma/seed.ts`
- Upserts 8 prototype products by stable id (`clog-black`, `clog-sand`, etc.).
- Run: `cd apps/api && npx tsx prisma/seed.ts` (or `corepack pnpm --filter api db:seed`).
- Idempotent — safe to re-run.

---

## 3. What the API serves — endpoints

### Products (public, no auth)

| Method | Path | Query | Returns |
|---|---|---|---|
| `GET` | `/products` | `?category=crocs\|trousers` · `?sale=true` | `Product[]` (8 total, filtered) |
| `GET` | `/products/:id` | — | single `Product` or `404 { error: { code, message } }` |

**`GET /products` response shape (raw Prisma row):**
```ts
{
  id, name, category, tag, price, oldPrice,
  desc, rating, reviews,
  colorsJson, sizesJson, outOfStockJson,   // JSON strings
  hero, galleryJson,                        // JSON strings
  isSale
}
```

Web layer (`apps/web/src/lib/queries.ts`) maps these to the shared `Product` DTO:
```ts
import type { Product } from "@nanospk/shared-types";
// colorsJson → Product.colors  (ProductColor[])
// sizesJson → Product.sizes     (string[])
// outOfStockJson → Product.outOfStock (string[])
// galleryJson → Product.gallery (string[])
```

### Auth (JWT + Google OAuth)

| Method | Path | Body / Guard | Returns |
|---|---|---|---|
| `POST` | `/auth/register` | `{ name, email, password }` | `{ accessToken, user }` or `409` (duplicate / google-locked) |
| `POST` | `/auth/login` | `{ email, password }` | `{ accessToken, user }` or `401` / `409` |
| `GET` | `/auth/me` | JWT guard | `{ id, email, name, googleId }` |
| `GET` | `/auth/google` | JWT guard (Passport redirects) | — (302 to Google) |
| `GET` | `/auth/google/callback` | JWT guard | `{ accessToken, user }` |

**JWT details:**
- HS256, 7-day expiry, secret = `JWT_SECRET`.
- Payload: `{ sub: userId, email }`.
- `JwtStrategy` (`src/auth/jwt.strategy.ts`) extracts Bearer token via `extractBearer()`, validates, looks up user in DB (never returns password), attaches to `req.user`.
- `AuthGuard("jwt")` protects `/auth/me`, `/auth/google`, `/auth/google/callback`.

**Password rules:**
- Register: name 2–80 chars, email valid, password 8–72 chars, bcrypt 12 rounds.
- Deliberate policy (enforced in `AuthService`):
  - Password register/login on a Google-owned email → **409** "Please sign in with Google."
  - Google sign-in on a password-owned email → **auto-links** `googleId` (Google verified the email).

**Google OAuth** (`src/auth/google.strategy.ts`):
- `passport-google-oauth20`, scope `email + profile`.
- `validate()` upserts user by email, sets `googleId`.
- `googleCallbackToken()` issues the **same JWT shape** as email+password login.

### Redis / BullMQ (jobs — currently a stub)

| Piece | File | Role |
|---|---|---|
| `RedisModule` (`src/redis/redis.module.ts`) | Global | Single `RedisService` (ioredis), connects to `REDIS_URL`. |
| `BullModule` (`src/redis/bull.module.ts`) | Global | Creates `order-emails` queue + worker. |

**`order-emails` queue:**
- Queue: `new Queue("order-emails", { connection, defaultJobOptions: { attempts: 3, exponential backoff 5s, removeOnComplete: 10, removeOnFail: 100 } })`.
- Worker: processes jobs, currently a **no-op stub** that logs `[BullMQ] order-emails job { jobId, orderId, to }` and returns `{ ok: true, sentAt }`.
- Failed jobs logged with `jobId, orderId, error.message`.

**Intended use (not wired yet):** when OrdersModule lands, `POST /orders` should add a job to `order-emails` with `{ orderId, email }`. The worker then dispatches the confirmation email. No email provider chosen yet.

---

## 4. Module dependency graph

```
AppModule
├── PrismaModule        (global)  → PrismaService → DATABASE_URL (Neon)
├── ProductsModule
│   ├── ProductsController  @Get() @Get(":id")
│   └── ProductsService     → PrismaService
├── AuthModule
│   ├── AuthController  @Post(register|login) @Get(me) @Get(google|google/callback)
│   ├── AuthService     → PrismaService + JwtService + bcrypt
│   ├── JwtStrategy     → PrismaService (validate: look up user)
│   ├── GoogleStrategy  → PrismaService (validate: upsert by email)
│   └── JwtModule (global, 7d, JWT_SECRET)
└── AppController / AppService   (health check GET /)

RedisModule    (global)  → RedisService   → REDIS_URL
BullModule     (global)  → Queue + Worker → RedisService
```

**Global modules:** `PrismaModule`, `RedisModule`, `BullModule` — marked `@Global()` so any future module can inject their services without importing them.

---

## 5. Data contracts

### Product (what the API returns, after web-layer mapping)

From `@nanospk/shared-types`:
```ts
interface Product {
  id: string;
  name: string;
  category: "crocs" | "trousers" | "shop" | "sale";
  tag?: string | null;        // "NEW" | "SALE" | "BESTSELLER"
  price: number;              // PKR integer
  oldPrice?: number | null;
  colors: { name: string; hex: string }[];
  sizes: string[];            // e.g. ["UK 6","UK 7",...] or ["28","30",...]
  outOfStock: string[];       // size values that are unavailable
  hero: string;               // image URL
  gallery: string[];          // image URLs
  desc: string;
  rating: number;             // 0–5
  reviews: number;
  isSale: boolean;
}
```

### Auth responses

```ts
// POST /auth/register | /auth/login | /auth/google/callback
{ accessToken: string; user: { id: string; email: string; name: string | null } }

// GET /auth/me  (JWT guard)
{ id: string; email: string; name: string | null; googleId: string | null }
```

### Errors

```ts
// 404 / conflict / unauthorized
{ error: { code: string; message: string } }
```

---

## 6. Current state (what's real vs stub)

| Feature | Status |
|---|---|
| Products CRUD | ✅ Real — 8 seeded products, live from Neon |
| Auth (register / login / me / Google) | ✅ Real — JWT + bcrypt + Google strategy (Google needs credentials in `.env`) |
| Cart | ⬜ Stub — client-side localStorage only (`lib/cart.ts`); no CartModule API yet |
| Orders | ⬜ Stub — no OrdersModule; checkout "Place Order" shows a notice |
| Wishlist | ⬜ Stub — local echo only |
| BullMQ email worker | 🔶 Real pipeline, stub worker (logs, no email) |
| Users/profile API | ⬜ Not started |

---

## 7. Running it

```bash
# From repo root:
cd nanos-pk

# 1. Install (once):
corepack pnpm install

# 2. Ensure Neon DB is reachable (DATABASE_URL in apps/api/.env)

# 3. Push schema / run migrations (if needed):
cd apps/api
corepack pnpm prisma db push          # dev convenience
# or: corepack pnpm prisma migrate deploy   # production

# 4. Seed products (idempotent):
corepack pnpm --filter api db:seed
# or: npx tsx prisma/seed.ts

# 5. Start API (logs to apps/api/api-dev.log):
cd apps/api
nohup corepack pnpm dev > api-dev.log 2>&1 &

# 6. Verify:
curl http://localhost:4000              # → "Hello World!"
curl http://localhost:4000/products     # → 8 products JSON
curl http://localhost:4000/products/clog-black  # → single product
curl -X POST http://localhost:4000/auth/register -H "Content-Type: application/json" -d '{"name":"Test","email":"t@t.com","password":"password123"}'
```

**Port conflict:** if 4000 is taken, kill the old process by PID then restart. Never kill all node processes — the web dev server (3000) dies with them.

```powershell
# Windows:
pid=$(netstat -ano | grep ':4000' | grep LISTENING | awk '{print $5}' | head -1)
taskkill //F //PID $pid
```
