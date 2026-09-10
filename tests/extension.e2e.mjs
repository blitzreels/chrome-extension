import assert from "node:assert/strict";
import { createHash, generateKeyPairSync } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { artifactHash } from "../scripts/artifact-hash.mjs";

const project = resolve(import.meta.dirname, "..");
const artifacts = resolve(project, "artifacts");
const temporary = await mkdtemp(resolve(tmpdir(), "blitzreels-wxt-test-"));
const extension = resolve(temporary, "extension");
await mkdir(artifacts, { recursive: true });
const screenshots = resolve(artifacts, "fixtures");
await mkdir(screenshots, { recursive: true });
await rm(resolve(artifacts, "verification.json"), { force: true });
await cp(resolve(project, "dist"), extension, { recursive: true });
const manifest = JSON.parse(
  await readFile(resolve(extension, "manifest.json"), "utf8"),
);
assert.equal(manifest.manifest_version, 3);
assert.deepEqual(manifest.permissions, ["storage"]);
assert.equal(manifest.background.service_worker, "background.js");
assert.equal(manifest.host_permissions, undefined);
assert.equal(manifest.action.default_popup, "popup.html");
assert.equal(manifest.side_panel, undefined);
assert.equal(manifest.minimum_chrome_version, "127");
assert.equal(manifest.externally_connectable, undefined);
assert.equal(manifest.content_scripts.length, 1);
assert.deepEqual(manifest.content_scripts[0].matches, [
  "https://www.youtube.com/*",
  "https://youtube.com/*",
]);
assert.equal(manifest.content_scripts[0].all_frames, false);
assert.equal(manifest.content_scripts[0].world, "ISOLATED");
assert.equal(
  manifest.content_security_policy.extension_pages,
  "script-src 'self'; object-src 'none'; base-uri 'none';",
);
for (const resource of manifest.web_accessible_resources ?? []) {
  assert.deepEqual(resource.matches, [
    "https://www.youtube.com/*",
    "https://youtube.com/*",
  ]);
  assert.ok(
    resource.resources.every((path) => path === "content-scripts/youtube.css"),
  );
}
const { publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "der" },
  privateKeyEncoding: { type: "pkcs8", format: "der" },
});
const extensionId = createHash("sha256")
  .update(publicKey)
  .digest("hex")
  .slice(0, 32)
  .replace(/[0-9a-f]/g, (character) =>
    String.fromCharCode(97 + Number.parseInt(character, 16)),
  );
await writeFile(
  resolve(extension, "manifest.json"),
  JSON.stringify({ ...manifest, key: publicKey.toString("base64") }),
);
const contentPath = resolve(extension, manifest.content_scripts[0].js[0]);
await writeFile(
  contentPath,
  `${await readFile(contentPath, "utf8")}\nObject.defineProperty(HTMLMediaElement.prototype, "duration", {get() { return Number(this.getAttribute("data-fixture-duration") ?? 120); }, configurable: true});\nObject.defineProperty(HTMLMediaElement.prototype, "currentTime", {get() { return Number(this.getAttribute("data-fixture-time") ?? 32); }, configurable: true});\nchrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message.type !== "fixture-security-probe") return false;
  Promise.all([
    chrome.storage.local.get("moments").then(() => false, () => true),
    chrome.runtime.sendMessage({ type: "snapshot" }).then((value) => value === undefined, () => true),
    chrome.runtime.sendMessage({ type: "create-clips" }).then((value) => value === undefined, () => true)
  ]).then((blocked) => respond({ blocked }));
  return true;
});`,
);
const workerPath = resolve(extension, manifest.background.service_worker);
await writeFile(
  workerPath,
  `globalThis.blitzTest = { opens: [] }; chrome.action.openPopup = async (options) => { const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); globalThis.blitzTest.tabId = tab.id; globalThis.blitzTest.opens.push(options); };\n${await readFile(workerPath, "utf8")}`,
);
const context = await chromium.launchPersistentContext(
  resolve(temporary, "profile"),
  {
    channel: "chromium",
    headless: true,
    ...(process.env.BLITZREELS_CHROMIUM_PATH
      ? { executablePath: process.env.BLITZREELS_CHROMIUM_PATH }
      : {}),
    args: [
      `--disable-extensions-except=${extension}`,
      `--load-extension=${extension}`,
    ],
    viewport: { width: 1280, height: 800 },
  },
);
context.setDefaultTimeout(10000);
const worker =
  context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
