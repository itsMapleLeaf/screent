import { QIcon, QSystemTrayIcon } from "@nodegui/nodegui"
import { autorun } from "mobx"
import packageJson from "../package.json"
import { createMenu } from "./menu.js"
import { hideRecordingFrame, showRecordingFrame } from "./recording-frame.js"
import { ScreenRecorder, ScreenRecorderState } from "./screen-recorder.js"
import { selectScreenRegion } from "./select-screen-region.js"

export class Tray {
  tray = new QSystemTrayIcon()

  constructor(readonly recorder: ScreenRecorder) {
    autorun(() => {
      this.setTrayMenu(this.recorder.state)
    })

    this.tray.setIcon(new QIcon("assets/icon.png"))
    this.tray.setToolTip(packageJson.name)
    this.tray.show()
  }

  setTrayMenu(state: ScreenRecorderState) {
    this.tray.setContextMenu(
      createMenu([
        {
          label: "Start Recording",
          enabled: state.status === "idle",
          onClick: async () => {
            const region = await selectScreenRegion()
            showRecordingFrame(region)
            await this.recorder.start(region, "test.mp4").catch(console.error)
            hideRecordingFrame()
          },
        },
        {
          label: "Stop Recording",
          enabled: state.status === "recording",
          onClick: () => {
            this.recorder.stop()
          },
        },
        {
          label: "Quit",
          onClick: async () => {
            this.recorder.stop()
            await this.recorder.recordingFinished()
            process.exit(0)
          },
        },
      ]),
    )
  }
}
