import glob from "fast-glob"
import { defineConfig } from "vite"
import { getDistPath } from "./src/common/paths"

export default defineConfig(async () => ({
  root: "src/renderer",
  base: "./",
  build: {
    outDir: getDistPath("renderer"),
    emptyOutDir: true,
    rollupOptions: {
      input: await glob("src/**/*.html"),
    },
  },
}))
