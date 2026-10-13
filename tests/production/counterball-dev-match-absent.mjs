import { Buffer } from "node:buffer";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const buildDirectory = path.resolve("apps/web/dist");
const diagnosticMarkers = [
  "Development-only renderer diagnostic",
  "renderer-diagnostic__label",
  "Write transport test file",
  "__counterballLoftMatrixHostAck",
];

if (process.env.VITE_COUNTERBALL_DEV_HARNESS !== undefined) {
  throw new Error("VITE_COUNTERBALL_DEV_HARNESS must be unset for production.");
}

const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(absolutePath);
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }
}

await walk(buildDirectory);
if (
  files.length === 0 ||
  !files.some((file) => path.basename(file) === "index.html")
) {
  throw new Error(
    `Production browser output is missing or empty: ${buildDirectory}`,
  );
}

for (const file of files) {
  const content = await readFile(file);
  for (const marker of diagnosticMarkers) {
    if (content.includes(Buffer.from(marker))) {
      throw new Error(
        `Production browser output contains diagnostic marker ${JSON.stringify(marker)} in ${file}.`,
      );
    }
  }
}
