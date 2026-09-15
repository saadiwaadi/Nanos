import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CHARTS: Record<string, { size: string }[]> = {
  crocs: ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'].map((size) => ({ size })),
  trousers: ['28', '30', '32', '34', '36', '38'].map((size) => ({ size })),
};

async function main() {
  for (const [category, rows] of Object.entries(CHARTS)) {
    await prisma.sizeChart.upsert({
      where: { category },
      update: {},
      create: { category, rowsJson: JSON.stringify(rows) },
    });
    console.log(`  ✓ ${category}: ${rows.length} rows`);
  }
  console.log('Done.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
