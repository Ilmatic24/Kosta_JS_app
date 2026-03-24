import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const contentTypesByExtension = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);
const clientRootPath = path.resolve(currentDirectoryPath, "..");
const requestedRootPath = process.argv[2] ?? ".";
const serverRootPath = path.resolve(clientRootPath, requestedRootPath);
const port = Number(process.argv[3] ?? process.env.PORT ?? 5173);

const createResolvedPath = (requestPathname) => {
  const normalizedRequestPath =
    requestPathname === "/" ? "index.html" : requestPathname.replace(/^\/+/, "");
  const resolvedPath = path.resolve(serverRootPath, normalizedRequestPath);

  if (!resolvedPath.startsWith(serverRootPath)) {
    throw new Error("Request outside of server root.");
  }

  return resolvedPath;
};

const sendResponse = (response, statusCode, body, contentType) => {
  response.writeHead(statusCode, {
    "Content-Type": contentType
  });
  response.end(body);
};

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    let filePath = createResolvedPath(requestUrl.pathname);
    let stat;

    try {
      stat = await fs.stat(filePath);
    } catch {
      stat = null;
    }

    if (stat?.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    const fileContent = await fs.readFile(filePath);
    const extension = path.extname(filePath);
    const contentType =
      contentTypesByExtension[extension] ?? "application/octet-stream";

    sendResponse(response, 200, fileContent, contentType);
  } catch {
    sendResponse(response, 404, "Not Found", "text/plain; charset=utf-8");
  }
});

server.listen(port, () => {
  console.log(`MLZ static client available at http://localhost:${port}`);
});
