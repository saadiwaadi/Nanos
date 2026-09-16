import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/GWB/.gemini/antigravity-ide/brain/dd2f9b31-f8ed-4970-b907-26c85da4625c';

async function verifyAdminUI() {
  console.log('--- Starting Admin UI Puppeteer Verification ---');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. Open admin login page
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle2' });

  // 2. Login
  await page.type('#email', 'saadahmad200555@gmail.com');
  await page.type('#password', 'admin');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2000));

  // 3. Navigate to /orders
  await page.goto('http://localhost:3001/orders', { waitUntil: 'networkidle2' });
  const listShotPath = path.join(ARTIFACT_DIR, 'admin_orders_list.png');
  await page.screenshot({ path: listShotPath, fullPage: true });
  console.log('Orders List Screenshot saved to:', listShotPath);

  // 4. Click first order link to view detail
  const firstOrderLink = await page.$('tbody tr td a');
  if (firstOrderLink) {
    await firstOrderLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1500));

    const detailShotPath = path.join(ARTIFACT_DIR, 'admin_order_detail.png');
    await page.screenshot({ path: detailShotPath, fullPage: true });
    console.log('Order Detail Screenshot saved to:', detailShotPath);
  } else {
    console.warn('No order links found in table body!');
  }

  await browser.close();
  console.log('--- Admin UI Verification Completed Cleanly ---');
}

verifyAdminUI().catch(console.error);
