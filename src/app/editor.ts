import { BrowserWindow } from "electron"
import { pathToFileURL } from "url"
import { isDev } from "../common/constants"
import { getDistPath } from "../common/paths"

export class Editor {
  _win?: BrowserWindow

  get win() {
    if (!this._win) {
      throw new Error("Editor window is not created yet")
    }
    return this._win
  }

  set win(win: BrowserWindow) {
    this._win = win
  }

  async createWindow() {
    this.win = new BrowserWindow({
      // show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false,
      },
    })

    this.win.on("close", (event) => {
      event.preventDefault()
      this.win.hide()
    })

    if (isDev) {
      await this.win.loadURL("http://localhost:3000")
    } else {
      const url = pathToFileURL(getDistPath("editor/index.html"))
      await this.win.loadURL(url.toString())
    }
  }

  showWindow() {
    this.win.show()
  }
}
