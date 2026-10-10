import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.wrangler/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
    ],
  },
  js.configs.recommended,
  {
    files: [
      "apps/**/*.{ts,tsx}",
      "games/**/*.ts",
      "packages/**/*.{ts,tsx}",
      "tests/**/*.{ts,tsx}",
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        projectService: true,
      },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs["recommended-type-checked"].rules,
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },
  {
    files: ["games/counterball/src/features/**/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@babylonjs/core",
              message:
                "Pure domain rules must not import the physics or rendering engine.",
            },
            {
              name: "react",
              message: "Pure domain rules must not import presentation code.",
            },
            {
              name: "@korre/ui",
              message:
                "Pure domain rules must not import shared presentation code.",
            },
            {
              name: "@korre/web",
              message: "Pure domain rules must not import an application package.",
            },
            {
              name: "@korre/api",
              message: "Pure domain rules must not import backend code.",
            },
            {
              name: "@korre/realtime",
              message: "Pure domain rules must not import backend code.",
            },
            {
              name: "hono",
              message: "Pure domain rules must not import a backend framework.",
            },
            {
              name: "pg",
              message: "Pure domain rules must not import database clients.",
            },
          ],
          patterns: [
            "@babylonjs/*",
            "@korre/ui/*",
            "@korre/web/*",
            "@korre/api/*",
            "@korre/realtime/*",
            "@cloudflare/*",
            "**/apps/api/**",
            "**/apps/realtime/**",
            "**/backend/**",
            "**/infrastructure/**",
            "**/presentation",
            "**/presentation/**",
            "**/ui",
            "**/ui/**",
          ],
        },
      ],
    },
  },
];
