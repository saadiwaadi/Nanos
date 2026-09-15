import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ColorEntry = { name: string; hex: string };

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, colorsJson: true, galleryJson: true },
  });
  console.log(`Backfilling ProductColor rows for ${products.length} products...`);

  let created = 0;
  let skipped = 0;

  for (const p of products) {
    let colors: ColorEntry[] = [];
    try {
      const parsed: unknown = JSON.parse(p.colorsJson);
      if (Array.isArray(parsed)) colors = parsed as ColorEntry[];
    } catch {
      console.warn(`  ! ${p.id}: colorsJson is not valid JSON — skipping`);
      continue;
    }

    // Each color inherits the product's own gallery verbatim (same images,
    // copied — nothing invented).
    const imagesJson = p.galleryJson;

    for (let i = 0; i < colors.length; i++) {
      const c = colors[i];
      if (!c || typeof c.name !== 'string' || typeof c.hex !== 'string') {
        console.warn(`  ! ${p.id}: malformed color entry at index ${i} — skipping entry`);
        skipped++;
        continue;
      }
      const existing = await prisma.productColor.findUnique({
        where: { productId_name: { productId: p.id, name: c.name } },
      });
      if (existing) {
        skipped++;
        continue;
      }
      await prisma.productColor.create({
        data: {
          productId: p.id,
          name: c.name,
          hex: c.hex,
          imagesJson,
          sortOrder: i,
        },
      });
      created++;
    }
  }

  const total = await prisma.productColor.count();
  console.log(`Created: ${created}, skipped (existing/malformed): ${skipped}`);
  console.log(`ProductColor rows in database: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
