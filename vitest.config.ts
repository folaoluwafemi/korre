import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["apps/**/src/**/*.test.{ts,tsx}", "games/**/src/**/*.test.{ts,tsx}", "packages/**/src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.{ts,tsx}"],
    exclude: [
      ...configDefaults.exclude,
      "apps/realtime/tests/**/*.worker.test.mjs",
    ],
    testTimeout: 10_000,
  },
});
