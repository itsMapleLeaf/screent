import { app } from "electron"
import { logErrorStack } from "../common/errors"
import { createAudioDeviceSelector } from "./audio-devices"
import { showErrorDialog } from "./error-dialog"
import { createMainTray } from "./main-tray"
import { tryRegisterShortcut } from "./shortcut"
import { createVideoRecorder } from "./video-recorder"

async function main() {
  await app.whenReady()

  const recorder = await createVideoRecorder()
  const audioDeviceSelector = await createAudioDeviceSelector()
  createMainTray(recorder, audioDeviceSelector)

  tryRegisterShortcut("Meta+Alt+F12", () => {
    recorder.toggleRecording().catch(logErrorStack)
  })
}

main().catch(showErrorDialog)
