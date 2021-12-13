import { BrowserWindow } from "electron"
import { isDevelopment } from "../common/constants"
import { getDistPath } from "../common/paths"
import { applyDevtoolsListener } from "./devtools"

export class Editor {
  private constructor(private readonly win: BrowserWindow) {}

  static async create() {
    return new Editor(await Editor.createWindow())
  }

  private static async createWindow() {
    const win = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false,
      },
    })

    win.on("close", (event) => {
      event.preventDefault()
      win.hide()
    })

    await (isDevelopment
      ? win.loadURL("http://localhost:3000/editor/")
      : win.loadFile(getDistPath("renderer/editor/index.html")))

    applyDevtoolsListener(win)

    return win
  }

  showWindow() {
    this.win.show()
  }
}
