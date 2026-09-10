import { MAX_MOMENTS, type PopupMessage, type Snapshot } from "../contracts";
import { parseVideo } from "../video";

type MomentStore = {
  read: () => Promise<Snapshot>;
  write: (value: Snapshot) => Promise<void>;
};
export function createController({ store }: { store: MomentStore }) {
  let queue: Promise<unknown> = Promise.resolve();
  async function run(message: PopupMessage): Promise<Snapshot> {
    const state = await store.read();
    if (message.type === "snapshot") return state;
    let moments = state.moments;
    if (message.type === "remove-moment") {
      moments = moments.filter((moment) => moment.id !== message.id);
    } else {
      const moment =
        message.type === "restore-moment"
          ? message.moment
          : {
              ...message.draft,
              id: crypto.randomUUID(),
              createdAt: Date.now(),
            };
      const video = parseVideo(moment.video.url);
      if (!video) throw new Error("Open a YouTube video to save a moment.");
      const duplicate = moments.some(
        (saved) =>
          saved.id === moment.id ||
          (saved.video.id === video.id &&
            saved.start === moment.start &&
            saved.end === moment.end &&
            saved.note === moment.note),
      );
      if (duplicate) return state;
      if (moments.length >= MAX_MOMENTS)
        throw new Error(
          "Your library is full. Remove a moment before saving another.",
        );
      moments = [{ ...moment, video }, ...moments].sort(
        (a, b) => b.createdAt - a.createdAt,
      );
    }
    const next = { moments };
    try {
      await store.write(next);
    } catch {
      throw new Error(
        "Chrome could not save the change. Your saved moments have not been changed. Try again.",
      );
    }
    return next;
  }
  return {
    dispatch(message: PopupMessage): Promise<Snapshot> {
      const task = queue.then(() => run(message));
      queue = task.catch(() => undefined);
      return task;
    },
  };
}
