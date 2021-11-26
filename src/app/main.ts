import { Editor } from "./editor"
import { MainTray } from "./main-tray"
import { showErrorDialog } from "./showErrorDialog"
import { VideoRecorder } from "./video-recorder"

async function main() {
  const editor = await Editor.create()
  await VideoRecorder.create()
  await MainTray.create(editor)
}

main().catch(showErrorDialog)
