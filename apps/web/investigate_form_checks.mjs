import puppeteer from "puppeteer-core";

const WEB_BASE = "http://localhost:3000";

async function investigateForm() {
  console.log("=== DETAILED CHECKOUT FORM INVESTIGATION ===");

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

  const networkEvents = [];
  page.on("request", (req) => {
    if (req.url().includes("/orders") || req.url().includes("/auth")) {
      networkEvents.push({ event: "REQUEST", url: req.url(), method: req.method(), postData: req.postData() });
    }
  });
  page.on("response", async (res) => {
    if (res.url().includes("/orders") || res.url().includes("/auth")) {
      let bodyText = "";
      try { bodyText = await res.text(); } catch (e) { bodyText = `<error: ${e.message}>`; }
      networkEvents.push({ event: "RESPONSE", url: res.url(), status: res.status(), body: bodyText });
    }
  });

  // Add item to cart
  await page.goto(`${WEB_BASE}/product/clog-black`, { waitUntil: "networkidle2" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle2" });

  await page.waitForSelector(".size-opt:not(.disabled)", { timeout: 10000 });
  await page.click(".size-opt:not(.disabled)");
  await page.click(".pdp-actions .btn-primary");
  await new Promise((r) => setTimeout(r, 500));

  // Go to /checkout
  await page.goto(`${WEB_BASE}/checkout`, { waitUntil: "networkidle2" });
  await page.waitForSelector("#ship-name", { timeout: 10000 });

  // 1. Check validity BEFORE filling form
  const emptyFormValidity = await page.evaluate(() => {
    const form = document.querySelector("#checkout-form");
    if (!form) return { formFound: false };
    const isValid = form.checkValidity();
    const invalidFields = Array.from(form.querySelectorAll(":invalid")).map((el) => ({
      id: el.id,
      name: el.name,
      tagName: el.tagName,
      type: el.type,
      validationMessage: el.validationMessage,
    }));
    return { formFound: true, isValid, invalidFields };
  });

  console.log("\n--- FORM VALIDITY BEFORE FILLING ---");
  console.log(JSON.stringify(emptyFormValidity, null, 2));

  // 2. Fill form fields
  await page.type("#ship-name", "Ali Raza");
  await page.type("#ship-phone", "03001234567");
  await page.type("#ship-email", "ali.raza@example.com");
  await page.type("#ship-address", "House 12, Street 3, Gulberg");
  await page.select("#ship-city", "Lahore");
  await page.type("#ship-postal", "54000");

  // Check validity AFTER filling form
  const filledFormValidity = await page.evaluate(() => {
    const form = document.querySelector("#checkout-form");
    if (!form) return { formFound: false };
    const isValid = form.checkValidity();
    const invalidFields = Array.from(form.querySelectorAll(":invalid")).map((el) => ({
      id: el.id,
      name: el.name,
      tagName: el.tagName,
      type: el.type,
      validationMessage: el.validationMessage,
    }));
    return { formFound: true, isValid, invalidFields };
  });

  console.log("\n--- FORM VALIDITY AFTER FILLING ---");
  console.log(JSON.stringify(filledFormValidity, null, 2));

  // 3. Inspect Submit Button attributes & overlays
  const submitBtnInspection = await page.evaluate(() => {
    const btn = document.querySelector('button[form="checkout-form"]');
    if (!btn) return { btnFound: false };
    const rect = btn.getBoundingClientRect();
    const topEl = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);

    return {
      btnFound: true,
      tagName: btn.tagName,
      type: btn.getAttribute("type"),
      formAttr: btn.getAttribute("form"),
      disabled: btn.disabled,
      innerText: btn.innerText.trim(),
      pointerEvents: window.getComputedStyle(btn).pointerEvents,
      display: window.getComputedStyle(btn).display,
      topElementAtBtnCenter: topEl ? { tagName: topEl.tagName, className: topEl.className, id: topEl.id } : null,
      isBtnSameAsTopEl: topEl === btn || btn.contains(topEl),
    };
  });

  console.log("\n--- SUBMIT BUTTON INSPECTION ---");
  console.log(JSON.stringify(submitBtnInspection, null, 2));

  // 4. Click Submit & Observe
  console.log("\n--- CLICKING SUBMIT BUTTON ---");
  const navPromise = page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(e => `No navigation (${e.message})`);
  await page.click('button[form="checkout-form"]');
  const navRes = await navPromise;

  console.log("Navigation Result:", navRes);
  console.log("Final Page URL:", page.url());

  console.log("\n--- NETWORK EVENTS LOGGED ---");
  console.log(JSON.stringify(networkEvents, null, 2));

  console.log("\n--- CONSOLE LOGS ---");
  console.log(JSON.stringify(consoleLogs, null, 2));

  await browser.close();
}

investigateForm().catch(console.error);
