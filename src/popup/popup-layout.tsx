import type { ReactNode } from "react";
import { appUrl } from "../app-links";
import { ExternalLink } from "../components/external-link";
import { Logo } from "../components/logo";
import type { Theme } from "../design/theme";

export function PopupLayout({
  theme,
  children,
}: {
  theme: Theme;
  children: ReactNode;
}) {
  return (
    <main className="blitz-theme blitz-popup" data-theme={theme}>
      <header className="blitz-brand">
        <Logo />
        <span>BlitzReels</span>
      </header>
      <div className="blitz-popup-body">{children}</div>
      <footer>
        <ExternalLink href={appUrl}>
          Open BlitzReels <span aria-hidden="true">↗</span>
        </ExternalLink>
        <span>Captions, clips and more at blitzreels.com</span>
      </footer>
    </main>
  );
}
