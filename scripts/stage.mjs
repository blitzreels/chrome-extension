import { cp, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await cp(".output/chrome-mv3", "dist", { recursive: true });
console.log("Staged WXT production build in dist.");
