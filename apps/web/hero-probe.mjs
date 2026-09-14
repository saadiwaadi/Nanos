import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900 });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));

const probe = await page.evaluate(() => {
  const out = {};
  const copy = document.querySelector(".hero-banner-copy.active");
  const layer = copy ? copy.parentElement : null;
  const scrim = document.querySelector(".hero-slide.active .hero-banner-scrim");
  const title = document.querySelector(".hero-banner-title");
  const header = document.querySelector(".site-header");
  const backdrop = document.querySelector(".nav-backdrop");

  function info(el) {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      opacity: cs.opacity,
      display: cs.display,
      visibility: cs.visibility,
      zIndex: cs.zIndex,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    };
  }
  out.copy = info(copy);
  out.layer = info(layer);
  out.scrim = info(scrim);
  out.header = info(header);
  out.backdrop = info(backdrop);
  if (title) {
    const cs = getComputedStyle(title);
    const r = title.getBoundingClientRect();
    out.title = { color: cs.color, fontSize: cs.fontSize, rect: { x: Math.round(r.x), w: Math.round(r.width) } };
  }
  out.openDrawer = !!document.querySelector(".side-nav.open");
  out.limeBtn = info(document.querySelector(".hero-btn-lime"));
  return out;
});
console.log(JSON.stringify(probe, null, 2));

// also grab a settled screenshot through CDP
const buf = await page.screenshot();
const fs = await import("fs");
fs.writeFileSync("hero-settled.png", buf);
console.log("SCREENSHOT WRITTEN:", buf.length, "bytes");
await browser.close();
