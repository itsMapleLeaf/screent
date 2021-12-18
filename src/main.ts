import { QIcon, QSystemTrayIcon } from "@nodegui/nodegui"
import packageJson from "../package.json"
import { createMenu } from "./menu.js"
import { hideRecordingFrame, showRecordingFrame } from "./recording-frame.js"
import { ScreenRecorder } from "./screen-recorder.js"
import { selectScreenRegion } from "./select-screen-region.js"

const recorder = new ScreenRecorder()

const trayMenu = createMenu([
  {
    label: "Start Recording",
    onClick: async () => {
      const region = await selectScreenRegion()
      showRecordingFrame(region)
      await recorder.start(region, "test.mp4").catch(console.error)
      hideRecordingFrame()
    },
  },
  {
    label: "Stop Recording",
    onClick: () => {
      recorder.stop()
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
