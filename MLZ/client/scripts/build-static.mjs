import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);
const clientRootPath = path.resolve(currentDirectoryPath, "..");
const distPath = path.join(clientRootPath, "dist");

await fs.rm(distPath, {
  recursive: true,
  force: true
});
await fs.mkdir(distPath, {
  recursive: true
});
await fs.copyFile(
  path.join(clientRootPath, "index.html"),
  path.join(distPath, "index.html")
);
await fs.cp(path.join(clientRootPath, "src"), path.join(distPath, "src"), {
  recursive: true
});

console.log(`Static client build completed: ${distPath}`);
