import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components/*": path.resolve(__dirname, "./src/components/*"),
      "@contexts/*": path.resolve(__dirname, "./src/contexts/*"),
      "@fixtures/*": path.resolve(__dirname, "./src/tests/fixtures/*"),
      "@graphql/*": path.resolve(__dirname, "./src/graphql/*"),
      "@hooks/*": path.resolve(__dirname, "./src/hooks/*"),
      "@providers/*": path.resolve(__dirname, "./src/providers/*"),
      "@utils/*": path.resolve(__dirname, "./src/utils/*"),
    },
  },
  test: {
    environment: "jsdom",
    exclude: ["**/tests/**", "**/node_modules/**"],
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
