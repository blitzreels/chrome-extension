import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { artifactHash } from "./artifact-hash.mjs";

const root = resolve(import.meta.dirname, "..");
const receipt = JSON.parse(
  await readFile(resolve(root, "artifacts/live-popup-receipt.json"), "utf8"),
);
assert.equal(
  receipt.artifactHash,
  await artifactHash(resolve(root, "dist")),
  "Capture the current native popup first",
);
assert.equal(receipt.savedMomentVerified, true);
const sources = await Promise.all(
  ["dark", "light"].map(async (theme) => {
    const file = `artifacts/native-moments-${theme}.png`;
    const bytes = await readFile(resolve(root, file));
    return {
      theme,
      file,
      base64: bytes.toString("base64"),
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  }),
);
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
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  await page.setContent(`<!doctype html><html lang="en"><head><style>
@font-face{font-family:Onest;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900}*{box-sizing:border-box}body{margin:0;background:#f3f6f4;color:#111;font-family:Onest,system-ui}main{padding:36px 64px}header{display:flex;justify-content:space-between;align-items:center}h1{font-size:32px;letter-spacing:-1px;margin:0;font-weight:600}header p{font-size:15px;margin:8px 0 0;color:#45544a}.website{font-size:18px;font-weight:600;color:#16714c}.screens{display:flex;justify-content:center;align-items:flex-start;gap:80px;margin-top:28px}figure{margin:0;width:380px}figcaption{font-size:12px;color:#45544a;margin-bottom:10px}img{display:block;width:380px;height:auto;border-radius:12px;box-shadow:0 10px 30px #142d171c}
</style></head><body><main><header><div><h1>Save video moments with BlitzReels</h1><p>YouTube timestamps and notes, saved on your device. Free, with no account needed.</p></div><span class="website">blitzreels.com</span></header><div class="screens">${sources.map(({ theme, base64 }) => `<figure><figcaption>${theme === "dark" ? "Dark mode" : "Light mode"}</figcaption><img alt="BlitzReels native Chrome popup in ${theme} mode" src="data:image/png;base64,${base64}"></figure>`).join("")}</div></main></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollHeight > innerHeight,
    ),
    false,
  );
  await mkdir(resolve(root, "store/screenshots"), { recursive: true });
  await page.screenshot({
    path: resolve(root, "store/screenshots/moments-1280x800.png"),
  });
  await writeFile(
    resolve(root, "store/screenshots/receipt.json"),
    `${JSON.stringify({ version: receipt.version, artifactHash: receipt.artifactHash, capturedAt: new Date().toISOString(), sources: sources.map(({ base64: _base64, ...source }) => source), note: "Composition of actual native Chrome popup captures; saved timestamp comes from the real YouTube player; no sample notes or generated clips." }, null, 2)}\n`,
  );
  console.log(
    "Store screenshot prepared: store/screenshots/moments-1280x800.png",
  );
} finally {
  await browser.close();
}
