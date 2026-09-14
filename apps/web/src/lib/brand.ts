export const NAV_LINKS = [] as const;

import { IMAGE_SLOTS } from "./imageSlots";

export const HERO_SLIDES = [
  {
    slotNum: IMAGE_SLOTS.hero1,
    eyebrowLime: "Comfort",
    eyebrowRest: "× Style",
    title: "EVERYDAY<br>COMFORT.",
    copy: "Crocs designed for your daily rotation. Comfort meets style.",
    img: "https://res.cloudinary.com/tp1vyxi3/image/upload/v1789300705/ChatGPT_Image_Sep_12_2026_12_33_22_PM.png",
    perks: [
      { icon: "truck", label: "Fast\nDelivery" },
      { icon: "shield", label: "Secure\nShopping" },
      { icon: "returns", label: "Easy\nReturns" },
      { icon: "support", label: "Customer\nSupport" },
    ],
  },
  {
    slotNum: IMAGE_SLOTS.hero2,
    eyebrowLime: "Relaxed",
    eyebrowRest: "× Fit",
    title: "BUILT<br>TO MOVE.",
    copy:
      "The Relaxed Fit Trouser, back in three fresh colorways. Soft drape, tapered leg, zero stiffness.",
    img: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1000&h=1200&fit=crop",
    perks: [
      { icon: "truck", label: "Fast\nDelivery" },
      { icon: "shield", label: "Secure\nShopping" },
      { icon: "returns", label: "Easy\nReturns" },
      { icon: "support", label: "Customer\nSupport" },
    ],
  },
  {
    slotNum: IMAGE_SLOTS.hero3,
    eyebrowLime: "Marked",
    eyebrowRest: "× Down",
    title: "STEALS<br>WHILE THEY LAST.",
    copy:
      "Your favorite clogs and trousers at their lowest prices of the season. When they're gone, they're gone.",
    img: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=1000&h=1200&fit=crop",
    perks: [
      { icon: "truck", label: "Fast\nDelivery" },
      { icon: "shield", label: "Secure\nShopping" },
      { icon: "returns", label: "Easy\nReturns" },
      { icon: "support", label: "Customer\nSupport" },
    ],
  },
];

export function fmtPrice(n: number) {
  return "PKR " + n.toLocaleString("en-PK");
}
