import { QIcon, QSystemTrayIcon } from "@nodegui/nodegui"
import packageJson from "../package.json"
import { createMenu } from "./menu.js"
import { createScreenRecorder } from "./record-screen.js"
import { hideRecordingFrame, showRecordingFrame } from "./recording-frame.js"
import { selectScreenRegion } from "./select-screen-region.js"

let recorder: ReturnType<typeof createScreenRecorder> | undefined

const trayMenu = createMenu([
  {
    label: "Start Recording",
    onClick: async () => {
      const region = await selectScreenRegion()
      showRecordingFrame(region)

      try {
        recorder = createScreenRecorder(region, "test.mp4")
        await recorder.run()
      } catch (error) {
        console.error(error)
      }

      recorder = undefined
      hideRecordingFrame()
    },
  },
  {
    label: "Stop Recording",
    onClick: () => {
      recorder?.stop()
    },
  },
  {
    label: "Quit",
    onClick: () => {
      process.exit(0)
    },
  },
])

const trayIcon = new QIcon("assets/icon.png")

const tray = new QSystemTrayIcon()
tray.setIcon(trayIcon)
tray.setToolTip(packageJson.name)
tray.setContextMenu(trayMenu)
tray.show()
;(global as any).tray = tray // prevents garbage collection of tray
