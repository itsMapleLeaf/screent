import type { BrowserWindow } from "electron"
import { EventEmitter } from "node:events"

const emitter = new EventEmitter()

export function showDevtools() {
  emitter.emit("show-devtools")
}

export function hideDevtools() {
  emitter.emit("hide-devtools")
}

export function applyDevtoolsListener(win: BrowserWindow) {
  emitter.on("show-devtools", () => win.webContents.openDevTools())
  emitter.on("hide-devtools", () => win.webContents.closeDevTools())
}
