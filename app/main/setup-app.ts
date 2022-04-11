import { configure } from "mobx"
import { initRemix } from "remix-electron"
import { logErrorStack } from "../common/errors"
import { createAudioDeviceSelector } from "./audio-devices"
import { createMainTray } from "./main-tray"
import { tryRegisterShortcut } from "./shortcut"
import { createVideoRecorder } from "./video-recorder"

configure({
  enforceActions: "never",
})

export async function setupApp() {
  await initRemix()

  const audioDeviceSelector = await createAudioDeviceSelector()
  const recorder = await createVideoRecorder(audioDeviceSelector)
  createMainTray(recorder, audioDeviceSelector)

  tryRegisterShortcut("Meta+Alt+F12", () => {
    recorder.toggleRecording().catch(logErrorStack)
  })
}
