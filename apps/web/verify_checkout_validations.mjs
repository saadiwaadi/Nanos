import puppeteer from "puppeteer-core";

const API_BASE = "http://localhost:4000";
const WEB_BASE = "http://localhost:3000";

async function runValidationProbe() {
  console.log("=== STARTING CHECKOUT VALIDATION & DEFENSE PROBE ===");

  const browser = await puppeteer.launch({
    executablePath: String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // 1. Add item to cart
  await page.goto(`${WEB_BASE}/product/clog-black`, { waitUntil: "networkidle2" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle2" });

  await page.waitForSelector(".size-opt:not(.disabled)", { timeout: 10000 });
  await page.click(".size-opt:not(.disabled)");
  await page.click(".pdp-actions .btn-primary");
  await new Promise((r) => setTimeout(r, 500));

  // 2. Go to /checkout
  await page.goto(`${WEB_BASE}/checkout`, { waitUntil: "networkidle2" });
  await page.waitForSelector("#ship-name", { timeout: 10000 });

  // Check initial submit button disabled state
  let btnDisabled = await page.$eval('button[form="checkout-form"]', (btn) => btn.disabled);
  console.log("1. Initial submit button disabled (Expect true):", btnDisabled);

  // Fill name
  await page.type("#ship-name", "Ali Raza");

  // 3. Test Invalid Phone Validation
  await page.type("#ship-phone", "123");
  await page.evaluate(() => document.querySelector("#ship-phone")?.blur());
  await new Promise((r) => setTimeout(r, 200));
  const phoneErr = await page.$eval("#ship-phone + span", (el) => el.innerText).catch(() => null);
  console.log("2. Invalid Phone Inline Error:", JSON.stringify(phoneErr));

  // 4. Test Invalid Address Validation
  await page.type("#ship-address", "1234");
  await page.evaluate(() => document.querySelector("#ship-address")?.blur());
  await new Promise((r) => setTimeout(r, 200));
  const addrErr = await page.$eval("#ship-address + span", (el) => el.innerText).catch(() => null);
  console.log("3. Invalid Address Inline Error:", JSON.stringify(addrErr));

  // 5. Test Invalid Promo Code
  await page.type('.promo-row input', "INVALIDPROMO");
  await page.click('.promo-row button');
  await new Promise((r) => setTimeout(r, 300));
  const promoErr = await page.$eval('.promo-row + div', (el) => el.innerText).catch(() => null);
  console.log("4. Invalid Promo Inline Error:", JSON.stringify(promoErr));

  // Fix fields to valid values
  await page.type("#ship-email", "ali.raza@example.com");

  await page.focus("#ship-phone");
  await page.keyboard.down("Control");
  await page.keyboard.press("A");
  await page.keyboard.up("Control");
  await page.type("#ship-phone", "03001234567");

  await page.focus("#ship-address");
  await page.keyboard.down("Control");
  await page.keyboard.press("A");
  await page.keyboard.up("Control");
  await page.type("#ship-address", "House 12 Street 3 Gulberg");

  await page.select("#ship-city", "Lahore");
  await page.type("#ship-postal", "54000");

  await new Promise((r) => setTimeout(r, 300));

  btnDisabled = await page.$eval('button[form="checkout-form"]', (btn) => btn.disabled);
  console.log("5. Submit button disabled after valid inputs (Expect false):", btnDisabled);

  // 6. Test Server Defense-in-depth: POST /orders with short phone directly
  const badServerRes = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      guestEmail: "test@example.com",
      guestName: "Test User",
      items: [{ productId: "clog-black", color: "Black", size: "UK 8", qty: 1 }],
      shippingInfo: { phone: "123", address: "Valid address here" }
    })
  });
  console.log("6. Server rejection for bad phone (Expect 400):", badServerRes.status, await badServerRes.json());

  // 7. Test Valid Submission + Loading state
  console.log("\n--- SUBMITTING VALID FORM ---");
  const navPromise = page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 });
  await page.click('button[form="checkout-form"]');

  // Immediately check loading button text
  const loadingText = await page.$eval('button[form="checkout-form"]', (btn) => btn.innerText.trim()).catch(() => "Navigated");
  console.log("7. Submit button text during flight:", JSON.stringify(loadingText));

  await navPromise;
  console.log("8. Navigation target URL:", page.url());

  await browser.close();
  console.log("\n=== VALIDATION & DEFENSE PROBE COMPLETED ===");
}

runValidationProbe().catch(console.error);
