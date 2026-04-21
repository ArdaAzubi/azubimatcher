import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const baseArg = process.argv[2];
const portArg = Number.parseInt(process.argv[3] || "8123", 10);

if (!baseArg) {
  console.error("Usage: node tools/serve_dist_cors.mjs <baseDir> [port]");
  process.exit(1);
}

const baseDir = path.resolve(baseArg);
const port = Number.isFinite(portArg) ? portArg : 8123;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".php": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8"
};

const server = http.createServer((request, response) => {
  const requestPath = decodeURIComponent(String(request.url || "/").split("?")[0] || "/");
  const relativePath = requestPath === "/" ? "/index.php" : requestPath;
  const targetPath = path.normalize(path.join(baseDir, relativePath));

  if (!targetPath.startsWith(path.normalize(baseDir))) {
    response.writeHead(403, {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/plain; charset=utf-8"
    });
    response.end("Forbidden");
    return;
  }

  fs.readFile(targetPath, (error, data) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain; charset=utf-8"
      });
      response.end(error.code === "ENOENT" ? "Not found" : String(error));
      return;
    }

    const extension = path.extname(targetPath).toLowerCase();
    response.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": mimeTypes[extension] || "application/octet-stream"
    });
    response.end(data);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`SERVING ${baseDir} on http://127.0.0.1:${port}`);
});