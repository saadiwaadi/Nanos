import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage();
// tall viewport so the whole 3x3 grid fits in one viewport shot
await page.setViewport({ width: 1440, height: 2200 });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForSelector("button.social-tile.product-tile", { timeout: 20000 });
await page.evaluate(() =>
  document.querySelector(".social-grid").scrollIntoView({ block: "center" }),
);
await new Promise((r) => setTimeout(r, 600));
const grid = await page.$(".social-grid");
await grid.screenshot({ path: "home-feed-tiles.png", type: "jpeg", quality: 70 });
await page.click("button.social-tile.product-tile");
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: "home-feed-modal.png" });
await browser.close();
console.log("screenshots saved: home-feed-tiles.png, home-feed-modal.png");
