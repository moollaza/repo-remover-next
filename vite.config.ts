import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@/../.storybook": resolve(__dirname, "./.storybook"),
      "@e2e": resolve(__dirname, "./e2e"),
    },
  },
});
