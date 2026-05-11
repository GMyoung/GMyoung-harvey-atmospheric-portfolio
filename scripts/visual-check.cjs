const { chromium } = require("C:/Users/Harvey/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const url = "http://127.0.0.1:4177/";

async function canvasHasInk(page) {
  return page.evaluate(() => {
    const canvas = document.getElementById("atmosphere-canvas");
    const ctx = canvas.getContext("2d");
    const sample = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < sample.length; i += 80) {
      if (sample[i] !== 0) return true;
    }
    return false;
  });
}

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe"
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(root, "screenshots-desktop.png"), fullPage: false });

  for (const mode of ["sunny", "rain", "moon", "day"]) {
    await page.click(`[data-mode="${mode}"]`);
    await page.waitForTimeout(450);
    const className = await page.evaluate(() => document.body.className);
    console.log(`${mode}: ${className}`);
    if (mode === "rain" || mode === "moon") {
      await page.waitForTimeout(250);
      console.log(`${mode}-canvas: ${await canvasHasInk(page)}`);
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(root, "screenshots-mobile.png"), fullPage: false });
  await browser.close();
})();
