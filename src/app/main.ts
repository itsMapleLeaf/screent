import { dialog } from "electron"
import { toError } from "../common/toError"
import { Editor } from "./editor"
import { MainTray } from "./main-tray"
import { VideoRecorder } from "./video-recorder"

void (async () => {
  try {
    const editor = await Editor.create()
    await VideoRecorder.create()
    await MainTray.create(editor)
  } catch (error) {
    const { stack, message } = toError(error)
    dialog.showErrorBox("Error", stack || message)
  }
})()
