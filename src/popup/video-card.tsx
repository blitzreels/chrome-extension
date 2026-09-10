import { Thumbnail } from "../components/thumbnail";
import type { Video } from "../video";

export function VideoCard({ video, title }: { video: Video; title: string }) {
  return (
    <div className="blitz-source">
      <Thumbnail
        key={video.id}
        src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
        className="blitz-source-thumbnail"
      />
      <div className="blitz-source-details">
        <p className="blitz-video-title">{title || "YouTube video"}</p>
      </div>
    </div>
  );
}
