import { defineContentScript } from "wxt/utils/define-content-script";
import { mountYoutubeAction } from "../src/youtube/mount-action";
import "../src/youtube/action.css";

export default defineContentScript({
  matches: ["https://www.youtube.com/*", "https://youtube.com/*"],
  runAt: "document_idle",
  allFrames: false,
  world: "ISOLATED",
  noScriptStartedPostMessage: true,
  cssInjectionMode: "ui",
  main: mountYoutubeAction,
});
