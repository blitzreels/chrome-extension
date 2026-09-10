import assert from "node:assert/strict";
import { test } from "node:test";
import { appUrl } from "../src/app-links";

test("the optional app link carries attribution and no video or note", () => {
  const url = new URL(appUrl);
  assert.equal(url.origin, "https://blitzreels.com");
  assert.equal(url.pathname, "/");
  assert.deepEqual([...url.searchParams.keys()].sort(), [
    "utm_campaign",
    "utm_medium",
    "utm_source",
  ]);
});
