import { existsSync } from "node:fs"
import { dirname, join } from "node:path"

// find first parent directory with a package.json file, or the cwd
const projectRoot = (() => {
  // eslint-disable-next-line unicorn/prefer-module
  let directory = __dirname
  while (directory !== "/") {
    if (existsSync(join(directory, "package.json"))) {
      return directory
    }
    directory = dirname(directory)
  }
  return process.cwd()
})()

export function getProjectPath(...localPathParts: string[]) {
  return join(projectRoot, ...localPathParts)
}

export function getAssetPath(...segments: string[]) {
  return getProjectPath("public", ...segments)
}

export function getDistPath(...segments: string[]) {
  return getProjectPath("dist", ...segments)
}
