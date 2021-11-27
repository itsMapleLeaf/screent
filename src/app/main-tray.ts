import { Menu, Tray } from "electron"
import { name as appName } from "../../package.json"
import { logErrorStack } from "../common/logErrorStack"
import { getAssetPath } from "../common/paths"
import type { Editor } from "./editor"
import type { VideoRecorder, VideoRecorderState } from "./video-recorder"

export class MainTray {
  private readonly tray = MainTray.createTray()

  private constructor(
    private readonly editor: Editor,
    private readonly recorder: VideoRecorder,
  ) {
    this.updateMenu(recorder.state.get())
    recorder.state.subscribe((state) => this.updateMenu(state))
  }

  static create(editor: Editor, recorder: VideoRecorder) {
    return new MainTray(editor, recorder)
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
        { label: appName, enabled: false },

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

        { type: "separator" },

        {
          label: "debug: show editor window",
          click: () => this.editor.showWindow(),
        },
        { type: "separator" },
        { role: "quit" },
      ]),
    )
  }
}
