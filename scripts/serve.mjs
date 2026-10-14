import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createGunzip } from "node:zlib";

const root = path.resolve("out");
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml; charset=utf-8", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2" };

export function createServer() {
  return http.createServer((request, response) => {
    handleRequest(request, response).catch(() => {
      if (request.aborted || response.destroyed || response.headersSent) {
        response.destroy();
        return;
      }
      response.writeHead(500, { "Cache-Control": "no-store" }).end("Unable to serve this request");
    });
  });
}

async function handleRequest(request, response) {
    let url;
    try { url = new URL(request.url, "http://localhost"); }
    catch { response.writeHead(400, { "Cache-Control": "no-store" }).end("Invalid URL"); return; }
    if (request.method === "POST" && url.pathname === "/api/contact") {
      let body = "";
      for await (const chunk of request) {
        body += chunk.toString();
        if (Buffer.byteLength(body) > 20000) {
          response.writeHead(413).end("Form too large");
          return;
        }
      }
      if (!(request.headers["content-type"] || "").startsWith("application/x-www-form-urlencoded")) {
        response.writeHead(415).end("Expected a website form");
        return;
      }
      const form = new URLSearchParams(body);
      const name = form.get("name"), email = form.get("email"), company = form.get("company"), message = form.get("message");
      if (!name || !email || !message) {
        response.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "Missing fields" }));
        return;
      }
      // Preserve the existing contact handler. It records submissions in server
      // logs; no email provider or new delivery service is activated here.
      console.log("[contact]", { name, email, company, message });
      response.writeHead(303, { Location: "/contact/thanks", "Cache-Control": "no-store" }).end();
      return;
    }
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    let decoded;
    try { decoded = decodeURIComponent(url.pathname); } catch { response.writeHead(400).end(); return; }
    if (decoded.includes("\0") || decoded.includes("\\")) { response.writeHead(400).end(); return; }
    const relative = decoded.replace(/^\/+|\/+$/g, "");
    const resolved = path.resolve(root, relative || "index.html");
    if (!resolved.startsWith(`${root}${path.sep}`)) { response.writeHead(404).end(); return; }
    const candidates = [resolved, `${resolved}.html.gz`, `${resolved}.html`, path.join(resolved, "index.html")];
    const file = candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    const target = file || path.join(root, "404.html");
    if (!fs.existsSync(target)) { response.writeHead(404).end(); return; }
    const stat = fs.statSync(target);
    const compressed = target.endsWith(".html.gz");
    const acceptsGzip = (request.headers["accept-encoding"] || "").split(",").some(value => {
      const [encoding, quality] = value.trim().split(";");
      return encoding === "gzip" && (!quality || Number(quality.trim().replace(/^q=/, "")) > 0);
    });
    const gzip = compressed && acceptsGzip;
    const etag = `"${stat.size.toString(16)}-${stat.mtimeMs.toString(16)}-${gzip ? "gzip" : "identity"}"`;
    const headers = { "Content-Type": mime[path.extname(compressed ? target.slice(0, -3) : target)] || "application/octet-stream", "Cache-Control": file ? (relative.startsWith("_next/static/") ? "public, max-age=31536000, immutable" : "public, max-age=300") : "no-store", "X-Content-Type-Options": "nosniff", ETag: etag, "X-SponsorWatch-Rendering": "static-file" };
    if (compressed) headers.Vary = "Accept-Encoding";
    if (gzip) headers["Content-Encoding"] = "gzip";
    if (!compressed || gzip) headers["Content-Length"] = stat.size;
    if (file && request.headers["if-none-match"] === etag) { response.writeHead(304, { ETag: etag }).end(); return; }
    response.writeHead(file ? 200 : 404, headers);
    if (request.method === "HEAD") { response.end(); return; }
    const stream = fs.createReadStream(target);
    stream.on("error", () => response.destroy());
    if (compressed && !gzip) stream.pipe(createGunzip()).on("error", () => response.destroy()).pipe(response);
    else stream.pipe(response);
}
if (import.meta.url === new URL(process.argv[1], "file:").href) {
  if (!JSON.parse(fs.readFileSync(path.join(root, "static-build.json"), "utf8")).complete) {
    throw new Error("Refusing to serve an incomplete static build");
  }
  createServer().listen(Number(process.env.PORT || 3000), "0.0.0.0", () => console.log("SponsorWatch static files ready"));
}