const errors = [];
const checks = [
  "Manifest V3, least privilege, isolated world and local-only CSP",
];
context.on("page", (page) =>
  page.on("pageerror", (error) => errors.push(error.message)),
);
const fixture = `<!doctype html><html lang="en"><head><title>Me at the zoo - YouTube</title><style>html{font-size:10px}body{margin:0;padding:48px;background:#fff;color:#0f0f0f;font:16px Arial}html[dark] body{background:#0f0f0f;color:#f1f1f1}h1{font-size:24px}ytd-watch-metadata{display:block;max-width:1000px}#top-level-buttons-computed{display:flex;align-items:center}button{height:40px;margin-right:8px;padding:0 16px;border:0;border-radius:999px;background:rgba(0,0,0,.05);font:500 14px Roboto,Arial,sans-serif}html[dark] button{background:rgba(255,255,255,.1);color:#f1f1f1}.player{height:420px;background:#181818;margin-bottom:24px;display:flex;align-items:center;justify-content:center;color:#aaa}.fixture-note{color:#767676;font-size:12px;margin-top:36px}ytd-reel-video-renderer{display:block}[hidden]{display:none!important}</style></head><body><main><div id="movie_player" class="player"><video></video>YouTube layout fixture</div><script>const video = document.querySelector("video"); Object.defineProperty(video, "duration", {value: 120, configurable: true}); Object.defineProperty(video, "currentTime", {value: 32, configurable: true});</script><ytd-watch-metadata><h1>Me at the zoo</h1><div id="actions"><div id="menu"><div id="top-level-buttons-computed"><button>Like</button><button>Share</button></div></div></div></ytd-watch-metadata><p class="fixture-note">Local fixture for extension checks.</p></main></body></html>`;

