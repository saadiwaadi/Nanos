// One-off: remove all seeded dummy products (user request 2026-09-14).
// Deletes wishlist rows first (FK safety), then products.
// Run: corepack pnpm --filter api tsx prisma/clear-products.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const w = await prisma.wishlistItem.deleteMany({});
  console.log(`wishlist rows deleted: ${w.count}`);
  const p = await prisma.product.deleteMany({});
  console.log(`products deleted: ${p.count}`);
  const remaining = await prisma.product.count();
  console.log(`products remaining: ${remaining}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
