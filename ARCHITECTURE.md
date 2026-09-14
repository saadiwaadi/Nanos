# nanos.pk — Architecture

> Companion to `PROGRESS.md` (which tracks status/next steps). This doc
> describes the *structure* and the *approaches* — stable across sessions.

## 1. High-level shape

```
nanos-pk/                          ← pnpm workspace + Turborepo monorepo
├── apps/
│   ├── web/                       ← Next.js 16 storefront  (port 3000)
│   │   └── src/
│   │       ├── app/               ← App Router pages (file-based routing)
│   │       │   ├── layout.tsx     ← root layout: fonts + shared SiteHeader
│   │       │   ├── page.tsx       ← /            (hero)
│   │       │   ├── shop/ crocs/ trousers/ sale/   ← product listing pages
│   │       │   ├── product/[id]/  ← PDP (dynamic route)
│   │       │   ├── cart/ checkout/ login/ account/ ← commerce flow pages
│   │       │   └── globals.css    ← Tailwind v4 @theme + imports prototype.css
│   │       ├── components/        ← SiteHeader, ProductCard, ShopView,
│   │       │                        ProductDetail, CheckoutForm,
│   │       │                        PayMethodPicker, PlaceholderSlot
│   │       ├── lib/               ← api.ts (fetch wrapper), queries.ts
│   │       │                        (API→DTO mapper), brand.ts (nav/hero data)
│   │       └── styles/prototype.css ← 508-line CSS extracted 1:1 from the
│   │                                    original HTML prototype
│   └── api/                       ← NestJS 11 REST API      (port 4000)
│       ├── prisma/
│       │   ├── schema.prisma      ← 7 models, source of truth
│       │   ├── seed.ts            ← 8 prototype products, idempotent upsert
│       │   └── migrations/        ← SQL migrations (init applied to Neon)
│       └── src/
│           ├── main.ts            ← bootstrap, dotenv, PORT ?? 4000
│           ├── app.module.ts      ← imports PrismaModule + ProductsModule
│           ├── products/          ← module/controller/service (live)
│           ├── prisma/            ← global PrismaModule + PrismaService
│           ├── redis/             ← RedisService + BullModule (email queue stub)
│           └── common/            ← shared DTOs/interfaces
├── packages/
│   └── shared-types/              ← @nanospk/shared-types (pure TS DTOs used
│                                    by BOTH apps; neither imports the other)
├── PROGRESS.md                    ← status + ordered next steps (read first)
├── ARCHITECTURE.md                ← this file
├── pnpm-workspace.yaml            ← workspace globs + onlyBuiltDependencies
└── turbo.json                     ← Turborepo task graph
```

## 2. Major approaches & systems

| Concern | Approach | Why |
|---|---|---|
| **Monorepo** | pnpm workspaces + Turborepo | one lockfile, `workspace:*` deps, cached task graph |
| **Frontend** | Next.js 16 App Router, React 19, **server components by default**; small client islands (`ProductDetail`, `CheckoutForm`, `PayMethodPicker`) marked `"use client"` | SEO + fast first paint for shop pages; interactivity only where needed |
| **Styling** | Tailwind v4 (`@theme` tokens) **plus** the original prototype's CSS imported verbatim; components use the prototype's class names | pixel-parity with the approved prototype without re-transcribing 500 lines |
| **API** | NestJS 11, feature modules (`products/`, `prisma/`, `redis/`), global `PrismaModule` | conventional Nest structure; new features = new module folder |
| **ORM** | Prisma **6.19.3 pinned exactly** (deliberately NOT the v8 RC) | `schema.prisma` + `@default(cuid())` stability; migration `20260913074857_init` applied to Neon |
| **Database** | PostgreSQL on **Neon** (serverless), single `neondb` | zero-ops; connection string in gitignored `apps/api/.env` |
| **Data contract** | `packages/shared-types` — pure TS interfaces (`Product`, `Cart`, `Order`…); API returns raw Prisma rows, web maps them to DTOs in `lib/queries.ts` | apps never import each other; JSON-as-string fields parsed in one place |
| **Background jobs** | BullMQ on Redis (`order-emails` queue, stub worker) | email provider TBD; pipeline proven |
| **Testing** | Vitest (+ `@nestjs/testing`, supertest installed) | typecheck passes; e2e spec scaffolded, not yet meaningful |
| **Toolchain pins** | run pnpm via **corepack** (`pnpm@10.12.0`); Node ≥ 20 (v24 in use) | global pnpm 12 install is broken on this machine |

## 3. Data flow (products, the one live path)

```
Neon Postgres ──Prisma 6──▶ NestJS ProductsService ──REST/JSON──▶
Next.js server component (getProducts in lib/queries.ts)
      │                                    │
      │                     maps raw row → shared Product DTO
      ▼                                    ▼
product-grid SSR HTML ◀────────── ProductCard (pure props)
```

Pages that await future modules render **honest empty states** plus
`[SLOT: NAME]` placeholders (see `PlaceholderSlot.tsx`) naming the exact
endpoint that will feed them: `CART-ITEMS`, `CART-SUMMARY`,
`CHECKOUT-SUMMARY`, `ORDER-CREATE`, `AUTH-API`, `ORDERS-API`,
`WISHLIST-API`, `PROFILE-API`.

## 4. Ports & running

| Service | Port | Command (from repo root) |
|---|---|---|
| web | 3000 | `corepack pnpm --filter web dev` |
| api | 4000 | `corepack pnpm --filter api dev` |
| Neon | — | remote; `DATABASE_URL` in `apps/api/.env` |

Dev servers run detached with logs at `apps/web/dev-server.log` and
`apps/api/api-dev.log`.

## 5. Non-negotiables / conventions

1. **No mock data.** Pages show real API data or honest empty states — never
   fabricated carts/orders/users.
2. **ESM `.js` import suffixes** in `apps/api/src` relative imports (api is
   `"type": "module"`; Node ESM requires them at runtime).
3. **No `incremental`** in api tsconfig (`nest start --watch` wipes `dist`,
   stale tsbuildinfo silently emits nothing).
4. **Secrets** only in gitignored `.env` files; never print `DATABASE_URL`.
5. **Both apps typecheck clean** — keep it that way
   (`corepack pnpm --filter api typecheck && corepack pnpm --filter web typecheck`).
