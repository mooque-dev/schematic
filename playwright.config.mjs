import { defineConfig, devices } from '@playwright/test';

// E2E runs against the real static site served by python's http.server.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4599',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'python3 -m http.server 4599',
    url: 'http://localhost:4599',
    reuseExistingServer: !process.env.CI,
    timeout: 20_000,
  },
});
