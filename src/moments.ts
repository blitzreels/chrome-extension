import type { Moment, MomentDraft } from "./contracts";
import { parseVideo } from "./video";

export function formatTime(seconds: number): string {
  const value = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const tail = String(value % 60).padStart(2, "0");
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${tail}`
    : `${minutes}:${tail}`;
}
export function parseTime(value: string): number | null {
  if (!/^\d{1,6}(:[0-5]\d){0,2}$/.test(value.trim())) return null;
  const seconds = value
    .trim()
    .split(":")
    .reduce((total, part) => total * 60 + Number(part), 0);
  return seconds <= 604800 ? seconds : null;
}
export function momentLink(moment: MomentDraft): string {
  const video = parseVideo(moment.video.url);
  if (!video) throw new Error("This video link is invalid.");
  const url = new URL(video.url);
  url.searchParams.set("t", `${moment.start}s`);
  return url.href;
}
export function momentText(moment: Moment): string {
  const range =
    moment.end === null
      ? formatTime(moment.start)
      : `${formatTime(moment.start)} - ${formatTime(moment.end)}`;
  return [moment.title, range, moment.note, momentLink(moment)]
    .filter(Boolean)
    .join("\n");
}
export function filterMoments({
  moments,
  query,
}: {
  moments: Moment[];
  query: string;
}): Moment[] {
  const search = query.trim().toLocaleLowerCase();
  return moments.filter((moment) =>
    `${moment.title} ${moment.note}`.toLocaleLowerCase().includes(search),
  );
}
