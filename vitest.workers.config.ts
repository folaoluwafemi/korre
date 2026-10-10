import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "apps/realtime/wrangler.toml" },
      miniflare: {
        bindings: { COUNTERBALL_CI_SMOKE: "worker-runtime-smoke-ok" },
      },
    }),
  ],
  test: {
    include: ["apps/realtime/tests/**/*.worker.test.mjs"],
    testTimeout: 10_000,
  },
});
