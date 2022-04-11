import { app } from "electron"
import { join } from "node:path"

export function getVideoRecordingsPath(...segments: string[]) {
  return join(app.getPath("videos"), "Recordings", ...segments)
}
