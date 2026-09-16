import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/GWB/.gemini/antigravity-ide/brain/dd2f9b31-f8ed-4970-b907-26c85da4625c';

const POSSIBLE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

async function captureVerificationScreenshots() {
  console.log('--- Launching Puppeteer for SKU UI Screenshots ---');
  let executablePath = POSSIBLE_PATHS.find((p) => fs.existsSync(p));

  const launchOpts = { headless: true };
  if (executablePath) {
    console.log('Using browser executable at:', executablePath);
    launchOpts.executablePath = executablePath;
  }

  const browser = await puppeteer.launch(launchOpts);
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // 1. Home / Shop grid screenshot
  await page.goto('http://localhost:3000/shop', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));

  const cardShotPath = path.join(ARTIFACT_DIR, 'sku_card_after.png');
  await page.screenshot({ path: cardShotPath, fullPage: false });
  console.log('Product Cards screenshot saved to:', cardShotPath);

  // 2. Product Detail PDP screenshot
  await page.goto('http://localhost:3000/product/clog-black', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));

  const pdpShotPath = path.join(ARTIFACT_DIR, 'sku_pdp_after.png');
  await page.screenshot({ path: pdpShotPath, fullPage: false });
  console.log('PDP Detail screenshot saved to:', pdpShotPath);

  await browser.close();
  console.log('--- Screenshots Captured Cleanly ---');
}

captureVerificationScreenshots().catch(console.error);
