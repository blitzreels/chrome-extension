import type { Selection } from "../contracts";
import { parseVideo } from "../video";

export function readSelection(): Selection | null {
  const video = parseVideo(location.href);
  if (!video) return null;
  const scope = video.isShort
    ? document.querySelector("ytd-reel-video-renderer[is-active]")
    : document.querySelector("#movie_player");
  if (
    scope?.matches(".ad-showing, [is-ad]") ||
    scope?.querySelector(".ad-showing, [is-ad]")
  )
    return null;
  const player = scope?.querySelector("video");
  if (
    !player ||
    !Number.isFinite(player.duration) ||
    player.duration <= 0 ||
    player.duration > 604800
  )
    return null;
  const title = video.isShort
    ? document.title.replace(/ - YouTube$/, "")
    : (document.querySelector("ytd-watch-metadata h1")?.textContent ??
      document.title.replace(/ - YouTube$/, ""));
  return {
    video,
    title: title.trim().slice(0, 500),
    seconds: Math.floor(
      Math.max(0, Math.min(player.currentTime, player.duration)),
    ),
    duration: Math.floor(player.duration),
  };
}
