import assert from "node:assert/strict";
import { test } from "node:test";
import { createController } from "../src/background/controller";
import {
  draftSchema,
  isPopupSender,
  MAX_MOMENTS,
  momentSchema,
  popupMessageSchema,
  type Snapshot,
} from "../src/contracts";
import {
  filterMoments,
  formatTime,
  momentLink,
  parseTime,
} from "../src/moments";
import { parseVideo } from "../src/video";

const video = parseVideo("https://www.youtube.com/watch?v=jNQXAC9IVRw");
assert.ok(video);
const draft = draftSchema.parse({
  video,
  title: "Me at the zoo",
  start: 4,
  end: 12,
  note: "The elephants",
});
function setup() {
  let value: Snapshot = { moments: [] };
  const store = {
    read: async () => structuredClone(value),
    write: async (next: Snapshot) => {
      value = structuredClone(next);
    },
  };
  return { controller: createController({ store }), store };
}
test("timestamps accept seconds, minutes and hours, and reject ambiguous input", () => {
  for (const value of [0, 59, 60, 3599, 3600, 604800])
    assert.equal(parseTime(formatTime(value)), value);
  assert.equal(parseTime("90"), 90);
  for (const value of ["", "1:90", "-1", "NaN", "1.5", "1:2", "604801"])
    assert.equal(parseTime(value), null);
});
test("moments validate ranges, bounds, notes and sources", () => {
  assert.equal(draftSchema.safeParse({ ...draft, end: 4 }).success, false);
  assert.equal(draftSchema.safeParse({ ...draft, end: null }).success, true);
  assert.equal(
    draftSchema.safeParse({ ...draft, start: Infinity }).success,
    false,
  );
  assert.equal(
    draftSchema.safeParse({ ...draft, note: "x".repeat(2001) }).success,
    false,
  );
  assert.equal(
    momentSchema.safeParse({
      ...draft,
      end: 2,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }).success,
    false,
  );
});
test("links point to the original video at the start time and never promise an end trim", () => {
  assert.equal(
    momentLink(draft),
    "https://www.youtube.com/watch?v=jNQXAC9IVRw&t=4s",
  );
});
test("serialized saves survive controller restarts and deduplicate retries", async () => {
  const { controller, store } = setup();
  await Promise.all([
    controller.dispatch({ type: "save-moment", draft }),
    controller.dispatch({ type: "save-moment", draft: { ...draft, start: 5 } }),
    controller.dispatch({ type: "save-moment", draft }),
  ]);
  const fresh = createController({ store });
  const state = await fresh.dispatch({ type: "snapshot" });
  assert.equal(state.moments.length, 2);
  assert.deepEqual(state.moments.map((m) => m.start).sort(), [4, 5]);
});
test("remove and undo preserve the original saved moment", async () => {
  const { controller } = setup();
  const saved = await controller.dispatch({ type: "save-moment", draft });
  const moment = saved.moments[0];
  assert.ok(moment);
  assert.equal(
    (await controller.dispatch({ type: "remove-moment", id: moment.id }))
      .moments.length,
    0,
  );
  assert.deepEqual(
    (await controller.dispatch({ type: "restore-moment", moment })).moments,
    [moment],
  );
});
test("quota failures never report a saved moment and the queue remains usable", async () => {
  const { store } = setup();
  let fail = true;
  const controller = createController({
    store: {
      ...store,
      write: async (next) => {
        if (fail) throw new Error("QUOTA_BYTES");
        await store.write(next);
      },
    },
  });
  await assert.rejects(
    controller.dispatch({ type: "save-moment", draft }),
    /could not save/,
  );
  assert.equal((await store.read()).moments.length, 0);
  fail = false;
  assert.equal(
    (await controller.dispatch({ type: "save-moment", draft })).moments.length,
    1,
  );
});
test("full library keeps existing moments and remains removable", async () => {
  const { controller, store } = setup();
  await store.write({
    moments: Array.from({ length: MAX_MOMENTS }, (_, start) => ({
      ...draft,
      start,
      end: null,
      id: crypto.randomUUID(),
      createdAt: start,
    })),
  });
  await assert.rejects(
    controller.dispatch({
      type: "save-moment",
      draft: { ...draft, note: "new" },
    }),
    /library is full/,
  );
  assert.equal((await store.read()).moments.length, MAX_MOMENTS);
});
test("search finds notes and titles without changing the library", () => {
  const moments = [{ ...draft, id: crypto.randomUUID(), createdAt: 0 }];
  assert.equal(filterMoments({ moments, query: " ELEPHANTS " }).length, 1);
  assert.equal(filterMoments({ moments, query: "zoo" }).length, 1);
  assert.equal(filterMoments({ moments, query: "missing" }).length, 0);
});
test("only the packaged popup can issue library commands, old clip commands are rejected", () => {
  const extensionOrigin = "chrome-extension://extension/";
  assert.equal(
    isPopupSender({
      extensionOrigin,
      senderUrl: `${extensionOrigin}popup.html`,
    }),
    true,
  );
  for (const senderUrl of [
    "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    `${extensionOrigin}popup.html?fake=1`,
    undefined,
  ])
    assert.equal(isPopupSender({ extensionOrigin, senderUrl }), false);
  for (const type of ["create-clips", "download", "sign-in", "retry-create"])
    assert.equal(popupMessageSchema.safeParse({ type }).success, false);
});
