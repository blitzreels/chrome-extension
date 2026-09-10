import assert from "node:assert/strict";
import { test } from "node:test";
import { parseVideo } from "../src/video";

test("watch URLs discard playlists and tracking", () => {
  assert.deepEqual(
    parseVideo(
      "https://www.youtube.com/watch?v=jNQXAC9IVRw&list=private-list&t=60",
    ),
    {
      id: "jNQXAC9IVRw",
      url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
      isShort: false,
    },
  );
});

test("Shorts normalize to the original watch URL", () => {
  assert.deepEqual(
    parseVideo("https://www.youtube.com/shorts/jNQXAC9IVRw?feature=share"),
    {
      id: "jNQXAC9IVRw",
      url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
      isShort: true,
    },
  );
});

test("unsupported pages and hostile URLs cannot become moments", () => {
  for (const value of [
    "",
    "javascript:alert(1)",
    "https://www.youtube.com/",
    "https://www.youtube.com/results?search_query=test",
    "https://youtube.com.evil.test/watch?v=jNQXAC9IVRw",
    "http://youtube.com/watch?v=jNQXAC9IVRw",
    "https://youtube.com:444/watch?v=jNQXAC9IVRw",
    "https://attacker@youtube.com/watch?v=jNQXAC9IVRw",
    "https://youtube.com/watch?v=invalid",
    "https://youtube.com/shorts/jNQXAC9IVRw/extra",
  ]) {
    assert.equal(parseVideo(value), null, value);
  }
});
