import { usePreferredTheme } from "../hooks/use-preferred-theme";
import { PopupView } from "./popup-view";
import { useExtension } from "./use-extension";

export function PopupApp() {
  const extension = useExtension();
  const theme = usePreferredTheme();
  return <PopupView {...extension} theme={theme} />;
}
