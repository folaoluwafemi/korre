# Verified toolchain pins

Registry metadata and peer/engine compatibility were checked on 2026-10-10. These are exact package pins, not claims that every product feature is implemented.

| Tool/package | Pin | Reason |
|---|---:|---|
| Node.js | 24.21.0 CI/runtime baseline | Active LTS selected for CI; the workspace machine currently has Node 25.2.0, which is EOL. |
| pnpm | 10.33.0 | Installed version, recorded in `packageManager` and CI. |
| TypeScript | 5.9.3 | Strict ESM compiler; supported by the pinned type-aware ESLint parser. |
| Vite | 8.3.4 | Declares Node `^20.19.0 || >=22.12.0`. |
| React / React DOM | 19.3.0 | Matching versions and peer range. |
| `@vitejs/plugin-react` | 6.1.2 | Vite 8 peer range. |
| Vitest | 4.1.2 | Declares Node `^20 || ^22 || >=24`, so it supports both pinned Node 24 CI and the current Node 25 local runtime. |
| Playwright | 1.64.0 | Browser test runner; Node 24 is supported. |
| Babylon.js core / loaders | 9.30.0 | Kept at the same version. |
| Babylon Havok | 1.3.14 | Version selected for the actual physics integration gate. |
| Hono | 4.13.13 | Node API framework. |
| `@hono/node-server` | 2.1.4 | Hono 4/5 peer range, Node 20+. |
| PostgreSQL client (`pg`) | 8.23.1 | Node 16+; service implementation is scheduled for T11. |
| `tsx` | 4.21.0 | Node 18+ local TypeScript runner for the API. |
| `@types/pg` | 8.15.6 | PostgreSQL type declarations for the API. |
| Zod | 4.6.5 | Runtime schema validation for protocol boundaries. |
| Wrangler | 4.149.0 | Cloudflare CLI; Node 22+. |
| ESLint | 10.11.0 | Current supported major, compatible with the pinned type-aware ESLint tooling. |
| `@eslint/js` | 10.0.1 | Matches ESLint 10. |
| `typescript-eslint` | 8.71.1 | TypeScript peer range `>=4.8.4 <6.1.0`; floating promise rules are enabled. |

Node 25 is not the project baseline. Local checks use the available Node 25.2.0 without changing the user's runtime installation. CI and documented project runtime use Node 24.21.0.
