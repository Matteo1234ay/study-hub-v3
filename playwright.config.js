import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 90_000,
  expect: { timeout: 45_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["line"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off"
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 }
      }
    },
    {
      name: "webkit-desktop",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1440, height: 900 }
      }
    },
    {
      name: "webkit-mobile",
      use: {
        ...devices["iPhone 13"]
      }
    }
  ]
});
