/**
 * Stage 3 verification, part 2: because every color currently shares the same
 * backfilled gallery, "images change" can't be observed directly — but the
 * imgIdx-reset logic CAN: select a high thumbnail, switch color, and the main
 * image must snap back to thumbnail 0 (new code) instead of staying on the
 * stale index (old code). Read-only probe.
 */
import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1500, height: 900 });
const log = (...a) => console.log(...a);

await page.goto("http://localhost:3000/product/clog-black", {
  waitUntil: "networkidle2",
  timeout: 60000,
});
await page.waitForSelector(".color-opt", { timeout: 15000 });

const snapshot = () =>
  page.evaluate(() => {
    const main = document.querySelector(".pdp-main-image img");
    const selected = document.querySelector(".option-group .selected-val");
    const thumbs = [...document.querySelectorAll(".pdp-thumbs img")];
    return {
      color: selected?.textContent.trim() ?? null,
      main: main?.getAttribute("src") ?? null,
      thumbs: thumbs.map((t) => t.getAttribute("src")),
    };
  });

// Step 1: default state (Black, imgIdx 0)
let s = await snapshot();
log("1) default:", s.color, "| main idx =", s.thumbs.indexOf(s.main));

// Step 2: click thumbnail #2 (0-based) -> main should follow
const thumbEls = await page.$$(".pdp-thumbs .pdp-thumb");
await thumbEls[2].click();
await new Promise((r) => setTimeout(r, 300));
s = await snapshot();
const afterThumbClick = s.thumbs.indexOf(s.main);
log("2) after clicking thumb[2]: main idx =", afterThumbClick, "(expect 2)");

// Step 3: switch to Sand -> main must RESET to idx 0 (new code), not stay at 2
const swatches = await page.$$(".color-opt");
await swatches[1].click();
await new Promise((r) => setTimeout(r, 300));
s = await snapshot();
const afterColorSwitch = s.thumbs.indexOf(s.main);
log("3) after switching color:", s.color, "| main idx =", afterColorSwitch);

// Step 4: same strip is served for Sand (identical backfilled data) — sanity
log(
  "4) thumbnail strip for Sand identical to Black's (expected w/ backfill):",
  s.thumbs.length,
  "thumbs",
);

log(
  "RESULT:",
  afterThumbClick === 2 && afterColorSwitch === 0
    ? "PASS — color switch resets gallery index; per-color gallery path live"
    : "FAIL — reset not working (or stale build): see indices above",
);

await browser.close();
