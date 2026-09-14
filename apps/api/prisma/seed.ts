import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ProtoColor = { name: string; hex: string };

type ProtoProduct = {
  id: string;
  name: string;
  category: 'crocs' | 'trousers';
  tag: string | null;
  price: number;
  oldPrice: number | null;
  colors: ProtoColor[];
  sizes: string[];
  outOfStock: string[];
  img: string;
  gallery: string[];
  desc: string;
  rating: number;
  reviews: number;
  sale?: boolean;
};

// Extracted 1:1 from nanos-pk-prototype.html (const PRODUCTS)
/** Black-clog product shot (brand Cloudinary). The old Unsplash photo
 *  (photo-1621665421964) went 404 — replaced everywhere 2026-09-14. */
const CLOG_BLACK_IMG =
  'https://res.cloudinary.com/tp1vyxi3/image/upload/v1789376228/ChatGPT_Image_Sep_14_2026_01_04_47_AM.png';

const PRODUCTS: ProtoProduct[] = [
  {
    id: 'clog-black', name: 'Classic Clog', category: 'crocs', tag: 'NEW',
    price: 7499, oldPrice: null,
    colors: [
      { name: 'Black', hex: '#111111' },
      { name: 'Sand', hex: '#D9CBB0' },
      { name: 'Olive', hex: '#4A4A34' }
    ],
    sizes: ['UK 6','UK 7','UK 8','UK 9','UK 10','UK 11'],
    outOfStock: ['UK 6'],
    img: CLOG_BLACK_IMG,
    gallery: [
      CLOG_BLACK_IMG,
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&h=800&fit=crop'
    ],
    desc: 'The Classic Clog. Broken-in comfort from the first step, ventilation ports for warm days, and a heel strap for when you need to move fast. Slip in, walk out.',
    rating: 4.7, reviews: 312
  },
  {
    id: 'clog-sand', name: 'Classic Clog', category: 'crocs', tag: 'NEW',
    price: 7499, oldPrice: null,
    colors: [
      { name: 'Sand', hex: '#D9CBB0' },
      { name: 'Black', hex: '#111111' },
      { name: 'Olive', hex: '#4A4A34' }
    ],
    sizes: ['UK 6','UK 7','UK 8','UK 9','UK 10','UK 11'],
    outOfStock: ['UK 11'],
    img: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600&h=600&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&h=800&fit=crop'
    ],
    desc: 'The Classic Clog in Sand. Broken-in comfort from the first step, ventilation ports for warm days, and a heel strap for when you need to move fast.',
    rating: 4.6, reviews: 198
  },
  {
    id: 'clog-olive', name: 'Classic Clog', category: 'crocs', tag: 'NEW',
    price: 7499, oldPrice: null,
    colors: [
      { name: 'Olive', hex: '#4A4A34' },
      { name: 'Black', hex: '#111111' },
      { name: 'Sand', hex: '#D9CBB0' }
    ],
    sizes: ['UK 6','UK 7','UK 8','UK 9','UK 10','UK 11'],
    outOfStock: [],
    img: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&h=600&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&h=800&fit=crop'
    ],
    desc: 'The Classic Clog in Olive. Broken-in comfort from the first step, ventilation ports for warm days, and a heel strap for when you need to move fast.',
    rating: 4.5, reviews: 87
  },
  {
    id: 'trouser-black', name: 'Relaxed Fit Trousers', category: 'trousers', tag: 'NEW',
    price: 3999, oldPrice: null,
    colors: [
      { name: 'Black', hex: '#111111' },
      { name: 'Charcoal', hex: '#222222' },
      { name: 'Stone', hex: '#D9D6CF' }
    ],
    sizes: ['28','30','32','34','36','38'],
    outOfStock: ['28'],
    img: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=600&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&h=800&fit=crop'
    ],
    desc: 'Relaxed Fit Trousers built for comfort meets versatility. A soft drape, tapered leg, and elasticated waistband that moves with your day.',
    rating: 4.8, reviews: 145
  },
  {
    id: 'trouser-charcoal', name: 'Relaxed Fit Trousers', category: 'trousers', tag: null,
    price: 3999, oldPrice: 4799,
    colors: [
      { name: 'Charcoal', hex: '#222222' },
      { name: 'Black', hex: '#111111' },
      { name: 'Stone', hex: '#D9D6CF' }
    ],
    sizes: ['28','30','32','34','36','38'],
    outOfStock: [],
    img: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=600&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&h=800&fit=crop'
    ],
    desc: 'Relaxed Fit Trousers in Charcoal, on sale. A soft drape, tapered leg, and elasticated waistband that moves with your day.',
    rating: 4.6, reviews: 63,
    sale: true
  },
  {
    id: 'trouser-stone', name: 'Relaxed Fit Trousers', category: 'trousers', tag: 'BESTSELLER',
    price: 3999, oldPrice: null,
    colors: [
      { name: 'Stone', hex: '#D9D6CF' },
      { name: 'Black', hex: '#111111' },
      { name: 'Charcoal', hex: '#222222' }
    ],
    sizes: ['28','30','32','34','36','38'],
    outOfStock: [],
    img: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&h=600&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=800&fit=crop'
    ],
    desc: 'Relaxed Fit Trousers in Stone. Our best-selling colorway — a soft drape, tapered leg, and elasticated waistband that moves with your day.',
    rating: 4.9, reviews: 401
  },
  {
    id: 'clog-black-sale', name: 'Classic Clog Lite', category: 'crocs', tag: null,
    price: 5999, oldPrice: 7499,
    colors: [
      { name: 'Black', hex: '#111111' },
      { name: 'Sand', hex: '#D9CBB0' }
    ],
    sizes: ['UK 6','UK 7','UK 8','UK 9','UK 10'],
    outOfStock: ['UK 9'],
    img: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&h=600&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&h=800&fit=crop',
      CLOG_BLACK_IMG,
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&h=800&fit=crop'
    ],
    desc: 'Classic Clog Lite — a lighter-weight build of our signature clog, on sale for a limited time.',
    rating: 4.4, reviews: 52,
    sale: true
  },
  {
    id: 'trouser-black-cargo', name: 'Utility Cargo Trousers', category: 'trousers', tag: 'NEW',
    price: 4599, oldPrice: null,
    colors: [
      { name: 'Black', hex: '#111111' },
      { name: 'Olive', hex: '#4A4A34' }
    ],
    sizes: ['28','30','32','34','36'],
    outOfStock: [],
    img: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=600&fit=crop&sat=-30',
    gallery: [
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=800&fit=crop&sat=-30',
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&h=800&fit=crop'
    ],
    desc: 'Utility Cargo Trousers with reinforced pockets and a straight leg, built for days that need extra carry.',
    rating: 4.5, reviews: 39
  }
];

async function main() {
  console.log(`Seeding ${PRODUCTS.length} products...`);

  for (const p of PRODUCTS) {
    const data = {
      name: p.name,
      category: p.category,
      tag: p.tag,
      price: p.price,
      oldPrice: p.oldPrice,
      desc: p.desc,
      rating: p.rating,
      reviews: p.reviews,
      colorsJson: JSON.stringify(p.colors),
      sizesJson: JSON.stringify(p.sizes),
      outOfStockJson: JSON.stringify(p.outOfStock),
      hero: p.img,
      galleryJson: JSON.stringify(p.gallery),
      isSale: p.sale ?? p.oldPrice != null,
    };

    // Upsert keeps re-seeding idempotent.
    await prisma.product.upsert({
      where: { id: p.id },
      update: data,
      create: { id: p.id, ...data },
    });
    console.log(`  ✓ ${p.id}`);
  }

  const count = await prisma.product.count();
  console.log(`Done. Products in database: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
