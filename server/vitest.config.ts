import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    testTimeout: 20000,
    hookTimeout: 20000,
    maxWorkers: 1,
    minWorkers: 1,
    exclude: ["node_modules/**", "dist/**"],
  },
});
