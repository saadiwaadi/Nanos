import puppeteer from "puppeteer-core";

const WEB_BASE = "http://localhost:3000";

async function verifyDrawerCheckout() {
  console.log("=== VERIFYING CART DRAWER CONTINUE TO CHECKOUT ===");

  const browser = await puppeteer.launch({
    executablePath: String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // 1. Go to home page
  await page.goto(`${WEB_BASE}/product/clog-black`, { waitUntil: "networkidle2" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle2" });

  // 2. Add product to cart
  await page.waitForSelector(".size-opt:not(.disabled)", { timeout: 10000 });
  await page.click(".size-opt:not(.disabled)");
  await page.click(".pdp-actions .btn-primary");
  await new Promise((r) => setTimeout(r, 500));

  // 3. Open Cart Drawer by clicking header cart icon
  await page.click('button[aria-label="Open cart"]');
  await page.waitForSelector(".cart-drawer-open", { timeout: 5000 });
  console.log("✓ Cart Drawer opened");

  // 4. Click "Continue to Checkout" in Cart Drawer
  const navPromise = page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 });
  await page.click(".cart-drawer-checkout");
  await navPromise;

  const currentUrl = page.url();
  console.log("✓ Current URL after clicking Continue to Checkout in drawer:", currentUrl);
  console.log("✓ Navigated to /checkout:", currentUrl === `${WEB_BASE}/checkout`);

  await browser.close();
}

verifyDrawerCheckout().catch(console.error);
