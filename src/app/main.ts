import { app } from "electron"
import { configure } from "mobx"
import { logErrorStack } from "../common/errors"
import { createAudioDeviceSelector } from "./audio-devices"
import { showErrorDialog } from "./error-dialog"
import { createMainTray } from "./main-tray"
import { tryRegisterShortcut } from "./shortcut"
import { createVideoRecorder } from "./video-recorder"

configure({
  enforceActions: "never",
})

async function main() {
  await app.whenReady()

  const audioDeviceSelector = await createAudioDeviceSelector()
  const recorder = await createVideoRecorder(audioDeviceSelector)
  createMainTray(recorder, audioDeviceSelector)

  tryRegisterShortcut("Meta+Alt+F12", () => {
    recorder.toggleRecording().catch(logErrorStack)
  })
}

main().catch(showErrorDialog)
