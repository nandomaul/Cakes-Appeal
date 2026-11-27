import { cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = new URL("../", import.meta.url);
const store = process.argv.includes("--store");
const output = new URL(store ? "dist-store/" : "dist/", root);
const assets = ["styles.css", "motion.css", "app.js", "cart.js", "catalog.js", "Tailwind-MIT.txt"];
const template = await readFile(new URL("index.html", root), "utf8");
const html = store
  ? template
  : template.replace('<html lang="id">', '<html lang="id" data-demo>')
    .replace(/^[ \t]*<!-- store-only -->[\s\S]*?<!-- \/store-only -->[ \t]*\r?\n/gm, "");

const work = await mkdtemp(fileURLToPath(new URL(".build-", root)));
const staging = pathToFileURL(work + "/");

try {
  await mkdir(new URL("src/", staging));
  await cp(new URL("assets/", root), new URL("assets/", staging), {
    recursive: true,
    filter: (source) => !source.endsWith(".DS_Store"),
  });
  await Promise.all([
    ...assets.map((file) => cp(new URL("src/" + file, root), new URL("src/" + file, staging))),
    writeFile(new URL("index.html", staging), html),
  ]);
  await rm(output, { recursive: true, force: true });
  await rename(staging, output);
} finally {
  await rm(staging, { recursive: true, force: true });
}

console.log((store ? "Build toko" : "Build demo") + " siap di " + fileURLToPath(output));
