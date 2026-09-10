import { createRoot } from "react-dom/client";
import { browser } from "wxt/browser";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root";
import { parseVideo } from "../video";
import { YoutubeAction } from "./action";
import { findActionAnchor } from "./anchor";
import { readSelection } from "./read-selection";

export async function mountYoutubeAction(ctx: ContentScriptContext) {
  let anchor: HTMLElement | null = null;
  let renderedUrl = "";
  let frame: number | null = null;
  const ui = await createShadowRootUi(ctx, {
    name: "blitzreels-youtube-action",
    position: "inline",
    inheritStyles: true,
    anchor: () => anchor,
    isolateEvents: true,
    onMount: (container) => createRoot(container),
    onRemove: (root) => root?.unmount(),
  });
  if (ctx.isInvalid) return;
  const onMessage: Parameters<typeof browser.runtime.onMessage.addListener>[0] =
    (message, sender, respond) => {
      if (
        sender.id !== browser.runtime.id ||
        sender.tab ||
        message?.type !== "read-selection"
      )
        return false;
      respond(readSelection());
      return false;
    };
  browser.runtime.onMessage.addListener(onMessage);
  ctx.onInvalidated(() => browser.runtime.onMessage.removeListener(onMessage));
  ui.shadowHost.id = "blitzreels-youtube-action";

  function reconcile() {
    frame = null;
    if (ctx.isInvalid) return;
    const video = parseVideo(location.href);
    anchor = video ? findActionAnchor(video) : null;
    if (!video || !anchor) {
      if (ui.mounted) ui.remove();
      renderedUrl = "";
      return;
    }
    if (!ui.shadowHost.isConnected || ui.shadowHost.parentElement !== anchor) {
      ui.remove();
      ui.mount();
      renderedUrl = "";
    }
    const key = `${video.id}:${video.isShort}`;
    if (renderedUrl === key) return;
    ui.shadowHost.dataset.layout = video.isShort ? "shorts" : "watch";
    ui.mounted?.render(<YoutubeAction video={video} onActivate={openPopup} />);
    renderedUrl = key;
  }

  function schedule() {
    if (frame === null && ctx.isValid) frame = requestAnimationFrame(reconcile);
  }

  function syncTheme() {
    ui.uiContainer.dataset.theme = document.documentElement.hasAttribute("dark")
      ? "dark"
      : "light";
  }

  const observer = new MutationObserver(() => {
    syncTheme();
    schedule();
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["is-active", "hidden", "aria-hidden", "dark"],
  });
  ctx.addEventListener(document, "yt-navigate-finish", schedule);
  ctx.addEventListener(document, "yt-page-data-updated", schedule);
  ctx.addEventListener(window, "wxt:locationchange", schedule);
  ctx.addEventListener(window, "pageshow", schedule);
  ctx.addEventListener(window, "resize", schedule);
  ctx.onInvalidated(() => {
    observer.disconnect();
    if (frame !== null) cancelAnimationFrame(frame);
  });

  function openPopup() {
    const video = parseVideo(location.href);
    if (!video) {
      schedule();
      return;
    }
    void browser.runtime
      .sendMessage({
        type: "open-popup",
      })
      .then((reply: { ok: boolean } | undefined) => {
        if (!reply?.ok) showOpenError();
      })
      .catch(showOpenError);
  }

  function showOpenError() {
    const button = ui.shadow.querySelector("button");
    if (button) {
      button.title = "Open BlitzReels from the Chrome toolbar to continue.";
      button.setAttribute("aria-label", button.title);
    }
  }

  syncTheme();
  reconcile();
}
