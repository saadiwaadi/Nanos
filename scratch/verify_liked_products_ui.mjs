import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/GWB/.gemini/antigravity-ide/brain/dd2f9b31-f8ed-4970-b907-26c85da4625c';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function verifyLikedProducts() {
  console.log('--- Launching Puppeteer for Liked Products Verification ---');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: fs.existsSync(EDGE_PATH) ? EDGE_PATH : undefined,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // 1. Open Shop page
  await page.goto('http://localhost:3000/shop', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));

  // 2. Click heart icon on first product card to like it
  const heartButton = await page.$('.card-wish');
  if (heartButton) {
    await heartButton.click();
    console.log('Liked first product on /shop');
    await new Promise((r) => setTimeout(r, 500));
  } else {
    console.warn('Heart button not found on card');
  }

  // 3. Open Cart Page
  await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));

  const cartShotPath = path.join(ARTIFACT_DIR, 'cart_liked_products.png');
  await page.screenshot({ path: cartShotPath, fullPage: true });
  console.log('Cart Page Liked Products screenshot saved to:', cartShotPath);

  await browser.close();
  console.log('--- Liked Products Verification Completed ---');
}

verifyLikedProducts().catch(console.error);
