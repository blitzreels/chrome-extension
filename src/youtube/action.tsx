import { Logo } from "../components/logo";
import type { Video } from "../video";

export function YoutubeAction({
  video,
  onActivate,
}: {
  video: Video;
  onActivate: () => void;
}) {
  return (
    <button
      type="button"
      data-video-id={video.id}
      onClick={onActivate}
      aria-label="Save a moment in BlitzReels (opens the extension popup)"
      title="Save a moment in BlitzReels"
      className={`youtube-clip${video.isShort ? " youtube-clip--shorts" : ""}`}
    >
      <span className="youtube-clip__icon">
        <Logo />
      </span>
      <span>{video.isShort ? "Save" : "Save in BlitzReels"}</span>
    </button>
  );
}
