import { useSyncExternalStore } from "react";
import type { Theme } from "../design/theme";

const query = "(prefers-color-scheme: dark)";

function subscribe(onChange: () => void) {
  const media = matchMedia(query);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSnapshot(): Theme {
  return matchMedia(query).matches ? "dark" : "light";
}

export function usePreferredTheme(): Theme {
  return useSyncExternalStore(subscribe, getSnapshot);
}
