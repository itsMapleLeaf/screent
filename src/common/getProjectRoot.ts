import { join } from "node:path"

/**
 * returns the first parent folder containing a package.json
 *
 * if none is found, returns the current working directory
 */
export function getProjectRoot(): string {
  const cwd = process.cwd()
  let parent = cwd
  while (parent !== "/") {
    const pkg = join(parent, "package.json")
    if (require.resolve(pkg)) {
      return parent
    }
    parent = join(parent, "..")
  }
  return cwd
}
