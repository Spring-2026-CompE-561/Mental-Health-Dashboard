/**
 * Vitest config for integration tests that hit a real running backend.
 *
 * Usage:
 *   npm run test:integration
 *
 * Boots a Python uvicorn process serving the FastAPI backend on a free port,
 * then runs the integration suite which uses real HTTP against that backend
 * via the frontend's own api.ts service module.
 */

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    globalSetup: ["tests/integration/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
  },
});
