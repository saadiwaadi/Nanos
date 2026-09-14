import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1500, height: 900 });
const log = (...a) => console.log(...a);

// 1. PDP: pick size, add to cart
await page.goto("http://localhost:3000/product/clog-black", { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForSelector(".size-opt:not(.disabled)", { timeout: 15000 });
await page.click(".size-opt:not(.disabled)");
await page.click(".pdp-actions .btn-primary");
await new Promise((r) => setTimeout(r, 400));
const pdpEcho = await page.$eval(".pdp-info", (el) => el.textContent.includes("Added to cart"));
log("1. PDP add-to-cart echo shown:", pdpEcho);

// 2. Header badge reflects the item WITHOUT navigation
let badge = await page.$eval(".cart-count", (el) => el.textContent.trim());
log("2. header badge on PDP (no nav):", badge);

// 3. Quick Add from shop (default variant)
await page.goto("http://localhost:3000/shop", { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForSelector(".quick-add", { timeout: 15000 });
await page.click(".quick-add");
await new Promise((r) => setTimeout(r, 300));
const qaText = await page.$eval(".quick-add", (el) => el.textContent.trim());
badge = await page.$eval(".cart-count", (el) => el.textContent.trim());
log("3. quick-add feedback:", JSON.stringify(qaText), "| badge now:", badge);

// 4. Cart page: contents + qty stepper + remove
await page.goto("http://localhost:3000/cart", { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForSelector(".cart-line", { timeout: 15000 });
let lines = await page.$$(".cart-line");
const names = await page.$$eval(".cart-line-info h3", (els) => els.map((e) => e.textContent.trim()));
log("4. cart lines:", lines.length, JSON.stringify(names));

// qty +1 on first line
await page.click(".cart-line .qty-stepper button:last-child");
await new Promise((r) => setTimeout(r, 300));
let totals = await page.$$eval(".summary-row", (els) => els.map((e) => e.textContent.trim()));
log("   after qty+1:", JSON.stringify(totals));

// promo NANOS10
await page.type(".promo-row input", "NANOS10");
await page.click(".promo-row button");
await new Promise((r) => setTimeout(r, 300));
totals = await page.$$eval(".summary-row", (els) => els.map((e) => e.textContent.trim()));
const promoMsg = await page.evaluate(() => {
  const box = document.querySelector(".summary-box");
  return box ? box.textContent.includes("NANOS10 applied") : false;
});
log("5. promo applied msg:", promoMsg, JSON.stringify(totals));

// remove one line down to... keep one; then header badge check
badge = await page.$eval(".cart-count", (el) => el.textContent.trim());
log("6. badge on cart page:", badge);

// 5. Proceed to Checkout — THE one navigation
await page.click('a[href="/checkout"].btn-primary');
await page.waitForSelector(".summary-box .order-summary-mini", { timeout: 15000 });
const url = page.url();
const minis = await page.$$eval(".order-summary-mini", (els) => els.map((e) => e.textContent.trim().slice(0, 40)));
const placeOrder = await page.$eval(".summary-box .btn-primary", (el) => el.textContent.trim());
log("7. navigated to:", url, "| summary lines:", JSON.stringify(minis), "| CTA:", JSON.stringify(placeOrder));

// 6. back to cart, empty it -> empty state; then checkout guard
await page.goto("http://localhost:3000/cart", { waitUntil: "networkidle2" });
const removeBtns = await page.$$("button.remove-link");
for (const b of removeBtns) { await b.click(); await new Promise((r) => setTimeout(r, 200)); }
const emptyShown = await page.$eval(".empty-state h2", (el) => el.textContent.trim()).catch(() => null);
log("8. after removing all lines, empty state:", JSON.stringify(emptyShown));
await page.goto("http://localhost:3000/checkout", { waitUntil: "networkidle2" });
const guard = await page.$eval(".empty-state h2", (el) => el.textContent.trim()).catch(() => null);
log("9. checkout empty-cart guard:", JSON.stringify(guard));

await browser.close();
log("E2E DONE");
