import type { Video } from "../video";

export function findActionAnchor(video: Video): HTMLElement | null {
  const selector = video.isShort
    ? "ytd-reel-video-renderer[is-active] #actions"
    : "ytd-watch-metadata #top-level-buttons-computed";
  return (
    [...document.querySelectorAll<HTMLElement>(selector)].find(
      (element) =>
        !element.closest('[hidden], [aria-hidden="true"]') &&
        element.getClientRects().length > 0,
    ) ?? null
  );
}
