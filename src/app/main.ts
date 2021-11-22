import { app } from "electron"
import { Editor } from "./editor"
import { TrayManager } from "./tray"

const editor = new Editor()
const tray = new TrayManager(editor)

app.on("ready", () => {
  editor.createWindow().catch(console.error)
  tray.create()
})
