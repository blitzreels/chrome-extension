import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "..");
const icon = (
  await readFile(resolve(root, "public/icons/icon-128.png"))
).toString("base64");
const font = (
  await readFile(
    resolve(
      root,
      "node_modules/@fontsource-variable/onest/files/onest-latin-wght-normal.woff2",
    ),
  )
).toString("base64");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BLITZREELS_CHROMIUM_PATH
    ? { executablePath: process.env.BLITZREELS_CHROMIUM_PATH }
    : {}),
});
try {
  const page = await browser.newPage({
    viewport: { width: 440, height: 280 },
    deviceScaleFactor: 1,
  });
  await page.setContent(`<!doctype html><html lang="en"><head><style>
@font-face{font-family:Onest;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900}*{box-sizing:border-box}body{margin:0;width:440px;height:280px;background:#0a0a0a;color:#fff;font-family:Onest,system-ui}main{height:100%;padding:30px 32px;display:flex;flex-direction:column;justify-content:space-between}header{display:flex;align-items:center;gap:10px;margin-left:-10px}img{width:64px;height:64px}h1{margin:0;font-size:35px;letter-spacing:-1.5px;font-weight:600}p{margin:0;font-size:24px;line-height:1.3;letter-spacing:-.6px;font-weight:500}footer{border-top:1px solid #303030;padding-top:16px;color:#a3a3a3;font-size:14px;display:flex;justify-content:space-between}strong{color:#00e69a;font-weight:500}
</style></head><body><main><header><img alt="" src="data:image/png;base64,${icon}"><h1>BlitzReels</h1></header><p>Save video moments.<br>Keep your notes.</p><footer><span>YouTube timestamps</span><strong>blitzreels.com</strong></footer></main></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  assert.equal(
    await page.evaluate(
      () =>
        document.documentElement.scrollHeight > innerHeight ||
        document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await mkdir(resolve(root, "store/promo"), { recursive: true });
  await page.screenshot({
    path: resolve(root, "store/promo/small-440x280.png"),
  });
  console.log(
    "Store promotional image prepared: store/promo/small-440x280.png",
  );
} finally {
  await browser.close();
}
