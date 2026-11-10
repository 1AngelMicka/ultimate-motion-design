// Tiny static HTTP server for local pages: browsers refuse ES modules, fetch() and some fonts over file://.
// Serves `root` on 127.0.0.1 with a random port; used by capture, stills and webperf for local paths.
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { join, resolve, relative, extname, sep, dirname, isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";

const TYPES = {
  ".html": "text/html; charset=utf-8", ".htm": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".cjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".map": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".gif": "image/gif", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2",
  ".ttf": "font/ttf", ".otf": "font/otf", ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime", ".mp3": "audio/mpeg", ".wav": "audio/wav",
  ".ogg": "audio/ogg", ".m4a": "audio/mp4", ".glb": "model/gltf-binary", ".gltf": "model/gltf+json", ".hdr": "application/octet-stream", ".wasm": "application/wasm",
  ".lottie": "application/zip", ".riv": "application/octet-stream", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
};

export async function serveFile(file, cwd = process.cwd()) {
  const abs = resolve(cwd, file);
  // serve the project root when the page lives inside it (so ../assets and node_modules resolve), else the page's folder
  const rel = relative(cwd, abs);
  const inside = !rel.startsWith("..") && !isAbsolute(rel); // a page on another drive is never "inside"
  const root = inside ? resolve(cwd) : dirname(abs);
  const server = createServer((req, res) => {
    let p;
    try { p = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch { res.writeHead(400).end(); return; }
    let f = resolve(join(root, p));
    if (f !== root && !f.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if (existsSync(f) && statSync(f).isDirectory()) f = join(f, "index.html");
    if (!existsSync(f) && p === "/favicon.ico") { res.writeHead(204).end(); return; } // avoid a noisy page error
    if (!existsSync(f)) { res.writeHead(404).end(); return; }
    const size = statSync(f).size;
    const type = TYPES[extname(f).toLowerCase()] || "application/octet-stream";
    const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    const send = (stream) => { stream.on("error", () => res.destroy()); stream.pipe(res); };
    if (range && (range[1] || range[2])) { // video seeking needs byte ranges
      let start, end;
      if (!range[1]) { start = Math.max(0, size - Number(range[2])); end = size - 1; } // suffix range: the last N bytes
      else { start = Number(range[1]); end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1; }
      if (start >= size || start > end) { res.writeHead(416, { "Content-Range": `bytes */${size}` }).end(); return; }
      res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${start}-${end}/${size}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1, "Cache-Control": "no-store" });
      send(createReadStream(f, { start, end }));
      return;
    }
    res.writeHead(200, { "Content-Type": type, "Content-Length": size, "Accept-Ranges": "bytes", "Cache-Control": "no-store" });
    send(createReadStream(f));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/${relative(root, abs).split(sep).map(encodeURIComponent).join("/")}`;
  return { url, close: () => new Promise((r) => server.close(() => r())) };
}

// URL for an input: remote URLs as they are, local paths through the static server.
export async function openInput(input, cwd) {
  if (/^https?:\/\//.test(input)) return { url: input, close: async () => {} };
  if (input.startsWith("file:")) return { url: input, close: async () => {} };
  if (!existsSync(resolve(cwd, input))) throw new Error(`Page not found: ${input}`);
  return serveFile(input, cwd);
}

export { pathToFileURL };
