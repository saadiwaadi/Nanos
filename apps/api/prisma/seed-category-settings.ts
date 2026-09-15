import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SETTINGS: Record<string, number> = {
  crocs: 20,
  trousers: 20,
};

async function main() {
  for (const [category, lowStockThreshold] of Object.entries(SETTINGS)) {
    await prisma.categorySettings.upsert({
      where: { category },
      update: {},
      create: { category, lowStockThreshold },
    });
    console.log(`  ✓ ${category}: lowStockThreshold=${lowStockThreshold}`);
  }
  console.log('Done.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
