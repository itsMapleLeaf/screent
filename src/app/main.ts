import { app } from "electron"
import { Editor } from "./editor"
import { MainTray } from "./main-tray"
import { showErrorDialog } from "./showErrorDialog"
import { VideoRecorder } from "./video-recorder"

async function main() {
  await app.whenReady()
  await Editor.create()
  const recorder = await VideoRecorder.create()
  MainTray.create(recorder)
}

main().catch(showErrorDialog)
