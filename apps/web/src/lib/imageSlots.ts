/**
 * Image slot registry — dev-state numbering for every image position.
 *
 * Every image location on the site has a stable IMG-XX number. The SAME
 * number is shown everywhere that image appears (home feed, shop grid,
 * PDP gallery, quick-view modal, cart), so a real photo can be dropped in
 * once and is instantly identifiable in every surface.
 *
 * Numbering plan (dev state, products table currently empty):
 *   IMG-01…03   hero slides 1–3
 *   IMG-04/05   home promo tiles (Crocs / Trousers)
 *   IMG-06…09   home social feed tiles 1–4 (first 4 products)
 *   IMG-10…17   product hero images, catalog positions 1–8
 *   IMG-NNa/b/c product gallery shots for position NN (A = hero, B/C = extra)
 */

export const IMAGE_SLOTS = {
  hero1: "IMG-01",
  hero2: "IMG-02",
  hero3: "IMG-03",
  promoCrocs: "IMG-04",
  promoTrousers: "IMG-05",
  feed1: "IMG-06",
  feed2: "IMG-07",
  feed3: "IMG-08",
  feed4: "IMG-09",
} as const;

export type ImageSlotKey = keyof typeof IMAGE_SLOTS;

/** Seeded catalog order — product N's hero is IMG-(9+N). */
export const PRODUCT_ORDER = [
  "clog-black", //        IMG-10
  "clog-sand", //         IMG-11
  "clog-olive", //        IMG-12
  "trouser-black", //     IMG-13
  "trouser-charcoal", //  IMG-14
  "trouser-stone", //     IMG-15
  "clog-black-sale", //   IMG-16
  "trouser-black-cargo", // IMG-17
] as const;

const PRODUCT_BASE = 9; // IMG-10 = position 1

export function slotNum(key: ImageSlotKey): string {
  return IMAGE_SLOTS[key];
}

export const FEED_SLOT_NUMS = [
  IMAGE_SLOTS.feed1,
  IMAGE_SLOTS.feed2,
  IMAGE_SLOTS.feed3,
  IMAGE_SLOTS.feed4,
];

/** Number for a product's images by product id (stable across pages). */
export function productSlotNums(productId: string): {
  num: string;
  galleryNums: string[];
} {
  const idx = PRODUCT_ORDER.indexOf(
    productId as (typeof PRODUCT_ORDER)[number],
  );
  if (idx === -1) {
    // Product created outside the seeded catalog — show an unassigned slot.
    return { num: "IMG-??", galleryNums: ["IMG-??"] };
  }
  const num = `IMG-${PRODUCT_BASE + idx + 1}`;
  return {
    num,
    galleryNums: [num, `${num}B`, `${num}C`], // A-shot = hero
  };
}
