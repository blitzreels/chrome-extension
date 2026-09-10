import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import { createController } from "../src/background/controller";
import { store } from "../src/background/store";
import { isPopupSender, popupMessageSchema } from "../src/contracts";
import { parseVideo } from "../src/video";

export default defineBackground(() => {
  const controller = createController({ store });
  browser.runtime.onMessage.addListener((message: unknown, sender, respond) => {
    if (sender.id !== browser.runtime.id) return false;
    if (
      isPopupSender({
        senderUrl: sender.url,
        extensionOrigin: browser.runtime.getURL("/"),
      })
    ) {
      const parsed = popupMessageSchema.safeParse(message);
      if (!parsed.success) return false;
      void controller.dispatch(parsed.data).then(
        (state) => respond({ ok: true, state }),
        (error: unknown) =>
          respond({
            ok: false,
            error: error instanceof Error ? error.message : "Please try again.",
          }),
      );
      return true;
    }
    if (
      typeof message !== "object" ||
      message === null ||
      !("type" in message) ||
      message.type !== "open-popup" ||
      sender.frameId !== 0 ||
      sender.tab?.id === undefined ||
      !parseVideo(sender.url ?? "")
    )
      return false;
    void browser.action.openPopup({ windowId: sender.tab.windowId }).then(
      () => respond({ ok: true }),
      () => respond({ ok: false }),
    );
    return true;
  });
});
