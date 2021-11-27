import { Menu, Tray } from "electron"
import { name as appName } from "../../package.json"
import { isDev } from "../common/constants"
import { logErrorStack } from "../common/logErrorStack"
import { getAssetPath } from "../common/paths"
import { hideDevtools, showDevtools } from "./devtools"
import type { VideoRecorder, VideoRecorderState } from "./video-recorder"

export class MainTray {
  private readonly tray = MainTray.createTray()

  private constructor(private readonly recorder: VideoRecorder) {
    this.updateMenu(recorder.state.get())
    recorder.state.subscribe((state) => this.updateMenu(state))
  }

  static create(recorder: VideoRecorder) {
    return new MainTray(recorder)
  }

  private static createTray() {
    const tray = new Tray(getAssetPath("icon.png"))
    tray.setTitle(appName)
    tray.setToolTip(appName)
    return tray
  }

  private updateMenu(state: VideoRecorderState) {
    this.tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: `${appName} - ${state.status}`, enabled: false },

        { type: "separator" },

        {
          label: "Start Recording",
          visible: state.status === "ready",
          click: () => {
            this.recorder.startRecording().catch(logErrorStack)
          },
        },
        {
          label: "Stop Recording",
          visible: state.status === "recording",
          click: () => {
            this.recorder.stopRecording()
          },
        },

        { visible: isDev, type: "separator" },
        { visible: isDev, label: "Show Devtools", click: showDevtools },
        { visible: isDev, label: "Hide Devtools", click: hideDevtools },

        { type: "separator" },

        { role: "quit" },
      ]),
    )
  }
}
