import { existsSync } from "node:fs"
import { dirname, join } from "node:path"

// find first parent directory with a package.json file, or the cwd
const projectRoot = (() => {
  let dir = process.cwd()
  while (dir !== "/") {
    if (existsSync(join(dir, "package.json"))) {
      return dir
    }
    dir = dirname(dir)
  }
  return process.cwd()
})()

export function getProjectPath(...localPathParts: string[]) {
  return join(projectRoot, ...localPathParts)
}

export function getAssetPath(...segments: string[]) {
  return getProjectPath("assets", ...segments)
}

export function getDistPath(...segments: string[]) {
  return getProjectPath("dist", ...segments)
}
