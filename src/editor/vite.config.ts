import { defineConfig } from "vite"
import { getDistPath } from "../common/paths"

export default defineConfig(({ command }) => ({
  publicDir: command === "build" ? "." : "/",
  build: {
    outDir: getDistPath("editor"),
  },
}))
