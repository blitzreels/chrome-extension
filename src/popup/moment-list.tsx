import { useId, useState } from "react";
import { Button } from "../components/button";
import { ExternalLink } from "../components/external-link";
import { Thumbnail } from "../components/thumbnail";
import type { Moment } from "../contracts";
import { filterMoments, formatTime, momentLink } from "../moments";

export function MomentList({
  moments,
  pending,
  copy,
  remove,
}: {
  moments: Moment[];
  pending: boolean;
  copy: (moment: Moment) => Promise<void>;
  remove: (id: string) => Promise<void>;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const filtered = filterMoments({ moments, query });
  return (
    <section className="blitz-library" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>
        Saved moments <span>{moments.length}</span>
      </h2>
      {moments.length > 0 && (
        <label className="blitz-search" htmlFor={`${id}-search`}>
          <span className="blitz-sr-only">Search saved moments</span>
          <input
            id={`${id}-search`}
            type="search"
            placeholder="Search titles and notes"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      )}
      {moments.length === 0 ? (
        <p className="blitz-note">
          Your timestamps and notes will appear here. Saved on this device.
        </p>
      ) : filtered.length === 0 ? (
        <p className="blitz-note">No moments match your search.</p>
      ) : (
        <ul className="blitz-moments">
          {filtered.map((moment) => (
            <li key={moment.id}>
              <div className="blitz-moment-heading">
                <Thumbnail
                  src={`https://i.ytimg.com/vi/${moment.video.id}/hqdefault.jpg`}
                  className="blitz-moment-thumbnail"
                />
                <div>
                  <p className="blitz-video-title">
                    {moment.title || "YouTube video"}
                  </p>
                  <p className="blitz-time-range">
                    {formatTime(moment.start)}
                    {moment.end !== null && ` - ${formatTime(moment.end)}`}
                  </p>
                </div>
              </div>
              {moment.note && (
                <p className="blitz-moment-note">{moment.note}</p>
              )}
              <div className="blitz-moment-actions">
                <ExternalLink
                  href={momentLink(moment)}
                  aria-label={`Open ${moment.title || "video"} at ${formatTime(moment.start)}`}
                >
                  Open at {formatTime(moment.start)}
                </ExternalLink>
                <Button
                  variant="ghost"
                  disabled={pending}
                  onClick={() => void copy(moment)}
                >
                  Copy link
                </Button>
                <Button
                  variant="ghost"
                  disabled={pending}
                  onClick={() => void remove(moment.id)}
                  aria-label={`Remove moment at ${formatTime(moment.start)}`}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
