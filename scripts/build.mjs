import { cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = new URL("../", import.meta.url);
const catalog = process.argv.includes("--pages");
const legacyStore = process.argv.includes("--store");
const output = new URL(catalog ? "dist-pages/" : legacyStore ? "dist-store/" : "dist/", root);
const assets = ["styles.css", "motion.css", "app.js", "cart.js", "catalog.js", "Tailwind-MIT.txt"];
let template = await readFile(new URL("index.html", root), "utf8");
const siteUrl = process.env.CAKES_APPEAL_SITE_URL;
if (siteUrl) {
  const published = new URL(siteUrl);
  if (published.protocol !== "https:" || published.search || published.hash) {
    throw new Error("Gunakan URL HTTPS situs tanpa query atau hash.");
  }
  published.pathname = published.pathname.replace(/\/?$/, "/");
  template = template.replaceAll("https://nandomaul.github.io/Cakes-Appeal/", published.href);
} else if (!catalog) {
  template = template.replace(/^  (?:<link rel="canonical"|<meta property="og:url")[^\n]+\n/gm, "");
}

const html = catalog
  ? template.replace(/^[ \t]*<!-- store-only -->[\s\S]*?<!-- \/store-only -->[ \t]*\r?\n/gm, "")
  : template.replace('<html lang="id" data-catalog>', '<html lang="id">');

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

console.log((catalog ? "Build katalog" : "Build toko") + " siap di " + fileURLToPath(output));