async function check({ name, run }) {
  await run();
  checks.push(name);
  console.log(`PASS: ${name}`);
}
async function expectVideo({ page, id }) {
  await page.waitForFunction((expected) => {
    const link = document
      .getElementById("blitzreels-youtube-action")
      ?.shadowRoot?.querySelector("button");
    return link && link.dataset.videoId === expected;
  }, id);
  assert.equal(await page.locator("#blitzreels-youtube-action").count(), 1);
}
async function navigate({ page, path, event }) {
  await page.evaluate(
    ({ path, event }) => {
      history.pushState({}, "", path);
      if (event) document.dispatchEvent(new Event("yt-navigate-finish"));
    },
    { path, event },
  );
}
async function audit({ page, selector }) {
  const results = await new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  assert.deepEqual(
    results.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map(({ target }) => target),
    })),
    [],
  );
}
try {
  await context.route("https://www.youtube.com/**", (route) =>
    route.fulfill({ contentType: "text/html", body: fixture }),
  );
  await context.route("https://blitzreels.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<title>Handoff receiver fixture</title>",
    }),
  );
  const page = await context.newPage();
  const action = page.locator("#blitzreels-youtube-action button");
  await check({
    name: "Direct video load, native sizing and accessible light theme",
    run: async () => {
      await page.goto("https://www.youtube.com/watch?v=jNQXAC9IVRw");
      await expectVideo({ page, id: "jNQXAC9IVRw" });
      const styles = await action.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          height: style.height,
          radius: style.borderRadius,
          font: style.fontSize,
          family: style.fontFamily,
          fill: style.backgroundColor,
        };
      });
      assert.deepEqual(styles, {
        height: "40px",
        radius: "999px",
        font: "14px",
        family: "Roboto, Arial, sans-serif",
        fill: "rgba(0, 0, 0, 0.05)",
      });
      await audit({ page, selector: "#blitzreels-youtube-action" });
      await page.screenshot({
        path: resolve(screenshots, "youtube-fixture-light.png"),
      });
    },
  });
  await check({
    name: "Normal refresh and cache-bypassing refresh",
    run: async () => {
      await page.reload();
      await expectVideo({ page, id: "jNQXAC9IVRw" });
      const session = await context.newCDPSession(page);
      await session.send("Network.setCacheDisabled", { cacheDisabled: true });
      await page.reload();
      await expectVideo({ page, id: "jNQXAC9IVRw" });
      await session.detach();
    },
  });
  await check({
    name: "WXT invalidation cleans up the host, listeners and pending work",
    run: async () => {
      await page.evaluate((id) => {
        document.dispatchEvent(
          new CustomEvent(`${id}:youtube:wxt:content-script-started`, {
            detail: {
              contentScriptName: "youtube",
              messageId: "replacement-test",
            },
          }),
        );
        document.body.append(document.createElement("div"));
        document.dispatchEvent(new Event("yt-navigate-finish"));
      }, extensionId);
      await action.waitFor({ state: "detached" });
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
          }),
      );
      assert.equal(await action.count(), 0);
      await page.reload();
      await expectVideo({ page, id: "jNQXAC9IVRw" });
    },
  });
  await check({
    name: "Live dark theme, hover, keyboard focus and reduced motion",
    run: async () => {
      await page.evaluate(() =>
        document.documentElement.setAttribute("dark", ""),
      );
      await page.waitForFunction(() => {
        const link = document
          .getElementById("blitzreels-youtube-action")
          ?.shadowRoot?.querySelector("button");
        return (
          link &&
          getComputedStyle(link).backgroundColor === "rgba(255, 255, 255, 0.1)"
        );
      });
      await audit({ page, selector: "#blitzreels-youtube-action" });
      await page.screenshot({
        path: resolve(screenshots, "youtube-fixture-dark.png"),
      });
      await action.screenshot({
        path: resolve(screenshots, "youtube-pill-dark.png"),
      });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await action.hover();
      assert.equal(
        await action.evaluate(
          (element) => getComputedStyle(element).backgroundColor,
        ),
        "rgba(255, 255, 255, 0.2)",
      );
      assert.equal(
        await action.evaluate(
          (element) => getComputedStyle(element).transitionDuration,
        ),
        "0s",
      );
      await page.getByRole("button", { name: "Share", exact: true }).focus();
      await page.keyboard.press("Tab");
      assert.equal(
        await action.evaluate((element) => element.matches(":focus-visible")),
        true,
      );
      assert.equal(
        await action.evaluate(
          (element) => getComputedStyle(element).outlineWidth,
        ),
        "2px",
      );
      await page.keyboard.press("Enter");
      await worker.evaluate(async () => {
        for (
          let attempt = 0;
          attempt < 100 && !globalThis.blitzTest.opens.length;
          attempt++
        )
          await new Promise((resolve) => setTimeout(resolve, 20));
      });
      await page.waitForFunction(
        () =>
          !document
            .querySelector("#blitzreels-youtube-action")
            ?.shadowRoot?.querySelector("button")
            ?.title.includes("toolbar"),
      );
      assert.equal(
        await worker.evaluate(() => globalThis.blitzTest.opens.length),
        1,
      );
    },
  });
  await check({
    name: "SPA video navigation, browser back/forward and event-free history",
    run: async () => {
      await navigate({ page, path: "/watch?v=dQw4w9WgXcQ", event: true });
      await expectVideo({ page, id: "dQw4w9WgXcQ" });
      await page.goBack();
      await expectVideo({ page, id: "jNQXAC9IVRw" });
      await page.goForward();
      await expectVideo({ page, id: "dQw4w9WgXcQ" });
      await navigate({ page, path: "/watch?v=jNQXAC9IVRw", event: false });
      await expectVideo({ page, id: "jNQXAC9IVRw" });
    },
  });
  await check({
    name: "Repeated events, removed host and replaced action rail",
    run: async () => {
      await page.evaluate(() => {
        for (let index = 0; index < 30; index++)
          document.dispatchEvent(new Event("yt-navigate-finish"));
        document.getElementById("blitzreels-youtube-action")?.remove();
      });
      await expectVideo({ page, id: "jNQXAC9IVRw" });
      await page.evaluate(() => {
        const menu = document.getElementById("top-level-buttons-computed");
        menu.replaceWith(menu.cloneNode(false));
      });
      await expectVideo({ page, id: "jNQXAC9IVRw" });
    },
  });
  await check({
    name: "Unsupported pages, home-to-video and late action rail",
    run: async () => {
      await page.goto("https://www.youtube.com/");
      assert.equal(await action.count(), 0);
      await page.evaluate(() =>
        document.querySelector("ytd-watch-metadata").setAttribute("hidden", ""),
      );
      await navigate({ page, path: "/watch?v=dQw4w9WgXcQ", event: true });
      assert.equal(await action.count(), 0);
      await page.evaluate(() =>
        document.querySelector("ytd-watch-metadata").removeAttribute("hidden"),
      );
      await expectVideo({ page, id: "dQw4w9WgXcQ" });
      await navigate({
        page,
        path: "/results?search_query=blitzreels",
        event: true,
      });
      await action.waitFor({ state: "detached" });
    },
  });
  await check({
    name: "Shorts layout, active rail replacement and accessible control",
    run: async () => {
      await page.evaluate(() => {
        document.body.innerHTML =
          '<main><ytd-reel-video-renderer id="first" is-active><div id="actions"></div></ytd-reel-video-renderer><ytd-reel-video-renderer id="second"><div id="actions"></div></ytd-reel-video-renderer></main>';
      });
      await navigate({ page, path: "/shorts/jNQXAC9IVRw", event: true });
      await expectVideo({ page, id: "jNQXAC9IVRw" });
      assert.equal(await action.innerText(), "Save");
      assert.equal(
        await page
          .locator(".youtube-clip__icon")
          .evaluate((element) => element.getBoundingClientRect().width),
        48,
      );
      await audit({ page, selector: "#blitzreels-youtube-action" });
      await page.evaluate(() => {
        document.getElementById("first").removeAttribute("is-active");
        document.getElementById("second").setAttribute("is-active", "");
      });
      await page.locator("#second #blitzreels-youtube-action button").waitFor();
      await navigate({ page, path: "/shorts/dQw4w9WgXcQ", event: true });
      await expectVideo({ page, id: "dQw4w9WgXcQ" });
    },
  });

  await check({
    name: "Save, search, copy, remove, undo and reopen the popup with a real extension store",
    run: async () => {
      await page.goto("https://www.youtube.com/watch?v=jNQXAC9IVRw");
      await expectVideo({ page, id: "jNQXAC9IVRw" });
      await action.click();
      await worker.evaluate(async () => {
        while (!globalThis.blitzTest.tabId)
          await new Promise((resolve) => setTimeout(resolve, 20));
      });
      const tabId = await worker.evaluate(() => globalThis.blitzTest.tabId);
      const popup = await context.newPage();
      await popup.addInitScript(
        ({ tabId }) => {
          chrome.tabs.query = async () => [{ id: tabId }];
          Object.defineProperty(navigator.clipboard, "writeText", {
            value: async (text) => {
              globalThis.copiedLink = text;
            },
          });
        },
        { tabId },
      );
      await popup.setViewportSize({ width: 380, height: 600 });
      await popup.goto(`chrome-extension://${extensionId}/popup.html`);
      await popup
        .getByRole("button", { name: "Save moment", exact: true })
        .waitFor()
        .catch(async (error) => {
          console.log(
            "POPUP DEBUG",
            await popup.locator("body").innerText(),
            errors,
          );
          console.log(
            "SOURCE DEBUG",
            await worker.evaluate(
              async (id) => ({
                tabs: await chrome.tabs.query({}),
                source: await chrome.tabs.sendMessage(id, {
                  type: "read-selection",
                }),
              }),
              tabId,
            ),
          );
          throw error;
        });
      assert.equal(
        await popup.getByLabel("Start", { exact: true }).inputValue(),
        "0:32",
      );
      await popup.getByLabel("End (optional)").fill("0:20");
      await popup
        .getByRole("button", { name: "Save moment", exact: true })
        .click();
      await popup
        .getByRole("alert")
        .filter({ hasText: "End time must be after" })
        .waitFor();
      await popup.getByLabel("End (optional)").fill("0:45");
      await popup
        .getByLabel("Note (optional)")
        .fill("Test note about elephants");
      await popup
        .getByRole("button", { name: "Save moment", exact: true })
        .click();
      await popup.getByText("Moment saved", { exact: true }).waitFor();
      await popup.locator(".blitz-moments li").waitFor();
      assert.equal(await popup.locator(".blitz-moments li").count(), 1);
      await popup
        .getByRole("button", { name: "Copy link", exact: true })
        .click();
      await popup.getByText("Link copied", { exact: true }).waitFor();
      assert.equal(
        await popup.evaluate(() => globalThis.copiedLink),
        "https://www.youtube.com/watch?v=jNQXAC9IVRw&t=32s",
      );
      const appUrl = new URL(
        await popup
          .getByRole("link", { name: "Open BlitzReels" })
          .getAttribute("href"),
      );
      assert.equal(appUrl.pathname, "/");
      assert.ok(
        [...appUrl.searchParams.keys()].every((key) => key.startsWith("utm_")),
      );
      await popup.getByLabel("Search saved moments").fill("missing");
      await popup.getByText("No moments match your search.").waitFor();
      await popup.getByLabel("Search saved moments").fill("ELEPHANTS");
      assert.equal(await popup.locator(".blitz-moments li").count(), 1);
      await popup.getByLabel("Search saved moments").fill("");
      for (const theme of ["dark", "light"]) {
        await popup.emulateMedia({ colorScheme: theme });
        await popup.waitForFunction(
          (value) => document.querySelector("main").dataset.theme === value,
          theme,
        );
        await audit({ page: popup, selector: "main" });
        await popup.screenshot({
          path: resolve(screenshots, `moments-${theme}.png`),
        });
      }
      await popup.reload();
      await popup.locator(".blitz-moments li").waitFor();
      await popup
        .getByRole("button", { name: "Remove moment at 0:32" })
        .click();
      await popup.getByText("Moment removed", { exact: true }).waitFor();
      assert.equal(await popup.locator(".blitz-moments li").count(), 0);
      await popup.getByRole("button", { name: "Undo", exact: true }).click();
      await popup.locator(".blitz-moments li").waitFor();
      await page.evaluate(() =>
        document.querySelector("video").setAttribute("data-fixture-time", "66"),
      );
      await popup.getByRole("button", { name: "Use current time" }).click();
      await popup.waitForFunction(
        () => document.querySelector("input[required]").value === "1:06",
      );
      await page.evaluate(() =>
        document.querySelector("#movie_player").classList.add("ad-showing"),
      );
      await popup.reload();
      await popup
        .getByText("Keep the moments you like", { exact: true })
        .waitFor();
      assert.equal(
        await popup
          .getByRole("button", { name: "Save moment", exact: true })
          .count(),
        0,
      );
      await page.evaluate(() => {
        document.querySelector("#movie_player").classList.remove("ad-showing");
        document
          .querySelector("video")
          .setAttribute("data-fixture-duration", "Infinity");
      });
      await popup.reload();
      await popup
        .getByText("Keep the moments you like", { exact: true })
        .waitFor();
      assert.equal(
        await popup
          .getByRole("button", { name: "Save moment", exact: true })
          .count(),
        0,
      );
      await page.goto("https://www.youtube.com/");
      await popup.reload();
      await popup
        .getByText("Keep the moments you like", { exact: true })
        .waitFor();
      assert.equal(await popup.locator(".blitz-moments li").count(), 1);
      assert.equal(
        await popup
          .getByRole("button", { name: "Save moment", exact: true })
          .count(),
        0,
      );
      await audit({ page: popup, selector: "main" });
      await page.goto("https://www.youtube.com/watch?v=jNQXAC9IVRw");
      await expectVideo({ page, id: "jNQXAC9IVRw" });
      const probe = await worker.evaluate(
        async (tabId) =>
          chrome.tabs.sendMessage(tabId, { type: "fixture-security-probe" }),
        tabId,
      );
      assert.deepEqual(probe.blocked, [true, true, true]);
      await popup.close();
    },
  });
  assert.deepEqual(errors, []);
  checks.push("No browser runtime errors");
  await writeFile(
    resolve(artifacts, "verification.json"),
    `${JSON.stringify({ verifiedAt: new Date().toISOString(), version: manifest.version, artifactHash: await artifactHash(resolve(project, "dist")), framework: "WXT", environment: "temporary Chromium profile; YouTube layout fixture; native popup opening and active tab mocked for automation", checks, errors }, null, 2)}\n`,
  );
} finally {
  await context.close();
  await rm(temporary, { recursive: true, force: true });
}
