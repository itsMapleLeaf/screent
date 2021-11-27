import { BrowserWindow } from "electron"
import { isDev } from "../common/constants"
import { getDistPath } from "../common/paths"

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

    if (isDev) {
      await win.loadURL("http://localhost:3000/src/editor/")
    } else {
      await win.loadFile(getDistPath("renderer/editor/index.html"))
    }

    return win
  }

  showWindow() {
    this.win.show()
  }
}
