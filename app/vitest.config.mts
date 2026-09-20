import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // Styles are not asserted here, and injecting desktop-only CSS into jsdom
    // (which has no media query support) would hide responsive elements.
    css: false,
    restoreMocks: true,
    // The API client reads this at import time; .env.local is not loaded here.
    env: { NEXT_PUBLIC_API_URL: "http://127.0.0.1:8000/api/v1" },
  },
});
