import { app, BrowserWindow } from "electron"
import { pathToFileURL } from "node:url"
import { isDev } from "../common/constants"
import { getDistPath } from "../common/paths"

export class Editor {
  private constructor(private readonly win: BrowserWindow) {}

  static async create() {
    await app.whenReady()
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
      await win.loadURL("http://localhost:3000/src/editor.html")
    } else {
      const url = pathToFileURL(getDistPath("renderer/editor.html"))
      await win.loadURL(url.toString())
    }

    return win
  }

  showWindow() {
    this.win.show()
  }
}
