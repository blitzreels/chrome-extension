import { browser } from "wxt/browser";
import { initialState, type Snapshot, snapshotSchema } from "../contracts";

const ready = browser.storage.local
  .setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" })
  .then(() =>
    browser.storage.local.remove([
      "credentials",
      "oauthClientId",
      "accountId",
      "state",
    ]),
  );
export const store = {
  async read(): Promise<Snapshot> {
    await ready;
    const data = await browser.storage.local.get("moments");
    if (data.moments === undefined) return initialState;
    const result = snapshotSchema.safeParse({ moments: data.moments });
    if (!result.success)
      throw new Error(
        "Your saved moments could not be read. They have not been changed.",
      );
    return result.data;
  },
  async write(value: Snapshot) {
    await ready;
    await browser.storage.local.set({ moments: value.moments });
  },
};
