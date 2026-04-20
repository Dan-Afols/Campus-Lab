import { defineConfig } from "@playwright/test";

const PWA_URL = process.env.PWA_URL || "http://localhost:5174";
const ADMIN_URL = process.env.ADMIN_URL || "http://localhost:5173";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60000,
  retries: 1,
  use: {
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure"
  },
  projects: [
    { name: "pwa", use: { baseURL: PWA_URL, browserName: "chromium" } },
    { name: "admin", use: { baseURL: ADMIN_URL, browserName: "chromium" } }
  ],
  webServer: [
    {
      command: "npm --workspace services/api run dev",
      url: "http://localhost:4000/health",
      reuseExistingServer: true,
      timeout: 30000
    },
    {
      command: "npm --workspace apps/admin run dev",
      url: ADMIN_URL,
      reuseExistingServer: true,
      timeout: 30000
    },
    {
      command: "npm --workspace apps/web run dev",
      url: PWA_URL,
      reuseExistingServer: true,
      timeout: 30000
    }
  ]
});