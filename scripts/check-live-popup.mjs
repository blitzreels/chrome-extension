import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { artifactHash } from "./artifact-hash.mjs";

const videoUrl = process.argv[2];
if (!videoUrl) throw new Error("Pass the YouTube video URL to verify.");
const extension = resolve(import.meta.dirname, "../dist");
const artifacts = resolve(import.meta.dirname, "../artifacts");
const profile = await mkdtemp(resolve(tmpdir(), "blitzreels-popup-live-"));
const manifest = JSON.parse(
  await readFile(resolve(extension, "manifest.json"), "utf8"),
);
await mkdir(artifacts, { recursive: true });
const context = await chromium.launchPersistentContext(profile, {
  headless: false,
  ...(process.env.BLITZREELS_CHROMIUM_PATH
    ? { executablePath: process.env.BLITZREELS_CHROMIUM_PATH }
    : {}),
  args: [
    `--disable-extensions-except=${extension}`,
    `--load-extension=${extension}`,
  ],
  viewport: { width: 1280, height: 800 },
});
try {
  const worker =
    context.serviceWorkers()[0] ??
    (await context.waitForEvent("serviceworker"));
  const page = await context.newPage();
  await page.goto(videoUrl, { waitUntil: "domcontentloaded" });
  const action = page.locator("#blitzreels-youtube-action button");
  await action.waitFor({ timeout: 45000 });
  const rejectCookies = page
    .locator("ytd-consent-bump-v2-lightbox")
    .getByText(/^(Reject all|Tout refuser)$/, { exact: true });
  await rejectCookies
    .waitFor({ state: "visible", timeout: 10000 })
    .catch(() => undefined);
  if (await rejectCookies.isVisible()) await rejectCookies.click();
  await page.waitForFunction(
    () => {
      const player = document.querySelector("#movie_player");
      const video = player?.querySelector("video");
      return (
        video &&
        Number.isFinite(video.duration) &&
        video.duration > 0 &&
        !player.classList.contains("ad-showing")
      );
    },
    undefined,
    { timeout: 45000 },
  );
  await page.evaluate(() => {
    const video = document.querySelector("#movie_player video");
    video.currentTime = Math.min(32, Math.floor(video.duration) - 1);
  });
  await page.bringToFront();
  await action.click();
  let popup;
  for (let attempt = 0; attempt < 100; attempt++) {
    [popup] = await worker.evaluate(() =>
      chrome.runtime.getContexts({ contextTypes: ["POPUP"] }),
    );
    if (popup) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(
    popup,
    "The YouTube button must open a native Chrome POPUP context",
  );
  assert.ok(popup.documentUrl.endsWith("/popup.html"));
  assert.equal(
    (
      await worker.evaluate(() =>
        chrome.runtime.getContexts({ contextTypes: ["SIDE_PANEL"] }),
      )
    ).length,
    0,
  );
  const session = await context.newCDPSession(page);
  const { targetInfos } = await session.send("Target.getTargets");
  const target = targetInfos.find((target) => target.url === popup.documentUrl);
  assert.ok(target);
  let { sessionId } = await session.send("Target.attachToTarget", {
    targetId: target.targetId,
    flatten: false,
  });
  let requestId = 0;
  async function popupCommand({ method, params }) {
    const id = ++requestId;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        session.off("Target.receivedMessageFromTarget", receive);
        reject(new Error(`Popup command timed out: ${method}`));
      }, 20000);
      function receive(event) {
        if (event.sessionId !== sessionId) return;
        const response = JSON.parse(event.message);
        if (response.id !== id) return;
        clearTimeout(timeout);
        session.off("Target.receivedMessageFromTarget", receive);
        if (response.error) reject(new Error(response.error.message));
        else resolve(response.result);
      }
      session.on("Target.receivedMessageFromTarget", receive);
      void session
        .send("Target.sendMessageToTarget", {
          sessionId,
          message: JSON.stringify({ id, method, params }),
        })
        .catch((error) => {
          clearTimeout(timeout);
          session.off("Target.receivedMessageFromTarget", receive);
          reject(error);
        });
    });
  }
  async function inspectPopup() {
    await document.fonts.ready;
    for (let attempt = 0; attempt < 150; attempt++) {
      const image = document.querySelector(".blitz-source-thumbnail");
      if (image?.complete && image.naturalWidth > 0) {
        return {
          width: innerWidth,
          height: innerHeight,
          title: document.querySelector(".blitz-video-title")?.textContent,
          thumbnail: image.src,
          imageLoaded: true,
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
          inventedProgress: document.querySelectorAll(".blitz-clips, progress")
            .length,
        };
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error("The real YouTube thumbnail did not load");
  }
  const evaluation = await popupCommand({
    method: "Runtime.evaluate",
    params: {
      expression: `(${inspectPopup.toString()})()`,
      awaitPromise: true,
      returnByValue: true,
    },
  });
  assert.equal(evaluation.exceptionDetails, undefined);
  const rendered = evaluation.result.value;
  assert.equal(rendered.width, 380);
  assert.ok(rendered.height <= 600);
  assert.equal(rendered.horizontalOverflow, false);
  assert.equal(rendered.inventedProgress, 0);
  const screenshot = await popupCommand({
    method: "Page.captureScreenshot",
    params: { format: "png" },
  });
  await writeFile(
    resolve(artifacts, "native-popup.png"),
    Buffer.from(screenshot.data, "base64"),
  );
  async function saveMoment() {
    const form = document.querySelector("form");
    if (!form) throw new Error("Moment form is missing");
    form.requestSubmit();
    for (let attempt = 0; attempt < 100; attempt++) {
      if (document.querySelector(".blitz-moments li")) return true;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error("The real moment was not saved");
  }
  const savedResult = await popupCommand({
    method: "Runtime.evaluate",
    params: {
      expression: `(${saveMoment.toString()})()`,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    },
  });
  assert.equal(savedResult.exceptionDetails, undefined);
  const savedState = await worker.evaluate(async () =>
    chrome.storage.local.get("moments"),
  );
  assert.equal(savedState.moments.length, 1);
  assert.equal(
    savedState.moments[0].video.id,
    new URL(videoUrl).searchParams.get("v"),
  );
  assert.equal(savedState.moments[0].title, rendered.title);
  assert.equal(savedState.moments[0].note, "");
  assert.ok(
    savedState.moments[0].start >= 30,
    "The real player timestamp must be saved",
  );
  await writeFile(
    resolve(artifacts, "live-moments.json"),
    `${JSON.stringify(savedState, null, 2)}\n`,
  );
  for (const theme of ["dark", "light"]) {
    await popupCommand({
      method: "Emulation.setEmulatedMedia",
      params: { features: [{ name: "prefers-color-scheme", value: theme }] },
    });
    await popupCommand({
      method: "Runtime.evaluate",
      params: {
        expression:
          "new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
        awaitPromise: true,
      },
    });
    const savedShot = await popupCommand({
      method: "Page.captureScreenshot",
      params: { format: "png" },
    });
    await writeFile(
      resolve(artifacts, `native-moments-${theme}.png`),
      Buffer.from(savedShot.data, "base64"),
    );
  }
  await session.send("Target.detachFromTarget", { sessionId });
  await page.bringToFront();
  await page.reload({ waitUntil: "domcontentloaded" });
  await action.waitFor();
  await action.click();
  let reopened;
  for (let attempt = 0; attempt < 100; attempt++) {
    [reopened] = await worker.evaluate(() =>
      chrome.runtime.getContexts({ contextTypes: ["POPUP"] }),
    );
    if (reopened && reopened.contextId !== popup.contextId) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(
    reopened && reopened.contextId !== popup.contextId,
    "Popup must reopen after YouTube refresh",
  );
  const reopenedTarget = (
    await session.send("Target.getTargets")
  ).targetInfos.find((item) => item.url === reopened.documentUrl);
  ({ sessionId } = await session.send("Target.attachToTarget", {
    targetId: reopenedTarget.targetId,
    flatten: false,
  }));
  async function checkRestored() {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (document.querySelector(".blitz-moments li")) return true;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return false;
  }
  const restored = await popupCommand({
    method: "Runtime.evaluate",
    params: {
      expression: `(${checkRestored.toString()})()`,
      awaitPromise: true,
      returnByValue: true,
    },
  });
  assert.equal(restored.result.value, true);
  assert.deepEqual(
    await worker.evaluate(async () => chrome.storage.local.get("moments")),
    savedState,
  );
  const receipt = {
    verifiedAt: new Date().toISOString(),
    version: manifest.version,
    source: videoUrl,
    title: await page.title(),
    contextType: popup.contextType,
    popupUrl: popup.documentUrl,
    rendered,
    evidence:
      "Unmodified production WXT build in a disposable headed Chrome profile; real YouTube button opens native toolbar popup",
    artifactHash: await artifactHash(extension),
    savedMomentVerified: true,
    persistenceAfterYoutubeRefreshAndPopupReopen: true,
  };
  await writeFile(
    resolve(artifacts, "live-popup-receipt.json"),
    `${JSON.stringify(receipt, null, 2)}\n`,
  );
  console.log(
    `Native popup verified: ${rendered.width} x ${rendered.height}; ${rendered.title}`,
  );
} finally {
  await context.close();
  await rm(profile, { recursive: true, force: true });
}
