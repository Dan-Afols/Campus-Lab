import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["services/api/tests/**/*.test.ts", "tests/**/*.test.ts"],
    exclude: ["tests/e2e/**"],
    testTimeout: 30000
  }
});