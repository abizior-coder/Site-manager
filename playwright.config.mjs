// Real-browser end-to-end tests against the built app and the Firebase
// emulators. Run with `npm run test:e2e` (starts the emulators, seeds, runs
// Chromium) or `npx playwright test` when emulators and the static server
// on 5566 are already up.
import { defineConfig, devices } from "@playwright/test";

const isWin = process.platform === "win32";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:5566",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    viewport: { width: 420, height: 860 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 420, height: 860 } } }],
  webServer: {
    command: `${isWin ? "python" : "python3"} -m http.server 5566`,
    url: "http://localhost:5566/index.html",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
