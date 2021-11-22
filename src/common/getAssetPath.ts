import { join } from "node:path"
import { getProjectRoot } from "./getProjectRoot"

export const getAssetPath = (filename: string) =>
  join(getProjectRoot(), "assets", filename)
