import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { artifactFiles, artifactHash } from "./artifact-hash.mjs";

const root = resolve(import.meta.dirname, "..");
const build = resolve(root, ".output/chrome-mv3");
const manifest = JSON.parse(
  await readFile(resolve(build, "manifest.json"), "utf8"),
);
const receipt = JSON.parse(
  await readFile(resolve(root, "artifacts/verification.json"), "utf8"),
);
assert.equal(manifest.name, "BlitzReels - Save video moments");
assert.deepEqual(manifest.permissions, ["storage"]);
assert.equal(manifest.host_permissions, undefined);
assert.equal(manifest.side_panel, undefined);
assert.equal(manifest.action.default_popup, "popup.html");
assert.equal(receipt.version, manifest.version);
assert.equal(
  receipt.artifactHash,
  await artifactHash(build),
  "Package differs from the verified build",
);
const filename = `blitzreels-chrome-${manifest.version}.zip`;
const archive = resolve(root, ".output", filename);
const paths = await artifactFiles(build);
const zipped = execFileSync("unzip", ["-Z1", archive], { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter((path) => !path.endsWith("/"))
  .sort();
assert.deepEqual(zipped, paths, "ZIP contains unexpected or missing files");
for (const path of paths) {
  assert.deepEqual(
    execFileSync("unzip", ["-p", archive, path], { maxBuffer: 10_000_000 }),
    await readFile(resolve(build, path)),
    `ZIP mismatch: ${path}`,
  );
}
const release = resolve(root, "release");
await mkdir(release, { recursive: true });
await cp(archive, resolve(release, filename));
const checksum = createHash("sha256")
  .update(await readFile(archive))
  .digest("hex");
await writeFile(
  resolve(release, `${filename}.sha256`),
  `${checksum}  ${filename}\n`,
);
console.log(
  `Verified local candidate: release/${filename}. Complete store/listing.md before submission. Nothing was published.`,
);
