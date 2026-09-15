import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DEFAULT_STOCK = 20;

async function main() {
  const products = await prisma.product.findMany();
  console.log(`Backfilling variants for ${products.length} products...`);
  let variantCount = 0;

  for (const p of products) {
    const colors: { name: string; hex: string }[] = JSON.parse(p.colorsJson);
    const sizes: string[] = JSON.parse(p.sizesJson);
    const outOfStock: string[] = JSON.parse(p.outOfStockJson);

    for (const color of colors) {
      for (const size of sizes) {
        const stock = outOfStock.includes(size) ? 0 : DEFAULT_STOCK;
        await prisma.productVariant.upsert({
          where: { productId_color_size: { productId: p.id, color: color.name, size } },
          update: {},
          create: { productId: p.id, color: color.name, size, stock },
        });
        variantCount++;
      }
    }
    console.log(`  ✓ ${p.id} (${colors.length} colors x ${sizes.length} sizes)`);
  }
  console.log(`Done. ${variantCount} variant rows processed.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
