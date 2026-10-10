import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, isAbsolute, relative, resolve } from "node:path";

// Serve an already-built GitHub artifact. No dependency install or build runs here.
const directory = resolve(process.argv[2] ?? ".artifacts/browser-preview");
const port = Number(process.argv[3] ?? "4173");
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("Choose a valid preview port.");
}
await stat(resolve(directory, "index.html"));
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".wasm": "application/wasm",
  ".woff2": "font/woff2",
};
const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const route = ["/", "/preview", "/preview/"].includes(pathname);
    const path = resolve(directory, route ? "index.html" : `.${pathname}`);
    const within = relative(directory, path);
    if (within.startsWith("..") || isAbsolute(within)) {
      response.writeHead(403).end();
      return;
    }
    const file = await readFile(path);
    response.writeHead(200, {
      "Content-Type": contentTypes[extname(path)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Length": file.length,
    });
    response.end(request.method === "HEAD" ? undefined : file);
  } catch (error) {
    response.writeHead(error instanceof URIError ? 400 : 404).end();
  }
});
server.listen(port, "127.0.0.1", () => {
  console.log(`Counterball preview: http://127.0.0.1:${port}/preview`);
  console.log("Serving prebuilt files only. Press Ctrl+C to stop.");
});
