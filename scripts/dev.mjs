import { createServer } from "node:http";
import { access, readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const preview = process.argv.includes("--preview");
const store = process.argv.includes("--store");
const catalog = process.argv.includes("--pages");
const output = catalog ? "../dist-pages/" : store ? "../dist-store/" : "../dist/";
const webRoot = new URL(preview ? output : "../", import.meta.url);
const root = fileURLToPath(webRoot);

if (preview) {
  try {
    await access(new URL("index.html", webRoot));
  } catch {
    const command = catalog ? "npm run build:pages" : store ? "npm run build:store" : "npm run build";
    console.error("Build belum ada. Jalankan " + command + " terlebih dahulu.");
    process.exit(1);
  }
}
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
};
const portFlag = process.argv.indexOf("--port");
const port = portFlag === -1 ? 4173 : Number(process.argv[portFlag + 1]);

const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = resolve(root, "." + (pathname === "/" ? "/index.html" : pathname));
    const type = types[extname(file)];
    if (!file.startsWith(root.endsWith(sep) ? root : root + sep) || !type) {
      res.writeHead(404).end("Halaman tidak ditemukan.");
      return;
    }
    let body = await readFile(file);
    if (!preview && (pathname === "/" || pathname === "/index.html")) {
      body = body.toString("utf8").replace('<html lang="id" data-catalog>', '<html lang="id">');
    }
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(404).end("Halaman tidak ditemukan.");
  }
});
const host = "127.0.0.1";

server.on("error", (error) => {
  if (error.code === "EADDRINUSE" && portFlag === -1) {
    server.listen(0, host);
    return;
  }
  console.error("Dev server gagal berjalan:", error.message);
  process.exitCode = 1;
});
server.on("listening", () => {
  console.log("Cakes Appeal  →  http://localhost:" + server.address().port);
});
server.listen(port, host);
