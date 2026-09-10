import { useState } from "react";
import { Button } from "../components/button";
import { ExternalLink } from "../components/external-link";
import type { Moment, PopupMessage, Selection, Snapshot } from "../contracts";
import type { Theme } from "../design/theme";
import { MomentForm } from "./moment-form";
import { MomentList } from "./moment-list";
import { PopupLayout } from "./popup-layout";
import { VideoCard } from "./video-card";

export type PopupViewProps = {
  state: Snapshot | null;
  selection: Selection | null;
  theme: Theme;
  pending: boolean;
  error: string | null;
  notice: string | null;
  removed: Moment | null;
  send: (message: PopupMessage) => Promise<boolean>;
  copy: (moment: Moment) => Promise<void>;
  capture: () => Promise<Selection | null>;
  reload: () => Promise<void>;
};
export function PopupView({
  state,
  selection,
  theme,
  pending,
  error,
  notice,
  removed,
  send,
  copy,
  capture,
  reload,
}: PopupViewProps) {
  const [savedVideo, setSavedVideo] = useState<string | null>(null);
  return (
    <PopupLayout theme={theme}>
      {!state ? (
        <>
          <h1>Saved moments</h1>
          {!error && (
            <output className="blitz-note">Loading your moments...</output>
          )}
        </>
      ) : (
        <>
          {selection ? (
            <>
              <h1>
                {savedVideo === selection.video.id
                  ? "Your video moments"
                  : "Save a moment"}
              </h1>
              {savedVideo === selection.video.id ? (
                <>
                  <VideoCard video={selection.video} title={selection.title} />
                  <Button
                    variant="secondary"
                    className="blitz-primary"
                    onClick={async () => {
                      await capture();
                      setSavedVideo(null);
                    }}
                  >
                    Save another moment
                  </Button>
                </>
              ) : (
                <MomentForm
                  key={selection.video.id}
                  selection={selection}
                  pending={pending}
                  capture={capture}
                  save={async (draft) => {
                    const saved = await send({ type: "save-moment", draft });
                    if (saved) setSavedVideo(draft.video.id);
                    return saved;
                  }}
                />
              )}
            </>
          ) : (
            <div className="blitz-empty">
              <h1>Keep the moments you like</h1>
              <p className="blitz-note">
                Open a YouTube video, then use the BlitzReels button to save a
                timestamp and note.
              </p>
              <div className="blitz-empty-actions">
                <ExternalLink href="https://www.youtube.com">
                  Open YouTube
                </ExternalLink>
                <Button variant="ghost" onClick={() => void capture()}>
                  Refresh video
                </Button>
              </div>
            </div>
          )}
          <output className="blitz-status" aria-live="polite">
            <span>{notice}</span>
            <span>
              {removed && (
                <Button
                  variant="ghost"
                  disabled={pending}
                  onClick={() =>
                    void send({ type: "restore-moment", moment: removed })
                  }
                >
                  Undo
                </Button>
              )}
            </span>
          </output>
        </>
      )}
      {error && (
        <div className="blitz-feedback" role="alert">
          <p>{error}</p>
          <Button variant="secondary" onClick={() => void reload()}>
            Try again
          </Button>
        </div>
      )}
      {state && (
        <MomentList
          moments={state.moments}
          pending={pending}
          copy={copy}
          remove={async (id) => {
            await send({ type: "remove-moment", id });
          }}
        />
      )}
    </PopupLayout>
  );
}
