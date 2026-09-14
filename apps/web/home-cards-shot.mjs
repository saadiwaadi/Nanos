import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 2600 });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForSelector(".product-card .quick-add", { timeout: 20000 });

const counts = await page.evaluate(() => ({
  cards: document.querySelectorAll(".product-card").length,
  quickAdd: document.querySelectorAll(".quick-add").length,
  hearts: document.querySelectorAll(".card-wish").length,
  socialTiles: document.querySelectorAll(".social-tile").length,
}));
console.log("DOM check:", JSON.stringify(counts));

await page.evaluate(() =>
  document.querySelectorAll(".section")[1]?.scrollIntoView({ block: "start" }),
);
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: "home-cards-restored.png", type: "jpeg", quality: 70 });
await browser.close();
console.log("screenshot saved: home-cards-restored.png");
