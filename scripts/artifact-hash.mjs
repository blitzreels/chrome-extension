import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

export async function artifactFiles(root) {
  const paths = await readdir(root, { recursive: true, withFileTypes: true });
  return paths
    .filter((entry) => entry.isFile())
    .map((entry) =>
      resolve(entry.parentPath, entry.name).slice(resolve(root).length + 1),
    )
    .sort();
}
export async function artifactHash(root) {
  const hash = createHash("sha256");
  for (const path of await artifactFiles(root)) {
    hash.update(path);
    hash.update(await readFile(resolve(root, path)));
  }
  return hash.digest("hex");
}
