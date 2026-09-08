import { defineConfig, devices } from "@playwright/test";

const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID ?? "";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
        },
        permissions: ["camera", "microphone"],
      },
    },
  ],
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
    env: {
      ...process.env,
      VITE_MSW: "1",
      ...(googleClientId.length > 0 ? { VITE_GOOGLE_CLIENT_ID: googleClientId } : {}),
    },
  },
});
