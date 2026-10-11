import { readdirSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const productionSpecs = [
  "home.spec.ts",
  "counterball-preview.spec.ts",
] as const;

// These files are added by their named local diagnostic packets. Keep the
// complete reviewed catalogue here so an added spec cannot vanish from CI.
const diagnosticSpecs = [
  "counterball-direct-probe.spec.ts",
  "counterball-physics.spec.ts",
  "local-flick.spec.ts",
  "local-restart.spec.ts",
  "local-match.spec.ts",
  "counterball-cinematic.spec.ts",
] as const;

// O04 owns the identity-service config; O19 owns the authenticated online
// config. These names are recognized here but never selected by this static
// production/diagnostic config.
const identityServiceSpecs = [
  "identity-gate.spec.ts",
  "identity-ai-gate.spec.ts",
] as const;

const onlineServiceSpecs = [
  "online-recovery.spec.ts",
  "online-match.spec.ts",
  "private-room.spec.ts",
  "invitations.spec.ts",
  "casual-match.spec.ts",
  "online-cinematic.spec.ts",
  "security-reliability.spec.ts",
] as const;

const knownSpecs = new Set<string>(
  [
    ...productionSpecs,
    ...diagnosticSpecs,
    ...identityServiceSpecs,
    ...onlineServiceSpecs,
  ].map((filename) => `tests/e2e/${filename}`),
);
const workspaceRoot = dirname(fileURLToPath(import.meta.url));
const e2eRoot = resolve(workspaceRoot, "tests/e2e");

function discoverSpecs(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return discoverSpecs(path);
    if (!entry.isFile() || !entry.name.endsWith(".spec.ts")) return [];
    return [relative(e2eRoot, path).replaceAll("\\", "/")];
  });
}

const discoveredSpecs = discoverSpecs(e2eRoot);
const unmappedSpecs = discoveredSpecs.filter(
  (path) => !knownSpecs.has(`tests/e2e/${path}`),
);
if (unmappedSpecs.length > 0) {
  throw new Error(
    `Unmapped browser specs require reviewed suite routing: ${unmappedSpecs.join(", ")}`,
  );
}

const diagnosticMode = process.env["COUNTERBALL_DEV_E2E"] === "1";
const productionPrebuiltMode =
  process.env["COUNTERBALL_PREBUILT_PREVIEW"] === "1";
const webCommand = diagnosticMode
  ? "node scripts/serve-preview.mjs apps/web/dist-dev 5173"
  : productionPrebuiltMode
    ? "node scripts/serve-preview.mjs apps/web/dist 5173"
    : process.platform === "win32"
      ? "pnpm.cmd --filter @korre/web dev --host 127.0.0.1"
      : "pnpm --filter @korre/web dev --host 127.0.0.1";
const selectedSpecs = diagnosticMode ? diagnosticSpecs : productionSpecs;
const jsonReportPath = diagnosticMode
  ? ".artifacts/browser-test-results-diagnostic.json"
  : ".artifacts/browser-test-results.json";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: selectedSpecs.map((filename) => `**/${filename}`),
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI
    ? ["github", ["json", { outputFile: jsonReportPath }]]
    : "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: webCommand,
    url: "http://127.0.0.1:5173",
    reuseExistingServer:
      !process.env.CI && !diagnosticMode && !productionPrebuiltMode,
    timeout: 60_000,
  },
});
