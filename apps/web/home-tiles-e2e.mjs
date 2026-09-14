import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1500, height: 900 });
const log = (...a) => console.log(...a);
let failures = 0;
const check = (name, cond) => {
  log(cond ? `PASS ${name}` : `FAIL ${name}`);
  if (!cond) failures++;
};

// 1. Home page: 8 product tiles + lime brand tile render
await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForSelector("button.social-tile.product-tile", { timeout: 20000 });
const tiles = await page.$$("button.social-tile.product-tile");
check("1. eight product tiles on home", tiles.length === 8);
const limeTile = await page.$(".social-tile.lime-tile");
check("1b. lime brand tile present (not clickable)", !!limeTile);

// 2. Hover shows Quick view hint
await page.hover("button.social-tile.product-tile");
await new Promise((r) => setTimeout(r, 350));
const hintOpacity = await page.$eval(
  "button.social-tile.product-tile .tile-view",
  (el) => getComputedStyle(el).opacity,
);
check("2. hover reveals Quick view hint", hintOpacity === "1");

// 3. Click tile → quick-view modal opens with that product
const tileName = await page.$eval(
  "button.social-tile.product-tile .tile-caption-name",
  (el) => el.textContent.trim(),
);
await page.click("button.social-tile.product-tile");
await page.waitForSelector(".prod-modal-panel", { timeout: 10000 });
await new Promise((r) => setTimeout(r, 400));
const modalName = await page.$eval(".pmq-name", (el) => el.textContent.trim());
check(`3. modal opens for clicked product (${tileName})`, modalName === tileName);
const modalPrice = await page.$eval(".pmq-price", (el) => el.textContent.trim());
check("3b. modal shows price", modalPrice.startsWith("PKR"));

// 4. Add to cart from the modal
await page.waitForSelector(".size-opt:not(.disabled)", { timeout: 10000 });
await page.click(".size-opt:not(.disabled)");
await page.click(".add-to-cart");
await new Promise((r) => setTimeout(r, 500));
const addedBtn = await page.$eval(".add-to-cart span", (el) => el.textContent.trim());
check("4. add-to-cart confirms", addedBtn.includes("Added"));
const badge = await page.$eval(".cart-count", (el) => el.textContent.trim());
check("4b. header badge updated", badge !== "0");

// 5. Escape closes the modal
await page.keyboard.press("Escape");
await new Promise((r) => setTimeout(r, 500));
const modalGone = (await page.$(".prod-modal-panel")) === null;
check("5. Escape closes modal", modalGone);

// 6. A different tile opens a different product
await page.$$("button.social-tile.product-tile").then(async (els) => {
  await els[4].click();
});
await page.waitForSelector(".prod-modal-panel", { timeout: 10000 });
await new Promise((r) => setTimeout(r, 400));
const secondName = await page.$eval(".pmq-name", (el) => el.textContent.trim());
check(`6. second tile opens its own product (${secondName})`, secondName !== modalName || secondName === tileName);
const badges = await page.$$(".prod-modal-panel .pmq-thumb");
check("6b. modal gallery thumbs render", badges.length > 0);

await browser.close();
log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
