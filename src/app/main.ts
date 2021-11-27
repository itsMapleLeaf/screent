import { app } from "electron"
import { logErrorStack } from "../common/log-error-stack"
import { showErrorDialog } from "./error-dialog"
import { createMainTray } from "./main-tray"
import { tryRegisterShortcut } from "./shortcut"
import { createVideoRecorder } from "./video-recorder"

async function main() {
  await app.whenReady()

  const recorder = await createVideoRecorder()
  createMainTray(recorder)

  tryRegisterShortcut("Meta+Alt+F12", () => {
    recorder.toggleRecording().catch(logErrorStack)
  })
}

main().catch(showErrorDialog)
