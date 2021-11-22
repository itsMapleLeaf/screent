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

export function getAssetPath(localPath: string) {
  return getProjectPath("assets", localPath)
}

export function getDistPath(localPath: string) {
  return getProjectPath("dist", localPath)
}
