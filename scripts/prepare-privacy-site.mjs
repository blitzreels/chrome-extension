import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const policy = await readFile(resolve(root, "store/privacy.html"));
const output = resolve(root, "store/privacy-site/public");
await mkdir(output, { recursive: true });
await writeFile(resolve(output, "index.html"), policy);
await writeFile(resolve(output, "privacy.html"), policy);
console.log(
  JSON.stringify({
    directory: output,
    privacySha256: createHash("sha256").update(policy).digest("hex"),
  }),
);
