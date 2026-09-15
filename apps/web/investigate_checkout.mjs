import puppeteer from "puppeteer-core";

const WEB_BASE = "http://localhost:3000";

async function investigate() {
  console.log("=== STARTING CHECKOUT INVESTIGATION ===");

  const browser = await puppeteer.launch({
    executablePath: String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const consoleLogs = [];
  page.on("console", (msg) => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });

  const pageErrors = [];
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  const networkRequests = [];
  page.on("request", (req) => {
    if (req.url().includes("/orders") || req.url().includes("/auth")) {
      networkRequests.push({
        url: req.url(),
        method: req.method(),
        postData: req.postData(),
        headers: req.headers(),
      });
    }
  });

  const networkResponses = [];
  page.on("response", async (res) => {
    if (res.url().includes("/orders") || res.url().includes("/auth")) {
      let bodyText = "";
      try {
        bodyText = await res.text();
      } catch (e) {
        bodyText = `<failed to read body: ${e.message}>`;
      }
      networkResponses.push({
        url: res.url(),
        status: res.status(),
        statusText: res.statusText(),
        body: bodyText,
      });
    }
  });

  // 1. Add item to cart via PDP
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

  // Inspect submit button and form state before submission
  const submitBtnAttrs = await page.evaluate(() => {
    const btn = document.querySelector('button[form="checkout-form"]');
    const form = document.querySelector("#checkout-form");
    const rawCart = localStorage.getItem("nanos_cart_v1");
    let parsedCartCount = 0;
    try {
      parsedCartCount = JSON.parse(rawCart).items.length;
    } catch {}

    return {
      btnExists: Boolean(btn),
      btnType: btn ? btn.getAttribute("type") : null,
      btnFormAttr: btn ? btn.getAttribute("form") : null,
      btnDisabled: btn ? btn.disabled : null,
      btnText: btn ? btn.innerText.trim() : null,
      formExists: Boolean(form),
      formHasOnSubmit: form ? typeof form.onsubmit : null,
      cartLengthInStorage: parsedCartCount,
    };
  });

  console.log("\n--- PRE-SUBMIT INSPECTION ---");
  console.log(JSON.stringify(submitBtnAttrs, null, 2));

  // Fill out form
  await page.type("#ship-name", "Ali Raza");
  await page.type("#ship-phone", "03001234567");
  await page.type("#ship-email", "ali.raza@example.com");
  await page.type("#ship-address", "House 12, Street 3, Gulberg");
  await page.select("#ship-city", "Lahore");
  await page.type("#ship-postal", "54000");

  console.log("\n--- CLICKING SUBMIT BUTTON ---");
  const navPromise = page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(err => `No navigation occurred (${err.message})`);
  await page.click('button[form="checkout-form"]');

  const navResult = await navPromise;
  console.log("Navigation Result:", navResult);
  console.log("Current Page URL after submit:", page.url());

  console.log("\n--- BROWSER CONSOLE MESSAGES ---");
  console.log(JSON.stringify(consoleLogs, null, 2));

  console.log("\n--- UNCAUGHT PAGE ERRORS ---");
  console.log(JSON.stringify(pageErrors, null, 2));

  console.log("\n--- NETWORK REQUESTS INTERCEPTED ---");
  console.log(JSON.stringify(networkRequests, null, 2));

  console.log("\n--- NETWORK RESPONSES INTERCEPTED ---");
  console.log(JSON.stringify(networkResponses, null, 2));

  await browser.close();
}

investigate().catch(console.error);
