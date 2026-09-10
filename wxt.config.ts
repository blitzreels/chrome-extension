import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  imports: false,
  manifest: {
    name: "BlitzReels - Save video moments",
    description:
      "Save YouTube timestamps and notes. Find your saved moments in the BlitzReels popup and return to the original video.",
    homepage_url: "https://blitzreels.com",
    minimum_chrome_version: "127",
    permissions: ["storage"],
    action: { default_title: "Save a moment with BlitzReels" },
    icons: {
      16: "icons/icon-16.png",
      32: "icons/icon-32.png",
      48: "icons/icon-48.png",
      128: "icons/icon-128.png",
    },
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'none'; base-uri 'none';",
    },
  },
  vite: () => ({ plugins: [tailwindcss()] }),
  zip: { artifactTemplate: "blitzreels-chrome-{{version}}.zip" },
});
