import { app } from "electron"
import { tryRegisterShortcut } from "./tryRegisterShortcut"

export class VideoRecorder {
  static async init() {
    await app.whenReady()

    tryRegisterShortcut("Meta+Alt+F12", () => {
      console.log("Recording video")
    })
  }
}
