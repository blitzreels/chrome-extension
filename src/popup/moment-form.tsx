import { useId, useState } from "react";
import { Button } from "../components/button";
import { draftSchema, type MomentDraft, type Selection } from "../contracts";
import { formatTime, parseTime } from "../moments";
import { VideoCard } from "./video-card";

export function MomentForm({
  selection,
  pending,
  capture,
  save,
}: {
  selection: Selection;
  pending: boolean;
  capture: () => Promise<Selection | null>;
  save: (draft: MomentDraft) => Promise<boolean>;
}) {
  const id = useId();
  const [start, setStart] = useState(formatTime(selection.seconds));
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  async function captureCurrentTime() {
    const current = await capture();
    if (!current || current.video.id !== selection.video.id) return;
    setStart(formatTime(current.seconds));
    if ((parseTime(end) ?? 0) <= current.seconds) setEnd("");
    setError(null);
  }
  async function submit() {
    const startSeconds = parseTime(start);
    const endSeconds = end.trim() ? parseTime(end) : null;
    if (startSeconds === null || (end.trim() && endSeconds === null)) {
      setError("Use a time like 1:30 or 1:02:30.");
      return;
    }
    if (
      selection.duration !== null &&
      (startSeconds > selection.duration ||
        (endSeconds !== null && endSeconds > selection.duration))
    ) {
      setError("Choose a time within this video.");
      return;
    }
    const parsed = draftSchema.safeParse({
      video: selection.video,
      title: selection.title,
      start: startSeconds,
      end: endSeconds,
      note,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the times and note.");
      return;
    }
    setError(null);
    await save(parsed.data);
  }
  return (
    <form
      className="blitz-form"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <VideoCard video={selection.video} title={selection.title} />
      <div className="blitz-times">
        <label htmlFor={`${id}-start`}>
          Start
          <input
            id={`${id}-start`}
            value={start}
            onChange={(event) => setStart(event.target.value)}
            maxLength={10}
            spellCheck={false}
            required
          />
        </label>
        <label htmlFor={`${id}-end`}>
          End <span>(optional)</span>
          <input
            id={`${id}-end`}
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            maxLength={10}
            placeholder="m:ss"
            spellCheck={false}
          />
        </label>
      </div>
      {end.trim() && (
        <p className="blitz-range-hint">
          The end time is for your notes. Links open at the start.
        </p>
      )}
      <Button
        variant="ghost"
        className="blitz-text-button"
        disabled={pending}
        onClick={() => void captureCurrentTime()}
      >
        Use current time
      </Button>
      <label htmlFor={`${id}-note`} className="blitz-note-label">
        Note <span>(optional)</span>
      </label>
      <textarea
        id={`${id}-note`}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={2000}
        rows={2}
        placeholder="What do you want to come back to?"
      />
      {error && (
        <p role="alert" className="blitz-feedback">
          {error}
        </p>
      )}
      <Button
        type="submit"
        variant="primary"
        className="blitz-primary"
        disabled={pending}
      >
        {pending ? "Saving..." : "Save moment"}
      </Button>
    </form>
  );
}
