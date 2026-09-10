import type { Theme } from "./design/theme";
import { PopupView, type PopupViewProps } from "./popup/popup-view";

export function ExtensionShowcase(props: Omit<PopupViewProps, "theme">) {
  return (
    <div className="showcase-grid">
      {(["light", "dark"] as Theme[]).map((theme) => (
        <section key={theme}>
          <h2>{theme === "light" ? "Light" : "Dark"}</h2>
          <PopupView {...props} theme={theme} />
        </section>
      ))}
    </div>
  );
}
