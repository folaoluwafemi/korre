import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "apps/**/src/**/*.test.{ts,tsx}",
      "games/**/src/**/*.test.{ts,tsx}",
      "packages/**/src/**/*.test.{ts,tsx}",
      "apps/web/server/**/*.test.{ts,tsx}",
      "tests/unit/**/*.test.{ts,tsx}",
    ],
    exclude: [
      ...configDefaults.exclude,
      "**/*.worker.test.{js,mjs,ts,tsx}",
      "**/*.workers.test.{js,mjs,ts,tsx}",
    ],
    testTimeout: 10_000,
  },
});
